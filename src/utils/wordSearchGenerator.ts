import { WordItem, PuzzleSettings, PlacedWord, GeneratedPuzzle } from '../types';

export const HIGHLIGHT_COLORS = [
  '#FDE047', // kuning lembut
  '#86EFAC', // hijau lembut
  '#93C5FD', // biru muda
  '#FCA5A5', // merah muda
  '#D8B4FE', // ungu muda
  '#FDBA74', // oranye lembut
  '#67E8F9', // sian muda
  '#F472B6', // pink
  '#A7F3D0', // zamrud muda
  '#C4B5FD', // violet
  '#FDE68A', // amber
  '#BAE6FD', // langit biru
  '#DDD6FE', // lavender
  '#BBF7D0', // limau muda
  '#FED7AA', // peach
  '#E9D5FF', // lilac
  '#FEF08A', // kuning cerah
  '#99F6E4', // toska
  '#FECDD3', // mawar
  '#E2E8F0', // abu cerah
];

const INDONESIAN_LETTERS = 'AAAAAAEEEEEEIIIIIOOOOOOUUUUNNNNNRRRRRTTTTSSSSLLLLDDDKKKMMMGGGBBPPYYHHWWFFVVZZJJQQXX';

export function getRandomLetter(): string {
  const idx = Math.floor(Math.random() * INDONESIAN_LETTERS.length);
  return INDONESIAN_LETTERS[idx];
}

export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generatePuzzle(
  title: string,
  words: WordItem[],
  settings: PuzzleSettings
): GeneratedPuzzle {
  let size = Number(settings.gridSize);
  let sizeAdjustmentNote: string | undefined;

  // 1. Pilih acak sejumlah wordCount
  const shuffledWords = shuffleArray(words);
  const targetCount = Math.min(words.length, Math.max(8, Math.min(20, settings.wordCount)));
  let selected = shuffledWords.slice(0, targetCount);

  // 3. Periksa panjang kata terhadap ukuran kotak
  const maxWordLength = Math.max(...selected.map(w => w.clean.length), 0);
  if (maxWordLength > size) {
    if (maxWordLength <= 15 && size < 15) {
      size = 15;
      sizeAdjustmentNote = `Ukuran kotak disesuaikan otomatis menjadi 15×15 karena ada kata yang panjangnya lebih dari 12 huruf.`;
    } else if (maxWordLength <= 18 && size < 18) {
      size = 18;
      sizeAdjustmentNote = `Ukuran kotak disesuaikan otomatis menjadi 18×18 karena ada kata yang panjangnya lebih dari 15 huruf.`;
    } else {
      // Jika masih ada kata yang lebih panjang dari 18 (meskipun validasi max 14 huruf)
      size = Math.max(size, maxWordLength);
    }
  }

  // Tentukan arah kata yang aktif
  const directions: [number, number][] = [];
  const hasHoriz = settings.horizontal;
  const hasVert = settings.vertical;
  const hasDiag = settings.diagonal;
  const allowRev = settings.allowReverse;

  // Jika semua tidak dicentang, aktifkan minimal horizontal & vertical
  const safeHoriz = hasHoriz || (!hasHoriz && !hasVert && !hasDiag);
  const safeVert = hasVert || (!hasHoriz && !hasVert && !hasDiag);

  if (safeHoriz) {
    directions.push([0, 1]); // Kanan
    if (allowRev) directions.push([0, -1]); // Kiri
  }
  if (safeVert) {
    directions.push([1, 0]); // Bawah
    if (allowRev) directions.push([-1, 0]); // Atas
  }
  if (hasDiag) {
    directions.push([1, 1]);  // Menurun ke kanan
    directions.push([-1, 1]); // Menaik ke kanan
    if (allowRev) {
      directions.push([-1, -1]); // Menaik ke kiri
      directions.push([1, -1]);  // Menurun ke kiri
    }
  }

  // Urutkan kata dari yang terpanjang
  const sortedWords = [...selected].sort((a, b) => b.clean.length - a.clean.length);

  // Coba susun hingga 50 kali
  let bestResult: { grid: (string | null)[][]; placed: PlacedWord[]; unplaced: string[] } | null = null;

  for (let attempt = 0; attempt < 50; attempt++) {
    const grid: (string | null)[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => null)
    );
    const placed: PlacedWord[] = [];
    const unplaced: string[] = [];

    let colorIdx = 0;

    for (const item of sortedWords) {
      const cleanWord = item.clean;
      let wordPlaced = false;

      // Kumpulkan semua kemungkinan posisi awal dan acak
      const coords: [number, number][] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          coords.push([r, c]);
        }
      }
      const shuffledCoords = shuffleArray(coords);
      const shuffledDirs = shuffleArray(directions);

      for (const [r, c] of shuffledCoords) {
        if (wordPlaced) break;
        for (const [dr, dc] of shuffledDirs) {
          const endR = r + (cleanWord.length - 1) * dr;
          const endC = c + (cleanWord.length - 1) * dc;

          if (endR < 0 || endR >= size || endC < 0 || endC >= size) {
            continue;
          }

          let canPlace = true;
          const cells: [number, number][] = [];
          for (let i = 0; i < cleanWord.length; i++) {
            const curR = r + i * dr;
            const curC = c + i * dc;
            const existing = grid[curR][curC];
            if (existing !== null && existing !== cleanWord[i]) {
              canPlace = false;
              break;
            }
            cells.push([curR, curC]);
          }

          if (canPlace) {
            for (let i = 0; i < cleanWord.length; i++) {
              const curR = r + i * dr;
              const curC = c + i * dc;
              grid[curR][curC] = cleanWord[i];
            }

            placed.push({
              originalText: item.original,
              word: cleanWord,
              start: [r, c],
              end: [endR, endC],
              cells,
              color: HIGHLIGHT_COLORS[colorIdx % HIGHLIGHT_COLORS.length],
              found: false,
            });
            colorIdx++;
            wordPlaced = true;
            break;
          }
        }
      }

      if (!wordPlaced) {
        unplaced.push(item.original);
      }
    }

    if (!bestResult || placed.length > bestResult.placed.length) {
      bestResult = { grid, placed, unplaced };
    }

    if (unplaced.length === 0) {
      break;
    }
  }

  // 4. Isi sel kosong dengan huruf acak
  const finalGrid: string[][] = bestResult!.grid.map(row =>
    row.map(cell => (cell !== null ? cell : getRandomLetter()))
  );

  return {
    id: 'puz_' + Math.random().toString(36).substring(2, 9),
    title,
    grid: finalGrid,
    size,
    placedWords: bestResult!.placed,
    unplacedWords: bestResult!.unplaced,
    sizeAdjustmentNote,
  };
}
