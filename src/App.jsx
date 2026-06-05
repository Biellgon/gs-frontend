import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import MapView from './components/MapView'
import Fires from './components/Fires'
import Deforestation from './components/Deforestation'
import Carbon from './components/Carbon'

const VIEWS = {
  dashboard: Dashboard,
  map: MapView,
  fires: Fires,
  deforestation: Deforestation,
  carbon: Carbon,
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const View = VIEWS[page] || Dashboard

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar active={page} onChange={setPage} />
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-base)' }}>
        <View />
      </main>
    </div>
  )
}
