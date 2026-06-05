import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polygon, Tooltip, useMap } from 'react-leaflet'
import { getFireHotspots, getDeforestPolygons } from '../services/api'

const SEVERITY_COLOR = { critical: '#ef4444', high: '#f59e0b', medium: '#eab308' }

function FitBounds({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [20, 20] })
  }, [bounds, map])
  return null
}

export default function MapView() {
  const [fires, setFires]         = useState([])
  const [polygons, setPolygons]   = useState([])
  const [layer, setLayer]         = useState('both')
  const [days, setDays]           = useState(7)
  const [loading, setLoading]     = useState(false)

  const loadData = (d) => {
    setLoading(true)
    Promise.all([getFireHotspots(d), getDeforestPolygons()])
      .then(([f, p]) => {
        setFires(f.data.hotspots || [])
        setPolygons(p.data.polygons || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData(days) }, [days])

  const confidenceColor = (c) => c >= 85 ? '#ef4444' : c >= 70 ? '#f59e0b' : '#fcd34d'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 28, gap: 16 }}>
      {/* Header + controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Mapa de Monitoramento</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Queimadas e áreas de desmatamento detectadas por satélite</p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['fires', 'deforestation', 'both'].map(l => (
            <button key={l} onClick={() => setLayer(l)} style={btnStyle(layer === l)}>
              {{ fires: '🔥 Queimadas', deforestation: '🌳 Desmatamento', both: '⬛ Ambos' }[l]}
            </button>
          ))}
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}
          >
            {[3, 7, 14, 30].map(d => <option key={d} value={d}>{d} dias</option>)}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-muted)' }}>
        <LegendItem color="#ef4444" label="Alta confiança (≥85%)" />
        <LegendItem color="#f59e0b" label="Média confiança (70-84%)" />
        <LegendItem color="#fcd34d" label="Baixa confiança (<70%)" />
        <LegendItem color="#ef444488" label="Área crítica desmatamento" shape="square" />
        <LegendItem color="#f59e0b88" label="Alta severidade" shape="square" />
      </div>

      {loading && (
        <div style={{ position: 'absolute', top: 80, right: 40, background: 'var(--bg-elevated)', padding: '8px 14px', borderRadius: 6, fontSize: 13, zIndex: 1000 }}>
          Atualizando...
        </div>
      )}

      {/* Map */}
      <div style={{ flex: 1, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', minHeight: 480 }}>
        <MapContainer
          center={[-8, -55]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Fire markers */}
          {(layer === 'fires' || layer === 'both') && fires.map((f, i) => (
            <CircleMarker
              key={i}
              center={[f.lat, f.lon]}
              radius={f.confidence >= 85 ? 7 : 5}
              pathOptions={{
                color: confidenceColor(f.confidence),
                fillColor: confidenceColor(f.confidence),
                fillOpacity: 0.8,
                weight: 1,
              }}
            >
              <Tooltip>
                <div style={{ fontSize: 12 }}>
                  <b>Foco de Calor</b><br />
                  🌡️ Brilho: {f.brightness}K<br />
                  📊 Confiança: {f.confidence}%<br />
                  📅 Data: {f.date}<br />
                  🌿 Bioma: {f.biome}
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Deforestation polygons */}
          {(layer === 'deforestation' || layer === 'both') && polygons.map(p => {
            const coords = p.coordinates.map(([lng, lat]) => [lat, lng])
            return (
              <Polygon
                key={p.id}
                positions={coords}
                pathOptions={{
                  color: SEVERITY_COLOR[p.severity] || '#f59e0b',
                  fillColor: SEVERITY_COLOR[p.severity] || '#f59e0b',
                  fillOpacity: 0.3,
                  weight: 2,
                }}
              >
                <Tooltip>
                  <div style={{ fontSize: 12 }}>
                    <b>{p.name}</b><br />
                    📐 Área: {p.area_km2.toLocaleString('pt-BR')} km²<br />
                    ⚠️ Severidade: {p.severity}
                  </div>
                </Tooltip>
              </Polygon>
            )
          })}
        </MapContainer>
      </div>

      {/* Stats below map */}
      <div style={{ display: 'flex', gap: 12 }}>
        <MiniStat label="Focos detectados" value={fires.length} color="var(--danger)" />
        <MiniStat label="Alta confiança" value={fires.filter(f => f.confidence >= 85).length} color="#f59e0b" />
        <MiniStat label="Áreas de alerta" value={polygons.length} color="var(--accent)" />
        <MiniStat label="Área total alertas" value={`${polygons.reduce((s, p) => s + p.area_km2, 0).toLocaleString('pt-BR')} km²`} color="#a78bfa" />
      </div>
    </div>
  )
}

function btnStyle(active) {
  return {
    padding: '7px 14px',
    borderRadius: 6,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'var(--accent-dim)' : 'var(--bg-elevated)',
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
  }
}

function LegendItem({ color, label, shape = 'circle' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: shape === 'square' ? 12 : 10,
        height: shape === 'square' ? 12 : 10,
        borderRadius: shape === 'square' ? 2 : '50%',
        background: color,
      }} />
      {label}
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{
      flex: 1,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '12px 16px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
