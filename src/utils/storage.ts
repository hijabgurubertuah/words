import { SavedPuzzle } from '../types';

const STORAGE_KEY = 'word_search_puzzles_v1';

export const DEFAULT_PUZZLES: SavedPuzzle[] = [
  {
    id: 'sample-rainforest',
    title: 'Rainforest Wildlife',
    description: 'Discover fascinating creatures dwelling in lush tropical rainforest canopies, jungle floors, and rivers.',
    words: [
      'JAGUAR', 'TOUCAN', 'ANACONDA', 'SLOTH', 'CHAMELEON',
      'PIRANHA', 'MACAW', 'OCELOT', 'TREEFROG', 'CAPYBARA',
      'ARMADILLO', 'GORILLA', 'HORNBILL', 'IGUANA', 'TAPIR',
      'LEMUR'
    ],
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'sample-space',
    title: 'Solar System & Cosmos',
    description: 'A stellar exploration of planets, cosmic phenomena, and deep space exploration.',
    words: [
      'MERCURY', 'VENUS', 'EARTH', 'MARS', 'JUPITER',
      'SATURN', 'URANUS', 'NEPTUNE', 'ASTEROID', 'COMET',
      'NEBULA', 'SUPERNOVA', 'GALAXY', 'TELESCOPE', 'ECLIPSE'
    ],
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'sample-culinary',
    title: 'Indonesian Culinary Heritage',
    description: 'Iconic traditional dishes, rich spices, and beloved street food delights from across the archipelago.',
    words: [
      'RENDANG', 'SATEAYAM', 'NASIGORENG', 'GADOGADO', 'SOTOBETAWI',
      'BAKSO', 'PEMPEK', 'RAWON', 'MARTABAK', 'GUDEG',
      'KLEPON', 'LONTONG', 'AYAMBETUTU', 'OPORAYAM', 'SERABI'
    ],
    createdAt: Date.now() - 86400000 * 1,
  }
];

export function loadSavedPuzzles(): SavedPuzzle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PUZZLES));
      return DEFAULT_PUZZLES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PUZZLES));
    return DEFAULT_PUZZLES;
  } catch {
    return DEFAULT_PUZZLES;
  }
}

export function savePuzzleToStorage(puzzle: Omit<SavedPuzzle, 'id' | 'createdAt'>): SavedPuzzle {
  const puzzles = loadSavedPuzzles();
  const newPuzzle: SavedPuzzle = {
    ...puzzle,
    id: 'pz_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    createdAt: Date.now(),
  };
  const updated = [newPuzzle, ...puzzles];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newPuzzle;
}

export function deletePuzzleFromStorage(id: string): SavedPuzzle[] {
  const puzzles = loadSavedPuzzles();
  const updated = puzzles.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function updatePuzzleLastPlayed(id: string) {
  const puzzles = loadSavedPuzzles();
  const updated = puzzles.map(p => (p.id === id ? { ...p, lastPlayedAt: Date.now() } : p));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
