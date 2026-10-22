export interface WordItem {
  original: string; // Bentuk asli dengan spasi/tanda hubung
  clean: string;    // Huruf kapital tanpa spasi dan tanda hubung
}

export interface PuzzleSettings {
  gridSize: 12 | 15 | 18;
  wordCount: number; // 8 - 20, default 10
  horizontal: boolean; // default true
  vertical: boolean;   // default true
  diagonal: boolean;   // default true
  allowReverse: boolean; // default false
}

export interface PlacedWord {
  originalText: string;
  word: string; // clean uppercase
  start: [number, number]; // [row, col]
  end: [number, number];   // [row, col]
  cells: [number, number][]; // semua [row, col]
  color: string;
  found: boolean;
}

export interface GeneratedPuzzle {
  id: string;
  title: string;
  grid: string[][];
  size: number;
  placedWords: PlacedWord[];
  unplacedWords: string[];
  sizeAdjustmentNote?: string;
}

export interface PrintSettings {
  layout: '1_per_page' | '2_per_page';
  twoPuzzleMode: 'different' | 'duplicate';
  cellScale: number; // 0.85 (kecil) - 1.0 (sedang) - 1.15 (besar)
  fontSize: 'small' | 'medium' | 'large';
  includeAnswerKey: boolean;
  includeNameClass: boolean;
}
