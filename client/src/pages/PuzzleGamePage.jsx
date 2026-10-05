import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/AppShell';
import {
  Trophy,
  Crown,
  Eye,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Award,
  RefreshCw,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export function PuzzleGamePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loadingState, setLoadingState] = useState(true);
  const [gameState, setGameState] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const [answerInput, setAnswerInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [shuffledSections, setShuffledSections] = useState([]);
  const [placedBoard, setPlacedBoard] = useState(new Array(9).fill(null));

  const fetchGameState = useCallback(async () => {
    try {
      setLoadingState(true);
      setErrorMsg('');
      const res = await fetch(`${API_BASE_URL}/game/r1/state`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch game state.');
      setGameState(data);
      if (data.currentPuzzle?.processedSections) {
        const sections = [...data.currentPuzzle.processedSections];
        setShuffledSections(sections.sort(() => Math.random() - 0.5));
        setPlacedBoard(new Array(sections.length).fill(null));
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingState(false);
    }
  }, []);

  useEffect(() => { fetchGameState(); }, [fetchGameState]);

  // Elapsed timer
  useEffect(() => {
    let timer;
    if (gameState?.hasStarted && !gameState?.isCompleted) {
      timer = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [gameState?.hasStarted, gameState?.isCompleted]);

  const handleStartGame = async () => {
    try {
      setStarting(true);
      setErrorMsg('');
      const res = await fetch(`${API_BASE_URL}/game/r1/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to start game session.');
      await fetchGameState();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    try {
      setSubmitting(true);
      setFeedbackMsg(null);
      setErrorMsg('');
      const res = await fetch(`${API_BASE_URL}/game/r1/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answer: answerInput.trim(), timeSpentSeconds: elapsedSeconds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Submission failed.');
      setFeedbackMsg({ isCorrect: data.isCorrect, text: data.message });
      if (data.isCorrect) setAnswerInput('');
      await fetchGameState();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrayTileClick = (section, idx) => {
    if (!gameState?.isLeader) return;
    const emptyIndex = placedBoard.findIndex((slot) => slot === null);
    if (emptyIndex !== -1) {
      const newBoard = [...placedBoard];
      newBoard[emptyIndex] = section;
      setPlacedBoard(newBoard);
      const newTray = [...shuffledSections];
      newTray.splice(idx, 1);
      setShuffledSections(newTray);
    }
  };

  const handleBoardTileClick = (section, idx) => {
    if (!gameState?.isLeader || !section) return;
    const newBoard = [...placedBoard];
    newBoard[idx] = null;
    setPlacedBoard(newBoard);
    setShuffledSections((prev) => [...prev, section]);
  };

  if (loadingState) {
    return (
      <AppShell>
        <div className="dash-loading" style={{ minHeight: '50vh' }}>
          <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
          <span>Syncing Event Portal Session…</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* ── Page title ── */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Round 01 · Tile Assemble</h1>
          <div className="ieee-profile-meta">
            <span>IEEE STUDENT BRANCH</span>
            <b>•</b>
            <span>NIT DURGAPUR</span>
            <b>•</b>
            <span className="ieee-blue-text">
              TEAM: {gameState?.team?.name || '—'} ({gameState?.team?.code || '—'})
            </span>
          </div>
        </div>

        <div className="ieee-stat-row">
          <div className="ieee-stat-box">
            <strong>{gameState?.session?.score || 0}</strong>
            <span>SCORE</span>
          </div>
          <div className="ieee-stat-box">
            <strong>
              {gameState?.session
                ? `${(gameState.session.currentPuzzleIndex || 0) + 1}/${gameState.session.totalPuzzles || 10}`
                : '1/10'}
            </strong>
            <span>PUZZLE</span>
          </div>
          <div className="ieee-stat-box">
            <strong>{Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s</strong>
            <span>TIME</span>
          </div>
        </div>
      </div>

      {/* ── Role Banner ── */}
      {gameState?.isLeader ? (
        <div className="game-banner leader">
          <Crown className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            <strong>TEAM LEADER CONTROL ACTIVE:</strong> You are authorized to launch Round 1 and submit answers for{' '}
            <strong>{gameState?.team?.name}</strong>.
          </span>
          <button onClick={fetchGameState} className="game-refresh-btn">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      ) : (
        <div className="game-banner member">
          <Eye className="w-5 h-5 text-sky-400 shrink-0" />
          <span>
            <strong>LIVE VIEW:</strong> Read-only display for {gameState?.team?.name}. Only{' '}
            <strong>{gameState?.team?.leaderName || 'the team leader'}</strong> can start and submit.
          </span>
          <button onClick={fetchGameState} className="game-refresh-btn">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      )}

      {/* Error banner */}
      {errorMsg && (
        <div className="dash-error-banner">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── CASE A: Not started ── */}
      {!gameState?.hasStarted && (
        <section className="ieee-panel" style={{ textAlign: 'center' }}>
          <div className="game-trophy-icon"><Trophy className="w-8 h-8" /></div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>
            Ready to Launch Round 1?
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
            {gameState?.message}
          </p>
          {gameState?.isLeader ? (
            <button
              onClick={handleStartGame}
              disabled={starting}
              className="ieee-enter-btn"
              style={{ padding: '12px 32px', fontSize: 14 }}
            >
              {starting
                ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Launching…</>
                : '🚀 START TEAM GAME SESSION'}
            </button>
          ) : (
            <div className="game-waiting">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Stand By: Waiting for Leader '{gameState?.team?.leaderName}' to click Start.</span>
            </div>
          )}
        </section>
      )}

      {/* ── CASE B: Completed ── */}
      {gameState?.isCompleted && (
        <section className="ieee-panel" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <span className="ieee-role-tag" style={{ display: 'inline-block', marginBottom: 12 }}>ROUND 1 COMPLETE</span>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', marginBottom: 8 }}>
            Congratulations, Team {gameState?.team?.name}!
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
            All Round 1 puzzles solved. Your team has qualified for Round 2.
          </p>
          <div className="ieee-stat-row" style={{ justifyContent: 'center', marginBottom: 24 }}>
            <div className="ieee-stat-box">
              <strong>+{gameState?.session?.score || 0}</strong>
              <span>FINAL SCORE</span>
            </div>
            <div className="ieee-stat-box">
              <strong>{gameState?.session?.attemptsCount || 0}</strong>
              <span>ATTEMPTS</span>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} className="ieee-enter-btn" style={{ padding: '10px 28px' }}>
            Return to Dashboard
          </button>
        </section>
      )}

      {/* ── CASE C: Active game ── */}
      {gameState?.hasStarted && !gameState?.isCompleted && gameState?.currentPuzzle && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

          {/* Left: Puzzle board + submission */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Progress stepper */}
            <section className="ieee-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 12, fontFamily: 'monospace' }}>
                <span style={{ color: '#64748b' }}>
                  Progress: <strong style={{ color: '#38bdf8' }}>
                    Puzzle #{(gameState.session.currentPuzzleIndex || 0) + 1} of {gameState.session.totalPuzzles}
                  </strong>
                </span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>Score: +{gameState.session.score || 0} PTS</span>
              </div>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                {Array.from({ length: gameState.session.totalPuzzles || 1 }).map((_, idx) => {
                  const isDone = idx < (gameState.session.currentPuzzleIndex || 0);
                  const isCurrent = idx === (gameState.session.currentPuzzleIndex || 0);
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        border: '1px solid',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        background: isDone ? '#082e44' : isCurrent ? '#0284c7' : '#162032',
                        color: isDone ? '#38bdf8' : isCurrent ? '#fff' : '#475569',
                        borderColor: isDone ? '#0284c7' : isCurrent ? '#38bdf8' : '#1e293b',
                      }}
                    >
                      #{idx + 1} {isDone ? '✓ Solved' : isCurrent ? 'Active' : 'Locked'}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Active Puzzle Card */}
            <section className="ieee-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16, borderBottom: '1px solid #1e293b' }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
                    {gameState.currentPuzzle.title}
                  </h2>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    {gameState.currentPuzzle.description}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <span className="ieee-role-tag">+{gameState.currentPuzzle.points || 100} PTS</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', background: '#162032', border: '1px solid #1e293b', padding: '4px 10px', borderRadius: 20 }}>
                    {gameState.currentPuzzle.timeLimitSeconds || 300}s Limit
                  </span>
                </div>
              </div>

              {/* 3×3 grid display */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
                padding: 16, background: '#0b111e', borderRadius: 12, border: '1px solid #1e293b',
                maxWidth: 360, margin: '0 auto',
              }}>
                {(gameState.currentPuzzle.processedSections || []).map((sec, idx) => (
                  <div
                    key={sec.sectionIndex ?? idx}
                    onClick={() => handleBoardTileClick(placedBoard[idx], idx)}
                    style={{
                      aspectRatio: '1', borderRadius: 8, overflow: 'hidden',
                      border: `1px solid ${placedBoard[idx] ? '#0284c7' : '#1e293b'}`,
                      background: '#162032', cursor: 'pointer',
                      boxShadow: placedBoard[idx] ? '0 0 0 2px #38bdf8' : 'none',
                    }}
                  >
                    {placedBoard[idx] ? (
                      <img src={placedBoard[idx].imageUrl} alt={`Tile ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 11, fontFamily: 'monospace' }}>
                        #{idx + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Tray */}
              <div style={{ padding: 16, background: '#162032', borderRadius: 12, border: '1px solid #1e293b' }}>
                <p style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                  Tile Piece Tray — Click to place
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 60 }}>
                  {shuffledSections.map((sec, idx) => (
                    <button
                      key={sec.sectionIndex ?? idx}
                      onClick={() => handleTrayTileClick(sec, idx)}
                      disabled={!gameState.isLeader}
                      style={{
                        width: 52, height: 52, borderRadius: 8, border: '1px solid #0284c7',
                        overflow: 'hidden', cursor: gameState.isLeader ? 'pointer' : 'not-allowed',
                        opacity: gameState.isLeader ? 1 : 0.6, flexShrink: 0,
                        transition: 'transform 0.15s',
                      }}
                    >
                      <img src={sec.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Hint */}
              {gameState.currentPuzzle.hint && (
                <div style={{ padding: '10px 14px', background: '#162032', border: '1px solid #1e293b', borderRadius: 10, fontSize: 12, color: '#38bdf8', fontFamily: 'monospace', display: 'flex', gap: 8 }}>
                  <HelpCircle className="w-4 h-4 text-sky-400 shrink-0" />
                  Hint: {gameState.currentPuzzle.hint}
                </div>
              )}

              {/* Feedback */}
              {feedbackMsg && (
                <div style={{
                  padding: '12px 16px', borderRadius: 10, fontSize: 12, fontFamily: 'monospace', display: 'flex', gap: 8, alignItems: 'center',
                  background: feedbackMsg.isCorrect ? '#082e44' : '#2d0a0a',
                  border: `1px solid ${feedbackMsg.isCorrect ? '#0284c7' : '#dc2626'}`,
                  color: feedbackMsg.isCorrect ? '#38bdf8' : '#f87171',
                }}>
                  {feedbackMsg.isCorrect
                    ? <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  {feedbackMsg.text}
                </div>
              )}

              {/* Answer form */}
              <form onSubmit={handleSubmitAnswer} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder={gameState.isLeader ? 'Enter solution key…' : 'Waiting for leader submission…'}
                    disabled={!gameState.isLeader || submitting}
                    required
                    style={{
                      flex: 1, background: '#0b111e', border: '1px solid #1e293b', borderRadius: 8,
                      padding: '10px 14px', fontSize: 12, color: '#fff', outline: 'none',
                      fontFamily: 'monospace', textTransform: 'uppercase',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!gameState.isLeader || submitting || !answerInput.trim()}
                    className="ieee-enter-btn"
                    style={{ padding: '0 20px', display: 'inline-flex', alignItems: 'center', gap: 6, height: 42, opacity: (!gameState.isLeader || !answerInput.trim()) ? 0.4 : 1 }}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit
                  </button>
                </div>
                {!gameState.isLeader && (
                  <p style={{ fontSize: 10, color: '#f59e0b', fontFamily: 'monospace' }}>
                    * Only Team Leader '{gameState?.team?.leaderName}' can submit answers.
                  </p>
                )}
              </form>
            </section>
          </div>

          {/* Right: Attempt log */}
          <div>
            <section className="ieee-panel" style={{ height: '100%' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, textTransform: 'uppercase', fontFamily: 'monospace' }}>
                <Award className="w-4 h-4 text-sky-400" /> Attempt History
              </h3>
              <p style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', marginBottom: 14 }}>
                Team {gameState?.team?.name}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 600, overflowY: 'auto' }}>
                {(gameState.session?.attempts || []).length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', padding: '32px 0', fontFamily: 'monospace' }}>
                    No attempts yet.
                  </p>
                ) : (
                  [...(gameState.session.attempts || [])].reverse().map((att, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 12, borderRadius: 10, border: '1px solid',
                        background: att.isCorrect ? '#082e44' : '#2d0a0a',
                        borderColor: att.isCorrect ? '#0284c7' : '#dc2626',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
                          Attempt #{att.attemptNumber}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, fontFamily: 'monospace',
                          background: att.isCorrect ? '#0369a1' : '#7f1d1d',
                          color: att.isCorrect ? '#bae6fd' : '#fca5a5',
                        }}>
                          {att.isCorrect ? `✓ +${att.pointsAwarded} PTS` : '✗ Incorrect'}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Answer: <strong style={{ color: '#fbbf24' }}>{att.submittedAnswer}</strong>
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#475569', marginTop: 6, fontFamily: 'monospace' }}>
                        <span>{att.submittedByEmail}</span>
                        <span>{new Date(att.submittedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </AppShell>
  );
}
