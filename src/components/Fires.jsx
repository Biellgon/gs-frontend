import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie, Legend
} from 'recharts'
import { getFireHotspots, getFireSummary } from '../services/api'

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  fontSize: 13,
}

const BIOME_COLORS = {
  amazonia: '#22c55e',
  cerrado: '#f59e0b',
  caatinga: '#ef4444',
  mata_atlantica: '#10b981',
  pampa: '#3b82f6',
  pantanal: '#8b5cf6',
}

const BIOME_LABELS = {
  amazonia: 'Amazônia',
  cerrado: 'Cerrado',
  caatinga: 'Caatinga',
  mata_atlantica: 'Mata Atlântica',
  pampa: 'Pampa',
  pantanal: 'Pantanal',
}

export default function Fires() {
  const [hotspots, setHotspots] = useState(null)
  const [summary, setSummary]   = useState(null)
  const [days, setDays]         = useState(7)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getFireHotspots(days), getFireSummary()])
      .then(([h, s]) => {
        setHotspots(h.data)
        setSummary(s.data)
      })
      .finally(() => setLoading(false))
  }, [days])

  if (loading) return <Loading />

  const byDate = {}
  for (const f of hotspots.hotspots) {
    byDate[f.date] = (byDate[f.date] || 0) + 1
  }
  const dateData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: date.slice(5), count }))

  const byBiome = Object.entries(summary.by_biome).map(([biome, count]) => ({
    name: BIOME_LABELS[biome] || biome,
    value: count,
    fill: BIOME_COLORS[biome] || '#888',
  }))

  const confLevels = [
    { name: 'Alta (≥85%)', count: hotspots.high_confidence,   fill: '#ef4444' },
    { name: 'Média (70–84%)', count: hotspots.medium_confidence, fill: '#f59e0b' },
    { name: 'Baixa (<70%)',  count: hotspots.low_confidence,   fill: '#fcd34d' },
  ]

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Análise de Queimadas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Focos de calor detectados por VIIRS/SNPP e MODIS · Dados NASA FIRMS
          </p>
        </div>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '8px 12px', fontSize: 13 }}
        >
          {[3, 7, 14, 30].map(d => <option key={d} value={d}>Últimos {d} dias</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Total de focos', value: hotspots.total, color: 'var(--danger)' },
          { label: 'Alta confiança', value: hotspots.high_confidence, color: '#f97316' },
          { label: 'Média confiança', value: hotspots.medium_confidence, color: '#f59e0b' },
          { label: 'Temperatura média', value: `${summary.avg_brightness}K`, color: 'var(--accent)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            flex: 1, minWidth: 140, background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '16px 20px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)' }}>Focos por Data</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dateData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#1e3022" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} name="Focos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)' }}>Distribuição por Bioma (30 dias)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byBiome} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {byBiome.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confidence levels */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)' }}>Níveis de Confiança de Detecção</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {confLevels.map(c => (
            <div key={c.name} style={{ flex: 1, minWidth: 140 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: c.fill }}>{c.name}</span>
                <span style={{ fontWeight: 600 }}>{c.count}</span>
              </div>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${hotspots.total ? (c.count / hotspots.total) * 100 : 0}%`,
                  background: c.fill,
                  borderRadius: 4,
                  transition: 'width 0.5s',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hotspot table (last 10) */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)' }}>Focos Recentes (alta confiança)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Latitude', 'Longitude', 'Temperatura (K)', 'Confiança', 'Data', 'Bioma'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hotspots.hotspots
                .filter(f => f.confidence >= 85)
                .slice(0, 10)
                .map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '9px 12px' }}>{f.lat.toFixed(4)}</td>
                    <td style={{ padding: '9px 12px' }}>{f.lon.toFixed(4)}</td>
                    <td style={{ padding: '9px 12px', color: '#ef4444', fontWeight: 600 }}>{f.brightness}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{ background: '#ef444422', color: '#ef4444', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>
                        {f.confidence}%
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', color: 'var(--text-muted)' }}>{f.date}</td>
                    <td style={{ padding: '9px 12px', color: BIOME_COLORS[f.biome] }}>{BIOME_LABELS[f.biome] || f.biome}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
      Carregando dados...
    </div>
  )
}
