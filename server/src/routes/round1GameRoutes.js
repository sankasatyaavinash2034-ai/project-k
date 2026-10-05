import express from 'express';
import { requireAuth, requireProfileComplete } from '../middleware/auth.js';
import {
  findTeamById,
  getAllPuzzles,
  getRoundByNumber,
  findActiveGameSession,
  startTeamGameSession,
  submitTeamGameAttempt,
} from '../services/store.js';
import {
  emitGameSessionStarted,
  emitPuzzleSolved,
  emitRoundCompleted,
} from '../services/socketService.js';

const router = express.Router();

/**
 * Helper middleware to verify team membership and readiness before any Round 1 operation
 */
const verifyTeamEligibility = async (req, res, next) => {
  try {
    if (!req.user.teamId) {
      return res.status(403).json({
        success: false,
        code: 'NO_TEAM',
        message: 'Game access denied: You must join or create a team before participating in Round 1.',
      });
    }

    const team = await findTeamById(req.user.teamId);
    if (!team) {
      return res.status(403).json({
        success: false,
        code: 'TEAM_NOT_FOUND',
        message: 'Game access denied: Associated team record not found.',
      });
    }

    if (team.isDisqualified) {
      return res.status(403).json({
        success: false,
        code: 'TEAM_DISQUALIFIED',
        message: `Game access denied: Your team '${team.name}' has been disqualified. Reason: ${team.disqualificationReason || 'Policy violation'}`,
      });
    }

    const memberCount = team.memberIds ? team.memberIds.length : 0;
    const minRequired = team.minSizeRequired || 2;
    const hasAdminBypass = team.allowAdminBypass === true;

    if (memberCount < minRequired && !hasAdminBypass) {
      return res.status(403).json({
        success: false,
        code: 'TEAM_NOT_READY',
        message: `Game access denied: Team '${team.name}' requires at least ${minRequired} members to start (Current: ${memberCount}/${team.maxSize}).`,
        memberCount,
        minRequired,
      });
    }

    const round1 = await getRoundByNumber(1);
    if (!round1 || round1.status === 'LOCKED') {
      return res.status(403).json({
        success: false,
        code: 'ROUND_LOCKED',
        message: 'Round 1 is currently LOCKED by event administrators.',
      });
    }

    req.team = team;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Team eligibility check error: ' + error.message });
  }
};

// Protect all Round 1 Game routes
router.use(requireAuth, requireProfileComplete, verifyTeamEligibility);

/**
 * @route   GET /api/v1/game/r1/state
 * @desc    Fetch real-time Round 1 session state for team caller (Leader or Member)
 * @access  Private (Team Members & Leaders)
 */
router.get('/state', async (req, res) => {
  try {
    const team = req.team;
    const isLeader =
      String(team.leaderId?._id || team.leaderId) === String(req.user._id) || req.user.role === 'team_leader';

    const publishedPuzzles = await getAllPuzzles(1);
    const activePuzzles = publishedPuzzles
      .filter((p) => p.isPublished !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const session = await findActiveGameSession(team._id, 1);

    if (!session) {
      return res.status(200).json({
        success: true,
        hasStarted: false,
        isLeader,
        teamName: team.name,
        leaderName: team.leaderId?.name || 'Leader',
        totalPublishedPuzzles: activePuzzles.length,
        message: isLeader
          ? 'You are the Team Leader. Click "Start Team Game" to launch Round 1.'
          : `Waiting for Team Leader '${team.leaderId?.name || 'Leader'}' to start Round 1.`,
      });
    }

    const isCompleted = session.status === 'COMPLETED' || session.isCompleted;
    const puzzleIdx = session.currentPuzzleIndex || 0;

    let currentPuzzleData = null;
    if (!isCompleted && puzzleIdx < activePuzzles.length) {
      const targetP = activePuzzles[puzzleIdx];
      currentPuzzleData = {
        id: targetP._id,
        roundNumber: targetP.roundNumber,
        title: targetP.title,
        description: targetP.description,
        imageUrl: targetP.imageUrl,
        gridRows: targetP.gridRows || 3,
        gridCols: targetP.gridCols || 3,
        points: targetP.points,
        timeLimitSeconds: targetP.timeLimitSeconds,
        hint: targetP.hint,
        processedSections: targetP.processedSections || [],
      };
    }

    return res.status(200).json({
      success: true,
      hasStarted: true,
      isLeader,
      isCompleted,
      session: {
        id: session._id,
        status: session.status,
        currentPuzzleIndex: puzzleIdx,
        totalPuzzles: activePuzzles.length,
        score: session.score || 0,
        startTime: session.startTime,
        attemptsCount: session.attempts ? session.attempts.length : 0,
        attempts: session.attempts || [],
      },
      currentPuzzle: currentPuzzleData,
      team: {
        id: team._id,
        name: team.name,
        code: team.code,
        leaderName: team.leaderId?.name || 'Leader',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch game state: ' + error.message });
  }
});

/**
 * @route   POST /api/v1/game/r1/start
 * @desc    Start Round 1 game session (TEAM LEADER ONLY)
 * @access  Private (Team Leader Only)
 */
router.post('/start', async (req, res) => {
  try {
    const team = req.team;
    const isLeader =
      String(team.leaderId?._id || team.leaderId) === String(req.user._id) || req.user.role === 'team_leader';

    if (!isLeader) {
      return res.status(403).json({
        success: false,
        code: 'ONLY_LEADER_CAN_START',
        message: `Round 1 access denied: Only Team Leader '${team.leaderId?.name || 'Leader'}' can start the game session.`,
      });
    }

    const session = await startTeamGameSession(team._id, req.user, 1);

    // Real-time broadcast to administrator feed & team room
    emitGameSessionStarted(team._id, team.name, session);

    const publishedPuzzles = await getAllPuzzles(1);
    const activePuzzles = publishedPuzzles
      .filter((p) => p.isPublished !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const firstPuzzle = activePuzzles[0];
    const firstPuzzleData = {
      id: firstPuzzle._id,
      roundNumber: firstPuzzle.roundNumber,
      title: firstPuzzle.title,
      description: firstPuzzle.description,
      imageUrl: firstPuzzle.imageUrl,
      gridRows: firstPuzzle.gridRows || 3,
      gridCols: firstPuzzle.gridCols || 3,
      points: firstPuzzle.points,
      timeLimitSeconds: firstPuzzle.timeLimitSeconds,
      hint: firstPuzzle.hint,
      processedSections: firstPuzzle.processedSections || [],
    };

    return res.status(200).json({
      success: true,
      message: `Round 1 game session launched for Team '${team.name}'.`,
      session: {
        id: session._id,
        currentPuzzleIndex: 0,
        totalPuzzles: activePuzzles.length,
        score: session.score || 0,
      },
      currentPuzzle: firstPuzzleData,
    });
  } catch (error) {
    const statusCode = error.code === 'ONLY_LEADER_CAN_START' ? 403 : 500;
    return res.status(statusCode).json({ success: false, code: error.code || 'START_ERROR', message: error.message });
  }
});

/**
 * @route   POST /api/v1/game/r1/submit
 * @desc    Submit answer for current puzzle in sequential session (TEAM LEADER ONLY)
 * @access  Private (Team Leader Only)
 */
router.post('/submit', async (req, res) => {
  try {
    const { answer, timeSpentSeconds = 0 } = req.body;
    const team = req.team;

    const isLeader =
      String(team.leaderId?._id || team.leaderId) === String(req.user._id) || req.user.role === 'team_leader';

    if (!isLeader) {
      return res.status(403).json({
        success: false,
        code: 'ONLY_LEADER_CAN_SUBMIT',
        message: `Submission denied: Only Team Leader '${team.leaderId?.name || 'Leader'}' can submit puzzle answers.`,
      });
    }

    if (!answer || !answer.trim()) {
      return res.status(400).json({ success: false, message: 'Submitted answer string is required.' });
    }

    const result = await submitTeamGameAttempt(team._id, req.user, answer, timeSpentSeconds, 1);

    // Real-time broadcast puzzle solve attempt
    emitPuzzleSolved(team._id, team.name, result);

    if (result.isRoundCompleted) {
      emitRoundCompleted(team._id, team.name, result.session);
    }

    return res.status(200).json({
      success: true,
      isCorrect: result.isCorrect,
      pointsAwarded: result.pointsAwarded,
      isRoundCompleted: result.isRoundCompleted,
      nextPuzzleUnlocked: result.nextPuzzleUnlocked,
      currentPuzzleIndex: result.currentPuzzleIndex,
      totalPuzzles: result.totalPuzzles,
      nextPuzzle: result.nextPuzzle,
      message: result.isRoundCompleted
        ? 'Congratulations! All Round 1 puzzles solved! Team qualified for Round 2.'
        : result.isCorrect
        ? 'Correct answer! Next puzzle unlocked.'
        : 'Incorrect answer. Try again!',
    });
  } catch (error) {
    const statusCode = error.code === 'ONLY_LEADER_CAN_SUBMIT' ? 403 : 500;
    return res.status(statusCode).json({ success: false, code: error.code || 'SUBMISSION_ERROR', message: error.message });
  }
});

export default router;
