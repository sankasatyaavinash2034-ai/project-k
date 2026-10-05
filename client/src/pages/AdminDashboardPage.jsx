import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/AppShell';
import { getSocket } from '../services/socket';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Trash2,
  Edit3,
  X,
  Users,
  Layers,
  Sparkles,
  GripVertical,
  Plus,
  PlusCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Play,
  CheckCircle2,
  Award,
  RotateCcw,
  SlidersHorizontal,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckSquare,
  AlertCircle,
  Upload,
  Grid,
  Activity,
  Radio,
  Wifi,
  Flame,
  UserCheck,
  Timer,
  CheckCheck,
  HelpCircle,
  Mail,
  FileText,
  UserPlus,
  Settings,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('live_monitor'); // 'live_monitor' | 'users' | 'teams' | 'puzzles' | 'rounds' | 'scoring' | 'whitelist' | 'faqs' | 'audit'

  // Data states
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [puzzles, setPuzzles] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [leaderboardStatus, setLeaderboardStatus] = useState({ isFrozen: false, isPublished: true });
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Whitelist Management State
  const [whitelistEmails, setWhitelistEmails] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdminEmail, setAddingAdminEmail] = useState(false);

  // FAQ Management State
  const [faqsList, setFaqsList] = useState([]);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ category: 'General', question: '', answer: '' });

  // Create Round Modal State
  const [isCreateRoundModalOpen, setIsCreateRoundModalOpen] = useState(false);
  const [newRoundForm, setNewRoundForm] = useState({
    roundNumber: 2,
    title: '',
    description: '',
    durationMinutes: 30,
    minTeamSize: 2,
    mechanicType: 'quiz',
    status: 'LOCKED',
  });

  // Socket.IO Real-Time Live Monitoring State
  const [socketConnected, setSocketConnected] = useState(false);
  const [liveState, setLiveState] = useState({
    timestamp: new Date().toISOString(),
    totalRegisteredUsers: 0,
    onlineCount: 0,
    onlineUsers: [],
    totalTeams: 0,
    activeRound1PlayingCount: 0,
    playingTeams: [],
    completedTeamsCount: 0,
    completedTeams: [],
    liveLeaderboard: [],
  });
  const [liveEventLogs, setLiveEventLogs] = useState([]);

  // Selected round for Puzzle filter
  const [selectedPuzzleRound, setSelectedPuzzleRound] = useState(1);

  // Upload & Section Preview states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewingPuzzleSections, setPreviewingPuzzleSections] = useState(null);

  // Puzzle Create / Edit Modal State
  const [isPuzzleModalOpen, setIsPuzzleModalOpen] = useState(false);
  const [editingPuzzle, setEditingPuzzle] = useState(null);
  const [puzzleForm, setPuzzleForm] = useState({
    roundNumber: 1,
    title: '',
    description: '',
    imageUrl: '',
    gridRows: 3,
    gridCols: 3,
    solution: '',
    points: 100,
    timeLimitSeconds: 300,
    hint: '',
    isPublished: true,
  });

  // Team Edit Modal State
  const [editingTeam, setEditingTeam] = useState(null);
  const [editName, setEditName] = useState('');
  const [editMaxSize, setEditMaxSize] = useState('3');
  const [editMinSize, setEditMinSize] = useState('2');
  const [editBypass, setEditBypass] = useState(false);

  // Score Adjustment Modal State
  const [adjustScoreModal, setAdjustScoreModal] = useState(null);
  const [scoreDelta, setScoreDelta] = useState(50);
  const [scoreReason, setScoreReason] = useState('Bonus challenge completion');

  // Round Config Modal State
  const [editingRound, setEditingRound] = useState(null);
  const [roundTitle, setRoundTitle] = useState('');
  const [roundDesc, setRoundDesc] = useState('');
  const [roundDuration, setRoundDuration] = useState(1800);
  const [roundMinTeam, setRoundMinTeam] = useState(2);
  const [roundMechanic, setRoundMechanic] = useState('puzzle');

  // Audit Diff View Modal
  const [viewingAuditDiff, setViewingAuditDiff] = useState(null);

  // Leaderboard & Ranking State
  const [selectedRankingRound, setSelectedRankingRound] = useState(1);
  const [qualifyingLimit, setQualifyingLimit] = useState(50);
  const [tieBreakOrder, setTieBreakOrder] = useState([
    'puzzlesCompleted',
    'totalScore',
    'completionTime',
    'finalPuzzleTimestamp',
  ]);
  const [rankingPreview, setRankingPreview] = useState(null);
  const [loadingRankingPreview, setLoadingRankingPreview] = useState(false);
  const [manualUnlockModal, setManualUnlockModal] = useState(null);
  const [freezeConfirmModal, setFreezeConfirmModal] = useState(false);

  // Drag and Drop state for puzzles
  const [draggedPuzzleIndex, setDraggedPuzzleIndex] = useState(null);

  const fetchAllAdminData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const [statsRes, usersRes, teamsRes, puzzlesRes, roundsRes, lbRes, auditRes, whitelistRes, faqsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/dashboard-stats`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/users`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/teams-mgmt/teams`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/mgmt/puzzles`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/mgmt/rounds`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/mgmt/leaderboard/status`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/mgmt/audit-logs`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/admin/mgmt/whitelist`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/help`),
      ]);

      if (statsRes.ok) setStats((await statsRes.json()).stats);
      if (usersRes.ok) setUsers((await usersRes.json()).users || []);
      if (teamsRes.ok) setTeams((await teamsRes.json()).teams || []);
      if (puzzlesRes.ok) setPuzzles((await puzzlesRes.json()).puzzles || []);
      if (roundsRes.ok) setRounds((await roundsRes.json()).rounds || []);
      if (lbRes.ok) setLeaderboardStatus((await lbRes.json()).leaderboard || { isFrozen: false, isPublished: true });
      if (auditRes.ok) setAuditLogs((await auditRes.json()).logs || []);
      if (whitelistRes.ok) {
        const wData = await whitelistRes.json();
        setWhitelistEmails(wData.emails || []);
      }
      if (faqsRes.ok) {
        const fData = await faqsRes.json();
        setFaqsList(fData.data?.faqs || []);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch administrator data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize Socket.IO connection & listeners
  useEffect(() => {
    fetchAllAdminData();

    const socket = getSocket();

    const handleConnect = () => {
      setSocketConnected(true);
      socket.emit('admin:request_state');
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleLiveState = (data) => {
      setLiveState(data);
    };

    const handlePresence = (data) => {
      setLiveState((prev) => ({
        ...prev,
        onlineCount: data.onlineCount,
        onlineUsers: data.onlineUsers,
      }));
    };

    const handleGameEvent = (evt) => {
      setLiveEventLogs((prev) => [
        {
          id: `evt_${Date.now()}_${Math.random()}`,
          ...evt,
          receivedAt: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 49),
      ]);
    };

    const handleLeaderboardChanged = () => {
      fetchAllAdminData();
    };

    if (socket.connected) {
      setSocketConnected(true);
      socket.emit('admin:request_state');
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('admin:live_state', handleLiveState);
    socket.on('admin:presence_update', handlePresence);
    socket.on('admin:game_event', handleGameEvent);
    socket.on('admin:leaderboard_changed', handleLeaderboardChanged);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('admin:live_state', handleLiveState);
      socket.off('admin:presence_update', handlePresence);
      socket.off('admin:game_event', handleGameEvent);
      socket.off('admin:leaderboard_changed', handleLeaderboardChanged);
    };
  }, [fetchAllAdminData]);

  const showFeedback = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const formatTimerSeconds = (secs) => {
    if (secs === undefined || secs === null || isNaN(secs)) return '00:00';
    const m = Math.floor(Math.max(0, secs) / 60);
    const s = Math.max(0, secs) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ================= USER DIRECTORY HANDLERS =================
  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${targetUserId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showFeedback(`Updated role to ${newRole}`);
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  // ================= TEAM MANAGEMENT HANDLERS =================
  const openEditTeamModal = (t) => {
    setEditingTeam(t);
    setEditName(t.name);
    setEditMaxSize(String(t.maxSize || 3));
    setEditMinSize(String(t.minSizeRequired || 2));
    setEditBypass(t.allowAdminBypass === true);
  };

  const handleSaveTeamEdit = async (e) => {
    e.preventDefault();
    if (!editingTeam) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/teams-mgmt/teams/${editingTeam._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editName,
          maxSize: parseInt(editMaxSize),
          minSizeRequired: parseInt(editMinSize),
          allowAdminBypass: editBypass,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setEditingTeam(null);
      showFeedback(`Updated team '${editName}'`);
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  const handleResetTeamSession = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to reset the active game session for '${teamName}'? This clears their current progress.`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/mgmt/teams/${teamId}/reset-session`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showFeedback(`Game session reset for '${teamName}'`);
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  const handleAdjustScoreSubmit = async (e) => {
    e.preventDefault();
    if (!adjustScoreModal) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/mgmt/teams/${adjustScoreModal.teamId}/adjust-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roundNumber: adjustScoreModal.roundNumber || 1,
          scoreDelta,
          reason: scoreReason,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setAdjustScoreModal(null);
      showFeedback(`Adjusted score for '${adjustScoreModal.teamName}'`);
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  // ================= PUZZLE HANDLERS =================
  const openCreatePuzzleModal = () => {
    setEditingPuzzle(null);
    setPuzzleForm({
      roundNumber: selectedPuzzleRound,
      title: '',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=800',
      gridRows: 3,
      gridCols: 3,
      solution: '',
      points: 100,
      timeLimitSeconds: 300,
      hint: '',
      isPublished: true,
    });
    setIsPuzzleModalOpen(true);
  };

  const openEditPuzzleModal = (p) => {
    setEditingPuzzle(p);
    setPuzzleForm({
      roundNumber: p.roundNumber,
      title: p.title,
      description: p.description || '',
      imageUrl: p.imageUrl,
      gridRows: p.gridRows || 3,
      gridCols: p.gridCols || 3,
      solution: p.solution,
      points: p.points,
      timeLimitSeconds: p.timeLimitSeconds,
      hint: p.hint || '',
      isPublished: p.isPublished,
    });
    setIsPuzzleModalOpen(true);
  };

  const handleSavePuzzle = async (e) => {
    e.preventDefault();
    try {
      const url = editingPuzzle
        ? `${API_BASE_URL}/admin/mgmt/puzzles/${editingPuzzle._id}`
        : `${API_BASE_URL}/admin/mgmt/puzzles`;

      const method = editingPuzzle ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(puzzleForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setIsPuzzleModalOpen(false);
      showFeedback(editingPuzzle ? 'Puzzle updated successfully!' : 'Puzzle created successfully!');
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  const handleDeletePuzzle = async (puzzleId, title) => {
    if (!window.confirm(`Delete puzzle '${title}'? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/mgmt/puzzles/${puzzleId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showFeedback(`Deleted puzzle '${title}'`);
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  const handleTogglePuzzlePublish = async (puzzleId, currentPublished, title) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/mgmt/puzzles/${puzzleId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPublished: !currentPublished }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showFeedback(`Puzzle '${title}' ${!currentPublished ? 'published' : 'unpublished'}`);
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  const handleMovePuzzle = async (index, direction) => {
    const roundPuzzles = puzzles
      .filter((p) => p.roundNumber === selectedPuzzleRound)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= roundPuzzles.length) return;

    const reordered = [...roundPuzzles];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const orders = reordered.map((p, idx) => ({ id: p._id, displayOrder: idx + 1 }));

    try {
      const res = await fetch(`${API_BASE_URL}/admin/mgmt/puzzles/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orders }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showFeedback('Puzzle display order updated.');
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedPuzzleIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedPuzzleIndex === null || draggedPuzzleIndex === dropIndex) return;

    const roundPuzzles = puzzles
      .filter((p) => p.roundNumber === selectedPuzzleRound)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const reordered = [...roundPuzzles];
    const [draggedItem] = reordered.splice(draggedPuzzleIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);

    setDraggedPuzzleIndex(null);

    const orders = reordered.map((p, idx) => ({ id: p._id, displayOrder: idx + 1 }));

    try {
      const res = await fetch(`${API_BASE_URL}/admin/mgmt/puzzles/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orders }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showFeedback('Puzzles reordered via drag-and-drop.');
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  // ================= ROUND MANAGEMENT HANDLERS =================
  const handleRoundStatusChange = async (roundNumber, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/mgmt/rounds/${roundNumber}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showFeedback(`Round ${roundNumber} status updated to ${status}`);
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  const openEditRoundModal = (r) => {
    setEditingRound(r);
    setRoundTitle(r.title);
    setRoundDesc(r.description || '');
    setRoundDuration(r.durationSeconds || 1800);
    setRoundMinTeam(r.minTeamSize || 2);
    setRoundMechanic(r.mechanicType || 'puzzle');
  };

  const handleSaveRoundConfig = async (e) => {
    e.preventDefault();
    if (!editingRound) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/mgmt/rounds/${editingRound.roundNumber}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: roundTitle,
          description: roundDesc,
          durationSeconds: parseInt(roundDuration) || 1800,
          minTeamSize: parseInt(roundMinTeam) || 2,
          mechanicType: roundMechanic,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setEditingRound(null);
      showFeedback(`Round ${editingRound.roundNumber} configuration updated!`);
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  const handleCreateRound = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/admin/mgmt/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newRoundForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setIsCreateRoundModalOpen(false);
      setNewRoundForm({
        roundNumber: (rounds.length || 0) + 1,
        title: '',
        description: '',
        durationMinutes: 30,
        minTeamSize: 2,
        mechanicType: 'quiz',
        status: 'LOCKED',
      });
      showFeedback(data.message || 'New event round created!');
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  const handleDeleteRound = async (roundNumber, title) => {
    if (!window.confirm(`Are you sure you want to delete Round ${roundNumber}: ${title}? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/admin/mgmt/rounds/${roundNumber}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showFeedback(data.message || `Round ${roundNumber} deleted.`);
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  // ================= WHITELIST MANAGEMENT HANDLERS =================
  const handleAddWhitelist = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    try {
      setAddingAdminEmail(true);
      const res = await fetch(`${API_BASE_URL}/admin/mgmt/whitelist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: newAdminEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setNewAdminEmail('');
      setWhitelistEmails(data.emails || []);
      showFeedback(`Administrator ${newAdminEmail} added to direct whitelist!`);
    } catch (err) {
      showFeedback(err.message, true);
    } finally {
      setAddingAdminEmail(false);
    }
  };

  const handleRemoveWhitelist = async (emailToRemove) => {
    if (!window.confirm(`Remove ${emailToRemove} from administrator whitelist?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/mgmt/whitelist/${encodeURIComponent(emailToRemove)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setWhitelistEmails(data.emails || []);
      showFeedback(`Administrator ${emailToRemove} removed from whitelist.`);
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  // ================= HELP & FAQ MANAGEMENT HANDLERS =================
  const openCreateFaqModal = () => {
    setEditingFaq(null);
    setFaqForm({ category: 'General', question: '', answer: '' });
    setIsFaqModalOpen(true);
  };

  const openEditFaqModal = (faq) => {
    setEditingFaq(faq);
    setFaqForm({
      category: faq.category || 'General',
      question: faq.question || faq.q || '',
      answer: faq.answer || faq.a || '',
    });
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = async (e) => {
    e.preventDefault();
    try {
      const url = editingFaq
        ? `${API_BASE_URL}/admin/mgmt/help/${editingFaq.id}`
        : `${API_BASE_URL}/admin/mgmt/help`;
      const method = editingFaq ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(faqForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setIsFaqModalOpen(false);
      showFeedback(editingFaq ? 'FAQ entry updated!' : 'New FAQ entry published!');
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  const handleDeleteFaq = async (id, question) => {
    if (!window.confirm(`Delete FAQ: "${question}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/mgmt/help/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showFeedback('FAQ entry deleted.');
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  // ================= ADVANCED RANKING & QUALIFICATION HANDLERS =================
  const handleComputePreview = async () => {
    try {
      setLoadingRankingPreview(true);
      const res = await fetch(`${API_BASE_URL}/leaderboard/admin/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roundNumber: selectedRankingRound,
          qualifyingCount: qualifyingLimit,
          tieBreakRules: tieBreakOrder,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setRankingPreview(data.preview);
      showFeedback(`Live rankings preview generated for Round ${selectedRankingRound}.`);
    } catch (err) {
      showFeedback(err.message, true);
    } finally {
      setLoadingRankingPreview(false);
    }
  };

  const handleFreezeRoundLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/leaderboard/admin/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roundNumber: selectedRankingRound,
          qualifyingCount: qualifyingLimit,
          tieBreakRules: tieBreakOrder,
          isPublished: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setFreezeConfirmModal(false);
      showFeedback(data.message);
      fetchAllAdminData();
      handleComputePreview();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  const handleUnfreezeRoundLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/leaderboard/admin/unfreeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roundNumber: selectedRankingRound }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showFeedback(data.message);
      fetchAllAdminData();
      handleComputePreview();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  const handlePublishRoundLeaderboard = async (isPub) => {
    try {
      const res = await fetch(`${API_BASE_URL}/leaderboard/admin/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roundNumber: selectedRankingRound, isPublished: isPub }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showFeedback(data.message);
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  const handleManualRoundUnlock = async (e) => {
    e.preventDefault();
    if (!manualUnlockModal) return;

    try {
      const res = await fetch(`${API_BASE_URL}/leaderboard/admin/manual-unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          teamId: manualUnlockModal.teamId,
          roundNumber: manualUnlockModal.roundNumber,
          reason: manualUnlockModal.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setManualUnlockModal(null);
      showFeedback(data.message);
      fetchAllAdminData();
    } catch (err) {
      showFeedback(err.message, true);
    }
  };

  // Filters
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.profile?.registrationNumber && u.profile.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPuzzles = puzzles
    .filter((p) => p.roundNumber === selectedPuzzleRound)
    .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || (p.solution && p.solution.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const filteredAuditLogs = auditLogs.filter(
    (l) =>
      l.adminEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.targetName && l.targetName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell>
      <div className="page-title-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title">Admin Management Console</h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px',
                borderRadius: 12,
                backgroundColor: socketConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: socketConnected ? '#34d399' : '#f87171',
                border: socketConnected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: socketConnected ? '#10b981' : '#ef4444',
                  boxShadow: socketConnected ? '0 0 8px #10b981' : 'none',
                }}
              />
              {socketConnected ? 'LIVE SOCKET SYNC' : 'OFFLINE'}
            </span>
          </div>
          <p className="page-subtitle">Real-time participant tracking, game session monitoring &amp; event control</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              fetchAllAdminData();
              getSocket().emit('admin:request_state');
            }}
            disabled={loading}
            className="ieee-outline-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 inline mr-1 ${loading ? 'animate-spin' : ''}`} /> Sync All
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {errorMsg && (
        <div className="dash-error-banner" style={{ marginBottom: 16 }}>
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="dash-retry-btn">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 12,
            padding: '12px 18px',
            color: '#6ee7b7',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs Bar & Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        <div className="dash-quick-tabs" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'live_monitor', label: '🔴 Live Real-Time Monitor', icon: Radio, count: liveState.activeRound1PlayingCount },
            { key: 'users', label: 'Participants', icon: Users, count: filteredUsers.length },
            { key: 'teams', label: 'Teams', icon: Layers, count: filteredTeams.length },
            { key: 'puzzles', label: 'Puzzles', icon: Grid, count: puzzles.length },
            { key: 'rounds', label: 'Event Rounds & Controls', icon: SlidersHorizontal, count: rounds.length },
            { key: 'scoring', label: 'Ranking & Qualification', icon: Award },
            { key: 'whitelist', label: 'Admin Whitelist', icon: ShieldCheck, count: whitelistEmails.length },
            { key: 'faqs', label: 'Help & FAQ Manager', icon: HelpCircle, count: faqsList.length },
            { key: 'audit', label: 'Audit Trail', icon: FileText, count: auditLogs.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`ieee-round-tab-btn ${isActive ? 'active' : ''}`}
                style={{
                  padding: '9px 16px',
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  border: isActive ? '1px solid #38bdf8' : '1px solid #1e293b',
                  backgroundColor: isActive ? 'rgba(14, 165, 233, 0.15)' : '#0f172a',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: '1px 6px',
                      borderRadius: 10,
                      backgroundColor: isActive ? '#0284c7' : '#1e293b',
                      color: '#ffffff',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab !== 'live_monitor' && (
          <div style={{ position: 'relative', maxWidth: 360 }}>
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ieee-input"
              style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: LIVE REAL-TIME MONITORING HUB */}
      {/* ======================================================== */}
      {activeTab === 'live_monitor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Live KPI Counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div className="ieee-card" style={{ padding: 18, borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Online Participants</span>
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#34d399', marginTop: 4 }}>
                {liveState.onlineCount} <span style={{ fontSize: 13, color: '#64748b' }}>/ {liveState.totalRegisteredUsers} registered</span>
              </div>
            </div>

            <div className="ieee-card" style={{ padding: 18, borderLeft: '4px solid #0284c7' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Registered Teams</span>
                <Layers className="w-4 h-4 text-sky-400" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
                {liveState.totalTeams} <span style={{ fontSize: 13, color: '#64748b' }}>teams</span>
              </div>
            </div>

            <div className="ieee-card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Playing Round 1</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#fbbf24', marginTop: 4 }}>
                {liveState.activeRound1PlayingCount} <span style={{ fontSize: 13, color: '#64748b' }}>active games</span>
              </div>
            </div>

            <div className="ieee-card" style={{ padding: 18, borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Round 1 Completed</span>
                <CheckCheck className="w-4 h-4 text-purple-400" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#c084fc', marginTop: 4 }}>
                {liveState.completedTeamsCount} <span style={{ fontSize: 13, color: '#64748b' }}>finished</span>
              </div>
            </div>
          </div>

          {/* Active Teams Playing Round 1 Live Session Monitor */}
          <section className="ieee-panel">
            <div className="ieee-panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Live Round 1 Active Sessions ({liveState.activeRound1PlayingCount} Playing)</h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                  Real-time telemetry of current puzzle, solved count, points, and timers
                </p>
              </div>
              <span className="ieee-role-tag" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                REAL-TIME TELEMETRY
              </span>
            </div>

            {liveState.playingTeams.length === 0 ? (
              <div className="dash-empty" style={{ padding: '32px 0' }}>
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p style={{ color: '#94a3b8', fontSize: 13 }}>No teams are actively playing Round 1 right now.</p>
              </div>
            ) : (
              <div className="lb-table">
                <div className="lb-table-head" style={{ gridTemplateColumns: '1.8fr 1.4fr 1.2fr 1fr 1fr 1fr 1.2fr' }}>
                  <span>Team Name</span>
                  <span>Current Puzzle</span>
                  <span>Puzzles Solved</span>
                  <span>Score</span>
                  <span>Elapsed</span>
                  <span>Remaining</span>
                  <span>Actions</span>
                </div>
                {liveState.playingTeams.map((session) => (
                  <div
                    key={session.sessionId || session.teamId}
                    className="lb-table-row"
                    style={{ gridTemplateColumns: '1.8fr 1.4fr 1.2fr 1fr 1fr 1fr 1.2fr', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
                  >
                    <span className="lb-team-name">
                      <strong>{session.teamName}</strong>
                      <span style={{ fontSize: 10, color: '#38bdf8', display: 'block' }}>{session.attemptsCount} total attempts</span>
                    </span>

                    <span style={{ fontSize: 12, color: '#f8fafc', fontWeight: 600 }}>
                      Puzzle #{session.currentPuzzleIndex + 1}
                    </span>

                    <span style={{ color: '#34d399', fontWeight: 700 }}>
                      {session.puzzlesCompleted} solved
                    </span>

                    <span className="lb-score">
                      {session.score} <span style={{ fontSize: 10, color: '#64748b' }}>pts</span>
                    </span>

                    <span style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}>
                      {formatTimerSeconds(session.elapsedSeconds)}
                    </span>

                    <span style={{ color: '#fbbf24', fontSize: 12, fontFamily: 'monospace', fontWeight: 700 }}>
                      {formatTimerSeconds(session.remainingSeconds)}
                    </span>

                    <span>
                      <button
                        onClick={() => handleResetTeamSession(session.teamId, session.teamName)}
                        className="dash-retry-btn"
                        style={{ padding: '3px 8px', fontSize: 11 }}
                      >
                        Reset Session
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Grid with Completed Teams & Online Participants Roster */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Completed Teams List */}
            <section className="ieee-panel">
              <div className="ieee-panel-heading">
                <h2>Round 1 Completed Teams ({liveState.completedTeams.length})</h2>
              </div>
              {liveState.completedTeams.length === 0 ? (
                <div className="dash-empty" style={{ padding: '24px 0', fontSize: 12 }}>
                  No teams have completed Round 1 yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {liveState.completedTeams.map((team, idx) => (
                    <div
                      key={team.teamId || idx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        backgroundColor: '#0b111e',
                        border: '1px solid #1e293b',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: 13 }}>{team.teamName}</span>
                        <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                          Finished in {formatTimerSeconds(team.elapsedSeconds)}
                        </p>
                      </div>
                      <span className="lb-score" style={{ fontSize: 15 }}>
                        {team.score} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Currently Logged In Online Participants Roster */}
            <section className="ieee-panel">
              <div className="ieee-panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Online Users ({liveState.onlineUsers.length})</h2>
                <span style={{ fontSize: 11, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} /> LIVE
                </span>
              </div>
              {liveState.onlineUsers.length === 0 ? (
                <div className="dash-empty" style={{ padding: '24px 0', fontSize: 12 }}>
                  No participants currently active on socket.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {liveState.onlineUsers.map((u, idx) => (
                    <div
                      key={u.userId || u.socketId || idx}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        backgroundColor: '#0b111e',
                        border: '1px solid #1e293b',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 12 }}>{u.name || u.email}</span>
                        <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>{u.email}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="ieee-role-tag" style={{ fontSize: 10, padding: '2px 6px' }}>
                          {u.role}
                        </span>
                        {u.teamName && (
                          <p style={{ fontSize: 10, color: '#38bdf8', margin: 0 }}>{u.teamName}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Real-Time Live Game Events Stream Ticker */}
          <section className="ieee-panel">
            <div className="ieee-panel-heading">
              <h2>Real-Time Live Event Stream</h2>
              <span className="ieee-role-tag">{liveEventLogs.length} RECENT EVENTS</span>
            </div>
            {liveEventLogs.length === 0 ? (
              <div className="dash-empty" style={{ padding: '20px 0', fontSize: 12 }}>
                Listening for live game events (session launches, puzzle solves, submissions)…
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                {liveEventLogs.map((evt) => (
                  <div
                    key={evt.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      backgroundColor: evt.type === 'PUZZLE_SOLVED' ? 'rgba(16, 185, 129, 0.08)' : '#0b111e',
                      borderLeft: evt.type === 'PUZZLE_SOLVED' ? '3px solid #10b981' : '3px solid #0284c7',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12,
                    }}
                  >
                    <div>
                      <strong style={{ color: '#f8fafc' }}>{evt.teamName}</strong>
                      <span style={{ color: '#cbd5e1', marginLeft: 8 }}>
                        {evt.type === 'SESSION_STARTED' && '▶ Started Round 1 session'}
                        {evt.type === 'PUZZLE_SOLVED' && `✓ Solved Puzzle #${evt.currentPuzzleIndex} (+${evt.pointsAwarded} pts)`}
                        {evt.type === 'PUZZLE_ATTEMPT_FAILED' && `✗ Incorrect attempt on Puzzle #${evt.currentPuzzleIndex + 1}`}
                        {evt.type === 'ROUND_COMPLETED' && `🏆 Completed Round 1 with ${evt.finalScore} pts!`}
                      </span>
                    </div>
                    <span style={{ color: '#64748b', fontSize: 11, fontFamily: 'monospace' }}>
                      {evt.receivedAt}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PARTICIPANTS DIRECTORY */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <section className="ieee-panel">
          <div className="ieee-panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Registered Participants ({filteredUsers.length})</h2>
            <span className="ieee-role-tag">ROLE MANAGEMENT</span>
          </div>

          <div className="lb-table">
            <div className="lb-table-head" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.5fr' }}>
              <span>User</span>
              <span>Email</span>
              <span>Team</span>
              <span>Profile</span>
              <span>Role</span>
              <span>Change Role</span>
            </div>
            {filteredUsers.map((u) => (
              <div key={u._id} className="lb-table-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.5fr' }}>
                <span className="lb-team-name">
                  <strong>{u.name}</strong>
                  {u.profile?.registrationNumber && (
                    <span style={{ fontSize: 10, color: '#64748b', display: 'block' }}>Reg: {u.profile.registrationNumber}</span>
                  )}
                </span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{u.email}</span>
                <span style={{ fontSize: 12, color: u.teamName ? '#38bdf8' : '#64748b' }}>{u.teamName || '—'}</span>
                <span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 6,
                      backgroundColor: u.isProfileComplete ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: u.isProfileComplete ? '#34d399' : '#fbbf24',
                    }}
                  >
                    {u.isProfileComplete ? 'Complete' : 'Pending'}
                  </span>
                </span>
                <span>
                  <span className="ieee-role-tag" style={{ fontSize: 10 }}>{u.role}</span>
                </span>
                <span>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    className="ieee-input"
                    style={{ height: 30, fontSize: 11, padding: '2px 6px' }}
                  >
                    <option value="participant">participant</option>
                    <option value="team_leader">team_leader</option>
                    <option value="admin">admin</option>
                    <option value="super_admin">super_admin</option>
                  </select>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 3: TEAMS DIRECTORY */}
      {/* ======================================================== */}
      {activeTab === 'teams' && (
        <section className="ieee-panel">
          <div className="ieee-panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Registered Teams ({filteredTeams.length})</h2>
            <span className="ieee-role-tag">TEAM ROSTERS</span>
          </div>

          {editingTeam && (
            <form onSubmit={handleSaveTeamEdit} className="ieee-card" style={{ padding: 20, marginBottom: 20, border: '1px solid #0284c7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>Edit Team: {editingTeam.name}</h3>
                <button type="button" onClick={() => setEditingTeam(null)} className="dash-retry-btn">Cancel</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Team Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="ieee-input" required />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Min Size</label>
                  <input type="number" value={editMinSize} onChange={(e) => setEditMinSize(e.target.value)} className="ieee-input" min="1" required />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Max Size</label>
                  <input type="number" value={editMaxSize} onChange={(e) => setEditMaxSize(e.target.value)} className="ieee-input" min="1" required />
                </div>
                <button type="submit" className="ieee-btn" style={{ height: 38, marginTop: 18 }}>
                  Save
                </button>
              </div>
            </form>
          )}

          <div className="lb-table">
            <div className="lb-table-head" style={{ gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1.5fr' }}>
              <span>Team Name &amp; Code</span>
              <span>Members</span>
              <span>Capacity</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {filteredTeams.map((t) => (
              <div key={t._id} className="lb-table-row" style={{ gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr 1.5fr' }}>
                <span className="lb-team-name">
                  <strong>{t.name}</strong>
                  <span style={{ fontSize: 11, color: '#fbbf24', marginLeft: 6 }}>({t.code})</span>
                </span>
                <span style={{ color: '#f8fafc' }}>{t.memberIds?.length || 0} members</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Min {t.minSizeRequired || 2} / Max {t.maxSize || 3}</span>
                <span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 6,
                      backgroundColor: t.isDisqualified ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: t.isDisqualified ? '#f87171' : '#34d399',
                    }}
                  >
                    {t.isDisqualified ? 'Disqualified' : 'Active'}
                  </span>
                </span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEditTeamModal(t)} className="ieee-outline-btn" style={{ padding: '3px 8px', fontSize: 11 }}>
                    Edit
                  </button>
                  <button onClick={() => handleResetTeamSession(t._id, t.name)} className="dash-retry-btn" style={{ padding: '3px 8px', fontSize: 11 }}>
                    Reset
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 4: PUZZLES & DETERMINISTIC IMAGE PROCESSOR */}
      {/* ======================================================== */}
      {activeTab === 'puzzles' && (
        <section className="ieee-panel">
          <div className="ieee-panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Round {selectedPuzzleRound} Puzzles ({filteredPuzzles.length})</h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Drag and drop to reorder; deterministic grid section previews</p>
            </div>
            <button onClick={openCreatePuzzleModal} className="ieee-btn" style={{ fontSize: 13, padding: '6px 14px' }}>
              <Plus className="w-4 h-4 inline mr-1" /> Add Puzzle
            </button>
          </div>

          {/* Puzzle Create / Edit Modal */}
          {isPuzzleModalOpen && (
            <form onSubmit={handleSavePuzzle} className="ieee-card" style={{ padding: 20, marginBottom: 20, border: '1px solid #0284c7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  {editingPuzzle ? 'Edit Puzzle' : 'Create New Puzzle'}
                </h3>
                <button type="button" onClick={() => setIsPuzzleModalOpen(false)} className="dash-retry-btn">Cancel</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Title</label>
                    <input type="text" value={puzzleForm.title} onChange={(e) => setPuzzleForm({ ...puzzleForm, title: e.target.value })} className="ieee-input" required />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Description</label>
                    <textarea value={puzzleForm.description} onChange={(e) => setPuzzleForm({ ...puzzleForm, description: e.target.value })} className="ieee-input" style={{ height: 60 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Image URL</label>
                    <input type="text" value={puzzleForm.imageUrl} onChange={(e) => setPuzzleForm({ ...puzzleForm, imageUrl: e.target.value })} className="ieee-input" required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Solution Passcode</label>
                      <input type="text" value={puzzleForm.solution} onChange={(e) => setPuzzleForm({ ...puzzleForm, solution: e.target.value })} className="ieee-input" required />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Points</label>
                      <input type="number" value={puzzleForm.points} onChange={(e) => setPuzzleForm({ ...puzzleForm, points: parseInt(e.target.value) })} className="ieee-input" required />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b111e', padding: 14, borderRadius: 10, border: '1px solid #1e293b' }}>
                  <img src={puzzleForm.imageUrl} alt="Preview" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 8 }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>Preview Slicing: {puzzleForm.gridRows}x{puzzleForm.gridCols} (9 sections)</span>
                </div>
              </div>

              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setIsPuzzleModalOpen(false)} className="ieee-outline-btn">Cancel</button>
                <button type="submit" className="ieee-btn">Save Puzzle</button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredPuzzles.map((p, idx) => (
              <div
                key={p._id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  cursor: 'grab',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <GripVertical className="w-4 h-4 text-slate-500" />
                  <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: 13 }}>#{idx + 1}</span>
                  <img src={p.imageUrl} alt={p.title} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: 0 }}>{p.title}</h4>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                      Solution: <strong style={{ color: '#fbbf24' }}>{p.solution}</strong> | Points: <strong style={{ color: '#34d399' }}>+{p.points}</strong>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => handleMovePuzzle(idx, -1)} disabled={idx === 0} className="ieee-icon-btn" title="Move Up">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleMovePuzzle(idx, 1)} disabled={idx === filteredPuzzles.length - 1} className="ieee-icon-btn" title="Move Down">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleTogglePuzzlePublish(p._id, p.isPublished, p.title)} className="ieee-outline-btn" style={{ padding: '4px 8px', fontSize: 11 }}>
                    {p.isPublished ? 'Published' : 'Draft'}
                  </button>
                  <button onClick={() => openEditPuzzleModal(p)} className="ieee-outline-btn" style={{ padding: '4px 8px', fontSize: 11 }}>
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeletePuzzle(p._id, p.title)} className="dash-retry-btn" style={{ padding: '4px 8px', fontSize: 11 }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 5: ROUNDS AVAILABILITY & CRUD */}
      {/* ======================================================== */}
      {activeTab === 'rounds' && (
        <section className="ieee-panel">
          <div className="ieee-panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Event Rounds &amp; Tournament Mechanics</h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Manage tournament stages, mechanics, time limits, and live availability
              </p>
            </div>
            <button
              onClick={() => {
                setNewRoundForm({
                  roundNumber: (rounds.length || 0) + 1,
                  title: '',
                  description: '',
                  durationMinutes: 30,
                  minTeamSize: 2,
                  mechanicType: 'quiz',
                  status: 'LOCKED',
                });
                setIsCreateRoundModalOpen(true);
              }}
              className="ieee-btn"
              style={{ fontSize: 13 }}
            >
              <PlusCircle className="w-4 h-4 inline mr-1" /> Add Event Round
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {rounds.map((r) => (
              <div key={r._id || r.roundNumber} className="ieee-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>
                      Round {r.roundNumber}: {r.title}
                    </span>
                    <span className="ieee-role-tag">{r.status}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, lineHeight: 1.5 }}>{r.description || 'No description provided.'}</p>
                  <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 14, flexWrap: 'wrap', background: 'rgba(11, 17, 30, 0.6)', padding: '8px 12px', borderRadius: 8 }}>
                    <span>Duration: <strong style={{ color: '#38bdf8' }}>{Math.floor((r.durationSeconds || 1800) / 60)} mins</strong></span>
                    <span>Min Team: <strong style={{ color: '#38bdf8' }}>{r.minTeamSize || 2}</strong></span>
                    <span>Type: <strong style={{ color: '#c084fc', textTransform: 'uppercase' }}>{r.mechanicType || 'puzzle'}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #1e293b', paddingTop: 12 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => handleRoundStatusChange(r.roundNumber, 'LOCKED')} className="ieee-outline-btn" style={{ fontSize: 11, padding: '4px 8px' }}>
                      <Lock className="w-3 h-3 inline mr-1 text-red-400" /> Lock
                    </button>
                    <button onClick={() => handleRoundStatusChange(r.roundNumber, 'AVAILABLE')} className="ieee-outline-btn" style={{ fontSize: 11, padding: '4px 8px', color: '#34d399' }}>
                      <Unlock className="w-3 h-3 inline mr-1 text-emerald-400" /> Open
                    </button>
                    <button onClick={() => handleRoundStatusChange(r.roundNumber, 'IN_PROGRESS')} className="ieee-outline-btn" style={{ fontSize: 11, padding: '4px 8px', color: '#38bdf8' }}>
                      <Play className="w-3 h-3 inline mr-1 text-sky-400" /> Start
                    </button>
                    <button onClick={() => handleRoundStatusChange(r.roundNumber, 'COMPLETED')} className="ieee-outline-btn" style={{ fontSize: 11, padding: '4px 8px' }}>
                      <CheckCircle2 className="w-3 h-3 inline mr-1 text-purple-400" /> Close
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={() => openEditRoundModal(r)} className="ieee-outline-btn" style={{ flex: 1, fontSize: 11, padding: '5px 8px', color: '#38bdf8' }}>
                      <Edit3 className="w-3.5 h-3.5 inline mr-1" /> Edit Details &amp; Summary
                    </button>
                    {r.roundNumber > 1 && (
                      <button onClick={() => handleDeleteRound(r.roundNumber, r.title)} className="dash-retry-btn" style={{ fontSize: 11, padding: '5px 10px' }} title="Delete Round">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 6: RANKING & QUALIFICATION ENGINE */}
      {/* ======================================================== */}
      {activeTab === 'scoring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Config Header */}
          <section className="ieee-panel">
            <div className="ieee-panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Ranking, Qualification &amp; Snapshot Controls</h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                  Select round, configure qualifying team cutoff (default 50), preview live rankings, and freeze official snapshot
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4].map((rNum) => (
                  <button
                    key={rNum}
                    onClick={() => {
                      setSelectedRankingRound(rNum);
                      setRankingPreview(null);
                    }}
                    className={`ieee-round-tab-btn ${selectedRankingRound === rNum ? 'active' : ''}`}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      borderRadius: 8,
                      border: selectedRankingRound === rNum ? '1px solid #38bdf8' : '1px solid #1e293b',
                      backgroundColor: selectedRankingRound === rNum ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                      color: selectedRankingRound === rNum ? '#38bdf8' : '#94a3b8',
                    }}
                  >
                    Round {rNum}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 14 }}>
              <div style={{ backgroundColor: '#0b111e', padding: 14, borderRadius: 10, border: '1px solid #1e293b' }}>
                <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Qualifying Teams Cutoff (Default 50)</label>
                <input
                  type="number"
                  value={qualifyingLimit}
                  onChange={(e) => setQualifyingLimit(Math.max(1, parseInt(e.target.value) || 1))}
                  className="ieee-input"
                  min="1"
                />
              </div>

              <div style={{ backgroundColor: '#0b111e', padding: 14, borderRadius: 10, border: '1px solid #1e293b' }}>
                <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Tie-Break Rules</label>
                <span style={{ fontSize: 11, color: '#38bdf8', lineHeight: 1.5, display: 'block' }}>
                  1. Puzzles Solved (DESC)<br />
                  2. Total Score (DESC)<br />
                  3. Time Taken (ASC)<br />
                  4. Solve Timestamp (ASC)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                <button onClick={handleComputePreview} disabled={loadingRankingPreview} className="ieee-btn" style={{ width: '100%', fontSize: 13 }}>
                  <RefreshCw className={`w-3.5 h-3.5 inline mr-1 ${loadingRankingPreview ? 'animate-spin' : ''}`} />
                  Compute Live Preview
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setFreezeConfirmModal(true)} className="ieee-outline-btn" style={{ flex: 1, fontSize: 12, color: '#fbbf24' }}>
                    <Lock className="w-3.5 h-3.5 inline mr-1" /> Freeze
                  </button>
                  <button onClick={() => handlePublishRoundLeaderboard(true)} className="ieee-outline-btn" style={{ flex: 1, fontSize: 12, color: '#34d399' }}>
                    Publish
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Freeze Confirmation Modal */}
          {freezeConfirmModal && (
            <div className="ieee-modal-overlay">
              <div className="ieee-modal-box" style={{ maxWidth: 480, textAlign: 'left' }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#f8fafc', marginBottom: 10 }}>
                  Freeze Round {selectedRankingRound} Leaderboard
                </h3>
                <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 14 }}>
                  This will finalize rankings and qualify the <strong>top {qualifyingLimit} teams</strong>. All team members will inherit qualification for Round {selectedRankingRound + 1}. Once frozen, qualification will not automatically change.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setFreezeConfirmModal(false)} className="ieee-outline-btn">Cancel</button>
                  <button onClick={handleFreezeRoundLeaderboard} className="ieee-btn">Confirm &amp; Freeze</button>
                </div>
              </div>
            </div>
          )}

          {/* Ranking Preview Table */}
          {rankingPreview && (
            <section className="ieee-panel">
              <div className="ieee-panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Round {selectedRankingRound} Live Preview</h2>
                <span className="ieee-role-tag" style={{ color: '#34d399' }}>
                  {rankingPreview.totalQualifiedTeams} QUALIFYING TEAMS
                </span>
              </div>
              <div className="lb-table">
                <div className="lb-table-head" style={{ gridTemplateColumns: '70px 2fr 1fr 1fr 1fr 1fr' }}>
                  <span>Rank</span>
                  <span>Team</span>
                  <span>Solved</span>
                  <span>Score</span>
                  <span>Time</span>
                  <span>Status</span>
                </div>
                {rankingPreview.entries.map((entry) => (
                  <div key={entry.teamId} className="lb-table-row" style={{ gridTemplateColumns: '70px 2fr 1fr 1fr 1fr 1fr' }}>
                    <span className="lb-rank">#{entry.rank}</span>
                    <span className="lb-team-name">
                      <strong>{entry.teamName}</strong>
                      {entry.isManualOverride && <span className="lb-my-badge" style={{ backgroundColor: '#7c3aed' }}>OVERRIDE</span>}
                    </span>
                    <span>{entry.puzzlesCompleted} solved</span>
                    <span className="lb-score">{entry.totalScore} pts</span>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{entry.completionTimeSeconds}s</span>
                    <span>
                      {entry.isQualified ? (
                        <span style={{ color: '#34d399', fontSize: 12, fontWeight: 700 }}>✓ Qualified</span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: 12 }}>Eliminated</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Manual Exception Overrides List */}
          <section className="ieee-panel">
            <div className="ieee-panel-heading">
              <h2>Manual Exception Overrides &amp; Round Unlocks</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
              {teams.map((t) => (
                <div
                  key={t._id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    backgroundColor: '#0b111e',
                    border: '1px solid #1e293b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13, color: '#f8fafc' }}>{t.name}</strong>
                    <span style={{ fontSize: 10, color: '#64748b', display: 'block' }}>{t.code}</span>
                  </div>
                  <button
                    onClick={() => setManualUnlockModal({ teamId: t._id, teamName: t.name, roundNumber: 2, reason: '' })}
                    className="ieee-outline-btn"
                    style={{ fontSize: 11, padding: '3px 8px', color: '#34d399' }}
                  >
                    Unlock R2-4
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Manual Unlock Modal */}
          {manualUnlockModal && (
            <div className="ieee-modal-overlay">
              <form onSubmit={handleManualRoundUnlock} className="ieee-modal-box" style={{ maxWidth: 440, textAlign: 'left' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>
                  Manual Unlock Exception: {manualUnlockModal.teamName}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Round</label>
                    <select
                      value={manualUnlockModal.roundNumber}
                      onChange={(e) => setManualUnlockModal({ ...manualUnlockModal, roundNumber: parseInt(e.target.value) })}
                      className="ieee-input"
                    >
                      <option value={2}>Round 2: Quantum Quiz</option>
                      <option value={3}>Round 3: Media Showcase</option>
                      <option value={4}>Round 4: Speed Run</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Reason</label>
                    <input
                      type="text"
                      value={manualUnlockModal.reason}
                      onChange={(e) => setManualUnlockModal({ ...manualUnlockModal, reason: e.target.value })}
                      className="ieee-input"
                      placeholder="e.g. Administrative exception override"
                      required
                    />
                  </div>
                </div>
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" onClick={() => setManualUnlockModal(null)} className="ieee-outline-btn">Cancel</button>
                  <button type="submit" className="ieee-btn">Grant Exception</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: ADMIN WHITELIST MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'whitelist' && (
        <section className="ieee-panel">
          <div className="ieee-panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Administrator Google Access Whitelist</h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Google accounts listed below are automatically granted full administrative permissions and routed directly to the Admin Console
              </p>
            </div>
            <span className="ieee-role-tag" style={{ color: '#38bdf8' }}>
              {whitelistEmails.length} AUTHORIZED ADMINS
            </span>
          </div>

          {/* Add Email Form */}
          <form
            onSubmit={handleAddWhitelist}
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 24,
              padding: 16,
              background: 'rgba(11, 17, 30, 0.7)',
              borderRadius: 12,
              border: '1px solid rgba(56, 189, 248, 0.2)',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 1, position: 'relative' }}>
              <Mail className="w-4 h-4 text-sky-400" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                placeholder="Enter Google email to authorize (e.g. volunteer.lead@gmail.com)"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="ieee-input"
                style={{ paddingLeft: 40, width: '100%' }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={addingAdminEmail || !newAdminEmail.trim()}
              className="ieee-btn"
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <UserPlus className="w-4 h-4" />
              <span>{addingAdminEmail ? 'Authorizing...' : 'Authorize Admin'}</span>
            </button>
          </form>

          {/* Whitelist Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {whitelistEmails.map((email) => {
              const isDefault =
                email === 'sankasatyaavinash2034@gmail.com' || email === 'kartikeyakk2007@gmail.com';
              return (
                <div
                  key={email}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 12,
                    background: '#0b111e',
                    border: '1px solid rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: 'rgba(56, 189, 248, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                      }}
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <strong style={{ fontSize: 14, color: '#f8fafc', display: 'block' }}>{email}</strong>
                      <span style={{ fontSize: 11, color: isDefault ? '#38bdf8' : '#94a3b8' }}>
                        {isDefault ? 'Primary Super Admin' : 'Authorized Administrator'}
                      </span>
                    </div>
                  </div>

                  {!isDefault && (
                    <button
                      onClick={() => handleRemoveWhitelist(email)}
                      className="dash-retry-btn"
                      style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                      title="Revoke Admin Access"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 8: HELP & SUPPORT FAQ MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'faqs' && (
        <section className="ieee-panel">
          <div className="ieee-panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Help &amp; Support FAQ Management</h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Add, edit, or remove FAQ questions displayed on participant Help &amp; Support page
              </p>
            </div>
            <button onClick={openCreateFaqModal} className="ieee-btn" style={{ fontSize: 13 }}>
              <Plus className="w-4 h-4 inline mr-1" /> Add FAQ Item
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqsList.map((faq) => (
              <div
                key={faq.id}
                style={{
                  padding: '16px 20px',
                  borderRadius: 12,
                  background: '#0b111e',
                  border: '1px solid #1e293b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 11,
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.12)',
                        padding: '2px 8px',
                        borderRadius: 999,
                      }}
                    >
                      {faq.category || 'General'}
                    </span>
                    <strong style={{ fontSize: 15, color: '#f8fafc' }}>{faq.question || faq.q}</strong>
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                    {faq.answer || faq.a}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8, shrink: 0 }}>
                  <button onClick={() => openEditFaqModal(faq)} className="ieee-outline-btn" style={{ padding: '6px 10px', fontSize: 12 }}>
                    <Edit3 className="w-3.5 h-3.5 inline mr-1" /> Edit
                  </button>
                  <button onClick={() => handleDeleteFaq(faq.id, faq.question || faq.q)} className="dash-retry-btn" style={{ padding: '6px 10px', fontSize: 12 }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 9: AUDIT TRAIL LOGS */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <section className="ieee-panel">
          <div className="ieee-panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Security Audit Trail Logs ({filteredAuditLogs.length})</h2>
            <span className="ieee-role-tag">IMMUTABLE LOGS</span>
          </div>

          <div className="lb-table">
            <div className="lb-table-head" style={{ gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1.5fr' }}>
              <span>Action</span>
              <span>Administrator</span>
              <span>Target</span>
              <span>Timestamp</span>
            </div>
            {filteredAuditLogs.map((log) => (
              <div key={log._id} className="lb-table-row" style={{ gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1.5fr' }}>
                <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: 12 }}>{log.action}</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{log.adminEmail}</span>
                <span style={{ fontSize: 12, color: '#e2e8f0' }}>{log.targetType}: {log.targetName || log.targetId}</span>
                <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                  {new Date(log.createdAt || log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CREATE ROUND MODAL ── */}
      {isCreateRoundModalOpen && (
        <div className="ieee-modal-overlay">
          <form onSubmit={handleCreateRound} className="ieee-modal-box" style={{ maxWidth: 520, textAlign: 'left' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', marginBottom: 16 }}>
              Create New Event Round
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Round Number</label>
                  <input
                    type="number"
                    value={newRoundForm.roundNumber}
                    onChange={(e) => setNewRoundForm({ ...newRoundForm, roundNumber: parseInt(e.target.value) || 1 })}
                    className="ieee-input"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Round Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Speed Challenge"
                    value={newRoundForm.title}
                    onChange={(e) => setNewRoundForm({ ...newRoundForm, title: e.target.value })}
                    className="ieee-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Description / Summary</label>
                <textarea
                  placeholder="Summary of rules and game mechanics for this round..."
                  value={newRoundForm.description}
                  onChange={(e) => setNewRoundForm({ ...newRoundForm, description: e.target.value })}
                  className="ieee-input"
                  rows={3}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Duration (Mins)</label>
                  <input
                    type="number"
                    value={newRoundForm.durationMinutes}
                    onChange={(e) => setNewRoundForm({ ...newRoundForm, durationMinutes: parseInt(e.target.value) || 30 })}
                    className="ieee-input"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Min Team Size</label>
                  <input
                    type="number"
                    value={newRoundForm.minTeamSize}
                    onChange={(e) => setNewRoundForm({ ...newRoundForm, minTeamSize: parseInt(e.target.value) || 2 })}
                    className="ieee-input"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Mechanic</label>
                  <select
                    value={newRoundForm.mechanicType}
                    onChange={(e) => setNewRoundForm({ ...newRoundForm, mechanicType: e.target.value })}
                    className="ieee-input"
                  >
                    <option value="puzzle">Puzzle</option>
                    <option value="quiz">Quiz</option>
                    <option value="media">Media</option>
                    <option value="speedrun">Speed Run</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setIsCreateRoundModalOpen(false)} className="ieee-outline-btn">Cancel</button>
              <button type="submit" className="ieee-btn">Create Round</button>
            </div>
          </form>
        </div>
      )}

      {/* ── EDIT ROUND MODAL ── */}
      {editingRound && (
        <div className="ieee-modal-overlay">
          <form onSubmit={handleSaveRoundConfig} className="ieee-modal-box" style={{ maxWidth: 520, textAlign: 'left' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', marginBottom: 16 }}>
              Edit Round {editingRound.roundNumber} Configuration
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Title</label>
                <input
                  type="text"
                  value={roundTitle}
                  onChange={(e) => setRoundTitle(e.target.value)}
                  className="ieee-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Description / Summary</label>
                <textarea
                  value={roundDesc}
                  onChange={(e) => setRoundDesc(e.target.value)}
                  className="ieee-input"
                  rows={3}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Duration (Seconds)</label>
                  <input
                    type="number"
                    value={roundDuration}
                    onChange={(e) => setRoundDuration(e.target.value)}
                    className="ieee-input"
                    min="60"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Min Team Size</label>
                  <input
                    type="number"
                    value={roundMinTeam}
                    onChange={(e) => setRoundMinTeam(e.target.value)}
                    className="ieee-input"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Mechanic</label>
                  <select
                    value={roundMechanic}
                    onChange={(e) => setRoundMechanic(e.target.value)}
                    className="ieee-input"
                  >
                    <option value="puzzle">Puzzle</option>
                    <option value="quiz">Quiz</option>
                    <option value="media">Media</option>
                    <option value="speedrun">Speed Run</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setEditingRound(null)} className="ieee-outline-btn">Cancel</button>
              <button type="submit" className="ieee-btn">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* ── CREATE / EDIT FAQ MODAL ── */}
      {isFaqModalOpen && (
        <div className="ieee-modal-overlay">
          <form onSubmit={handleSaveFaq} className="ieee-modal-box" style={{ maxWidth: 520, textAlign: 'left' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', marginBottom: 16 }}>
              {editingFaq ? 'Edit FAQ Item' : 'Add New FAQ Item'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Category</label>
                <input
                  type="text"
                  placeholder="e.g. Teams, Gameplay, Rules, Scoring"
                  value={faqForm.category}
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  className="ieee-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Question</label>
                <input
                  type="text"
                  placeholder="e.g. How do I join or create a team?"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  className="ieee-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Answer</label>
                <textarea
                  placeholder="Detailed answer or instructions..."
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  className="ieee-input"
                  rows={4}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setIsFaqModalOpen(false)} className="ieee-outline-btn">Cancel</button>
              <button type="submit" className="ieee-btn">
                {editingFaq ? 'Update FAQ' : 'Publish FAQ'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
