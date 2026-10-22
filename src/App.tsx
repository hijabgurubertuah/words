import React, { useState } from 'react';
import { WordItem, PuzzleSettings, GeneratedPuzzle } from './types';
import { generatePuzzle } from './utils/wordSearchGenerator';
import { PuzzleMaker } from './components/PuzzleMaker';
import { WordSearchPlayer } from './components/WordSearchPlayer';
import { PrintSheet } from './components/PrintSheet';
import { ArrowLeft, Play, Printer } from 'lucide-react';

export default function App() {
  // Mode tampilan: 'form' (Formulir) atau 'result' (Hasil)
  const [currentView, setCurrentView] = useState<'form' | 'result'>('form');

  // Tab di tampilan Hasil: 'play' (Main Langsung) atau 'print' (Cetak)
  const [activeTab, setActiveTab] = useState<'play' | 'print'>('play');

  // Data formulir aktif
  const [formTitle, setFormTitle] = useState<string>('');
  const [rawWords, setRawWords] = useState<WordItem[]>([]);
  const [settings, setSettings] = useState<PuzzleSettings>({
    gridSize: 15,
    wordCount: 10,
    horizontal: true,
    vertical: true,
    diagonal: true,
    allowReverse: false,
  });

  // Puzzle yang terbuat
  const [generatedPuzzle, setGeneratedPuzzle] = useState<GeneratedPuzzle | null>(null);

  // Saat tombol "Buat Puzzle" diklik dari formulir
  const handleGeneratePuzzle = (
    title: string,
    words: WordItem[],
    puzzleSettings: PuzzleSettings
  ) => {
    setFormTitle(title);
    setRawWords(words);
    setSettings(puzzleSettings);

    const puzzle = generatePuzzle(title, words, puzzleSettings);
    setGeneratedPuzzle(puzzle);
    setCurrentView('result');
    setActiveTab('play');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Tombol "Acak Ulang"
  const handleRegenerate = () => {
    if (!generatedPuzzle || rawWords.length === 0) return;
    const newPuzzle = generatePuzzle(formTitle, rawWords, settings);
    setGeneratedPuzzle(newPuzzle);
  };

  // Tombol "← Ubah Daftar Kata" kembali ke formulir tanpa menghapus isian
  const handleBackToForm = () => {
    setCurrentView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Konten Utama */}
      <main className="flex-1 pb-4">
        {currentView === 'form' ? (
          <PuzzleMaker
            initialTitle={formTitle}
            initialWords={rawWords.map(w => w.original)}
            initialSettings={settings}
            onSubmit={handleGeneratePuzzle}
          />
        ) : (
          <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3">
            {/* Header Hasil Kompak: Tombol Kembali, Judul Puzzle, & Tab Pills dalam 1 Card Ramping */}
            <div className="no-print bg-white rounded-lg p-2.5 sm:p-3 border border-slate-200 shadow-2xs mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={handleBackToForm}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer shrink-0"
                  title="Kembali ke formulir untuk mengubah daftar kata"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ubah Kata</span>
                </button>
                <div className="h-4 w-px bg-slate-200 shrink-0"></div>
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 truncate">
                  {generatedPuzzle?.title || formTitle}
                </h1>
              </div>

              {/* Dua Tab: "Main Langsung" dan "Cetak Lembar A4" */}
              <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setActiveTab('play')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeTab === 'play'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Main Langsung</span>
                </button>

                <button
                  onClick={() => setActiveTab('print')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeTab === 'print'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Printer className="w-3 h-3" />
                  <span>Cetak Lembar A4</span>
                </button>
              </div>
            </div>

            {/* Isi Tab */}
            {generatedPuzzle && (
              <div>
                {activeTab === 'play' && (
                  <div className="no-print">
                    <WordSearchPlayer puzzle={generatedPuzzle} onRegenerate={handleRegenerate} />
                  </div>
                )}

                {activeTab === 'print' && (
                  <PrintSheet
                    puzzle={generatedPuzzle}
                    rawWords={rawWords}
                    settings={settings}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 
        Footer persis sesuai brief:
        "Teks persis: 'by : MGMP IPA KECAMATAN BENGKALIS' 
        (perhatikan spasi sebelum dan sesudah titik dua, dan huruf kapital). 
        Letakkan di bagian bawah halaman, teks kecil dan rata tengah.
        Beri class no-print pada footer web agar tidak ikut tercetak."
      */}
      <footer className="no-print py-2.5 text-center border-t border-slate-200 bg-white">
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          by : MGMP IPA KECAMATAN BENGKALIS
        </p>
      </footer>
    </div>
  );
}
