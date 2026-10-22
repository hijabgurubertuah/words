import React, { useState, useMemo } from 'react';
import { GeneratedPuzzle, PrintSettings, PlacedWord, WordItem, PuzzleSettings } from '../types';
import { generatePuzzle } from '../utils/wordSearchGenerator';
import { Printer, Check, Copy, Shuffle, FileSpreadsheet, KeyRound, UserCheck } from 'lucide-react';

interface Props {
  puzzle: GeneratedPuzzle;
  rawWords: WordItem[];
  settings: PuzzleSettings;
}

export const PrintSheet: React.FC<Props> = ({ puzzle, rawWords, settings }) => {
  // Pengaturan cetak dengan opsi default otomatis sesuai brief
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    layout: '1_per_page',
    twoPuzzleMode: 'different',
    includeAnswerKey: false,
    includeNameClass: true, // Otomatis aktif
  });

  // Puzzle kedua jika mode "Dua puzzle berbeda" dipilih
  const secondPuzzle = useMemo(() => {
    if (printSettings.layout !== '2_per_page') return null;
    if (printSettings.twoPuzzleMode === 'duplicate') return puzzle;
    return generatePuzzle(puzzle.title, puzzle.description, rawWords, settings);
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
   * Menghitung otomatis ukuran kotak huruf dan ukuran font berdasarkan ukuran kertas A4
   * dan dimensi grid agar pas sempurna dan tidak pernah bertumpuk.
   */
  const getAutoDimensions = (gridSize: number, isTwoPerPage: boolean) => {
    if (isTwoPerPage) {
      // Pada 2 per lembar, tinggi panel maks ~130mm, area grid ~80-84mm
      if (gridSize <= 12) {
        return { cellMm: 6.4, fontSizePt: '8.5pt', wordListFontPt: '8pt', maxRows: 6 };
      } else if (gridSize <= 15) {
        return { cellMm: 5.4, fontSizePt: '7.5pt', wordListFontPt: '7.5pt', maxRows: 8 };
      } else {
        return { cellMm: 4.6, fontSizePt: '6.5pt', wordListFontPt: '7pt', maxRows: 10 };
      }
    } else {
      // Pada 1 per lembar, ruang sangat leluasa
      if (gridSize <= 12) {
        return { cellMm: 8.8, fontSizePt: '11pt', wordListFontPt: '9.5pt', maxRows: 8 };
      } else if (gridSize <= 15) {
        return { cellMm: 7.4, fontSizePt: '10pt', wordListFontPt: '9pt', maxRows: 10 };
      } else {
        return { cellMm: 6.2, fontSizePt: '8.5pt', wordListFontPt: '8.5pt', maxRows: 10 };
      }
    }
  };

  /**
   * Render satu panel puzzle (Daftar Kata diletakkan di SAMPING kotak pencarian)
   */
  const renderPuzzlePanel = (
    puz: GeneratedPuzzle,
    isTwoPerPage: boolean,
    isAnswerKey = false,
    answerMap?: Map<string, string> | null
  ) => {
    const { cellMm, fontSizePt, wordListFontPt } = getAutoDimensions(puz.size, isTwoPerPage);

    return (
      <div
        className={`print-panel flex flex-col justify-between overflow-hidden bg-white text-black ${
          isTwoPerPage ? 'h-[131mm] max-h-[131mm] p-2' : 'h-[275mm] max-h-[275mm] py-4 px-5'
        }`}
        style={{ boxSizing: 'border-box' }}
      >
        {/* Bagian Atas: Judul, Deskripsi, dan Kolom Nama/Kelas */}
        <div className="shrink-0">
          <div className="text-center mb-1">
            <h2
              className={`font-bold tracking-tight text-black leading-tight ${
                isTwoPerPage ? 'text-[11pt]' : 'text-[15pt]'
              }`}
            >
              {puz.title}{' '}
              {isAnswerKey && (
                <span className="text-[9pt] font-semibold text-slate-700 ml-1">
                  (KUNCI JAWABAN)
                </span>
              )}
            </h2>
            {puz.description && (
              <p
                className={`text-slate-700 italic mt-0.5 leading-snug line-clamp-1 ${
                  isTwoPerPage ? 'text-[7.5pt]' : 'text-[9.5pt]'
                }`}
              >
                {puz.description}
              </p>
            )}
          </div>

          {/* Kolom Nama dan Kelas (Otomatis Ada) */}
          {printSettings.includeNameClass && !isAnswerKey && (
            <div
              className={`flex justify-between items-center border-b border-black pb-1 mb-2 font-mono ${
                isTwoPerPage ? 'text-[7.5pt]' : 'text-[9pt]'
              }`}
            >
              <span>Nama : .................................................</span>
              <span>Kelas : ....................</span>
              <span>Nilai : ............</span>
            </div>
          )}
        </div>

        {/* Bagian Tengah: KOTAK HURUF & DAFTAR KATA DILAYOUT BERDAMPINGAN (SIDE-BY-SIDE) */}
        <div className="flex-1 flex items-center justify-center gap-4 sm:gap-6 my-auto overflow-hidden">
          {/* Kotak Huruf Grid (Sebelah Kiri) */}
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

          {/* Daftar Kata (Sebelah Kanan Kotak Huruf) */}
          <div
            className={`flex-1 border border-black p-2 bg-white rounded-none self-stretch flex flex-col justify-between overflow-hidden ${
              isTwoPerPage ? 'max-w-[78mm]' : 'max-w-[85mm]'
            }`}
          >
            <div>
              <div
                className={`font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-1.5 text-center ${
                  isTwoPerPage ? 'text-[7.5pt]' : 'text-[9pt]'
                }`}
              >
                DAFTAR KATA ({puz.placedWords.length})
              </div>

              {/* Kata dalam 2 kolom rapi tanpa saling bertumpuk */}
              <div
                className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono leading-tight"
                style={{ fontSize: wordListFontPt }}
              >
                {puz.placedWords.map((pw, idx) => (
                  <div key={pw.word} className="flex items-center gap-1 truncate">
                    <span className="w-2.5 h-2.5 border border-black inline-block shrink-0"></span>
                    <span className="truncate">{pw.originalText}</span>
                  </div>
                ))}
              </div>
            </div>

            <p
              className={`text-slate-500 italic mt-1 text-center font-sans ${
                isTwoPerPage ? 'text-[6.5pt]' : 'text-[7.5pt]'
              }`}
            >
              Cari & temukan kata di dalam kotak huruf
            </p>
          </div>
        </div>

        {/* Bagian Bawah: Footer persis sesuai brief */}
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
        Panel Pengaturan Cetak Berupa Tombol-Tombol Minimalis & Mudah Dipahami
        (Hanya tampil di layar pratinjau, otomatis tersembunyi saat dicetak)
      */}
      <div className="no-print bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Pengaturan Cetak Lembar A4</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ukuran kotak dan huruf otomatis menyesuaikan halaman. Daftar kata diletakkan di samping kotak.
            </p>
          </div>

          {/* Tombol Utama Cetak */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Lembar A4
          </button>
        </div>

        {/* Grup Tombol Pengaturan Minimalis */}
        <div className="flex flex-wrap items-center gap-4 pt-4 text-xs">
          {/* 1. Tombol Pilihan Jumlah Puzzle per Lembar */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700 mr-1">Tata Letak:</span>
            <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setPrintSettings(prev => ({ ...prev, layout: '1_per_page' }))}
                className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
                  printSettings.layout === '1_per_page'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1 Puzzle per Lembar
              </button>
              <button
                type="button"
                onClick={() => setPrintSettings(prev => ({ ...prev, layout: '2_per_page' }))}
                className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
                  printSettings.layout === '2_per_page'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2 Puzzle per Lembar (Hemat Kertas)
              </button>
            </div>
          </div>

          {/* 2. Tombol Variasi jika 2 Puzzle dipilih */}
          {printSettings.layout === '2_per_page' && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 mr-1">Isi 2 Puzzle:</span>
              <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPrintSettings(prev => ({ ...prev, twoPuzzleMode: 'different' }))}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
                    printSettings.twoPuzzleMode === 'different'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  2 Puzzle Berbeda
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSettings(prev => ({ ...prev, twoPuzzleMode: 'duplicate' }))}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
                    printSettings.twoPuzzleMode === 'duplicate'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  2 Salinan Sama
                </button>
              </div>
            </div>
          )}

          {/* 3. Tombol Kolom Nama & Kelas */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setPrintSettings(prev => ({ ...prev, includeNameClass: !prev.includeNameClass }))
              }
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                printSettings.includeNameClass
                  ? 'bg-blue-50 border-blue-200 text-blue-800 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Kolom Nama & Kelas: {printSettings.includeNameClass ? 'Ada ✓' : 'Tidak Ada'}
            </button>
          </div>

          {/* 4. Tombol Kunci Jawaban */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setPrintSettings(prev => ({ ...prev, includeAnswerKey: !prev.includeAnswerKey }))
              }
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                printSettings.includeAnswerKey
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Kunci Jawaban: {printSettings.includeAnswerKey ? 'Sertakan di Akhir ✓' : 'Tanpa Kunci'}
            </button>
          </div>
        </div>
      </div>

      {/* 
        Pratinjau Lembar A4 di Layar & Tampilan Cetak Sebenarnya 
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
              <div className="relative my-1 py-1 flex items-center justify-center shrink-0">
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

        {/* Lembar Kunci Jawaban (halaman terpisah jika diaktifkan) */}
        {printSettings.includeAnswerKey && (
          <div className="a4-preview-page print-page border border-slate-300 p-[10mm]">
            <div className="mb-2 text-center pb-1 border-b border-black">
              <h2 className="text-base font-bold text-black uppercase tracking-wider">
                KUNCI JAWABAN PUZZLE CARI KATA
              </h2>
              <p className="text-xs text-slate-600">MGMP IPA KECAMATAN BENGKALIS</p>
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
