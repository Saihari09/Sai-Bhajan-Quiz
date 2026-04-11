export type DeityTag = 'sai-baba' | 'krishna' | 'rama' | 'shiva' | 'ganesha' | 'hanuman'

export interface LyricLine {
  index: number
  original: string
  transliteration: string
  words: string[]
}

export type DifficultyLevel = 1 | 2 | 3

export interface Bhajan {
  id: string
  title: string
  deity: DeityTag
  occasion: string
  difficulty: DifficultyLevel
  audio: {
    clipUrl: string
    fullUrl: string
    clipDurationSec: number
  }
  lyrics: {
    original: string
    transliteration: string
    translation: string
    lines: LyricLine[]
  }
  deityImageUrl: string
  round2LineIndex: number
  round3LineIndex: number
}

export interface DeityOption {
  tag: DeityTag
  displayName: string
  imageUrl: string
}

export const DEITY_OPTIONS: DeityOption[] = [
  { tag: 'sai-baba', displayName: 'Sai Baba', imageUrl: '/images/deities/sai-baba.jpeg' },
  { tag: 'krishna', displayName: 'Krishna', imageUrl: '/images/deities/krishna.jpg' },
  { tag: 'rama', displayName: 'Rama', imageUrl: '/images/deities/rama.jpg' },
  { tag: 'shiva', displayName: 'Shiva', imageUrl: '/images/deities/shiva.jpg' },
  { tag: 'ganesha', displayName: 'Ganesha', imageUrl: '/images/deities/ganesha.jpg' },
  { tag: 'hanuman', displayName: 'Hanuman', imageUrl: '/images/deities/hanuman.jpeg' },
]

export interface Schedule {
  schedule: { date: string; bhajanId: string }[]
  fallbackBhajanId: string
}
