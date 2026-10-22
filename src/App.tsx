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
      <main className="flex-1 pb-8">
        {currentView === 'form' ? (
          <PuzzleMaker
            initialTitle={formTitle}
            initialWords={rawWords.map(w => w.original)}
            initialSettings={settings}
            onSubmit={handleGeneratePuzzle}
          />
        ) : (
          <div className="max-w-5xl mx-auto px-4 py-6">
            {/* Navigasi kembali ke formulir tanpa menghapus isian */}
            <div className="no-print mb-5">
              <button
                onClick={handleBackToForm}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                ← Ubah Daftar Kata
              </button>
            </div>

            {/* Di atas tab, tampilkan judul puzzle (tanpa kolom deskripsi) */}
            <div className="no-print bg-white rounded-xl p-5 border border-slate-200 shadow-sm mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {generatedPuzzle?.title || formTitle}
              </h1>

              {/* Dua Tab: "Main Langsung" dan "Cetak" */}
              <div className="flex items-center gap-2 mt-4 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setActiveTab('play')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'play'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Main Langsung
                </button>

                <button
                  onClick={() => setActiveTab('print')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'print'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Lembar A4
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
        Letakkan di bagian bawah halaman, teks kecil dan rata tengah."
      */}
      <footer className="no-print py-4 text-center border-t border-slate-200 bg-white">
        <p className="text-xs text-slate-500 font-medium">
          by : MGMP IPA KECAMATAN BENGKALIS
        </p>
      </footer>
    </div>
  );
}
