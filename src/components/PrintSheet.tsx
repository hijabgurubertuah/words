import React, { useState, useMemo } from 'react';
import { GeneratedPuzzle, PrintSettings, PlacedWord, WordItem, PuzzleSettings } from '../types';
import { generatePuzzle } from '../utils/wordSearchGenerator';
import { Printer } from 'lucide-react';

interface Props {
  puzzle: GeneratedPuzzle;
  rawWords: WordItem[];
  settings: PuzzleSettings;
}

export const PrintSheet: React.FC<Props> = ({ puzzle, rawWords, settings }) => {
  // Pengaturan cetak
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    layout: '1_per_page',
    twoPuzzleMode: 'different',
    cellScale: 1.0, // 0.85 (kecil) - 1.0 (sedang) - 1.15 (besar)
    fontSize: 'medium',
    includeAnswerKey: false,
    includeNameClass: true, // Default aktif
  });

  // Puzzle kedua jika mode "Dua puzzle berbeda" dipilih
  const secondPuzzle = useMemo(() => {
    if (printSettings.layout !== '2_per_page') return null;
    if (printSettings.twoPuzzleMode === 'duplicate') return puzzle;
    return generatePuzzle(puzzle.title, rawWords, settings);
  }, [puzzle, rawWords, settings, printSettings.layout, printSettings.twoPuzzleMode]);

  // Peta sel kata untuk kunci jawaban
  const getAnswerCellMap = (placedWords: PlacedWord[]) => {
    const map = new Map<string, string>();
    placedWords.forEach(pw => {
      pw.cells.forEach(([r, c]) => {
        map.set(`${r}_${c}`, pw.color || '#E2E8F0');
      });
    });
    return map;
  };

  const puzzle1AnswerMap = useMemo(() => getAnswerCellMap(puzzle.placedWords), [puzzle.placedWords]);
  const puzzle2AnswerMap = useMemo(
    () => (secondPuzzle ? getAnswerCellMap(secondPuzzle.placedWords) : null),
    [secondPuzzle]
  );

  /**
   * Menghitung ukuran sel dan font agar pas presisi di kertas A4 tanpa footer
   */
  const getCellDimensions = (gridSize: number, isTwoPerPage: boolean) => {
    let baseMm = 7.6;
    if (isTwoPerPage) {
      if (gridSize <= 12) baseMm = 6.0;
      else if (gridSize <= 15) baseMm = 5.0;
      else baseMm = 4.3;
    } else {
      if (gridSize <= 12) baseMm = 9.0;
      else if (gridSize <= 15) baseMm = 7.6;
      else baseMm = 6.4;
    }

    const finalCellMm = Number((baseMm * printSettings.cellScale).toFixed(2));

    // Skala ukuran font
    let fontPt = isTwoPerPage ? 7.5 : 10;
    if (printSettings.fontSize === 'small') fontPt -= 1;
    if (printSettings.fontSize === 'large') fontPt += 1.5;

    let wordListFontPt = isTwoPerPage ? 7 : 8.5;
    if (printSettings.fontSize === 'small') wordListFontPt -= 0.5;
    if (printSettings.fontSize === 'large') wordListFontPt += 1;

    return {
      cellMm: finalCellMm,
      fontSizePt: `${fontPt}pt`,
      wordListFontPt: `${wordListFontPt}pt`,
    };
  };

  /**
   * Render satu panel puzzle:
   * Dari atas: Judul (tebal), baris "Nama: ........ Kelas: ........" (jika aktif),
   * lalu grid huruf di kiri dan "Daftar Kata" dalam 1 KOLOM KE BAWAH di kanannya.
   * Catatan: Footer ditiadakan dari lembar cetak dan pratinjau A4 sesuai brief.
   */
  const renderPuzzlePanel = (
    puz: GeneratedPuzzle,
    isTwoPerPage: boolean,
    isAnswerKey = false,
    answerMap?: Map<string, string> | null
  ) => {
    const { cellMm, fontSizePt, wordListFontPt } = getCellDimensions(puz.size, isTwoPerPage);

    return (
      <div
        className={`print-panel flex flex-col justify-start overflow-hidden bg-white text-black ${
          isTwoPerPage ? 'h-[132mm] max-h-[132mm] p-1.5' : 'h-[275mm] max-h-[275mm] py-2 px-3'
        }`}
        style={{ boxSizing: 'border-box' }}
      >
        {/* Atas: Judul (Tebal) & Baris Nama/Kelas */}
        <div className="shrink-0 mb-1">
          <div className="text-center mb-0.5">
            <h2
              className={`font-bold tracking-tight text-black leading-tight ${
                isTwoPerPage ? 'text-[11pt]' : 'text-[15pt]'
              }`}
            >
              {puz.title}
              {isAnswerKey && (
                <span className="text-[9pt] font-semibold text-slate-700 ml-1.5">
                  (KUNCI JAWABAN)
                </span>
              )}
            </h2>
          </div>

          {/* Kolom Nama dan Kelas (jika diaktifkan) */}
          {printSettings.includeNameClass && !isAnswerKey && (
            <div
              className={`flex justify-between items-center border-b border-black pb-0.5 mb-1 font-mono ${
                isTwoPerPage ? 'text-[7.5pt]' : 'text-[9pt]'
              }`}
            >
              <span>Nama : .................................................</span>
              <span>Kelas : ....................</span>
              <span>Nilai : ............</span>
            </div>
          )}
        </div>

        {/* Tengah: Grid Huruf di KIRI dan Daftar Kata 1 KOLOM KE BAWAH di KANANNYA */}
        <div className="flex-1 flex items-start justify-center gap-3 sm:gap-5 overflow-hidden">
          {/* Grid Huruf (Sebelah Kiri) */}
          <div className="shrink-0 flex justify-center">
            <div
              className="inline-block border border-black bg-white"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${puz.size}, auto)`,
              }}
            >
              {puz.grid.map((row, r) =>
                row.map((letter, c) => {
                  const isAnswer = isAnswerKey && answerMap?.has(`${r}_${c}`);
                  return (
                    <div
                      key={`${r}_${c}`}
                      className="border border-black flex items-center justify-center font-mono font-bold leading-none select-none text-black"
                      style={{
                        width: `${cellMm}mm`,
                        height: `${cellMm}mm`,
                        fontSize: fontSizePt,
                        backgroundColor: isAnswer ? '#E2E8F0' : '#FFFFFF',
                        fontWeight: isAnswer ? '900' : '700',
                      }}
                    >
                      {letter}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Daftar Kata: 1 KOLOM KE BAWAH (Sebelah Kanan Grid) */}
          <div
            className={`border border-black p-1.5 bg-white flex flex-col justify-start overflow-hidden ${
              isTwoPerPage ? 'w-[72mm] max-h-[102mm]' : 'w-[80mm] max-h-[185mm]'
            }`}
          >
            <div
              className={`font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 mb-1 text-center ${
                isTwoPerPage ? 'text-[7.5pt]' : 'text-[9pt]'
              }`}
            >
              DAFTAR KATA ({puz.placedWords.length})
            </div>

            {/* 1 Kolom ke Bawah */}
            <div
              className="flex flex-col gap-0.5 font-mono leading-tight overflow-hidden"
              style={{ fontSize: wordListFontPt }}
            >
              {puz.placedWords.map((pw, idx) => (
                <div key={pw.word} className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 border border-black inline-block shrink-0"></span>
                  <span className="truncate">
                    {idx + 1}. {pw.originalText}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 
        Panel Pengaturan Cetak Compact:
        Disusun rapat 1-2 baris tombol segmented pill kecil
      */}
      <div className="no-print bg-white rounded-lg border border-slate-200 shadow-2xs p-2.5 sm:p-3 mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Kontrol Grup Kiri */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Layout: 1 atau 2 per lembar */}
            <div className="inline-flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
              <button
                type="button"
                onClick={() => setPrintSettings(prev => ({ ...prev, layout: '1_per_page' }))}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  printSettings.layout === '1_per_page'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1 Puzzle
              </button>
              <button
                type="button"
                onClick={() => setPrintSettings(prev => ({ ...prev, layout: '2_per_page' }))}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  printSettings.layout === '2_per_page'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2 Puzzle
              </button>
            </div>

            {/* 2. Mode 2 puzzle: hanya muncul jika layout 2 puzzle dipilih */}
            {printSettings.layout === '2_per_page' && (
              <div className="inline-flex bg-slate-100 p-0.5 rounded-md border border-slate-200 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => setPrintSettings(prev => ({ ...prev, twoPuzzleMode: 'different' }))}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                    printSettings.twoPuzzleMode === 'different'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Berbeda
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSettings(prev => ({ ...prev, twoPuzzleMode: 'duplicate' }))}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                    printSettings.twoPuzzleMode === 'duplicate'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Salinan Sama
                </button>
              </div>
            )}

            {/* 3. Slider Ukuran Kotak */}
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs">
              <span className="text-slate-600 text-[11px] whitespace-nowrap">Kotak:</span>
              <input
                type="range"
                min="0.85"
                max="1.15"
                step="0.05"
                value={printSettings.cellScale}
                onChange={(e) =>
                  setPrintSettings(prev => ({ ...prev, cellScale: parseFloat(e.target.value) }))
                }
                className="w-16 accent-blue-600 cursor-pointer h-1.5"
              />
            </div>

            {/* 4. Ukuran Huruf */}
            <div className="inline-flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
              {(['small', 'medium', 'large'] as const).map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPrintSettings(prev => ({ ...prev, fontSize: sz }))}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                    printSettings.fontSize === sz
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sz === 'small' ? 'Font S' : sz === 'medium' ? 'Font M' : 'Font L'}
                </button>
              ))}
            </div>

            {/* 5. Toggle Kolom Nama/Kelas */}
            <button
              type="button"
              onClick={() =>
                setPrintSettings(prev => ({ ...prev, includeNameClass: !prev.includeNameClass }))
              }
              className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                printSettings.includeNameClass
                  ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              Nama/Kelas {printSettings.includeNameClass ? '✓' : ''}
            </button>

            {/* 6. Toggle Kunci Jawaban */}
            <button
              type="button"
              onClick={() =>
                setPrintSettings(prev => ({ ...prev, includeAnswerKey: !prev.includeAnswerKey }))
              }
              className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                printSettings.includeAnswerKey
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              Kunci Jawaban {printSettings.includeAnswerKey ? '✓' : ''}
            </button>
          </div>

          {/* Tombol Cetak di Ujung Kanan */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Lembar A4
          </button>
        </div>
      </div>

      {/* 
        Pratinjau Lembar A4 di Layar & Dokumen Cetak Sebenarnya 
        Margin 1 cm (10mm) di sekeliling halaman
        Tanpa footer di lembar cetak maupun di pratinjau A4
      */}
      <div className="space-y-4">
        {/* Lembar Soal Siswa */}
        <div className="a4-preview-page print-page border border-slate-300 p-[10mm]">
          {printSettings.layout === '1_per_page' ? (
            renderPuzzlePanel(puzzle, false)
          ) : (
            <div className="flex flex-col justify-between h-full overflow-hidden">
              {/* Panel Puzzle Atas */}
              {renderPuzzlePanel(puzzle, true)}

              {/* Garis putus-putus untuk gunting pemisah dua puzzle */}
              <div className="relative my-1 py-0.5 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dashed border-black cut-line"></div>
                </div>
                <span className="relative bg-white px-2 text-[7pt] text-slate-500 font-mono select-none">
                  ✂ Gunting di sini
                </span>
              </div>

              {/* Panel Puzzle Bawah */}
              {secondPuzzle && renderPuzzlePanel(secondPuzzle, true)}
            </div>
          )}
        </div>

        {/* Lembar Kunci Jawaban (halaman terpisah jika dicentang) - Tanpa footer */}
        {printSettings.includeAnswerKey && (
          <div className="a4-preview-page print-page border border-slate-300 p-[10mm]">
            <div className="mb-1.5 text-center pb-1 border-b border-black">
              <h2 className="text-sm font-bold text-black uppercase tracking-wider">
                KUNCI JAWABAN PUZZLE CARI KATA
              </h2>
            </div>

            {printSettings.layout === '1_per_page' ? (
              renderPuzzlePanel(puzzle, false, true, puzzle1AnswerMap)
            ) : (
              <div className="flex flex-col justify-between h-full overflow-hidden">
                {renderPuzzlePanel(puzzle, true, true, puzzle1AnswerMap)}
                <div className="my-1 border-t border-dashed border-black cut-line"></div>
                {secondPuzzle && renderPuzzlePanel(secondPuzzle, true, true, puzzle2AnswerMap)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
