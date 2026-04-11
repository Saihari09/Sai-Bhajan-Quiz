export type DeityTag =
  | 'allah' | 'anjaneya' | 'ayyappa' | 'buddha' | 'devi'
  | 'ganesha' | 'gayathri' | 'guru' | 'jesus' | 'krishna'
  | 'narasimha' | 'narayana' | 'rama' | 'sai' | 'sarva-dharma'
  | 'shiva' | 'subrahmanya' | 'vittala'

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
  { tag: 'allah', displayName: 'Allah', imageUrl: 'images/deities/allah.jpg' },
  { tag: 'anjaneya', displayName: 'Anjaneya', imageUrl: 'images/deities/hanuman.jpeg' },
  { tag: 'ayyappa', displayName: 'Ayyappa', imageUrl: 'images/deities/ayyappa.jpg' },
  { tag: 'buddha', displayName: 'Buddha', imageUrl: 'images/deities/buddha.jpeg' },
  { tag: 'devi', displayName: 'Devi', imageUrl: 'images/deities/Devi.jpg' },
  { tag: 'ganesha', displayName: 'Ganesha', imageUrl: 'images/deities/ganesha.jpg' },
  { tag: 'gayathri', displayName: 'Gayathri', imageUrl: 'images/deities/Gayathri.jpeg' },
  { tag: 'guru', displayName: 'Guru', imageUrl: 'images/deities/Guru.jpeg' },
  { tag: 'jesus', displayName: 'Jesus', imageUrl: 'images/deities/Jesus.jpeg' },
  { tag: 'krishna', displayName: 'Krishna', imageUrl: 'images/deities/krishna.jpg' },
  { tag: 'narasimha', displayName: 'Narasimha', imageUrl: 'images/deities/Narasimha.jpeg' },
  { tag: 'narayana', displayName: 'Narayana', imageUrl: 'images/deities/narayana.jpg' },
  { tag: 'rama', displayName: 'Rama', imageUrl: 'images/deities/rama.jpg' },
  { tag: 'sai', displayName: 'Sai', imageUrl: 'images/deities/sai-baba.jpeg' },
  { tag: 'sarva-dharma', displayName: 'Sarva Dharma', imageUrl: 'images/deities/Sarva_Dharma.jpg' },
  { tag: 'shiva', displayName: 'Shiva', imageUrl: 'images/deities/shiva.jpg' },
  { tag: 'subrahmanya', displayName: 'Subrahmanya', imageUrl: 'images/deities/Subrahmanya.jpeg' },
  { tag: 'vittala', displayName: 'Vittala', imageUrl: 'images/deities/vittala.jpg' },
]

export interface Schedule {
  schedule: { date: string; bhajanId: string }[]
  fallbackBhajanId: string
}
