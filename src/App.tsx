import React, { useState, useEffect } from 'react';
import { SavedPuzzle } from './types';
import { loadSavedPuzzles, DEFAULT_PUZZLES } from './utils/storage';
import { PuzzleMaker } from './components/PuzzleMaker';
import { WordSearchPlayer } from './components/WordSearchPlayer';
import { ManagePuzzles } from './components/ManagePuzzles';
import { BookOpen, X } from 'lucide-react';

type ActiveView = 'MAKER' | 'MANAGE' | 'PLAY';

export default function App() {
  const [view, setView] = useState<ActiveView>('MAKER');
  const [activePuzzle, setActivePuzzle] = useState<SavedPuzzle | null>(null);
  const [editingPuzzle, setEditingPuzzle] = useState<SavedPuzzle | null>(null);
  const [showInstructionsModal, setShowInstructionsModal] = useState<boolean>(false);

  // Parse initial query params (e.g. /maker/?manage=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('manage') === '1') {
      setView('MANAGE');
    }

    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('manage') === '1') {
        setView('MANAGE');
      } else {
        setView('MAKER');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update browser URL quietly without full reload
  const navigateTo = (newView: ActiveView, updateQuery = true) => {
    setView(newView);
    if (updateQuery) {
      if (newView === 'MANAGE') {
        window.history.pushState({}, '', '/maker/?manage=1');
      } else if (newView === 'MAKER') {
        window.history.pushState({}, '', '/');
      }
    }
  };

  // Handler for Manage link click from #mHead
  const handleManageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigateTo('MANAGE');
  };

  // Handler for puzzle submission from Maker
  const handlePuzzleCreated = (puzzle: SavedPuzzle) => {
    setActivePuzzle(puzzle);
    navigateTo('PLAY', false);
  };

  // Handler for playing a puzzle from Manage view
  const handlePlayPuzzle = (puzzle: SavedPuzzle) => {
    setActivePuzzle(puzzle);
    navigateTo('PLAY', false);
  };

  // Handler for editing / duplicating in Maker
  const handleEditInMaker = (puzzle: SavedPuzzle) => {
    setEditingPuzzle(puzzle);
    navigateTo('MAKER');
  };

  // Handler for "Create Puzzle" primary button
  const handleCreateNew = () => {
    setEditingPuzzle(null);
    navigateTo('MAKER');
  };

  // Handler for loading sample puzzle directly into player
  const handlePlaySample = () => {
    const puzzles = loadSavedPuzzles();
    const sample = puzzles[0] || DEFAULT_PUZZLES[0];
    setActivePuzzle(sample);
    navigateTo('PLAY', false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 
        Strict Top Bar Contract:
        [Brand wordmark, one line] — [4-5 nav links, single-line] — [1 primary action]
      */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => navigateTo('MAKER')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-600 transition-colors text-left"
          >
            Word Search Studio
          </button>

          {/* Zone 2: 4 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => navigateTo('MAKER')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${view === 'MAKER' ? 'text-blue-600 font-semibold' : ''}`}
            >
              Maker
            </button>
            <button
              onClick={() => navigateTo('MANAGE')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${view === 'MANAGE' ? 'text-blue-600 font-semibold' : ''}`}
            >
              Puzzles
            </button>
            <button
              onClick={handlePlaySample}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${view === 'PLAY' ? 'text-blue-600 font-semibold' : ''}`}
            >
              Quick Play
            </button>
            <button
              onClick={() => setShowInstructionsModal(true)}
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Instructions
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
            >
              New Puzzle
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {view === 'MAKER' && (
          <PuzzleMaker
            initialPuzzle={editingPuzzle}
            onManageClick={handleManageClick}
            onSubmitSuccess={handlePuzzleCreated}
          />
        )}

        {view === 'MANAGE' && (
          <ManagePuzzles
            onPlayPuzzle={handlePlayPuzzle}
            onEditInMaker={handleEditInMaker}
            onGoToMaker={() => navigateTo('MAKER')}
          />
        )}

        {view === 'PLAY' && activePuzzle && (
          <WordSearchPlayer
            puzzle={activePuzzle}
            onBackToMaker={() => navigateTo('MAKER')}
            onManagePuzzles={() => navigateTo('MANAGE')}
          />
        )}
      </main>

      {/* Footer (No-print) */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>Word Search Puzzle Maker & Player</p>
          <div className="flex items-center gap-4">
            <button onClick={() => navigateTo('MAKER')} className="hover:text-slate-800">
              Maker Form
            </button>
            <span>·</span>
            <button onClick={() => navigateTo('MANAGE')} className="hover:text-slate-800">
              Manage Puzzles
            </button>
            <span>·</span>
            <button onClick={() => setShowInstructionsModal(true)} className="hover:text-slate-800">
              Rules
            </button>
          </div>
        </div>
      </footer>

      {/* Instructions Modal */}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3>Word Search Maker Instructions</h3>
              </div>
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ul className="text-sm text-slate-600 space-y-3 list-disc list-inside">
              <li>To create a word search puzzle you must supply a word list of at least 10 words.</li>
              <li>The word list should be based on a single theme or topic. For example a television show or a movie you enjoy.</li>
              <li>Words can only contain the letters a-z and a maximum of two spaces or dashes. Spaces and dashes will be removed when words are added to the word search grid.</li>
              <li>Words can have a maximum length of 14 letters.</li>
              <li>All puzzles created will be playable on the site, will be deleted automatically after 60 days of inactivity.</li>
            </ul>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
