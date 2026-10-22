import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SavedPuzzle, PlacedWord, WordSearchResult } from '../types';
import { generateWordSearch } from '../utils/wordSearchGenerator';
import { sound } from '../utils/audio';
import { 
  Trophy, 
  RotateCw, 
  Lightbulb, 
  Volume2, 
  VolumeX, 
  Printer, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Shuffle
} from 'lucide-react';

interface Props {
  puzzle: SavedPuzzle;
  onBackToMaker: () => void;
  onManagePuzzles: () => void;
}

export const WordSearchPlayer: React.FC<Props> = ({
  puzzle,
  onBackToMaker,
  onManagePuzzles,
}) => {
  const [subsetSize, setSubsetSize] = useState<number>(() => Math.min(12, puzzle.words.length));
  const [gameData, setGameData] = useState<WordSearchResult | null>(null);
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>([]);
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartCell, setDragStartCell] = useState<[number, number] | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [activeHintMessage, setActiveHintMessage] = useState<string | null>(null);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Initialize or re-roll puzzle grid
  const initializeGame = useCallback(() => {
    const result = generateWordSearch({
      words: puzzle.words,
      maxWordsToSelect: subsetSize,
    });
    setGameData(result);
    setPlacedWords(result.placedWords);
    setSelectedCells([]);
    setIsDragging(false);
    setDragStartCell(null);
    setSecondsElapsed(0);
    setIsTimerRunning(true);
    setHintsUsed(0);
    setActiveHintMessage(null);
    setIsVictory(false);
  }, [puzzle.words, subsetSize]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Timer loop
  useEffect(() => {
    if (!isTimerRunning || isVictory) return;
    const interval = setInterval(() => {
      setSecondsElapsed(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isVictory]);

  // Toggle sound
  const toggleSound = () => {
    sound.soundEnabled = !sound.soundEnabled;
    setIsMuted(!sound.soundEnabled);
  };

  // Helper to check line collinearity (horizontal, vertical, diagonal)
  const getLineCells = (start: [number, number], end: [number, number]): [number, number][] | null => {
    const [r0, c0] = start;
    const [r1, c1] = end;
    const dr = r1 - r0;
    const dc = c1 - c0;

    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    if (absDr === 0 && absDc === 0) {
      return [start];
    }

    // Must be horizontal, vertical, or 45-degree diagonal
    const isHorizontal = absDr === 0 && absDc > 0;
    const isVertical = absDc === 0 && absDr > 0;
    const isDiagonal = absDr === absDc;

    if (!isHorizontal && !isVertical && !isDiagonal) {
      return null;
    }

    const steps = Math.max(absDr, absDc);
    const stepR = dr === 0 ? 0 : dr / absDr;
    const stepC = dc === 0 ? 0 : dc / absDc;

    const cells: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      cells.push([r0 + i * stepR, c0 + i * stepC]);
    }
    return cells;
  };

  // Cell key helper
  const cellKey = (r: number, c: number) => `${r}_${c}`;

  // Map of found cells to their highlight colors
  const foundCellColorMap = useMemo(() => {
    const map = new Map<string, string>();
    placedWords.forEach(pw => {
      if (pw.found) {
        pw.cells.forEach(([r, c]) => {
          map.set(cellKey(r, c), pw.color);
        });
      }
    });
    return map;
  }, [placedWords]);

  // Handle pointer down on cell
  const handleCellPointerDown = (r: number, c: number) => {
    setIsDragging(true);
    setDragStartCell([r, c]);
    setSelectedCells([[r, c]]);
    sound.playSelect();
  };

  // Handle pointer enter/move on cell
  const handleCellPointerEnter = (r: number, c: number) => {
    if (!isDragging || !dragStartCell) return;
    const line = getLineCells(dragStartCell, [r, c]);
    if (line) {
      setSelectedCells(line);
    }
  };

  // Handle pointer up anywhere on board
  const handlePointerUp = () => {
    if (!isDragging || !gameData) return;
    setIsDragging(false);

    if (selectedCells.length > 1) {
      // Build selected word forward and backward
      const forwardChars = selectedCells.map(([r, c]) => gameData.grid[r][c]).join('');
      const backwardChars = [...selectedCells].reverse().map(([r, c]) => gameData.grid[r][c]).join('');

      let matchFound = false;

      const updatedWords = placedWords.map(pw => {
        if (!pw.found && (pw.word === forwardChars || pw.word === backwardChars)) {
          matchFound = true;
          return { ...pw, found: true };
        }
        return pw;
      });

      if (matchFound) {
        sound.playWordFound();
        setPlacedWords(updatedWords);
        setActiveHintMessage(null);

        // Check if all placed words are found
        const remaining = updatedWords.filter(w => !w.found).length;
        if (remaining === 0) {
          setIsVictory(true);
          setIsTimerRunning(false);
          sound.playVictory();
        }
      }
    }

    setSelectedCells([]);
    setDragStartCell(null);
  };

  // Hint Logic (4-tier hints)
  const handleRequestHint = () => {
    const unfound = placedWords.filter(w => !w.found);
    if (unfound.length === 0) return;

    // Pick first unfound word
    const target = unfound[0];
    const currentTier = target.hintLevel;
    const nextTier = currentTier + 1;

    setHintsUsed(h => h + 1);

    const [startR, startC] = target.start;
    const [endR, endC] = target.end;
    const dr = endR - startR;
    const dc = endC - startC;

    let dirText = 'horizontal';
    if (dr === 0 && dc > 0) dirText = 'left-to-right →';
    else if (dr === 0 && dc < 0) dirText = 'right-to-left ←';
    else if (dc === 0 && dr > 0) dirText = 'top-to-bottom ↓';
    else if (dc === 0 && dr < 0) dirText = 'bottom-to-top ↑';
    else if (dr > 0 && dc > 0) dirText = 'diagonal down-right ↘';
    else if (dr < 0 && dc < 0) dirText = 'diagonal up-left ↖';
    else if (dr > 0 && dc < 0) dirText = 'diagonal down-left ↙';
    else if (dr < 0 && dc > 0) dirText = 'diagonal up-right ↗';

    let msg = '';
    if (nextTier === 1) {
      msg = `Hint 1: "${target.word}" starts with the letter "${target.word[0]}".`;
    } else if (nextTier === 2) {
      msg = `Hint 2: "${target.word}" is placed in direction: ${dirText}.`;
    } else {
      msg = `Hint 3: "${target.word}" begins at row ${startR + 1}, column ${startC + 1}.`;
    }

    setPlacedWords(prev =>
      prev.map(w => (w.word === target.word ? { ...w, hintLevel: nextTier } : w))
    );
    setActiveHintMessage(msg);
    sound.playSelect();
  };

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const foundCount = placedWords.filter(w => w.found).length;
  const totalCount = placedWords.length;

  if (!gameData) {
    return <div className="p-8 text-center text-slate-500">Generating word search grid...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6" onPointerUp={handlePointerUp}>
      {/* Top action row */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMaker}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Maker Form
          </button>
          <button
            onClick={onManagePuzzles}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Manage Puzzles
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>

          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            title="Print worksheet for paper solving"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Print Worksheet
          </button>

          {/* Regenerate with new random word subset */}
          <button
            onClick={initializeGame}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            title="Generate a new random grid with another subset of words"
          >
            <Shuffle className="w-4 h-4" />
            Randomize Subset
          </button>
        </div>
      </div>

      {/* Printable Sheet View (visible only in print) */}
      <div className="print-only mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-black mb-1">{puzzle.title}</h1>
        <p className="text-sm text-gray-700 mb-4">{puzzle.description}</p>
        <div className="flex justify-between text-xs border-b border-black pb-2 mb-4">
          <span>Name: ______________________</span>
          <span>Date: ______________________</span>
          <span>Score / Time: _______________</span>
        </div>
      </div>

      {/* Main Puzzle Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{puzzle.title}</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">{puzzle.description}</p>
          </div>

          {/* Live Game Stats */}
          <div className="no-print flex items-center gap-4 text-sm font-medium text-slate-700 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 shrink-0">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-mono tabular-nums">{formatTime(secondsElapsed)}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{foundCount} of {totalCount} words</span>
            </div>
          </div>
        </div>

        {/* Word subset selector & hint trigger */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Play with subset:</span>
            <select
              value={subsetSize}
              onChange={(e) => setSubsetSize(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {puzzle.words.length >= 10 && <option value={10}>10 words (Quick)</option>}
              {puzzle.words.length >= 12 && <option value={12}>12 words (Balanced)</option>}
              {puzzle.words.length >= 15 && <option value={15}>15 words (Standard)</option>}
              {puzzle.words.length >= 20 && <option value={20}>20 words (Challenging)</option>}
              <option value={puzzle.words.length}>All {puzzle.words.length} words (Full)</option>
            </select>
            <span className="text-slate-400">· Selected at random at play time</span>
          </div>

          <button
            onClick={handleRequestHint}
            disabled={isVictory || foundCount === totalCount}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
            Get Clue ({hintsUsed} used)
          </button>
        </div>

        {/* Active Hint Banner */}
        {activeHintMessage && (
          <div className="no-print mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-900 flex items-center justify-between animate-fadeIn">
            <span>💡 {activeHintMessage}</span>
            <button
              onClick={() => setActiveHintMessage(null)}
              className="text-amber-700 hover:text-amber-900 ml-4 font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Grid + Word Bank Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* The Word Search Grid */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div
            className="select-none inline-block p-3 sm:p-4 bg-white rounded-xl shadow-sm border border-slate-200 touch-none"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <div
              className="grid gap-1 sm:gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${gameData.size}, minmax(0, 1fr))`,
              }}
            >
              {gameData.grid.map((row, rIdx) =>
                row.map((letter, cIdx) => {
                  const isSelected = selectedCells.some(([r, c]) => r === rIdx && c === cIdx);
                  const foundColor = foundCellColorMap.get(cellKey(rIdx, cIdx));

                  let cellBg = 'bg-slate-50 hover:bg-slate-100 text-slate-800';
                  let cellStyle: React.CSSProperties = {};

                  if (foundColor) {
                    cellStyle = {
                      backgroundColor: foundColor,
                      color: '#0f172a',
                      fontWeight: 700,
                    };
                  }

                  if (isSelected) {
                    cellStyle = {
                      backgroundColor: '#60A5FA', // bright blue-400 selection line
                      color: '#ffffff',
                      fontWeight: 700,
                      transform: 'scale(1.06)',
                    };
                  }

                  return (
                    <div
                      key={`${rIdx}_${cIdx}`}
                      onPointerDown={() => handleCellPointerDown(rIdx, cIdx)}
                      onPointerEnter={() => handleCellPointerEnter(rIdx, cIdx)}
                      style={cellStyle}
                      className={`
                        w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 
                        flex items-center justify-center 
                        text-sm sm:text-base md:text-lg 
                        font-mono font-bold tracking-wider 
                        rounded-md cursor-pointer 
                        transition-transform duration-75 
                        ${!foundColor && !isSelected ? cellBg : ''}
                      `}
                    >
                      {letter}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <p className="no-print text-xs text-slate-500 mt-3 text-center">
            Click & drag (or touch & drag) across letters horizontally, vertically, or diagonally to find words.
          </p>
        </div>

        {/* Word Bank & Checklist */}
        <div className="lg:col-span-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">Word Bank</h3>
            <span className="text-xs text-slate-500">
              {foundCount}/{totalCount} found
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
            {placedWords.map((pw) => {
              return (
                <div
                  key={pw.word}
                  className={`
                    px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold 
                    transition-all duration-200 flex items-center justify-between
                    ${pw.found 
                      ? 'line-through text-slate-400 bg-slate-50 border border-slate-200' 
                      : 'text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200'}
                  `}
                  style={pw.found ? { borderLeft: `4px solid ${pw.color}` } : {}}
                >
                  <span className="truncate">{pw.word}</span>
                  {pw.found && (
                    <span className="text-emerald-600 font-bold ml-1 text-xs">✓</span>
                  )}
                </div>
              );
            })}
          </div>

          {gameData.unplacedWords.length > 0 && (
            <p className="no-print text-[11px] text-slate-400 mt-4 italic">
              * Note: {gameData.unplacedWords.length} words from full pool were omitted in this random round.
            </p>
          )}

          {/* Quick instructions in player */}
          <div className="no-print mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
            <p className="font-medium text-slate-700">How to solve:</p>
            <p>1. Find words in any of the 8 compass directions.</p>
            <p>2. Words may overlap letters with other words.</p>
            <p>3. Use the Clue button if you get stuck!</p>
          </div>
        </div>
      </div>

      {/* Printable Word Bank for Paper Solving */}
      <div className="print-only mt-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-3">
          Word Bank ({placedWords.length} words to find)
        </h3>
        <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-xs font-mono">
          {placedWords.map((pw, i) => (
            <div key={pw.word} className="flex items-center gap-2">
              <span className="w-4 h-4 border border-black inline-block"></span>
              <span>{i + 1}. {pw.word}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Victory Celebration Modal */}
      {isVictory && (
        <div className="no-print fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center border border-slate-100">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1">Puzzle Solved!</h3>
            <p className="text-sm text-slate-600 mb-6">
              You found all <span className="font-bold text-slate-800">{totalCount} words</span> in{' '}
              <span className="font-bold text-blue-600">{formatTime(secondsElapsed)}</span>!
            </p>

            <div className="bg-slate-50 rounded-xl p-3 mb-6 grid grid-cols-3 gap-2 text-center text-xs border border-slate-200">
              <div>
                <p className="text-slate-500">Words</p>
                <p className="text-base font-bold text-slate-800">{totalCount}</p>
              </div>
              <div>
                <p className="text-slate-500">Time</p>
                <p className="text-base font-bold text-slate-800 font-mono">{formatTime(secondsElapsed)}</p>
              </div>
              <div>
                <p className="text-slate-500">Hints</p>
                <p className="text-base font-bold text-slate-800">{hintsUsed}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={initializeGame}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
              >
                <RotateCw className="w-4 h-4" />
                Play Again (New Word Subset)
              </button>
              <button
                onClick={onBackToMaker}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition-colors text-sm"
              >
                Create Another Puzzle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
