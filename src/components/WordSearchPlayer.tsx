import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GeneratedPuzzle, PlacedWord } from '../types';
import { sound } from '../utils/audio';
import { RotateCw, Eye, RefreshCw, Trophy, Volume2, VolumeX, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  puzzle: GeneratedPuzzle;
  onRegenerate: () => void;
}

export const WordSearchPlayer: React.FC<Props> = ({ puzzle, onRegenerate }) => {
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>(() => puzzle.placedWords);
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartCell, setDragStartCell] = useState<[number, number] | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showAllAnswers, setShowAllAnswers] = useState<boolean>(false);

  // Perbarui jika puzzle berganti
  useEffect(() => {
    setPlacedWords(puzzle.placedWords);
    setSelectedCells([]);
    setIsDragging(false);
    setDragStartCell(null);
    setSecondsElapsed(0);
    setHasStarted(false);
    setIsVictory(false);
    setShowAllAnswers(false);
  }, [puzzle]);

  // Pewaktu
  useEffect(() => {
    if (!hasStarted || isVictory) return;
    const interval = setInterval(() => {
      setSecondsElapsed(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasStarted, isVictory]);

  // Tombol Ulangi (reset state pencarian kata pada papan yang sama)
  const handleResetBoard = () => {
    setPlacedWords(puzzle.placedWords.map(w => ({ ...w, found: false })));
    setSelectedCells([]);
    setIsDragging(false);
    setDragStartCell(null);
    setSecondsElapsed(0);
    setHasStarted(false);
    setIsVictory(false);
    setShowAllAnswers(false);
  };

  // Tombol Tampilkan Jawaban
  const handleRevealAnswers = () => {
    setShowAllAnswers(true);
    setPlacedWords(prev => prev.map(w => ({ ...w, found: true })));
    sound.playSelect();
  };

  const toggleSound = () => {
    sound.soundEnabled = !sound.soundEnabled;
    setIsMuted(!sound.soundEnabled);
  };

  // Garis sel yang ditarik
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

  // Peta sel tersorot
  const foundCellColorMap = useMemo(() => {
    const map = new Map<string, string>();
    placedWords.forEach(pw => {
      if (pw.found || showAllAnswers) {
        pw.cells.forEach(([r, c]) => {
          map.set(`${r}_${c}`, pw.color);
        });
      }
    });
    return map;
  }, [placedWords, showAllAnswers]);

  // Mulai drag
  const handlePointerDown = (r: number, c: number) => {
    if (isVictory) return;
    if (!hasStarted) setHasStarted(true);
    setIsDragging(true);
    setDragStartCell([r, c]);
    setSelectedCells([[r, c]]);
    sound.playSelect();
  };

  // Seret lewat sel
  const handlePointerEnter = (r: number, c: number) => {
    if (!isDragging || !dragStartCell) return;
    const line = getLineCells(dragStartCell, [r, c]);
    if (line) {
      setSelectedCells(line);
    }
  };

  // Lepaskan seretan
  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (selectedCells.length > 1) {
      const forwardChars = selectedCells.map(([r, c]) => puzzle.grid[r][c]).join('');
      const backwardChars = [...selectedCells].reverse().map(([r, c]) => puzzle.grid[r][c]).join('');

      let matchedWord: PlacedWord | null = null;

      const updated = placedWords.map(pw => {
        if (!pw.found && (pw.word === forwardChars || pw.word === backwardChars)) {
          matchedWord = pw;
          return { ...pw, found: true };
        }
        return pw;
      });

      if (matchedWord) {
        sound.playWordFound();
        setPlacedWords(updated);

        const remaining = updated.filter(w => !w.found).length;
        if (remaining === 0) {
          setIsVictory(true);
          sound.playVictory();
        }
      }
    }

    setSelectedCells([]);
    setDragStartCell(null);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m > 0) {
      return `${m} menit ${s} detik`;
    }
    return `${s} detik`;
  };

  const formatDigitalTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const foundCount = placedWords.filter(w => w.found).length;
  const totalCount = placedWords.length;

  return (
    <div onPointerUp={handlePointerUp}>
      {/* Catatan jika ukuran grid disesuaikan otomatis */}
      {puzzle.sizeAdjustmentNote && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          ℹ️ {puzzle.sizeAdjustmentNote}
        </div>
      )}

      {/* Baris Status & Tombol Aksi */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        {/* Status Ditemukan & Waktu */}
        <div className="flex items-center gap-4 text-sm font-medium text-slate-800 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Ditemukan: <strong className="text-slate-900">{foundCount}</strong> dari {totalCount} kata
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="font-mono tabular-nums">{formatDigitalTime(secondsElapsed)}</span>
          </div>
        </div>

        {/* Tombol Kontrol */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            aria-label={isMuted ? 'Nyalakan suara' : 'Bisukan suara'}
            className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            title={isMuted ? 'Nyalakan suara' : 'Bisukan suara'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>

          <button
            onClick={handleResetBoard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Ulangi
          </button>

          <button
            onClick={handleRevealAnswers}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5" />
            Tampilkan Jawaban
          </button>

          <button
            onClick={onRegenerate}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-2xs"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Acak Ulang
          </button>
        </div>
      </div>

      {/* Pesan Kemenangan */}
      {isVictory && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-500 shrink-0" />
            <p className="text-sm font-semibold text-emerald-900">
              Selamat! Semua kata ditemukan dalam {formatTime(secondsElapsed)}.
            </p>
          </div>
          <button
            onClick={onRegenerate}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
          >
            Mainkan Puzzle Baru
          </button>
        </div>
      )}

      {/* Grid dan Daftar Kata */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kotak Huruf Grid di Tengah */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div
            className="select-none inline-block p-3 sm:p-4 bg-white rounded-xl shadow-xs border border-slate-200 touch-none"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <div
              className="grid gap-1 sm:gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`,
              }}
            >
              {puzzle.grid.map((row, rIdx) =>
                row.map((letter, cIdx) => {
                  const isSelected = selectedCells.some(([r, c]) => r === rIdx && c === cIdx);
                  const foundColor = foundCellColorMap.get(`${rIdx}_${cIdx}`);

                  let cellBg = 'bg-slate-50 hover:bg-slate-100 text-slate-800';
                  let cellStyle: React.CSSProperties = {};

                  if (foundColor) {
                    cellStyle = {
                      backgroundColor: foundColor,
                      color: '#0f172a',
                      fontWeight: 800,
                    };
                  }

                  if (isSelected) {
                    cellStyle = {
                      backgroundColor: '#60A5FA', // biru terang saat diseret
                      color: '#ffffff',
                      fontWeight: 800,
                      transform: 'scale(1.05)',
                    };
                  }

                  return (
                    <div
                      key={`${rIdx}_${cIdx}`}
                      onPointerDown={() => handlePointerDown(rIdx, cIdx)}
                      onPointerEnter={() => handlePointerEnter(rIdx, cIdx)}
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
          <p className="text-xs text-slate-500 mt-3 text-center">
            Seret tetikus (mouse) atau sentuhan jari dari huruf pertama ke huruf terakhir secara lurus mendatar, menurun, atau diagonal.
          </p>
        </div>

        {/* Daftar Kata (Memakai Bentuk Asli Kata) */}
        <div className="lg:col-span-4 bg-white p-4 rounded-xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">Daftar Kata</h3>
            <span className="text-xs text-slate-500">
              {foundCount}/{totalCount}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {placedWords.map((pw) => (
              <div
                key={pw.word}
                className={`
                  px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold 
                  transition-all duration-150 flex items-center justify-between
                  ${
                    pw.found || showAllAnswers
                      ? 'line-through text-slate-400 bg-slate-50 border border-slate-200'
                      : 'text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200'
                  }
                `}
                style={pw.found || showAllAnswers ? { borderLeft: `4px solid ${pw.color}` } : {}}
              >
                <span className="truncate">{pw.originalText}</span>
                {(pw.found || showAllAnswers) && (
                  <span className="text-emerald-600 font-bold ml-1 text-xs">✓</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <p className="font-medium text-slate-700">Petunjuk bermain:</p>
            <p>• Kata dapat berada dalam arah mendatar, menurun, atau diagonal.</p>
            <p>• Kata dapat bersilangan huruf dengan kata lain.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
