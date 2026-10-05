import fs from 'fs';
import path from 'path';
import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { Round } from '../models/Round.js';
import { Puzzle } from '../models/Puzzle.js';
import { LeaderboardSetting } from '../models/LeaderboardSetting.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { GameSession } from '../models/GameSession.js';
import { processGridSections } from './imageProcessor.js';

const DATA_DIR = path.resolve('server', 'data');
const BACKUP_FILE = path.join(DATA_DIR, 'db_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to build pre-seeded puzzle object
const buildSeedPuzzle = (id, title, description, imageUrl, solution, points, timeLimitSeconds, hint, displayOrder) => {
  const gridRows = 3;
  const gridCols = 3;
  const processedSections = processGridSections(imageUrl, gridRows, gridCols);
  return {
    _id: id,
    roundNumber: 1,
    title,
    description,
    imageUrl,
    gridRows,
    gridCols,
    processedSections,
    solution,
    points,
    timeLimitSeconds,
    hint,
    displayOrder,
    isPublished: true,
    isLockedForGame: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// In-Memory & File-Backed Data Store Fallback
let memoryStore = {
  users: [],
  teams: [],
  rounds: [
    {
      _id: 'mem_r1',
      roundNumber: 1,
      title: 'Round 1: Avengers Tile Assemble',
      description: 'Sequential Image Puzzle challenge with dynamic grid slicing, piece tray drag/swap mechanics, and time-attack scoring.',
      mechanicType: 'SEQUENTIAL_PUZZLE',
      status: 'AVAILABLE',
      durationSeconds: 1800,
      minTeamSize: 2,
    },
    {
      _id: 'mem_r2',
      roundNumber: 2,
      title: 'Round 2: Quantum Mind Quiz',
      description: 'Interactive speed quiz testing algorithmic logic, Marvel trivia, and real-time decision making.',
      mechanicType: 'MCQ_QUIZ',
      status: 'LOCKED',
      durationSeconds: 1200,
      minTeamSize: 2,
    },
    {
      _id: 'mem_r3',
      roundNumber: 3,
      title: 'Round 3: Vibranium Media Showcase',
      description: 'Creative project presentation and video/image asset submission for expert jury evaluation.',
      mechanicType: 'MEDIA_SUBMISSION',
      status: 'LOCKED',
      durationSeconds: 3600,
      minTeamSize: 2,
    },
    {
      _id: 'mem_r4',
      roundNumber: 4,
      title: 'Round 4: Infinity Speed Run',
      description: 'Grand final speed programming and multi-tile puzzle showdown for top qualified teams.',
      mechanicType: 'CODE_CHALLENGE',
      status: 'LOCKED',
      durationSeconds: 2400,
      minTeamSize: 2,
    },
  ],
  puzzles: [
    buildSeedPuzzle('mem_p1', 'Stark Tower Arc Reactor Blueprint', 'Reassemble the arc reactor schematic fragments into their precise geometric layout.', 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=800', 'ARC-REACTOR-2026', 100, 300, 'Look for the glowing central energy core in tile 5.', 1),
    buildSeedPuzzle('mem_p2', 'Quantum Realm Sub-Atomic Matrix', 'Solve the sub-atomic matrix alignment to unlock the quantum portal entry keys.', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800', 'QUANTUM-88-ALPHA', 120, 360, 'Align blue flux lines along the horizontal axis first.', 2),
    buildSeedPuzzle('mem_p3', 'Wakandan Vibranium Sonic Shield', 'Connect the sonic stabilization nodes to restore shield energy integrity.', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800', 'VIBRANIUM-KEY-99', 140, 400, 'Check the peripheral purple nodes.', 3),
    buildSeedPuzzle('mem_p4', 'Mjolnir Asgardian Lightning Pattern', 'Align the electrical discharge vectors to harness Thor hammer power.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800', 'MJOLNIR-THUNDER-77', 150, 420, 'Follow the central blue lightning arc.', 4),
    buildSeedPuzzle('mem_p5', 'Eye of Agamotto Temporal Grid', 'Reconstruct the mystic rune ring alignment to stabilize local timeline flux.', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800', 'AGAMOTTO-TIME-GEM', 160, 450, 'Green temporal rings match outer corners.', 5),
    buildSeedPuzzle('mem_p6', 'S.H.I.E.L.D. Helicarrier Flight Matrix', 'Assemble navigation system coordinates for carrier takeoff alignment.', 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800', 'HELICARRIER-ALT-40', 180, 480, 'Rotor turbines are located on the left and right wings.', 6),
    buildSeedPuzzle('mem_p7', 'Nano-Tech Iron Mark-85 Armor', 'Calibrate nanite cell density across chest plate and repulsor nodes.', 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800', 'MARK-85-SUIT', 200, 500, 'Chest unibeam goes directly in the center tile.', 7),
    buildSeedPuzzle('mem_p8', 'Web-Shooter Tensile Frequency', 'Synthesize high-tensile web formula lattice for maximum structural hold.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800', 'SPIDER-WEB-LINE', 220, 520, 'Radial spider threads emanate from section 5.', 8),
    buildSeedPuzzle('mem_p9', 'Bifrost Bifurcated Portal Array', 'Synchronize rainbow bridge energy frequency for inter-dimensional transit.', 'https://images.unsplash.com/photo-1550684848-bac1c5b4e853?w=800', 'BIFROST-999-KEY', 240, 540, 'Prismatic light spectrum forms a vertical column.', 9),
    buildSeedPuzzle('mem_p10', 'Tesseract Cosmic Energy Node', 'Contain spatial cube energy fluctuations within containment field.', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800', 'SPACE-STONE-BLUE', 250, 560, 'Bright blue cubic edges delineate outer bounds.', 10),
    buildSeedPuzzle('mem_p11', 'Kree Fleet Navigation Map', 'Map interstellar jump point coordinates through Andromeda galaxy cluster.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800', 'HALA-NAV-COMMAND', 280, 580, 'Star map constellation cluster centers in tile 2.', 11),
    buildSeedPuzzle('mem_p12', 'Infinity Gauntlet Snap Sequence', 'Position all 6 infinity stones in harmonic order to unleash full cosmic power.', 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=800', 'INFINITY-SNAP-2026', 300, 600, 'Mind stone rests atop the center knuckle.', 12),
  ],
  leaderboardSetting: {
    isFrozen: false,
    isPublished: true,
    frozenAt: null,
    publishedAt: new Date(),
    lastUpdatedBy: 'system',
  },
  auditLogs: [],
  gameSessions: [],
  adminWhitelist: [
    'sankasatyaavinash2034@gmail.com',
    'kartikeyakk2007@gmail.com',
  ],
  faqs: [
    {
      _id: 'faq_1',
      question: 'What is AAROhan 2026?',
      answer: 'AAROhan 2026 is the premier annual multi-round technical and problem-solving competition organized by the IEEE Student Branch of NIT Durgapur.',
      category: 'General',
      displayOrder: 1,
      createdAt: new Date(),
    },
    {
      _id: 'faq_2',
      question: 'How do team formations and qualifications work?',
      answer: 'Teams consist of 2–3 members. The top 50 qualifying teams from Round 1 advance to Round 2. All registered members of a qualifying team inherit qualification automatically.',
      category: 'Teams & Qualification',
      displayOrder: 2,
      createdAt: new Date(),
    },
    {
      _id: 'faq_3',
      question: 'Who can submit puzzle answers in Round 1?',
      answer: 'Only the designated Team Leader can start the team session and submit puzzle answers. All team members can view progress in real-time.',
      category: 'Game Rules',
      displayOrder: 3,
      createdAt: new Date(),
    },
    {
      _id: 'faq_4',
      question: 'What are the tie-break criteria on the leaderboard?',
      answer: 'Teams are ranked by: 1. Number of Puzzles Completed (DESC), 2. Total Score (DESC), 3. Total Completion Time (ASC), 4. Final Puzzle Completion Timestamp (ASC).',
      category: 'Scoring',
      displayOrder: 4,
      createdAt: new Date(),
    },
  ],
};

// Default immutable super-admins
export const DEFAULT_ADMIN_EMAILS = [
  'sankasatyaavinash2034@gmail.com',
  'kartikeyakk2007@gmail.com',
];

// Load backup file on startup if available
try {
  if (fs.existsSync(BACKUP_FILE)) {
    const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.users) memoryStore.users = parsed.users;
    if (parsed.teams) memoryStore.teams = parsed.teams;
    if (parsed.auditLogs) memoryStore.auditLogs = parsed.auditLogs;
    if (parsed.adminWhitelist) memoryStore.adminWhitelist = parsed.adminWhitelist;
    if (parsed.faqs) memoryStore.faqs = parsed.faqs;
    if (parsed.rounds) memoryStore.rounds = parsed.rounds;
    console.log('[Resilient Store] Loaded persisted local data store from disk.');
  }
} catch (e) {
  console.warn('[Resilient Store] Failed to read disk backup:', e.message);
}

export const saveDiskBackup = () => {
  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Resilient Store] Failed to save disk backup:', e.message);
  }
};

export const getMemoryStore = () => memoryStore;

export const isDbConnected = () => {
  return global.isMongoConnected === true;
};

// ==================== USER OPERATIONS ====================

export const findUserById = async (id) => {
  if (isDbConnected()) {
    try {
      const u = await User.findById(id);
      if (u) return u;
    } catch {}
  }
  return memoryStore.users.find((u) => String(u._id) === String(id)) || null;
};

export const findUserByGoogleIdOrEmail = async (googleId, email) => {
  if (isDbConnected()) {
    try {
      const u = await User.findOne({ $or: [{ googleId }, { email }] });
      if (u) return u;
    } catch {}
  }
  return memoryStore.users.find((u) => u.googleId === googleId || (email && u.email === email.toLowerCase())) || null;
};

export const createUser = async (userData) => {
  if (isDbConnected()) {
    try {
      return await User.create(userData);
    } catch (e) {
      console.warn('[DB Error] User create fallback to memory:', e.message);
    }
  }

  const newUser = {
    _id: `mem_u_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    googleId: userData.googleId,
    email: userData.email.toLowerCase(),
    name: userData.name,
    avatar: userData.avatar || '',
    role: userData.role || 'participant',
    isProfileComplete: userData.isProfileComplete || false,
    profile: userData.profile || { fullName: userData.name },
    teamId: null,
    teamName: '',
    stats: {
      totalScore: 0,
      gamesAttempted: 0,
      gamesCompleted: 0,
      currentRound: 1,
      eventStatus: 'REGISTERED',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryStore.users.push(newUser);
  saveDiskBackup();
  return newUser;
};

export const updateUserProfile = async (userId, profileData) => {
  const user = await findUserById(userId);
  if (!user) return null;

  if (isDbConnected() && typeof user.save === 'function') {
    try {
      user.profile = { ...user.profile, ...profileData };
      user.isProfileComplete = true;
      user.name = profileData.fullName || user.name;
      await user.save();
      return user;
    } catch {}
  }

  user.profile = { ...user.profile, ...profileData };
  user.isProfileComplete = true;
  user.name = profileData.fullName || user.name;
  user.updatedAt = new Date();
  saveDiskBackup();
  return user;
};

export const updateUserRole = async (userId, newRole) => {
  const user = await findUserById(userId);
  if (!user) return null;

  if (isDbConnected() && typeof user.save === 'function') {
    try {
      user.role = newRole;
      await user.save();
      return user;
    } catch {}
  }

  user.role = newRole;
  user.updatedAt = new Date();
  saveDiskBackup();
  return user;
};

export const getAllUsers = async () => {
  if (isDbConnected()) {
    try { return await User.find().select('-__v').sort({ createdAt: -1 }); } catch {}
  }
  return memoryStore.users;
};

// ==================== TEAM OPERATIONS ====================

export const findTeamById = async (id) => {
  if (isDbConnected()) {
    try {
      const t = await Team.findById(id).populate('leaderId memberIds', 'name email avatar role profile stats');
      if (t) return t;
    } catch {}
  }

  const t = memoryStore.teams.find((tm) => String(tm._id) === String(id));
  if (!t) return null;

  const leaderObj = memoryStore.users.find((u) => String(u._id) === String(t.leaderId)) || { _id: t.leaderId, name: 'Leader' };
  const membersObj = t.memberIds.map((mid) => memoryStore.users.find((u) => String(u._id) === String(mid)) || { _id: mid, name: 'Member' });
  return { ...t, leaderId: leaderObj, memberIds: membersObj };
};

export const findTeamByCode = async (code) => {
  const normalizedCode = code.trim().toUpperCase();
  if (isDbConnected()) {
    try {
      const t = await Team.findOne({ code: normalizedCode }).populate('leaderId memberIds', 'name email avatar role profile');
      if (t) return t;
    } catch {}
  }

  const t = memoryStore.teams.find((tm) => tm.code === normalizedCode);
  if (!t) return null;

  const leaderObj = memoryStore.users.find((u) => String(u._id) === String(t.leaderId)) || { _id: t.leaderId, name: 'Leader' };
  const membersObj = t.memberIds.map((mid) => memoryStore.users.find((u) => String(u._id) === String(mid)) || { _id: mid, name: 'Member' });
  return { ...t, leaderId: leaderObj, memberIds: membersObj };
};

export const findTeamByName = async (name) => {
  const normalizedName = name.trim();
  if (isDbConnected()) {
    try {
      const t = await Team.findOne({ name: normalizedName });
      if (t) return t;
    } catch {}
  }

  return memoryStore.teams.find((tm) => tm.name.toLowerCase() === normalizedName.toLowerCase()) || null;
};

export const createTeam = async (teamData, leaderUser) => {
  if (isDbConnected()) {
    try {
      const newTeam = await Team.create(teamData);
      await User.findByIdAndUpdate(leaderUser._id, {
        teamId: newTeam._id,
        teamName: newTeam.name,
        role: leaderUser.role === 'admin' || leaderUser.role === 'super_admin' ? leaderUser.role : 'team_leader',
      });
      return newTeam;
    } catch {}
  }

  const newTeam = {
    _id: `mem_t_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: teamData.name,
    code: teamData.code,
    leaderId: leaderUser._id,
    memberIds: [leaderUser._id],
    maxSize: teamData.maxSize || 3,
    minSizeRequired: 2,
    allowAdminBypass: false,
    qualifications: [
      { roundNumber: 1, status: 'QUALIFIED', score: 0, qualifiedAt: new Date() },
      { roundNumber: 2, status: 'PENDING', score: 0 },
      { roundNumber: 3, status: 'PENDING', score: 0 },
      { roundNumber: 4, status: 'PENDING', score: 0 },
    ],
    isDisqualified: false,
    disqualificationReason: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryStore.teams.push(newTeam);
  leaderUser.teamId = newTeam._id;
  leaderUser.teamName = newTeam.name;
  if (leaderUser.role !== 'admin' && leaderUser.role !== 'super_admin') {
    leaderUser.role = 'team_leader';
  }

  saveDiskBackup();
  return newTeam;
};

export const joinTeam = async (teamId, userObj) => {
  const team = memoryStore.teams.find((t) => String(t._id) === String(teamId));

  if (isDbConnected()) {
    try {
      const dbTeam = await Team.findById(teamId);
      if (dbTeam) {
        if (!dbTeam.memberIds.includes(userObj._id)) {
          dbTeam.memberIds.push(userObj._id);
          await dbTeam.save();
        }
        await User.findByIdAndUpdate(userObj._id, { teamId: dbTeam._id, teamName: dbTeam.name });
        return dbTeam;
      }
    } catch {}
  }

  if (team) {
    if (!team.memberIds.some((id) => String(id) === String(userObj._id))) {
      team.memberIds.push(userObj._id);
    }
    userObj.teamId = team._id;
    userObj.teamName = team.name;
    saveDiskBackup();
    return team;
  }
  return null;
};

export const leaveTeam = async (userObj) => {
  if (!userObj.teamId) return;

  const teamId = userObj.teamId;
  userObj.teamId = null;
  userObj.teamName = '';
  if (userObj.role === 'team_leader') userObj.role = 'participant';

  if (isDbConnected()) {
    try {
      const dbTeam = await Team.findById(teamId);
      if (dbTeam) {
        dbTeam.memberIds = dbTeam.memberIds.filter((id) => String(id) !== String(userObj._id));
        if (dbTeam.memberIds.length === 0) {
          await Team.findByIdAndDelete(dbTeam._id);
        } else if (String(dbTeam.leaderId) === String(userObj._id)) {
          dbTeam.leaderId = dbTeam.memberIds[0];
          await dbTeam.save();
          await User.findByIdAndUpdate(dbTeam.leaderId, { role: 'team_leader' });
        } else {
          await dbTeam.save();
        }
      }
      await User.findByIdAndUpdate(userObj._id, { teamId: null, teamName: '', role: userObj.role });
    } catch {}
  }

  const team = memoryStore.teams.find((t) => String(t._id) === String(teamId));
  if (team) {
    team.memberIds = team.memberIds.filter((id) => String(id) !== String(userObj._id));
    if (team.memberIds.length === 0) {
      memoryStore.teams = memoryStore.teams.filter((t) => String(t._id) !== String(teamId));
    } else if (String(team.leaderId) === String(userObj._id)) {
      team.leaderId = team.memberIds[0];
      const newLeader = memoryStore.users.find((u) => String(u._id) === String(team.leaderId));
      if (newLeader && newLeader.role !== 'admin' && newLeader.role !== 'super_admin') {
        newLeader.role = 'team_leader';
      }
    }
    saveDiskBackup();
  }
};

export const getAllTeams = async () => {
  if (isDbConnected()) {
    try { return await Team.find().populate('leaderId memberIds', 'name email avatar role profile').sort({ createdAt: -1 }); } catch {}
  }
  return memoryStore.teams.map((t) => {
    const leaderObj = memoryStore.users.find((u) => String(u._id) === String(t.leaderId)) || { _id: t.leaderId, name: 'Leader' };
    const membersObj = t.memberIds.map((mid) => memoryStore.users.find((u) => String(u._id) === String(mid)) || { _id: mid, name: 'Member' });
    return { ...t, leaderId: leaderObj, memberIds: membersObj };
  });
};

// ==================== ROUND OPERATIONS ====================

export const getAllRounds = async () => {
  if (isDbConnected()) {
    try {
      const count = await Round.countDocuments();
      if (count > 0) {
        return await Round.find().sort({ roundNumber: 1 });
      }
    } catch {}
  }
  return memoryStore.rounds;
};

export const getRoundByNumber = async (roundNumber) => {
  const num = parseInt(roundNumber);
  if (isDbConnected()) {
    try {
      let found = await Round.findOne({ roundNumber: num });
      if (found) return found;
      // Fallback to memoryStore and seed DB if missing
      const memRound = memoryStore.rounds.find((r) => r.roundNumber === num);
      if (memRound) {
        try {
          found = await Round.create(memRound);
          return found;
        } catch {
          return memRound;
        }
      }
    } catch {}
  }
  return memoryStore.rounds.find((r) => r.roundNumber === num) || null;
};

export const updateRoundStatus = async (roundNumber, status) => {
  const num = parseInt(roundNumber);
  let round = await getRoundByNumber(num);
  if (!round) return null;

  if (typeof round.toObject === 'function') {
    round.status = status;
  } else {
    round.status = status;
  }

  if (isDbConnected()) {
    try {
      const updated = await Round.findOneAndUpdate(
        { roundNumber: num },
        { $set: { status } },
        { upsert: true, new: true }
      );
      if (updated) round = updated;
    } catch (e) {
      console.warn('[updateRoundStatus DB Warning]:', e.message);
    }
  }

  const memIndex = memoryStore.rounds.findIndex((r) => r.roundNumber === num);
  if (memIndex !== -1) {
    memoryStore.rounds[memIndex].status = status;
  } else {
    memoryStore.rounds.push({
      _id: `mem_r${num}`,
      roundNumber: num,
      title: `Round ${num}`,
      description: '',
      mechanicType: 'SEQUENTIAL_PUZZLE',
      status,
      durationSeconds: 1800,
      minTeamSize: 2,
    });
  }
  saveDiskBackup();
  return round;
};

export const updateRoundConfig = async (roundNumber, configData) => {
  const num = parseInt(roundNumber);
  let round = await getRoundByNumber(num);

  const updateFields = {};
  if (configData.title !== undefined) updateFields.title = configData.title;
  if (configData.description !== undefined) updateFields.description = configData.description;
  if (configData.durationSeconds !== undefined) updateFields.durationSeconds = parseInt(configData.durationSeconds);
  if (configData.minTeamSize !== undefined) updateFields.minTeamSize = parseInt(configData.minTeamSize);
  if (configData.status !== undefined) updateFields.status = configData.status;
  if (configData.mechanicType !== undefined) updateFields.mechanicType = configData.mechanicType;

  if (isDbConnected()) {
    try {
      const updated = await Round.findOneAndUpdate(
        { roundNumber: num },
        { $set: updateFields, $setOnInsert: { roundNumber: num } },
        { upsert: true, new: true }
      );
      if (updated) round = updated;
    } catch (e) {
      console.warn('[updateRoundConfig DB Warning]:', e.message);
    }
  }

  if (!round) {
    round = { roundNumber: num, ...updateFields };
  } else {
    Object.assign(round, updateFields);
  }

  const memIndex = memoryStore.rounds.findIndex((r) => r.roundNumber === num);
  if (memIndex !== -1) {
    Object.assign(memoryStore.rounds[memIndex], updateFields);
  } else {
    memoryStore.rounds.push({ _id: `mem_r${num}`, roundNumber: num, ...updateFields });
  }
  saveDiskBackup();
  return round;
};

export const createRound = async (roundData) => {
  const roundNumber = parseInt(roundData.roundNumber) || (memoryStore.rounds.length + 1);
  const newRound = {
    _id: `round_${roundNumber}_${Date.now()}`,
    roundNumber,
    title: roundData.title || `Round ${roundNumber}`,
    description: roundData.description || '',
    mechanicType: roundData.mechanicType || 'SEQUENTIAL_PUZZLE',
    status: roundData.status || 'LOCKED',
    durationSeconds: parseInt(roundData.durationSeconds) || 1800,
    minTeamSize: parseInt(roundData.minTeamSize) || 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (isDbConnected()) {
    try {
      return await Round.create(newRound);
    } catch {}
  }

  if (!memoryStore.rounds) memoryStore.rounds = [];
  memoryStore.rounds.push(newRound);
  memoryStore.rounds.sort((a, b) => a.roundNumber - b.roundNumber);
  saveDiskBackup();
  return newRound;
};

export const deleteRound = async (roundNumber) => {
  const num = parseInt(roundNumber);
  if (isDbConnected()) {
    try {
      await Round.deleteOne({ roundNumber: num });
    } catch {}
  }

  if (!memoryStore.rounds) memoryStore.rounds = [];
  memoryStore.rounds = memoryStore.rounds.filter((r) => r.roundNumber !== num);
  saveDiskBackup();
  return true;
};

// ==================== ADMIN WHITELIST OPERATIONS ====================

export const getAdminWhitelist = async () => {
  if (!memoryStore.adminWhitelist) {
    memoryStore.adminWhitelist = [...DEFAULT_ADMIN_EMAILS];
  }
  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...memoryStore.adminWhitelist]));
};

export const isAdminEmail = (email) => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  if (DEFAULT_ADMIN_EMAILS.includes(normalized)) return true;
  const list = memoryStore.adminWhitelist || [];
  return list.map((e) => e.toLowerCase().trim()).includes(normalized);
};

export const addAdminWhitelistEmail = async (email) => {
  if (!email) throw new Error('Email is required');
  const normalized = email.toLowerCase().trim();
  if (!memoryStore.adminWhitelist) memoryStore.adminWhitelist = [...DEFAULT_ADMIN_EMAILS];

  if (!memoryStore.adminWhitelist.includes(normalized)) {
    memoryStore.adminWhitelist.push(normalized);
  }

  // Update existing user role if already registered
  const user = memoryStore.users.find((u) => u.email.toLowerCase() === normalized);
  if (user) {
    user.role = 'super_admin';
  }

  if (isDbConnected()) {
    try {
      await User.findOneAndUpdate({ email: normalized }, { role: 'super_admin' });
    } catch {}
  }

  saveDiskBackup();
  return memoryStore.adminWhitelist;
};

export const removeAdminWhitelistEmail = async (email) => {
  const normalized = email.toLowerCase().trim();
  if (DEFAULT_ADMIN_EMAILS.includes(normalized)) {
    throw new Error('Default system super-admin email cannot be removed.');
  }

  if (!memoryStore.adminWhitelist) memoryStore.adminWhitelist = [...DEFAULT_ADMIN_EMAILS];
  memoryStore.adminWhitelist = memoryStore.adminWhitelist.filter((e) => e.toLowerCase() !== normalized);

  const user = memoryStore.users.find((u) => u.email.toLowerCase() === normalized);
  if (user) {
    user.role = 'participant';
  }

  if (isDbConnected()) {
    try {
      await User.findOneAndUpdate({ email: normalized }, { role: 'participant' });
    } catch {}
  }

  saveDiskBackup();
  return memoryStore.adminWhitelist;
};

// ==================== FAQ / HELP & SUPPORT OPERATIONS ====================

export const getAllFAQs = async () => {
  if (!memoryStore.faqs) {
    memoryStore.faqs = [];
  }
  return memoryStore.faqs.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
};

export const createFAQ = async (faqData) => {
  const newFAQ = {
    _id: `faq_${Date.now()}`,
    question: faqData.question,
    answer: faqData.answer,
    category: faqData.category || 'General',
    displayOrder: parseInt(faqData.displayOrder) || (memoryStore.faqs?.length || 0) + 1,
    createdAt: new Date(),
  };

  if (!memoryStore.faqs) memoryStore.faqs = [];
  memoryStore.faqs.push(newFAQ);
  saveDiskBackup();
  return newFAQ;
};

export const updateFAQ = async (id, data) => {
  if (!memoryStore.faqs) memoryStore.faqs = [];
  const faq = memoryStore.faqs.find((f) => String(f._id) === String(id));
  if (!faq) return null;

  if (data.question !== undefined) faq.question = data.question;
  if (data.answer !== undefined) faq.answer = data.answer;
  if (data.category !== undefined) faq.category = data.category;
  if (data.displayOrder !== undefined) faq.displayOrder = parseInt(data.displayOrder);

  saveDiskBackup();
  return faq;
};

export const deleteFAQ = async (id) => {
  if (!memoryStore.faqs) memoryStore.faqs = [];
  memoryStore.faqs = memoryStore.faqs.filter((f) => String(f._id) !== String(id));
  saveDiskBackup();
  return true;
};

// ==================== PUZZLE OPERATIONS ====================

export const getAllPuzzles = async (roundNumber = null) => {
  if (isDbConnected()) {
    try {
      const filter = roundNumber ? { roundNumber: parseInt(roundNumber) } : {};
      return await Puzzle.find(filter).sort({ roundNumber: 1, displayOrder: 1, createdAt: 1 });
    } catch {}
  }
  if (!memoryStore.puzzles) memoryStore.puzzles = [];
  let result = memoryStore.puzzles;
  if (roundNumber) {
    result = result.filter((p) => p.roundNumber === parseInt(roundNumber));
  }
  return result.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
};

export const getPuzzleById = async (id) => {
  if (isDbConnected()) {
    try { return await Puzzle.findById(id); } catch {}
  }
  return memoryStore.puzzles.find((p) => String(p._id) === String(id)) || null;
};

export const createPuzzle = async (puzzleData) => {
  const gridRows = parseInt(puzzleData.gridRows) || 3;
  const gridCols = parseInt(puzzleData.gridCols) || 3;
  const imageUrl = puzzleData.imageUrl || 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=800';
  const processedSections = puzzleData.processedSections || processGridSections(imageUrl, gridRows, gridCols);

  const payload = {
    ...puzzleData,
    gridRows,
    gridCols,
    imageUrl,
    processedSections,
    isLockedForGame: Boolean(puzzleData.isLockedForGame),
  };

  if (isDbConnected()) {
    try {
      return await Puzzle.create(payload);
    } catch (e) {
      console.warn('[DB Error] Puzzle create fallback to memory:', e.message);
    }
  }

  const newPuzzle = {
    _id: `mem_p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    roundNumber: parseInt(puzzleData.roundNumber) || 1,
    title: puzzleData.title,
    description: puzzleData.description || '',
    imageUrl,
    gridRows,
    gridCols,
    processedSections,
    solution: puzzleData.solution,
    points: parseInt(puzzleData.points) || 100,
    timeLimitSeconds: parseInt(puzzleData.timeLimitSeconds) || 300,
    hint: puzzleData.hint || '',
    displayOrder: parseInt(puzzleData.displayOrder) || (memoryStore.puzzles.length + 1),
    isPublished: puzzleData.isPublished !== undefined ? Boolean(puzzleData.isPublished) : true,
    isLockedForGame: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!memoryStore.puzzles) memoryStore.puzzles = [];
  memoryStore.puzzles.push(newPuzzle);
  saveDiskBackup();
  return newPuzzle;
};

export const updatePuzzle = async (id, updateData, allowLockedOverride = false) => {
  const puzzle = await getPuzzleById(id);
  if (!puzzle) return null;

  // Immutability Guard: Published puzzles locked during active game
  if (puzzle.isLockedForGame && !allowLockedOverride) {
    throw new Error('Puzzle is locked during an active game session. Perform a controlled reset or set override flag to edit.');
  }

  const gridRows = parseInt(updateData.gridRows || puzzle.gridRows || 3);
  const gridCols = parseInt(updateData.gridCols || puzzle.gridCols || 3);
  const imageUrl = updateData.imageUrl || puzzle.imageUrl;

  // Re-generate grid sections if image or grid parameters change
  if (updateData.imageUrl || updateData.gridRows || updateData.gridCols || !puzzle.processedSections || puzzle.processedSections.length === 0) {
    updateData.processedSections = processGridSections(imageUrl, gridRows, gridCols);
  }

  if (isDbConnected() && typeof puzzle.save === 'function') {
    try {
      Object.assign(puzzle, updateData);
      await puzzle.save();
      return puzzle;
    } catch {}
  }

  Object.assign(puzzle, updateData, { updatedAt: new Date() });
  saveDiskBackup();
  return puzzle;
};

export const deletePuzzle = async (id) => {
  const puzzle = await getPuzzleById(id);
  if (!puzzle) return null;

  if (isDbConnected()) {
    try {
      await Puzzle.findByIdAndDelete(id);
    } catch {}
  }

  memoryStore.puzzles = memoryStore.puzzles.filter((p) => String(p._id) !== String(id));
  saveDiskBackup();
  return puzzle;
};

export const reorderPuzzles = async (puzzleOrders) => {
  // puzzleOrders = [{ id: 'p1', displayOrder: 1 }, { id: 'p2', displayOrder: 2 }]
  const updatedList = [];
  for (const item of puzzleOrders) {
    const p = await getPuzzleById(item.id || item._id);
    if (p) {
      if (isDbConnected() && typeof p.save === 'function') {
        try {
          p.displayOrder = item.displayOrder;
          await p.save();
        } catch {}
      } else {
        p.displayOrder = item.displayOrder;
      }
      updatedList.push(p);
    }
  }
  saveDiskBackup();
  return updatedList;
};

export const togglePuzzlePublish = async (id, isPublished) => {
  return await updatePuzzle(id, { isPublished: Boolean(isPublished) });
};

// ==================== SESSION RESET & SCORE ADJUSTMENT ====================

export const resetTeamSession = async (teamId) => {
  const team = await findTeamById(teamId);
  if (!team) return null;

  const previousState = {
    qualifications: team.qualifications ? JSON.parse(JSON.stringify(team.qualifications)) : [],
  };

  // Reset active game state flags
  if (team.qualifications) {
    team.qualifications = team.qualifications.map((q) => ({
      ...q,
      score: q.status === 'QUALIFIED' ? q.score : 0,
    }));
  }

  // Remove active game sessions for team
  if (isDbConnected()) {
    try {
      await GameSession.deleteMany({ teamId: team._id });
    } catch {}
  }

  if (memoryStore.gameSessions) {
    memoryStore.gameSessions = memoryStore.gameSessions.filter((s) => String(s.teamId) !== String(teamId));
  }

  if (isDbConnected() && typeof team.save === 'function') {
    try {
      await team.save();
    } catch {}
  }

  saveDiskBackup();
  return { team, previousState, newState: { qualifications: team.qualifications } };
};

// ==================== ROUND 1 SEQUENTIAL GAME SESSION OPERATIONS ====================

export const findActiveGameSession = async (teamId, roundNumber = 1) => {
  if (isDbConnected()) {
    try {
      const session = await GameSession.findOne({
        teamId,
        roundNumber: parseInt(roundNumber),
        status: 'IN_PROGRESS',
      });
      if (session) return session;
    } catch {}
  }
  if (!memoryStore.gameSessions) memoryStore.gameSessions = [];
  return (
    memoryStore.gameSessions.find(
      (s) => String(s.teamId) === String(teamId) && s.roundNumber === parseInt(roundNumber) && s.status === 'IN_PROGRESS'
    ) || null
  );
};

export const startTeamGameSession = async (teamId, leaderUser, roundNumber = 1) => {
  const team = await findTeamById(teamId);
  if (!team) throw new Error('Associated team record not found.');

  const isLeader =
    String(team.leaderId?._id || team.leaderId) === String(leaderUser._id) || leaderUser.role === 'team_leader';

  if (!isLeader) {
    const error = new Error('ONLY_LEADER_CAN_START: Only the Team Leader can start Round 1.');
    error.code = 'ONLY_LEADER_CAN_START';
    throw error;
  }

  let activeSession = await findActiveGameSession(teamId, roundNumber);
  if (activeSession) {
    return activeSession;
  }

  const publishedPuzzles = await getAllPuzzles(roundNumber);
  const activePuzzles = publishedPuzzles.filter((p) => p.isPublished !== false);
  if (activePuzzles.length === 0) {
    throw new Error('No published puzzles available for Round 1 yet. Please notify event administrators.');
  }

  const firstPuzzle = activePuzzles[0];

  const sessionData = {
    teamId: team._id,
    teamName: team.name,
    roundNumber: parseInt(roundNumber),
    startedBy: leaderUser._id,
    startedByEmail: leaderUser.email,
    startTime: new Date(),
    status: 'IN_PROGRESS',
    currentPuzzleIndex: 0,
    currentPuzzleId: String(firstPuzzle._id),
    score: 0,
    completedPuzzleIds: [],
    attempts: [],
    isCompleted: false,
  };

  if (isDbConnected()) {
    try {
      return await GameSession.create(sessionData);
    } catch (e) {
      console.warn('[DB Error] GameSession create fallback to memory:', e.message);
    }
  }

  const newSession = {
    _id: `mem_session_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    ...sessionData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!memoryStore.gameSessions) memoryStore.gameSessions = [];
  memoryStore.gameSessions.push(newSession);
  saveDiskBackup();
  return newSession;
};

export const submitTeamGameAttempt = async (teamId, userObj, submittedAnswer, timeSpentSeconds = 0, roundNumber = 1) => {
  const team = await findTeamById(teamId);
  if (!team) throw new Error('Associated team record not found.');

  const isLeader =
    String(team.leaderId?._id || team.leaderId) === String(userObj._id) || userObj.role === 'team_leader';

  if (!isLeader) {
    const error = new Error('ONLY_LEADER_CAN_SUBMIT: Only the Team Leader can submit puzzle answers.');
    error.code = 'ONLY_LEADER_CAN_SUBMIT';
    throw error;
  }

  const session = await findActiveGameSession(teamId, roundNumber);
  if (!session) {
    throw new Error('No active game session found for your team. Please start Round 1 first.');
  }

  const publishedPuzzles = await getAllPuzzles(roundNumber);
  const activePuzzles = publishedPuzzles
    .filter((p) => p.isPublished !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  if (activePuzzles.length === 0) {
    throw new Error('No published puzzles available.');
  }

  if (session.currentPuzzleIndex >= activePuzzles.length) {
    throw new Error('All Round 1 puzzles have already been completed by your team.');
  }

  const currentPuzzle = activePuzzles[session.currentPuzzleIndex];

  const isCorrect =
    String(submittedAnswer || '').trim().toLowerCase() === String(currentPuzzle.solution || '').trim().toLowerCase();

  const attemptLog = {
    attemptNumber: (session.attempts ? session.attempts.length : 0) + 1,
    puzzleId: String(currentPuzzle._id),
    puzzleTitle: currentPuzzle.title,
    puzzleIndex: session.currentPuzzleIndex,
    submittedBy: userObj._id,
    submittedByEmail: userObj.email,
    submittedAnswer: String(submittedAnswer || '').trim(),
    isCorrect,
    startedAt: session.updatedAt || session.startTime,
    submittedAt: new Date(),
    pointsAwarded: isCorrect ? currentPuzzle.points || 100 : 0,
    timeSpentSeconds: parseInt(timeSpentSeconds) || 0,
  };

  if (!session.attempts) session.attempts = [];
  session.attempts.push(attemptLog);

  let isRoundCompleted = false;
  let nextPuzzleUnlocked = false;

  if (isCorrect) {
    session.score = (session.score || 0) + (currentPuzzle.points || 100);
    if (!session.completedPuzzleIds) session.completedPuzzleIds = [];
    session.completedPuzzleIds.push(String(currentPuzzle._id));

    session.currentPuzzleIndex += 1;

    if (session.currentPuzzleIndex >= activePuzzles.length) {
      session.status = 'COMPLETED';
      session.isCompleted = true;
      session.endTime = new Date();
      isRoundCompleted = true;

      if (!team.qualifications) team.qualifications = [];
      let qual = team.qualifications.find((q) => q.roundNumber === parseInt(roundNumber));
      if (!qual) {
        qual = { roundNumber: parseInt(roundNumber), status: 'QUALIFIED', score: session.score };
        team.qualifications.push(qual);
      } else {
        qual.status = 'QUALIFIED';
        qual.score = session.score;
        qual.qualifiedAt = new Date();
      }
    } else {
      session.currentPuzzleId = String(activePuzzles[session.currentPuzzleIndex]._id);
      nextPuzzleUnlocked = true;
    }
  }

  if (isDbConnected() && typeof session.save === 'function') {
    try {
      await session.save();
      if (typeof team.save === 'function') await team.save();
    } catch {}
  }

  saveDiskBackup();

  return {
    session,
    isCorrect,
    pointsAwarded: attemptLog.pointsAwarded,
    isRoundCompleted,
    nextPuzzleUnlocked,
    currentPuzzleIndex: session.currentPuzzleIndex,
    totalPuzzles: activePuzzles.length,
    nextPuzzle: !isRoundCompleted && session.currentPuzzleIndex < activePuzzles.length
      ? {
          id: activePuzzles[session.currentPuzzleIndex]._id,
          roundNumber: activePuzzles[session.currentPuzzleIndex].roundNumber,
          title: activePuzzles[session.currentPuzzleIndex].title,
          description: activePuzzles[session.currentPuzzleIndex].description,
          imageUrl: activePuzzles[session.currentPuzzleIndex].imageUrl,
          gridRows: activePuzzles[session.currentPuzzleIndex].gridRows || 3,
          gridCols: activePuzzles[session.currentPuzzleIndex].gridCols || 3,
          points: activePuzzles[session.currentPuzzleIndex].points,
          timeLimitSeconds: activePuzzles[session.currentPuzzleIndex].timeLimitSeconds,
          hint: activePuzzles[session.currentPuzzleIndex].hint,
          processedSections: activePuzzles[session.currentPuzzleIndex].processedSections,
        }
      : null,
  };
};

export const adjustTeamScore = async (teamId, roundNumber, scoreDelta, reason) => {
  const team = await findTeamById(teamId);
  if (!team) return null;

  if (!team.qualifications) team.qualifications = [];
  let qual = team.qualifications.find((q) => q.roundNumber === parseInt(roundNumber));
  if (!qual) {
    qual = { roundNumber: parseInt(roundNumber), status: 'PENDING', score: 0 };
    team.qualifications.push(qual);
  }

  const previousScore = qual.score || 0;
  const newScore = Math.max(0, previousScore + parseInt(scoreDelta));
  qual.score = newScore;

  if (isDbConnected() && typeof team.save === 'function') {
    try {
      await team.save();
    } catch {}
  }

  saveDiskBackup();
  return { team, previousScore, newScore, reason };
};

// ==================== LEADERBOARD CONTROL ====================

export const getLeaderboardStatus = async () => {
  if (isDbConnected()) {
    try {
      const setting = await LeaderboardSetting.findOne();
      if (setting) return setting;
    } catch {}
  }
  if (!memoryStore.leaderboardSetting) {
    memoryStore.leaderboardSetting = { isFrozen: false, isPublished: true, frozenAt: null, publishedAt: new Date() };
  }
  return memoryStore.leaderboardSetting;
};

export const setLeaderboardFreeze = async (isFrozen, adminEmail = 'admin') => {
  let setting = await getLeaderboardStatus();
  const previousState = { isFrozen: setting.isFrozen, frozenAt: setting.frozenAt };

  const updatedData = {
    isFrozen: Boolean(isFrozen),
    frozenAt: isFrozen ? new Date() : null,
    lastUpdatedBy: adminEmail,
  };

  if (isDbConnected() && typeof setting.save === 'function') {
    try {
      Object.assign(setting, updatedData);
      await setting.save();
      return { setting, previousState, newState: updatedData };
    } catch {}
  }

  Object.assign(memoryStore.leaderboardSetting, updatedData);
  saveDiskBackup();
  return { setting: memoryStore.leaderboardSetting, previousState, newState: updatedData };
};

export const setLeaderboardPublish = async (isPublished, adminEmail = 'admin') => {
  let setting = await getLeaderboardStatus();
  const previousState = { isPublished: setting.isPublished, publishedAt: setting.publishedAt };

  const updatedData = {
    isPublished: Boolean(isPublished),
    publishedAt: isPublished ? new Date() : null,
    lastUpdatedBy: adminEmail,
  };

  if (isDbConnected() && typeof setting.save === 'function') {
    try {
      Object.assign(setting, updatedData);
      await setting.save();
      return { setting, previousState, newState: updatedData };
    } catch {}
  }

  Object.assign(memoryStore.leaderboardSetting, updatedData);
  saveDiskBackup();
  return { setting: memoryStore.leaderboardSetting, previousState, newState: updatedData };
};

// ==================== AUDIT LOG OPERATIONS ====================

export const logAdminAudit = async (adminUser, action, targetType, targetId, targetName, previousValue = null, newValue = null, req = null) => {
  const logObj = {
    adminId: adminUser._id,
    adminEmail: adminUser.email,
    action,
    targetType,
    targetId: String(targetId || ''),
    targetName: targetName || '',
    previousValue: previousValue !== null ? previousValue : null,
    newValue: newValue !== null ? newValue : null,
    changes: { before: previousValue, after: newValue },
    ipAddress: req ? (req.ip || req.headers['x-forwarded-for'] || '') : '',
    createdAt: new Date(),
  };

  if (isDbConnected()) {
    try { await AdminAuditLog.create(logObj); } catch (e) { console.warn('[Audit Log Error]:', e.message); }
  }

  if (!memoryStore.auditLogs) memoryStore.auditLogs = [];
  memoryStore.auditLogs.unshift({ _id: `mem_audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, ...logObj });
  saveDiskBackup();
};

export const getAuditLogs = async () => {
  if (isDbConnected()) {
    try { return await AdminAuditLog.find().sort({ createdAt: -1 }).limit(100); } catch {}
  }
  return memoryStore.auditLogs || [];
};

