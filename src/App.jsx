import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { GameBoard } from './components/GameBoard';
import { PieceTray } from './components/PieceTray';
import { Controls } from './components/Controls';
import { ImageSelector } from './components/ImageSelector';
import { PreviewModal } from './components/PreviewModal';
import { VictoryModal } from './components/VictoryModal';
import { InstructionsModal } from './components/InstructionsModal';
import { soundManager } from './utils/audio';
import { PRESET_PUZZLES } from './utils/presets';
import {
  createTiles,
  shuffleArray,
  checkIsSolved,
  validateSolution,
  calculateProgress,
  GAME_MODES
} from './utils/puzzleLogic';
import './App.css';

export function App() {
  // Config state
  const [gridSize, setGridSize] = useState(5); // Default 5x5 as in original
  const [gameMode, setGameMode] = useState(GAME_MODES.TRAY); // Default original tray mode
  const [currentPreset, setCurrentPreset] = useState(PRESET_PUZZLES[0]);
  const [customImageUrl, setCustomImageUrl] = useState(null);

  // Gameplay state
  const [board, setBoard] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [turns, setTurns] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submissionFeedback, setSubmissionFeedback] = useState(null);

  // Interaction state
  const [selectedTile, setSelectedTile] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const dragSourceRef = useRef(null);

  // Visual aids & Theme
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('avengers_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });
  const [showGhostHint, setShowGhostHint] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [soundMuted, setSoundMuted] = useState(soundManager.getMuted());

  // Modals state
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSolving, setIsSolving] = useState(false);

  // Best scores persistence
  const [bestScores, setBestScores] = useState(() => {
    try {
      const saved = localStorage.getItem('avengers_best_scores');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const activeImageSrc = customImageUrl || currentPreset.src;
  const timerRef = useRef(null);

  // Initialize or Reset Game
  const initGame = useCallback((size = gridSize, mode = gameMode) => {
    const allTiles = createTiles(size);
    const shuffled = shuffleArray(allTiles);

    if (mode === GAME_MODES.TRAY) {
      // Board starts empty (all nulls), pieces tray has all shuffled tiles
      setBoard(new Array(size * size).fill(null));
      setPieces(shuffled);
    } else {
      // SWAP mode: all pieces placed on board shuffled, tray is empty
      setBoard(shuffled);
      setPieces([]);
    }

    setTurns(0);
    setSeconds(0);
    setIsTimerRunning(false);
    setIsSolved(false);
    setSelectedTile(null);
    setDragOverTarget(null);
    setIsSolving(false);
    setProgress(0);
    setSubmissionFeedback(null);
  }, [gridSize, gameMode]);

  // Initial load
  useEffect(() => {
    initGame(gridSize, gameMode);
  }, [initGame, gridSize, gameMode]);

  // Timer Tick
  useEffect(() => {
    if (isTimerRunning && !isSolved) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, isSolved]);

  // Apply Theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('avengers_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Theme Toggle
  const handleToggleTheme = () => {
    soundManager.playClick();
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sound Mute Toggle
  const handleToggleSound = () => {
    const nextMuted = !soundMuted;
    setSoundMuted(nextMuted);
    soundManager.setMuted(nextMuted);
    if (!nextMuted) {
      soundManager.playClick();
    }
  };

  // Perform Swap / Movement
  const executeMove = (source, target) => {
    if (!source || !target) return;
    if (source.source === target.source && source.index === target.index) {
      setSelectedTile(null);
      return;
    }

    // Start timer on first move
    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    const newBoard = [...board];
    const newPieces = [...pieces];

    let sourceTile = null;
    let targetTile = null;

    // Get source tile
    if (source.source === 'board') {
      sourceTile = newBoard[source.index];
    } else {
      sourceTile = newPieces[source.index];
    }

    // If source is empty, do nothing
    if (!sourceTile) {
      setSelectedTile(null);
      return;
    }

    // Get target tile
    if (target.source === 'board') {
      targetTile = newBoard[target.index];
    } else {
      targetTile = newPieces[target.index];
    }

    // Perform swap
    if (source.source === 'board') {
      newBoard[source.index] = targetTile;
    } else {
      newPieces[source.index] = targetTile;
    }

    if (target.source === 'board') {
      newBoard[target.index] = sourceTile;
    } else {
      newPieces[target.index] = sourceTile;
    }

    const nextTurns = turns + 1;
    setTurns(nextTurns);
    setBoard(newBoard);
    setPieces(newPieces);
    setSelectedTile(null);
    setDragOverTarget(null);

    // Check if target is in correct position
    const isTargetCorrect = target.source === 'board' && sourceTile && sourceTile.correctIndex === target.index;
    soundManager.playSnap(isTargetCorrect);

    // Calculate progress
    const newProgress = calculateProgress(newBoard, gridSize);
    setProgress(newProgress);

    // Check win condition
    const solved = checkIsSolved(newBoard, gridSize, gameMode);
    if (solved) {
      setIsSolved(true);
      setIsTimerRunning(false);
      setProgress(100);
      soundManager.playWin();

      // Save Best Score
      const scoreKey = `${gameMode}_${gridSize}`;
      const currentBest = bestScores[scoreKey];
      if (!currentBest || nextTurns < currentBest) {
        const updated = { ...bestScores, [scoreKey]: nextTurns };
        setBestScores(updated);
        try {
          localStorage.setItem('avengers_best_scores', JSON.stringify(updated));
        } catch {
          // ignore
        }
      }

      setTimeout(() => {
        setIsVictoryOpen(true);
      }, 500);
    }
  };

  // SUBMIT ANSWER (Flowchart validation: compare currentPosition with correctPosition)
  const handleSubmitAnswer = () => {
    if (isSolved || isSolving) return;

    // Compare currentPosition with correctPosition for every tile
    const result = validateSolution(board, gridSize);

    if (result.isCorrect) {
      // TRUE -> CORRECT
      setIsSolved(true);
      setIsTimerRunning(false);
      setProgress(100);
      setSubmissionFeedback({
        isCorrect: true,
        correctCount: result.total,
        total: result.total,
        misplacedIndices: []
      });
      soundManager.playWin();

      const scoreKey = `${gameMode}_${gridSize}`;
      const currentBest = bestScores[scoreKey];
      if (!currentBest || turns < currentBest) {
        const updated = { ...bestScores, [scoreKey]: turns };
        setBestScores(updated);
        try {
          localStorage.setItem('avengers_best_scores', JSON.stringify(updated));
        } catch {
          // ignore
        }
      }

      setTimeout(() => {
        setIsVictoryOpen(true);
      }, 400);
    } else {
      // FALSE -> WRONG
      soundManager.playError();
      setSubmissionFeedback({
        isCorrect: false,
        correctCount: result.correctCount,
        total: result.total,
        misplacedIndices: result.misplacedIndices
      });

      // Clear wrong banner after 3 seconds
      setTimeout(() => {
        setSubmissionFeedback((prev) => (prev && !prev.isCorrect ? null : prev));
      }, 3000);
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e, data) => {
    if (isSolved) return;
    dragSourceRef.current = data;
    soundManager.playGrab();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(data));
  };

  const handleDragOver = (e, targetData) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (
      !dragOverTarget ||
      dragOverTarget.source !== targetData.source ||
      dragOverTarget.index !== targetData.index
    ) {
      setDragOverTarget(targetData);
    }
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (e, targetData) => {
    e.preventDefault();
    const sourceData = dragSourceRef.current;
    if (sourceData) {
      executeMove(sourceData, targetData);
    }
    dragSourceRef.current = null;
    setDragOverTarget(null);
  };

  const handleDragEnd = () => {
    dragSourceRef.current = null;
    setDragOverTarget(null);
  };

  // Click / Tap-to-Swap Handler
  const handleTileClick = (clickData) => {
    if (isSolved) return;

    if (!selectedTile) {
      if (clickData.tile) {
        setSelectedTile(clickData);
        soundManager.playGrab();
      }
    } else {
      if (selectedTile.source === clickData.source && selectedTile.index === clickData.index) {
        setSelectedTile(null);
        soundManager.playClick();
      } else {
        executeMove(selectedTile, clickData);
      }
    }
  };

  // Auto-Solve Animation
  const handleAutoSolve = () => {
    if (isSolved || isSolving) return;
    setIsSolving(true);
    soundManager.playShuffle();

    const solvedTiles = createTiles(gridSize);
    let step = 0;
    const total = gridSize * gridSize;

    const interval = setInterval(() => {
      if (step < total) {
        const currentIdx = step;
        setBoard((prev) => {
          const next = [...prev];
          next[currentIdx] = solvedTiles[currentIdx];
          return next;
        });

        if (gameMode === GAME_MODES.TRAY) {
          setPieces((prev) => {
            const next = [...prev];
            const targetTileId = solvedTiles[currentIdx].id;
            const pieceIdx = next.findIndex((p) => p && p.id === targetTileId);
            if (pieceIdx !== -1) {
              next[pieceIdx] = null;
            }
            return next;
          });
        }

        soundManager.playSnap(true);
        setTurns((t) => t + 1);
        setProgress(Math.round(((step + 1) / total) * 100));
        step++;
      } else {
        clearInterval(interval);
        setIsSolving(false);
        setIsSolved(true);
        setIsTimerRunning(false);
        setProgress(100);
        soundManager.playWin();
        setTimeout(() => setIsVictoryOpen(true), 400);
      }
    }, 75);
  };

  // Switch Grid Dimension
  const handleChangeGridSize = (newSize) => {
    if (newSize === gridSize) return;
    soundManager.playClick();
    setGridSize(newSize);
    initGame(newSize, gameMode);
  };

  // Switch Game Mode
  const handleChangeGameMode = (newMode) => {
    if (newMode === gameMode) return;
    soundManager.playClick();
    setGameMode(newMode);
    initGame(gridSize, newMode);
  };

  // Shuffle / Reset
  const handleShuffle = () => {
    soundManager.playShuffle();
    initGame(gridSize, gameMode);
  };

  // Select Preset Artwork
  const handleSelectPreset = (preset) => {
    soundManager.playClick();
    setCurrentPreset(preset);
    setCustomImageUrl(null);
    initGame(gridSize, gameMode);
  };

  // Custom Image Upload
  const handleUploadCustomImage = (dataUrl) => {
    soundManager.playClick();
    setCustomImageUrl(dataUrl);
    setCurrentPreset({
      id: 'custom',
      title: 'Custom Image',
      hero: 'User Image'
    });
    initGame(gridSize, gameMode);
  };

  // Next Level from Victory Modal
  const handleNextLevel = () => {
    if (gridSize < 6) {
      const nextSize = gridSize + 1;
      setGridSize(nextSize);
      initGame(nextSize, gameMode);
      setIsVictoryOpen(false);
    }
  };

  const scoreKey = `${gameMode}_${gridSize}`;
  const bestScore = bestScores[scoreKey];

  return (
    <div className="app-container">
      <div className="app-content">
        {/* Top Header */}
        <Header
          soundMuted={soundMuted}
          onToggleSound={handleToggleSound}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenImagePicker={() => setIsImageSelectorOpen(true)}
          currentPreset={currentPreset}
        />

        {/* Live Stats Bar */}
        <StatsBar
          turns={turns}
          seconds={seconds}
          progress={progress}
          bestScore={bestScore}
          gridSize={gridSize}
          mode={gameMode}
          onReset={handleShuffle}
        />

        {/* Central Game Section */}
        <main className="game-main-layout">
          {/* Puzzle Board */}
          <GameBoard
            gridSize={gridSize}
            board={board}
            imageSrc={activeImageSrc}
            selectedTile={selectedTile}
            onTileClick={handleTileClick}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            dragOverTarget={dragOverTarget}
            showGhostHint={showGhostHint}
            showNumbers={showNumbers}
            isSolved={isSolved}
            submissionFeedback={submissionFeedback}
          />

          {/* Tray Dock (For Original Assemble Mode) */}
          {gameMode === GAME_MODES.TRAY && (
            <PieceTray
              pieces={pieces}
              gridSize={gridSize}
              imageSrc={activeImageSrc}
              selectedTile={selectedTile}
              onTileClick={handleTileClick}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              dragOverTarget={dragOverTarget}
              showNumbers={showNumbers}
              isSolved={isSolved}
            />
          )}

          {/* Action & Configuration Controls */}
          <Controls
            gridSize={gridSize}
            onChangeGridSize={handleChangeGridSize}
            gameMode={gameMode}
            onChangeGameMode={handleChangeGameMode}
            onShuffle={handleShuffle}
            onSubmitAnswer={handleSubmitAnswer}
            onReset={handleShuffle}
            onToggleGhostHint={() => {
              soundManager.playClick();
              setShowGhostHint(!showGhostHint);
            }}
            showGhostHint={showGhostHint}
            onToggleNumbers={() => {
              soundManager.playClick();
              setShowNumbers(!showNumbers);
            }}
            showNumbers={showNumbers}
            onOpenPreview={() => {
              soundManager.playClick();
              setIsPreviewOpen(true);
            }}
            onAutoSolve={handleAutoSolve}
            isSolving={isSolving}
          />
        </main>
      </div>

      {/* Modals */}
      <ImageSelector
        isOpen={isImageSelectorOpen}
        onClose={() => setIsImageSelectorOpen(false)}
        currentPresetId={customImageUrl ? 'custom' : currentPreset.id}
        onSelectPreset={handleSelectPreset}
        onUploadCustomImage={handleUploadCustomImage}
        customImageUrl={customImageUrl}
      />

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        imageSrc={activeImageSrc}
        title={currentPreset.title}
        hero={currentPreset.hero}
      />

      <VictoryModal
        isOpen={isVictoryOpen}
        onClose={() => setIsVictoryOpen(false)}
        turns={turns}
        seconds={seconds}
        gridSize={gridSize}
        onReplay={handleShuffle}
        onNextLevel={handleNextLevel}
        canNextLevel={gridSize < 6}
        heroTitle={currentPreset.title}
      />

      <InstructionsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}

export default App;
