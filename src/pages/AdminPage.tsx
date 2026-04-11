import { useState } from 'react'
import type { Bhajan, DeityTag } from '../types/bhajan'
import { DEITY_OPTIONS } from '../types/bhajan'

const EMPTY_BHAJAN: Omit<Bhajan, 'id'> = {
  title: '',
  deity: 'sai',
  occasion: '',
  difficulty: 1,
  audio: { clipUrl: '', fullUrl: '', clipDurationSec: 20 },
  lyrics: { original: '', transliteration: '', translation: '', lines: [] },
  deityImageUrl: 'images/deities/sai-baba.jpeg',
  round2LineIndex: 0,
  round3LineIndex: 1,
}

function parseLyricLines(transliteration: string) {
  return transliteration
    .split('\n')
    .filter((l) => l.trim())
    .map((line, index) => ({
      index,
      original: '',
      transliteration: line.trim(),
      words: line.trim().split(/\s+/),
    }))
}

export function AdminPage() {
  const [bhajan, setBhajan] = useState(EMPTY_BHAJAN)
  const [bhajansList, setBhajansList] = useState<Bhajan[]>([])
  const [scheduleEntries, setScheduleEntries] = useState<{ date: string; bhajanId: string }[]>([])
  const [newDate, setNewDate] = useState('')
  const [newBhajanId, setNewBhajanId] = useState('')
  const [exportedJson, setExportedJson] = useState('')

  const handleAddBhajan = () => {
    const lines = parseLyricLines(bhajan.lyrics.transliteration)
    const id = `bhajan-${String(bhajansList.length + 1).padStart(3, '0')}`
    const newBhajan: Bhajan = {
      ...bhajan,
      id,
      lyrics: {
        ...bhajan.lyrics,
        lines: lines.map((l, i) => ({
          ...l,
          original: bhajan.lyrics.original.split('\n')[i]?.trim() || '',
        })),
      },
      deityImageUrl: `images/deities/${bhajan.deity}.svg`,
    }
    setBhajansList((prev) => [...prev, newBhajan])
    setBhajan(EMPTY_BHAJAN)
  }

  const handleAddScheduleEntry = () => {
    if (newDate && newBhajanId) {
      setScheduleEntries((prev) => [...prev, { date: newDate, bhajanId: newBhajanId }])
      setNewDate('')
      setNewBhajanId('')
    }
  }

  const handleExport = () => {
    const bhajansJson = JSON.stringify(bhajansList, null, 2)
    const scheduleJson = JSON.stringify(
      {
        schedule: scheduleEntries,
        fallbackBhajanId: bhajansList[0]?.id || 'bhajan-001',
      },
      null,
      2
    )
    setExportedJson(`// bhajans.json\n${bhajansJson}\n\n// schedule.json\n${scheduleJson}`)
  }

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 py-6 px-4 space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-gray-800">Admin Panel</h1>

      {/* Add Bhajan Form */}
      <div className="bg-white rounded-2xl p-5 shadow-md space-y-4">
        <h2 className="text-lg font-bold text-gray-700">Add Bhajan</h2>

        <label className="block">
          <span className="text-sm font-semibold text-gray-600">Title</span>
          <input
            type="text"
            value={bhajan.title}
            onChange={(e) => setBhajan({ ...bhajan, title: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
            placeholder="Sundara Sundara Vinayaka"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-600">Deity</span>
          <select
            value={bhajan.deity}
            onChange={(e) => setBhajan({ ...bhajan, deity: e.target.value as DeityTag })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
          >
            {DEITY_OPTIONS.map((d) => (
              <option key={d.tag} value={d.tag}>{d.displayName}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-600">Occasion</span>
          <input
            type="text"
            value={bhajan.occasion}
            onChange={(e) => setBhajan({ ...bhajan, occasion: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
            placeholder="Ganesh Chaturthi / Satsang"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-600">Audio Clip Path</span>
          <input
            type="text"
            value={bhajan.audio.clipUrl}
            onChange={(e) => setBhajan({ ...bhajan, audio: { ...bhajan.audio, clipUrl: e.target.value } })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
            placeholder="audio/clips/bhajan-001-clip.mp3"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-600">Full Bhajan URL (sairhythms link)</span>
          <input
            type="text"
            value={bhajan.audio.fullUrl}
            onChange={(e) => setBhajan({ ...bhajan, audio: { ...bhajan.audio, fullUrl: e.target.value } })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
            placeholder="https://sairhythms.sathyasai.org/song/..."
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-600">Lyrics (Original Script, one line per line)</span>
          <textarea
            value={bhajan.lyrics.original}
            onChange={(e) => setBhajan({ ...bhajan, lyrics: { ...bhajan.lyrics, original: e.target.value } })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
            rows={5}
            placeholder="सुन्दर सुन्दर विनायक&#10;शुभ मंगल दायक विनायक"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-600">Transliteration (one line per line)</span>
          <textarea
            value={bhajan.lyrics.transliteration}
            onChange={(e) => setBhajan({ ...bhajan, lyrics: { ...bhajan.lyrics, transliteration: e.target.value } })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
            rows={5}
            placeholder="Sundara Sundara Vinayaka&#10;Shubha Mangala Dayaka Vinayaka"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-gray-600">English Translation</span>
          <textarea
            value={bhajan.lyrics.translation}
            onChange={(e) => setBhajan({ ...bhajan, lyrics: { ...bhajan.lyrics, translation: e.target.value } })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
            rows={3}
            placeholder="Victory to Lord Ganesha..."
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-gray-600">Round 2 Line #</span>
            <input
              type="number"
              min={0}
              value={bhajan.round2LineIndex}
              onChange={(e) => setBhajan({ ...bhajan, round2LineIndex: Number(e.target.value) })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-gray-600">Round 3 Line #</span>
            <input
              type="number"
              min={0}
              value={bhajan.round3LineIndex}
              onChange={(e) => setBhajan({ ...bhajan, round3LineIndex: Number(e.target.value) })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
            />
          </label>
        </div>

        {/* Preview parsed lines */}
        {bhajan.lyrics.transliteration && (
          <div className="p-3 bg-gray-50 rounded-xl text-sm">
            <p className="font-semibold text-gray-600 mb-2">Parsed Lines Preview:</p>
            {parseLyricLines(bhajan.lyrics.transliteration).map((line, i) => (
              <p key={i} className="text-gray-700">
                <span className="text-gray-400">Line {i}:</span> [{line.words.join(', ')}]
              </p>
            ))}
          </div>
        )}

        <button
          onClick={handleAddBhajan}
          disabled={!bhajan.title || !bhajan.lyrics.transliteration}
          className="w-full py-3 bg-saffron-500 text-white font-bold rounded-xl disabled:opacity-50"
        >
          Add Bhajan to Queue
        </button>
      </div>

      {/* Queue */}
      {bhajansList.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-md space-y-3">
          <h2 className="text-lg font-bold text-gray-700">Bhajan Queue ({bhajansList.length})</h2>
          {bhajansList.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-semibold text-sm text-gray-800">{b.title}</p>
                <p className="text-xs text-gray-500">{b.id} · {b.deity}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule */}
      <div className="bg-white rounded-2xl p-5 shadow-md space-y-3">
        <h2 className="text-lg font-bold text-gray-700">Schedule</h2>
        <div className="flex gap-2">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm"
          />
          <select
            value={newBhajanId}
            onChange={(e) => setNewBhajanId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm"
          >
            <option value="">Select bhajan</option>
            {bhajansList.map((b) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
          <button
            onClick={handleAddScheduleEntry}
            disabled={!newDate || !newBhajanId}
            className="px-4 py-2 bg-saffron-500 text-white rounded-xl text-sm font-bold disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {scheduleEntries.map((s, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
            <span className="text-gray-600">{s.date}</span>
            <span className="font-semibold text-gray-800">{s.bhajanId}</span>
          </div>
        ))}
      </div>

      {/* Export */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={bhajansList.length === 0}
            className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl disabled:opacity-50"
          >
            Preview JSON
          </button>
          <button
            onClick={() => handleDownload('bhajans.json', JSON.stringify(bhajansList, null, 2))}
            disabled={bhajansList.length === 0}
            className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl disabled:opacity-50"
          >
            Download bhajans.json
          </button>
        </div>
        <button
          onClick={() =>
            handleDownload(
              'schedule.json',
              JSON.stringify({ schedule: scheduleEntries, fallbackBhajanId: bhajansList[0]?.id || 'bhajan-001' }, null, 2)
            )
          }
          disabled={scheduleEntries.length === 0}
          className="w-full py-3 bg-green-600 text-white font-bold rounded-xl disabled:opacity-50"
        >
          Download schedule.json
        </button>
      </div>

      {exportedJson && (
        <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs overflow-auto max-h-96">
          {exportedJson}
        </pre>
      )}
    </div>
  )
}
