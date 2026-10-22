import { PlacedWord, WordSearchResult } from '../types';

// High contrast, pleasant highlighter colors for found words
export const HIGHLIGHT_COLORS = [
  '#FDE047', // yellow-300
  '#86EFAC', // green-300
  '#93C5FD', // blue-300
  '#FCA5A5', // red-300
  '#D8B4FE', // purple-300
  '#FDBA74', // orange-300
  '#67E8F9', // cyan-300
  '#F472B6', // pink-400
  '#A7F3D0', // emerald-200
  '#C4B5FD', // violet-300
  '#FDE68A', // amber-200
  '#BAE6FD', // sky-200
  '#DDD6FE', // indigo-200
  '#BBF7D0', // lime-200
  '#FED7AA', // warm-orange
];

const DIRECTIONS: [number, number][] = [
  [0, 1],   // Right
  [1, 0],   // Down
  [1, 1],   // Down-Right
  [-1, 1],  // Up-Right
  [0, -1],  // Left
  [-1, 0],  // Up
  [-1, -1], // Up-Left
  [1, -1],  // Down-Left
];

// Typical English letter distribution for realistic word search filler
const LETTER_WEIGHTS = 'EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIOOOOOOOONNNNNNRRRRRRTTTTTTLLLLSSSSUUUUDDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ';

export function getRandomFillerLetter(): string {
  const idx = Math.floor(Math.random() * LETTER_WEIGHTS.length);
  return LETTER_WEIGHTS[idx];
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface GenerateOptions {
  words: string[];
  maxWordsToSelect?: number; // e.g. 10 or 12
  gridSize?: number;
}

export function generateWordSearch({
  words,
  maxWordsToSelect = 12,
  gridSize,
}: GenerateOptions): WordSearchResult {
  // 1. Pick a random subset of words if words > maxWordsToSelect
  const shuffled = shuffleArray(words);
  const targetCount = Math.min(words.length, Math.max(10, maxWordsToSelect));
  const selectedWords = shuffled.slice(0, targetCount);

  // 2. Determine grid size
  const maxWordLen = Math.max(...selectedWords.map(w => w.length), 8);
  const calculatedSize = Math.max(12, maxWordLen + 1, Math.min(16, Math.ceil(Math.sqrt(selectedWords.join('').length * 2.2))));
  const size = gridSize || calculatedSize;

  // Sort words descending by length (longer words placed first reduces collisions)
  const sortedWords = [...selectedWords].sort((a, b) => b.length - a.length);

  // Retry board generation if we fail to place most words
  let bestResult: { grid: (string | null)[][]; placed: PlacedWord[]; unplaced: string[] } | null = null;

  for (let attempt = 0; attempt < 15; attempt++) {
    const grid: (string | null)[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => null)
    );
    const placed: PlacedWord[] = [];
    const unplaced: string[] = [];

    let colorIdx = 0;

    for (const word of sortedWords) {
      let wordPlaced = false;
      const shuffledDirections = shuffleArray(DIRECTIONS);

      // Collect all possible starting coordinates and shuffle
      const coords: [number, number][] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          coords.push([r, c]);
        }
      }
      const shuffledCoords = shuffleArray(coords);

      // Try directions and coords
      for (const [r, c] of shuffledCoords) {
        if (wordPlaced) break;
        for (const [dr, dc] of shuffledDirections) {
          const endR = r + (word.length - 1) * dr;
          const endC = c + (word.length - 1) * dc;

          if (endR < 0 || endR >= size || endC < 0 || endC >= size) {
            continue; // Out of bounds
          }

          // Check if placement is valid
          let canPlace = true;
          const cells: [number, number][] = [];
          for (let i = 0; i < word.length; i++) {
            const currR = r + i * dr;
            const currC = c + i * dc;
            const cellVal = grid[currR][currC];
            if (cellVal !== null && cellVal !== word[i]) {
              canPlace = false;
              break;
            }
            cells.push([currR, currC]);
          }

          if (canPlace) {
            // Commit to grid
            for (let i = 0; i < word.length; i++) {
              const currR = r + i * dr;
              const currC = c + i * dc;
              grid[currR][currC] = word[i];
            }

            placed.push({
              word,
              start: [r, c],
              end: [endR, endC],
              cells,
              color: HIGHLIGHT_COLORS[colorIdx % HIGHLIGHT_COLORS.length],
              found: false,
              hintLevel: 0,
            });
            colorIdx++;
            wordPlaced = true;
            break;
          }
        }
      }

      if (!wordPlaced) {
        unplaced.push(word);
      }
    }

    if (!bestResult || placed.length > bestResult.placed.length) {
      bestResult = { grid, placed, unplaced };
    }

    if (unplaced.length === 0) {
      break; // All words successfully placed!
    }
  }

  const finalGrid = bestResult!.grid.map(row =>
    row.map(cell => (cell !== null ? cell : getRandomFillerLetter()))
  );

  return {
    grid: finalGrid,
    size,
    placedWords: bestResult!.placed,
    unplacedWords: bestResult!.unplaced,
  };
}
