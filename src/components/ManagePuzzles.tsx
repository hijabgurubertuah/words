import React, { useState } from 'react';
import { SavedPuzzle } from '../types';
import { loadSavedPuzzles, deletePuzzleFromStorage } from '../utils/storage';
import { Play, Trash2, ArrowLeft, Plus, Download, Upload, Calendar, FileText } from 'lucide-react';

interface Props {
  onPlayPuzzle: (puzzle: SavedPuzzle) => void;
  onEditInMaker: (puzzle: SavedPuzzle) => void;
  onGoToMaker: () => void;
}

export const ManagePuzzles: React.FC<Props> = ({
  onPlayPuzzle,
  onEditInMaker,
  onGoToMaker,
}) => {
  const [puzzles, setPuzzles] = useState<SavedPuzzle[]>(() => loadSavedPuzzles());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    const updated = deletePuzzleFromStorage(id);
    setPuzzles(updated);
    setDeleteConfirmId(null);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(puzzles, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `word_search_puzzles_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          localStorage.setItem('word_search_puzzles_v1', JSON.stringify(parsed));
          setPuzzles(parsed);
        }
      } catch {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top action header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onGoToMaker}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Maker
          </button>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Puzzles</h2>
          <p className="text-sm text-slate-500 mt-1">
            Browse, play, export, or edit all saved word search puzzle sets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            title="Export all puzzles as JSON backup"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            Import JSON
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={onGoToMaker}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Puzzle
          </button>
        </div>
      </div>

      {/* Puzzles List */}
      {puzzles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 mb-1">No Puzzles Found</h3>
          <p className="text-sm text-slate-500 mb-4">
            You have not created any puzzles yet. Start by crafting your first themed word list!
          </p>
          <button
            onClick={onGoToMaker}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Puzzle Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {puzzles.map((puzzle) => (
            <div
              key={puzzle.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-900 truncate">{puzzle.title}</h3>
                  <span className="text-xs text-slate-400 font-medium">
                    · {puzzle.words.length} words
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 mb-2">{puzzle.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Created {formatDate(puzzle.createdAt)}
                  </span>
                  <span>·</span>
                  <span className="font-mono text-slate-500">
                    Sample: {puzzle.words.slice(0, 5).join(', ')}...
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onPlayPuzzle(puzzle)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Play Online
                </button>

                <button
                  onClick={() => onEditInMaker(puzzle)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Edit / Duplicate
                </button>

                {deleteConfirmId === puzzle.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(puzzle.id)}
                      className="px-2 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(puzzle.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                    title="Delete puzzle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
