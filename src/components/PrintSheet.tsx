import React, { useState, useMemo } from 'react';
import { GeneratedPuzzle, PrintSettings, PlacedWord, WordItem, PuzzleSettings } from '../types';
import { generatePuzzle } from '../utils/wordSearchGenerator';
import { Printer, Shuffle, Copy, Sliders, CheckSquare, Square, FileText } from 'lucide-react';

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
   * Menghitung ukuran sel dan font agar pas presisi di kertas A4
   */
  const getCellDimensions = (gridSize: number, isTwoPerPage: boolean) => {
    let baseMm = 7.2;
    if (isTwoPerPage) {
      if (gridSize <= 12) baseMm = 5.8;
      else if (gridSize <= 15) baseMm = 4.8;
      else baseMm = 4.1;
    } else {
      if (gridSize <= 12) baseMm = 8.6;
      else if (gridSize <= 15) baseMm = 7.2;
      else baseMm = 6.0;
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
   * lalu grid huruf di kiri dan "Daftar Kata" dalam 1 KOLOM KE BAWAH di kanannya,
   * dan footer di bawah. Tanpa deskripsi!
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
        className={`print-panel flex flex-col justify-between overflow-hidden bg-white text-black ${
          isTwoPerPage ? 'h-[132mm] max-h-[132mm] p-2' : 'h-[275mm] max-h-[275mm] py-3 px-4'
        }`}
        style={{ boxSizing: 'border-box' }}
      >
        {/* Atas: Judul (Tebal) & Baris Nama/Kelas */}
        <div className="shrink-0 mb-1">
          <div className="text-center mb-1">
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
              className={`flex justify-between items-center border-b border-black pb-1 mb-1.5 font-mono ${
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
        <div className="flex-1 flex items-start justify-center gap-3 sm:gap-5 my-auto overflow-hidden">
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
            className={`border border-black p-2 bg-white flex flex-col justify-start overflow-hidden ${
              isTwoPerPage ? 'w-[72mm] max-h-[96mm]' : 'w-[80mm] max-h-[170mm]'
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

        {/* Bawah: Footer persis sesuai brief */}
        <div className="shrink-0 mt-1 pt-1 border-t border-slate-200 text-center">
          <p className="text-[7pt] tracking-wide text-slate-600 font-medium">
            by : MGMP IPA KECAMATAN BENGKALIS
          </p>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 
        Panel Pengaturan Cetak (Hanya tampil di layar pratinjau)
        Format tombol-tombol minimalis dan mudah dipahami
      */}
      <div className="no-print bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Pengaturan Lembar Cetak A4</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Margin 1 cm di semua sisi. Grid dan daftar kata 1 kolom berdampingan agar tidak bertumpuk.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Lembar A4
          </button>
        </div>

        {/* Kontrol Pengaturan Cetak */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 text-xs">
          {/* 1. Tata Letak Lembar */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Tata Letak Lembar
            </label>
            <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full">
              <button
                type="button"
                onClick={() => setPrintSettings(prev => ({ ...prev, layout: '1_per_page' }))}
                className={`flex-1 py-1.5 font-medium rounded-md transition-colors cursor-pointer text-center ${
                  printSettings.layout === '1_per_page'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1 Puzzle / Lembar
              </button>
              <button
                type="button"
                onClick={() => setPrintSettings(prev => ({ ...prev, layout: '2_per_page' }))}
                className={`flex-1 py-1.5 font-medium rounded-md transition-colors cursor-pointer text-center ${
                  printSettings.layout === '2_per_page'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2 Puzzle / Lembar
              </button>
            </div>

            {/* Opsi jika 2 puzzle per lembar */}
            {printSettings.layout === '2_per_page' && (
              <div className="mt-2.5 inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full">
                <button
                  type="button"
                  onClick={() => setPrintSettings(prev => ({ ...prev, twoPuzzleMode: 'different' }))}
                  className={`flex-1 py-1 font-medium rounded-md transition-colors cursor-pointer text-center text-[11px] ${
                    printSettings.twoPuzzleMode === 'different'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2 Puzzle Berbeda
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSettings(prev => ({ ...prev, twoPuzzleMode: 'duplicate' }))}
                  className={`flex-1 py-1 font-medium rounded-md transition-colors cursor-pointer text-center text-[11px] ${
                    printSettings.twoPuzzleMode === 'duplicate'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2 Salinan Sama
                </button>
              </div>
            )}
          </div>

          {/* 2. Ukuran Fleksibel: Slider Ukuran Kotak & Pilihan Ukuran Huruf */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-800">
                Ukuran Kotak Huruf
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {printSettings.cellScale < 0.95
                  ? 'Kecil'
                  : printSettings.cellScale > 1.05
                  ? 'Besar'
                  : 'Sedang'}
              </span>
            </div>
            <input
              type="range"
              min="0.85"
              max="1.15"
              step="0.05"
              value={printSettings.cellScale}
              onChange={(e) =>
                setPrintSettings(prev => ({ ...prev, cellScale: parseFloat(e.target.value) }))
              }
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>Kecil</span>
              <span>Sedang (Default)</span>
              <span>Besar</span>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-700">Ukuran Huruf:</span>
              <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(['small', 'medium', 'large'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setPrintSettings(prev => ({ ...prev, fontSize: sz }))}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                      printSettings.fontSize === sz
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {sz === 'small' ? 'Kecil' : sz === 'medium' ? 'Sedang' : 'Besar'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Opsi Tambahan: Kolom Siswa & Kunci Jawaban */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-800 mb-1">
              Opsi Tambahan
            </label>
            <button
              type="button"
              onClick={() =>
                setPrintSettings(prev => ({ ...prev, includeNameClass: !prev.includeNameClass }))
              }
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                printSettings.includeNameClass
                  ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Kolom Nama & Kelas</span>
              <span>{printSettings.includeNameClass ? 'Aktif ✓' : 'Nonaktif'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setPrintSettings(prev => ({ ...prev, includeAnswerKey: !prev.includeAnswerKey }))
              }
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                printSettings.includeAnswerKey
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Kunci Jawaban di Akhir</span>
              <span>{printSettings.includeAnswerKey ? 'Sertakan ✓' : 'Tanpa Kunci'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 
        Pratinjau Lembar A4 di Layar & Dokumen Cetak Sebenarnya 
        Margin 1 cm (10mm) di sekeliling halaman
      */}
      <div className="space-y-8">
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
                <span className="relative bg-white px-2.5 text-[7pt] text-slate-500 font-mono select-none">
                  ✂ Gunting di sini
                </span>
              </div>

              {/* Panel Puzzle Bawah */}
              {secondPuzzle && renderPuzzlePanel(secondPuzzle, true)}
            </div>
          )}
        </div>

        {/* Lembar Kunci Jawaban (halaman terpisah jika dicentang) */}
        {printSettings.includeAnswerKey && (
          <div className="a4-preview-page print-page border border-slate-300 p-[10mm]">
            <div className="mb-2 text-center pb-1 border-b border-black">
              <h2 className="text-sm font-bold text-black uppercase tracking-wider">
                KUNCI JAWABAN PUZZLE CARI KATA
              </h2>
              <p className="text-[10px] text-slate-600">MGMP IPA KECAMATAN BENGKALIS</p>
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
