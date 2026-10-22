import React, { useState, useEffect } from 'react';
import { SavedPuzzle } from '../types';
import { Sparkles, Trash2, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  initialPuzzle?: SavedPuzzle | null;
  onManageClick: (e: React.MouseEvent) => void;
  onSubmitSuccess: (puzzle: SavedPuzzle) => void;
}

export const PuzzleMaker: React.FC<Props> = ({
  initialPuzzle,
  onManageClick,
  onSubmitSuccess,
}) => {
  // Title & description state
  const [title, setTitle] = useState<string>('');
  const [desc, setDesc] = useState<string>('');

  // Exactly 30 word input slots (wrd0 to wrd29)
  const [wordInputs, setWordInputs] = useState<string[]>(() => Array(30).fill(''));

  // Error state mapping
  const [titleErr, setTitleErr] = useState<string>('');
  const [descErr, setDescErr] = useState<string>('');
  const [wordErrs, setWordErrs] = useState<string[]>(() => Array(30).fill(''));
  const [listErr, setListErr] = useState<string>('');

  // Success notification after submission
  const [submittedPuzzle, setSubmittedPuzzle] = useState<SavedPuzzle | null>(null);

  // If editing an existing puzzle, populate initial state
  useEffect(() => {
    if (initialPuzzle) {
      setTitle(initialPuzzle.title);
      setDesc(initialPuzzle.description);
      const newWords = Array(30).fill('');
      initialPuzzle.words.forEach((w, idx) => {
        if (idx < 30) newWords[idx] = w;
      });
      setWordInputs(newWords);
      setSubmittedPuzzle(null);
    }
  }, [initialPuzzle]);

  // Handle single word input change
  const handleWordChange = (index: number, value: string) => {
    const updated = [...wordInputs];
    updated[index] = value;
    setWordInputs(updated);

    // Clear error for this specific row when user edits
    if (wordErrs[index]) {
      const updatedErrs = [...wordErrs];
      updatedErrs[index] = '';
      setWordErrs(updatedErrs);
    }
    if (listErr) setListErr('');
  };

  // Preset themes to easily test and populate 12-15 words
  const fillPreset = (theme: 'rainforest' | 'space' | 'culinary') => {
    let presetTitle = '';
    let presetDesc = '';
    let words: string[] = [];

    if (theme === 'rainforest') {
      presetTitle = 'Rainforest Wildlife';
      presetDesc = 'Fascinating animals and birds living in the lush tropical rainforest.';
      words = [
        'Jaguar', 'Toucan', 'Anaconda', 'Sloth', 'Chameleon',
        'Piranha', 'Macaw', 'Ocelot', 'Tree Frog', 'Capybara',
        'Armadillo', 'Gorilla', 'Hornbill', 'Iguana', 'Tapir'
      ];
    } else if (theme === 'space') {
      presetTitle = 'Solar System & Cosmos';
      presetDesc = 'Planets, cosmic bodies, and astronomical phenomena of deep space.';
      words = [
        'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter',
        'SatURN', 'Uranus', 'Neptune', 'Asteroid', 'Comet',
        'Nebula', 'Supernova', 'Galaxy', 'Telescope', 'Eclipse'
      ];
    } else {
      presetTitle = 'Indonesian Culinary Heritage';
      presetDesc = 'Delicious traditional dishes and culinary delicacies from Indonesia.';
      words = [
        'Rendang', 'Sate Ayam', 'Nasi Goreng', 'Gado Gado', 'Soto Betawi',
        'Bakso', 'Pempek', 'Rawon', 'Martabak', 'Gudeg',
        'Klepon', 'Lontong', 'Ayam Betutu', 'Opor Ayam', 'Serabi'
      ];
    }

    setTitle(presetTitle);
    setDesc(presetDesc);
    const newWordList = Array(30).fill('');
    words.forEach((w, i) => {
      newWordList[i] = w;
    });
    setWordInputs(newWordList);
    clearAllErrors();
  };

  // Clear all errors
  const clearAllErrors = () => {
    setTitleErr('');
    setDescErr('');
    setWordErrs(Array(30).fill(''));
    setListErr('');
  };

  // Clear entire form
  const handleResetForm = () => {
    setTitle('');
    setDesc('');
    setWordInputs(Array(30).fill(''));
    clearAllErrors();
    setSubmittedPuzzle(null);
  };

  // Form submission and validation logic according to brief rules
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 7. Clear all previous errors
    clearAllErrors();

    let hasError = false;
    let newTitleErr = '';
    let newDescErr = '';
    const newWordErrs = Array(30).fill('');
    let newListErr = '';

    // 2. Title validation: required after trim
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newTitleErr = 'Please enter a title.';
      hasError = true;
    } else if (trimmedTitle.length > 70) {
      newTitleErr = 'Title must be 70 characters or fewer.';
      hasError = true;
    }

    // 2. Description validation: required after trim
    const trimmedDesc = desc.trim();
    if (!trimmedDesc) {
      newDescErr = 'Please enter a description.';
      hasError = true;
    } else if (trimmedDesc.length > 350) {
      newDescErr = 'Description must be 350 characters or fewer.';
      hasError = true;
    }

    // 3. Collect non-empty words
    const filledIndices: number[] = [];
    const cleanedWordsMap: { [index: number]: string } = {};

    wordInputs.forEach((raw, idx) => {
      const trimmed = raw.trim();
      if (trimmed.length > 0) {
        filledIndices.push(idx);

        // 5. Word validation:
        // Rule: Only a-z (case insensitive) and max 2 spaces or dashes
        const spacesAndDashesCount = (trimmed.match(/[\s-]/g) || []).length;
        if (spacesAndDashesCount > 2) {
          newWordErrs[idx] = 'Words can only contain a maximum of two spaces or dashes.';
          hasError = true;
          return;
        }

        // Rule: Only letters a-z, spaces, and dashes allowed
        if (/[^a-zA-Z\s-]/.test(trimmed)) {
          newWordErrs[idx] = 'Words can only contain the letters a-z and up to two spaces or dashes.';
          hasError = true;
          return;
        }

        // Rule: After spaces & dashes removed, max 14 letters
        const cleaned = trimmed.replace(/[\s-]/g, '').toUpperCase();
        if (cleaned.length === 0) {
          newWordErrs[idx] = 'Word cannot be only spaces or dashes.';
          hasError = true;
          return;
        }

        if (cleaned.length > 14) {
          newWordErrs[idx] = 'Words can have a maximum length of 14 letters.';
          hasError = true;
          return;
        }

        if (cleaned.length < 2) {
          newWordErrs[idx] = 'Word must contain at least 2 letters.';
          hasError = true;
          return;
        }

        cleanedWordsMap[idx] = cleaned;
      }
    });

    // Check for duplicate words in the list
    const seenWords = new Map<string, number>();
    filledIndices.forEach(idx => {
      const clean = cleanedWordsMap[idx];
      if (clean) {
        if (seenWords.has(clean)) {
          newWordErrs[idx] = 'Duplicate word in list.';
          hasError = true;
        } else {
          seenWords.set(clean, idx);
        }
      }
    });

    // 4. List size check: Must be between 10 and 30 words
    if (filledIndices.length < 10) {
      newListErr = 'Please enter at least 10 words.';
      hasError = true;
    }

    // Apply error states if any
    if (hasError) {
      setTitleErr(newTitleErr);
      setDescErr(newDescErr);
      setWordErrs(newWordErrs);
      setListErr(newListErr);
      return;
    }

    // 6. When saved: strip all spaces and dashes, convert to UPPERCASE
    const finalWords = filledIndices.map(idx => cleanedWordsMap[idx]);

    // 8. Call placeholder submitPuzzle
    const puzzlePayload = {
      title: trimmedTitle,
      description: trimmedDesc,
      words: finalWords,
    };

    const saved = submitPuzzle(puzzlePayload);
    setSubmittedPuzzle(saved);
    onSubmitSuccess(saved);
  };

  /**
   * Placeholder function as requested in technical constraints:
   * "Backend penyimpanan puzzle tidak termasuk. Siapkan fungsi submitPuzzle(data) sebagai placeholder."
   */
  const submitPuzzle = (data: { title: string; description: string; words: string[] }): SavedPuzzle => {
    // In our client implementation, we persist into localStorage so the user can immediately play!
    const STORAGE_KEY = 'word_search_puzzles_v1';
    let existing: SavedPuzzle[] = [];
    try {
      existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      existing = [];
    }

    const newRecord: SavedPuzzle = {
      id: 'pz_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      title: data.title,
      description: data.description,
      words: data.words,
      createdAt: Date.now(),
    };

    const updated = [newRecord, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  };

  const filledWordCount = wordInputs.filter(w => w.trim().length > 0).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Success banner if just submitted */}
      {submittedPuzzle && (
        <div className="mb-8 p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Puzzle "{submittedPuzzle.title}" created successfully!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {submittedPuzzle.words.length} words saved. Ready for randomized online play.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSubmitSuccess(submittedPuzzle)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Play Now
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSubmittedPuzzle(null)}
              className="px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:text-emerald-950"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Preset Theme Quick Load Helpers (Extra convenience) */}
      <div className="mb-6 p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-slate-800">Quick Fill Sample Themes:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fillPreset('rainforest')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
          >
            🌿 Rainforest
          </button>
          <button
            type="button"
            onClick={() => fillPreset('space')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
          >
            🚀 Solar System
          </button>
          <button
            type="button"
            onClick={() => fillPreset('culinary')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
          >
            🍲 Indonesian Food
          </button>
          <button
            type="button"
            onClick={handleResetForm}
            className="p-1 text-slate-400 hover:text-red-600 rounded ml-1 transition-colors"
            title="Clear form"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 
        Exact DOM Structure as specified in brief:
        <section id="maker">
        Satu kolom vertikal, dari atas ke bawah:
        1. #mHead: tautan "Manage existing puzzles here" menuju /maker/?manage=1
        2. #mTitle: label "Title", input teks satu baris, lalu div.fErr
        3. #mDesc: label "Description", textarea, lalu div.fErr
        4. #mWords: label "Word List", paragraf tanpa margin, <wordlist> dengan #wrd0..#wrd29 dan div.fErr, lalu div.fErr.fLast
        5. Paragraf peringatan: "❗ Do not add personal information into online puzzles."
        6. Tombol #mSubmit berlabel "Submit"
        7. #mInstructions: heading h3 "Instructions" dan daftar ul 5 butir
      */}
      <section id="maker" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} noValidate>
          {/* 1. #mHead */}
          <div className="mb-6">
            <a
              id="mHead"
              href="/maker/?manage=1"
              onClick={onManageClick}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors inline-block"
            >
              Manage existing puzzles here
            </a>
          </div>

          {/* 2. #mTitle */}
          <div id="mTitle" className="mb-5">
            <label htmlFor="puzzleTitleInput" className="block text-sm font-semibold text-slate-900 mb-1.5">
              Title
            </label>
            <input
              id="puzzleTitleInput"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleErr) setTitleErr('');
              }}
              placeholder="e.g. Rainforest Animals, 80s Rock Bands"
              className={`
                w-full px-3.5 py-2 text-sm text-slate-900 bg-white border rounded-lg 
                shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                ${titleErr ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 hover:border-slate-400'}
              `}
            />
            <div className="fErr">{titleErr}</div>
          </div>

          {/* 3. #mDesc */}
          <div id="mDesc" className="mb-6">
            <label htmlFor="puzzleDescInput" className="block text-sm font-semibold text-slate-900 mb-1.5">
              Description
            </label>
            <textarea
              id="puzzleDescInput"
              rows={3}
              value={desc}
              onChange={(e) => {
                setDesc(e.target.value);
                if (descErr) setDescErr('');
              }}
              placeholder="Describe the theme or give clues to players..."
              className={`
                w-full px-3.5 py-2 text-sm text-slate-900 bg-white border rounded-lg 
                shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                ${descErr ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 hover:border-slate-400'}
              `}
            />
            <div className="fErr">{descErr}</div>
          </div>

          {/* 4. #mWords */}
          <div id="mWords" className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-slate-900">
                Word List
              </label>
              <span className="text-xs font-mono text-slate-500">
                {filledWordCount} of 30 words filled {filledWordCount >= 10 ? '✓' : '(min 10)'}
              </span>
            </div>

            {/* Paragraph without margin: exact copy */}
            <p style={{ margin: 0 }} className="text-xs text-slate-500 mb-3">
              Between 10 and 30 words. Puzzles are randomly generated using a selection of your words at play time.
            </p>

            {/* Custom <wordlist> with exactly 30 div.word from wrd0 to wrd29 */}
            <wordlist className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {wordInputs.map((val, idx) => {
                const rowId = `wrd${idx}`;
                const hasRowErr = Boolean(wordErrs[idx]);

                return (
                  <div key={rowId} id={rowId} className="word">
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-[11px] font-mono text-slate-400 select-none">
                        {(idx + 1).toString().padStart(2, '0')}.
                      </span>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleWordChange(idx, e.target.value)}
                        placeholder={`Word ${idx + 1}`}
                        className={`
                          w-full pl-8 pr-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-900 
                          bg-white border rounded-lg shadow-2xs transition-colors
                          focus:outline-none focus:ring-2 focus:ring-blue-500
                          ${hasRowErr ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 hover:border-slate-400'}
                        `}
                      />
                    </div>
                    {/* Error container for this word: empty .fErr takes 0 space */}
                    <div className="fErr">{wordErrs[idx]}</div>
                  </div>
                );
              })}
            </wordlist>

            {/* List-level error container: empty .fErr.fLast takes 0 space */}
            <div className="fErr fLast mt-2">{listErr}</div>
          </div>

          {/* 5. Warning paragraph: exact copy */}
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 mb-6">
            ❗ Do not add personal information into online puzzles.
          </p>

          {/* 6. Button #mSubmit */}
          <div className="mb-8">
            <button
              id="mSubmit"
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
            >
              Submit
            </button>
          </div>

          {/* 7. #mInstructions */}
          <div id="mInstructions" className="pt-6 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Instructions
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>To create a word search puzzle you must supply a word list of at least 10 words.</li>
              <li>The word list should be based on a single theme or topic. For example a television show or a movie you enjoy.</li>
              <li>Words can only contain the letters a-z and a maximum of two spaces or dashes. Spaces and dashes will be removed when words are added to the word search grid.</li>
              <li>Words can have a maximum length of 14 letters</li>
              <li>All puzzles created will be playable on the site, will be deleted automatically after 60 days of inactivity</li>
            </ul>
          </div>
        </form>
      </section>
    </div>
  );
};
