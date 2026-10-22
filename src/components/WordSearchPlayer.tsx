import React, { useState, useEffect, useMemo } from 'react';
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

  // Ukuran kotak huruf fit ke layar
  const [cellSizePx, setCellSizePx] = useState<number>(38);

  // Hitung ulang ukuran kotak huruf otomatis agar pas memenuhi ruang layar yang tersisa
  useEffect(() => {
    const calculateFitSize = () => {
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const isMobile = winW < 1024;

      let maxGridDim: number;
      if (isMobile) {
        // Layar kecil/ponsel: ruang vertikal dan horizontal
        const availW = Math.max(200, winW - 24);
        const availH = Math.max(220, winH - 260);
        maxGridDim = Math.min(availW, availH);
      } else {
        // Layar desktop: area atas sangat ramping (~160px) + footer (~40px)
        const availH = Math.max(280, winH - 190);
        const availW = Math.max(280, winW - 320); // Ruang untuk daftar kata 1 kolom (~260px)
        maxGridDim = Math.min(availH, availW);
      }

      // Hitung ukuran per sel (petak persegi)
      const gapTotal = (puzzle.size - 1) * 2;
      const calculatedCell = Math.floor((maxGridDim - gapTotal) / puzzle.size);
      // Batasi minimum 22px dan maksimum 70px agar grid membesar memenuhi layar kosong
      const clamped = Math.max(22, Math.min(70, calculatedCell));
      setCellSizePx(clamped);
    };

    calculateFitSize();
    window.addEventListener('resize', calculateFitSize);
    window.addEventListener('orientationchange', calculateFitSize);
    return () => {
      window.removeEventListener('resize', calculateFitSize);
      window.removeEventListener('orientationchange', calculateFitSize);
    };
  }, [puzzle.size]);

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

  // Tombol Ulangi (reset kata ditemukan pada papan yang sama)
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

  // Garis sel yang ditarik lurus mendatar, menurun, atau diagonal
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

  // Drag bergerak (support mouse dan sentuhan jari)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartCell) return;
    const elem = document.elementFromPoint(e.clientX, e.clientY);
    const cellTarget = elem?.closest('[data-cell-coord]');
    if (cellTarget) {
      const coordStr = cellTarget.getAttribute('data-cell-coord');
      if (coordStr) {
        const [r, c] = coordStr.split('_').map(Number);
        const line = getLineCells(dragStartCell, [r, c]);
        if (line) {
          setSelectedCells(line);
        }
      }
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
    if (m > 0) return `${m} menit ${s} detik`;
    return `${s} detik`;
  };

  const formatDigitalTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const foundCount = placedWords.filter(w => w.found).length;
  const totalCount = placedWords.length;
  const letterFontSize = Math.max(12, Math.round(cellSizePx * 0.52));

  return (
    <div
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      className="touch-none select-none"
    >
      {/* Catatan jika ukuran grid disesuaikan otomatis */}
      {puzzle.sizeAdjustmentNote && (
        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
          ℹ️ {puzzle.sizeAdjustmentNote}
        </div>
      )}

      {/* 
        Satu Baris Atas Ringkas:
        Kiri: Penghitung kata & Pewaktu
        Kanan: Deretan tombol kecil (Mute, Ulangi, Jawaban, Acak Ulang)
      */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200">
        {/* Status Ditemukan & Waktu */}
        <div className="flex items-center gap-2.5 text-xs font-medium text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Ditemukan: <strong className="text-slate-900">{foundCount}</strong>/{totalCount}
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 font-mono tabular-nums">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{formatDigitalTime(secondsElapsed)}</span>
          </div>
        </div>

        {/* Deretan Tombol Kontrol Kecil dalam Satu Baris */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSound}
            aria-label={isMuted ? 'Nyalakan suara' : 'Bisukan suara'}
            className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title={isMuted ? 'Nyalakan suara' : 'Bisukan suara'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
          </button>

          <button
            onClick={handleResetBoard}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Ulangi</span>
          </button>

          <button
            onClick={handleRevealAnswers}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-300 rounded hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">Jawaban</span>
          </button>

          <button
            onClick={onRegenerate}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCw className="w-3 h-3" />
            <span className="hidden sm:inline">Acak Ulang</span>
          </button>
        </div>
      </div>

      {/* Pesan Kemenangan */}
      {isVictory && (
        <div className="mb-3 p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs sm:text-sm font-semibold text-emerald-900">
              Selamat! Semua kata ditemukan dalam {formatTime(secondsElapsed)}.
            </p>
          </div>
          <button
            onClick={onRegenerate}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            Puzzle Baru
          </button>
        </div>
      )}

      {/* Grid dan Daftar Kata (Daftar Kata 1 kolom ke bawah rapat) */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 sm:gap-6">
        {/* Kotak Huruf Grid: otomatis fit ke layar kosong */}
        <div className="flex flex-col items-center shrink-0">
          <div
            className="inline-block p-1.5 sm:p-2 bg-white rounded-lg shadow-xs border border-slate-200"
            style={{ touchAction: 'none' }}
          >
            <div
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: `repeat(${puzzle.size}, ${cellSizePx}px)`,
              }}
            >
              {puzzle.grid.map((row, rIdx) =>
                row.map((letter, cIdx) => {
                  const isSelected = selectedCells.some(([r, c]) => r === rIdx && c === cIdx);
                  const foundColor = foundCellColorMap.get(`${rIdx}_${cIdx}`);

                  let cellBg = 'bg-slate-50 hover:bg-slate-100 text-slate-800';
                  let cellStyle: React.CSSProperties = {
                    width: `${cellSizePx}px`,
                    height: `${cellSizePx}px`,
                    fontSize: `${letterFontSize}px`,
                  };

                  if (foundColor) {
                    cellStyle = {
                      ...cellStyle,
                      backgroundColor: foundColor,
                      color: '#0f172a',
                      fontWeight: 800,
                    };
                  }

                  if (isSelected) {
                    cellStyle = {
                      ...cellStyle,
                      backgroundColor: '#60A5FA', // biru terang saat diseret
                      color: '#ffffff',
                      fontWeight: 800,
                      transform: 'scale(1.05)',
                    };
                  }

                  return (
                    <div
                      key={`${rIdx}_${cIdx}`}
                      data-cell-coord={`${rIdx}_${cIdx}`}
                      onPointerDown={() => handlePointerDown(rIdx, cIdx)}
                      style={cellStyle}
                      className={`
                        flex items-center justify-center 
                        font-mono font-bold tracking-wider 
                        rounded cursor-pointer 
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
          <p className="text-[10px] text-slate-500 mt-1.5 text-center">
            Seret lurus mendatar, menurun, atau diagonal untuk mencari kata.
          </p>
        </div>

        {/* Daftar Kata: 1 KOLOM KE BAWAH rapat & scrollable */}
        <div
          className="w-full lg:w-56 bg-white p-3 rounded-lg shadow-xs border border-slate-200 shrink-0 flex flex-col"
          style={{
            maxHeight: `${Math.max(260, cellSizePx * puzzle.size + (puzzle.size - 1) * 2 + 30)}px`,
          }}
        >
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100 shrink-0">
            <h3 className="font-semibold text-slate-900 text-xs">Daftar Kata</h3>
            <span className="text-[11px] text-slate-500">
              {foundCount}/{totalCount}
            </span>
          </div>

          {/* 1 Kolom ke Bawah dengan jarak baris rapat (gap-1) */}
          <div className="flex flex-col gap-1 overflow-y-auto pr-1 flex-1">
            {placedWords.map((pw, i) => (
              <div
                key={pw.word}
                className={`
                  px-2.5 py-1 rounded text-xs font-mono font-semibold 
                  transition-all duration-150 flex items-center justify-between
                  ${
                    pw.found || showAllAnswers
                      ? 'line-through text-slate-400 bg-slate-50 border border-slate-200'
                      : 'text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200'
                  }
                `}
                style={pw.found || showAllAnswers ? { borderLeft: `3px solid ${pw.color}` } : {}}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] text-slate-400 select-none">
                    {(i + 1).toString().padStart(2, '0')}.
                  </span>
                  <span className="truncate">{pw.originalText}</span>
                </div>
                {(pw.found || showAllAnswers) && (
                  <span className="text-emerald-600 font-bold ml-1 text-xs">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
