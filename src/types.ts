import React from 'react';

export interface SavedPuzzle {
  id: string;
  title: string;
  description: string;
  words: string[]; // Cleaned uppercase words
  createdAt: number;
  lastPlayedAt?: number;
}

export type Direction = [number, number]; // [dRow, dCol]

export interface PlacedWord {
  word: string;
  originalText?: string;
  start: [number, number]; // [row, col]
  end: [number, number];   // [row, col]
  cells: [number, number][]; // all [row, col]
  color: string;
  found: boolean;
  hintLevel: number; // 0 = none, 1 = first letter, 2 = direction, 3 = row/col
}

export interface WordSearchResult {
  grid: string[][];
  size: number;
  placedWords: PlacedWord[];
  unplacedWords: string[];
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      wordlist: React.HTMLAttributes<HTMLElement>;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      wordlist: React.HTMLAttributes<HTMLElement>;
    }
  }
}
