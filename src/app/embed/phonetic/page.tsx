// Minimal embeddable phonetic-alphabet reference (server-rendered, static).
const ALPHA: Array<[string, string]> = [
  ['A', 'Alpha'], ['B', 'Bravo'], ['C', 'Charlie'], ['D', 'Delta'], ['E', 'Echo'], ['F', 'Foxtrot'],
  ['G', 'Golf'], ['H', 'Hotel'], ['I', 'India'], ['J', 'Juliett'], ['K', 'Kilo'], ['L', 'Lima'],
  ['M', 'Mike'], ['N', 'November'], ['O', 'Oscar'], ['P', 'Papa'], ['Q', 'Quebec'], ['R', 'Romeo'],
  ['S', 'Sierra'], ['T', 'Tango'], ['U', 'Uniform'], ['V', 'Victor'], ['W', 'Whiskey'], ['X', 'X-ray'],
  ['Y', 'Yankee'], ['Z', 'Zulu'],
]
const NUM: Array<[string, string]> = [['3', 'Tree'], ['5', 'Fife'], ['9', 'Niner']]

export default function EmbedPhonetic() {
  return (
    <div className="p-4 max-w-md mx-auto font-sans">
      <div className="text-sm font-semibold text-gray-900 mb-3">Phonetic alphabet</div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mb-3">
        {ALPHA.map(([l, w]) => (
          <div key={l} className="border border-gray-200 rounded px-2 py-1 text-xs">
            <span className="font-mono font-bold text-gray-900">{l}</span> <span className="text-gray-600">{w}</span>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500 mb-3">On the radio: {NUM.map(([n, w]) => `${n} = ${w}`).join(' · ')}</div>
      <a href="https://clearsparradio.binnacleai.com/?utm_source=embed&utm_medium=phonetic" target="_blank" rel="noopener" className="block text-center text-[11px] text-gray-400 hover:text-gray-600">Powered by Clearspar Radio Trainer — practice radio calls →</a>
    </div>
  )
}
