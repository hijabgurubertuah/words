import React, { useState, useEffect, useRef } from 'react';
import { WordItem, PuzzleSettings } from '../types';

interface Props {
  initialTitle?: string;
  initialDesc?: string;
  initialWords?: string[];
  initialSettings?: PuzzleSettings;
  onSubmit: (title: string, desc: string, words: WordItem[], settings: PuzzleSettings) => void;
}

const DRAFT_STORAGE_KEY = 'cari_kata_draft_v2';

export const PuzzleMaker: React.FC<Props> = ({
  initialTitle,
  initialDesc,
  initialWords,
  initialSettings,
  onSubmit,
}) => {
  // Load draft dari localStorage jika ada
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
    return null;
  };

  const draft = loadDraft();

  const [title, setTitle] = useState<string>(() => initialTitle ?? draft?.title ?? '');
  const [desc, setDesc] = useState<string>(() => initialDesc ?? draft?.desc ?? '');
  const [wordInputs, setWordInputs] = useState<string[]>(() => {
    if (initialWords && initialWords.length > 0) {
      const arr = Array(30).fill('');
      initialWords.forEach((w, i) => {
        if (i < 30) arr[i] = w;
      });
      return arr;
    }
    if (draft?.words && Array.isArray(draft.words)) {
      return draft.words;
    }
    return Array(30).fill('');
  });

  const [settings, setSettings] = useState<PuzzleSettings>(() => {
    return (
      initialSettings ??
      draft?.settings ?? {
        gridSize: 15,
        wordCount: 10,
        horizontal: true,
        vertical: true,
        diagonal: true,
        allowReverse: false,
      }
    );
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Error states
  const [titleErr, setTitleErr] = useState<string>('');
  const [descErr, setDescErr] = useState<string>('');
  const [wordErrs, setWordErrs] = useState<string[]>(() => Array(30).fill(''));
  const [listErr, setListErr] = useState<string>('');

  // Refs untuk scrolling ke error pertama
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  const wordInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const listErrRef = useRef<HTMLDivElement>(null);

  // Simpan draf ke localStorage (try/catch)
  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          title,
          desc,
          words: wordInputs,
          settings,
        })
      );
    } catch {
      // Abaikan jika localStorage dibatasi
    }
  }, [title, desc, wordInputs, settings]);

  const handleWordChange = (index: number, val: string) => {
    const updated = [...wordInputs];
    updated[index] = val;
    setWordInputs(updated);

    if (wordErrs[index]) {
      const errs = [...wordErrs];
      errs[index] = '';
      setWordErrs(errs);
    }
    if (listErr) setListErr('');
  };

  const clearAllErrors = () => {
    setTitleErr('');
    setDescErr('');
    setWordErrs(Array(30).fill(''));
    setListErr('');
  };

  const filledCount = wordInputs.filter(w => w.trim().length > 0).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearAllErrors();

    let hasError = false;
    let firstErrorElement: HTMLElement | null = null;

    let newTitleErr = '';
    let newDescErr = '';
    const newWordErrs = Array(30).fill('');
    let newListErr = '';

    // 1. Judul wajib diisi
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newTitleErr = 'Judul wajib diisi.';
      hasError = true;
      if (!firstErrorElement && titleInputRef.current) {
        firstErrorElement = titleInputRef.current;
      }
    }

    // 2. Deskripsi wajib diisi
    const trimmedDesc = desc.trim();
    if (!trimmedDesc) {
      newDescErr = 'Deskripsi wajib diisi.';
      hasError = true;
      if (!firstErrorElement && descInputRef.current) {
        firstErrorElement = descInputRef.current;
      }
    }

    // 3. Kumpulkan kata terisi
    const filledIndices: number[] = [];
    const validWordItems: { idx: number; original: string; clean: string }[] = [];

    wordInputs.forEach((raw, idx) => {
      const trimmed = raw.trim();
      if (trimmed.length > 0) {
        filledIndices.push(idx);

        // a. Selain huruf a–z, spasi, dan "-"
        if (/[^a-zA-Z\s-]/.test(trimmed)) {
          newWordErrs[idx] = 'Hanya boleh huruf a–z.';
          hasError = true;
          if (!firstErrorElement && wordInputRefs.current[idx]) {
            firstErrorElement = wordInputRefs.current[idx];
          }
          return;
        }

        // b. Lebih dari dua spasi/tanda hubung
        const spacesAndDashes = (trimmed.match(/[\s-]/g) || []).length;
        if (spacesAndDashes > 2) {
          newWordErrs[idx] = 'Maksimal dua spasi atau tanda hubung.';
          hasError = true;
          if (!firstErrorElement && wordInputRefs.current[idx]) {
            firstErrorElement = wordInputRefs.current[idx];
          }
          return;
        }

        // c. Setelah spasi dan tanda hubung dibuang, max 14 huruf
        const clean = trimmed.replace(/[\s-]/g, '').toUpperCase();
        if (clean.length === 0) {
          newWordErrs[idx] = 'Hanya boleh huruf a–z.';
          hasError = true;
          if (!firstErrorElement && wordInputRefs.current[idx]) {
            firstErrorElement = wordInputRefs.current[idx];
          }
          return;
        }

        if (clean.length > 14) {
          newWordErrs[idx] = 'Maksimal 14 huruf.';
          hasError = true;
          if (!firstErrorElement && wordInputRefs.current[idx]) {
            firstErrorElement = wordInputRefs.current[idx];
          }
          return;
        }

        validWordItems.push({ idx, original: trimmed, clean });
      }
    });

    // d. Duplikat: "Kata sudah dipakai."
    const seenMap = new Map<string, number>();
    validWordItems.forEach(item => {
      if (seenMap.has(item.clean)) {
        newWordErrs[item.idx] = 'Kata sudah dipakai.';
        hasError = true;
        if (!firstErrorElement && wordInputRefs.current[item.idx]) {
          firstErrorElement = wordInputRefs.current[item.idx];
        }
      } else {
        seenMap.set(item.clean, item.idx);
      }
    });

    // 4. Kurang dari 10 kata terisi
    if (filledIndices.length < 10) {
      newListErr = 'Isi minimal 10 kata.';
      hasError = true;
      if (!firstErrorElement && listErrRef.current) {
        firstErrorElement = listErrRef.current;
      }
    }

    // 6. Jika ada satu saja error, batalkan dan gulir ke error pertama
    if (hasError) {
      setTitleErr(newTitleErr);
      setDescErr(newDescErr);
      setWordErrs(newWordErrs);
      setListErr(newListErr);

      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorElement.focus?.();
      }
      return;
    }

    // Lolos: normalisasi kata dan kirim
    setIsSubmitting(true);
    const finalWords: WordItem[] = validWordItems.map(item => ({
      original: item.original,
      clean: item.clean,
    }));

    // Beri jeda kecil agar tombol nonaktif sebentar saat puzzle dibuat
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmit(trimmedTitle, trimmedDesc, finalWords, settings);
    }, 250);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 1. Judul Halaman */}
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Pembuat Puzzle Cari Kata
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Buat lembar puzzle bertema secara acak untuk dimainkan siswa di layar atau dicetak di kertas A4.
        </p>
      </div>

      <section id="maker" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} noValidate>
          {/* 2. Judul */}
          <div id="mTitle" className="mb-5">
            <label htmlFor="puzzleTitleInput" className="block text-sm font-semibold text-slate-900 mb-1.5">
              Judul
            </label>
            <input
              id="puzzleTitleInput"
              ref={titleInputRef}
              type="text"
              value={title}
              aria-describedby={titleErr ? 'titleError' : undefined}
              aria-invalid={Boolean(titleErr)}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleErr) setTitleErr('');
              }}
              placeholder="Contoh: Sistem Pencernaan Manusia, Tata Surya"
              className={`
                w-full px-3.5 py-2 text-sm text-slate-900 bg-white border rounded-lg 
                shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                ${titleErr ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 hover:border-slate-400'}
              `}
            />
            <div id="titleError" className="fErr">
              {titleErr}
            </div>
          </div>

          {/* 3. Deskripsi */}
          <div id="mDesc" className="mb-6">
            <label htmlFor="puzzleDescInput" className="block text-sm font-semibold text-slate-900 mb-1.5">
              Deskripsi
            </label>
            <textarea
              id="puzzleDescInput"
              ref={descInputRef}
              rows={3}
              value={desc}
              aria-describedby={descErr ? 'descError' : undefined}
              aria-invalid={Boolean(descErr)}
              onChange={(e) => {
                setDesc(e.target.value);
                if (descErr) setDescErr('');
              }}
              placeholder="Berikan petunjuk atau pengantar tema materi bagi siswa..."
              className={`
                w-full px-3.5 py-2 text-sm text-slate-900 bg-white border rounded-lg 
                shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                ${descErr ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 hover:border-slate-400'}
              `}
            />
            <div id="descError" className="fErr">
              {descErr}
            </div>
          </div>

          {/* 4 & 5. Daftar Kata (30 baris) */}
          <div id="mWords" className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-slate-900">
                Daftar Kata
              </label>
              <span className="text-xs font-mono text-slate-500">
                {filledCount} dari 30 terisi {filledCount >= 10 ? '✓' : '(minimal 10)'}
              </span>
            </div>

            {/* Teks bantu persis sesuai brief */}
            <p style={{ margin: 0 }} className="text-xs text-slate-500 mb-3">
              Isi 10 sampai 30 kata. Puzzle dibuat secara acak memakai sebagian kata dari daftar Anda.
            </p>

            {/* 30 kolom input kata (2 atau 3 kolom di layar lebar, 1 di layar kecil) */}
            <div id="wordlist" className="wordlist grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {wordInputs.map((val, idx) => {
                const rowId = `wrd${idx}`;
                const errorId = `err_${rowId}`;
                const hasErr = Boolean(wordErrs[idx]);

                return (
                  <div key={rowId} id={rowId} className="word">
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-[11px] font-mono text-slate-400 select-none">
                        {(idx + 1).toString().padStart(2, '0')}.
                      </span>
                      <input
                        ref={(el) => {
                          wordInputRefs.current[idx] = el;
                        }}
                        type="text"
                        value={val}
                        id={`input_${rowId}`}
                        aria-label={`Kata ${idx + 1}`}
                        aria-describedby={hasErr ? errorId : undefined}
                        aria-invalid={hasErr}
                        onChange={(e) => handleWordChange(idx, e.target.value)}
                        placeholder={`Kata ${idx + 1}`}
                        className={`
                          w-full pl-8 pr-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-900 
                          bg-white border rounded-lg shadow-2xs transition-colors
                          focus:outline-none focus:ring-2 focus:ring-blue-500
                          ${hasErr ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 hover:border-slate-400'}
                        `}
                      />
                    </div>
                    <div id={errorId} className="fErr">
                      {wordErrs[idx]}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Area error di bawah daftar */}
            <div ref={listErrRef} className="fErr fLast mt-2">
              {listErr}
            </div>
          </div>

          {/* 6. Pengaturan puzzle (blok kecil) */}
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Pengaturan Puzzle
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Ukuran kotak */}
              <div>
                <label htmlFor="gridSizeSelect" className="block text-xs font-semibold text-slate-800 mb-1">
                  Ukuran kotak
                </label>
                <select
                  id="gridSizeSelect"
                  value={settings.gridSize}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      gridSize: Number(e.target.value) as 12 | 15 | 18,
                    }))
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value={12}>12 × 12 (Ringkas)</option>
                  <option value={15}>15 × 15 (Standar - Default)</option>
                  <option value={18}>18 × 18 (Lebar)</option>
                </select>
              </div>

              {/* Jumlah kata dalam puzzle */}
              <div>
                <label htmlFor="wordCountInput" className="block text-xs font-semibold text-slate-800 mb-1">
                  Jumlah kata dalam puzzle
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="wordCountInput"
                    type="number"
                    min={8}
                    max={Math.max(8, Math.min(20, filledCount || 20))}
                    value={settings.wordCount}
                    onChange={(e) => {
                      const val = Math.max(8, Math.min(20, Number(e.target.value)));
                      setSettings((prev) => ({ ...prev, wordCount: val }));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">
                    (8–20, maks kata terisi)
                  </span>
                </div>
              </div>

              {/* Arah kata */}
              <div>
                <span className="block text-xs font-semibold text-slate-800 mb-1">
                  Arah kata
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.horizontal}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, horizontal: e.target.checked }))
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Mendatar</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.vertical}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, vertical: e.target.checked }))
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Menurun</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.diagonal}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, diagonal: e.target.checked }))
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Diagonal</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowReverse}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, allowReverse: e.target.checked }))
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Boleh terbalik</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Peringatan persis sesuai brief */}
          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 mb-6">
            ❗ Jangan memasukkan data pribadi ke dalam puzzle.
          </p>

          {/* 8. Tombol Utama "Buat Puzzle" */}
          <div className="mb-8">
            <button
              id="mSubmit"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-7 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Sedang Membuat Puzzle...' : 'Buat Puzzle'}
            </button>
          </div>

          {/* 9. Kotak Petunjuk persis sesuai brief */}
          <div id="mInstructions" className="pt-6 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Petunjuk
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>Untuk membuat puzzle, isi daftar kata minimal 10 kata.</li>
              <li>
                Daftar kata sebaiknya bertema satu topik, misalnya materi IPA seperti sistem pencernaan atau tata surya.
              </li>
              <li>
                Kata hanya boleh berisi huruf a–z dan maksimal dua spasi atau tanda hubung. Spasi dan tanda hubung dihapus saat kata dimasukkan ke kotak puzzle.
              </li>
              <li>Panjang kata maksimal 14 huruf.</li>
            </ul>
          </div>
        </form>
      </section>
    </div>
  );
};
