import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts'
import { getDeforestHistory, getDeforestAlerts } from '../services/api'

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  fontSize: 13,
}

const STATE_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
]

export default function Deforestation() {
  const [history, setHistory] = useState([])
  const [alerts, setAlerts]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDeforestHistory(), getDeforestAlerts()])
      .then(([h, a]) => {
        setHistory(h.data.data)
        setAlerts(a.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  const maxYear = history.reduce((a, b) => a.area_km2 > b.area_km2 ? a : b, {})

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Monitoramento de Desmatamento</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Dados PRODES/INPE — Detecção por imagens Landsat e CBERS
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <InfoCard
          title="Total 2015–2024"
          value={history.reduce((s, h) => s + h.area_km2, 0).toLocaleString('pt-BR')}
          unit="km²"
          sub="Amazônia Legal"
          color="#f59e0b"
        />
        <InfoCard
          title="Pico de Desmatamento"
          value={maxYear.area_km2?.toLocaleString('pt-BR') || '—'}
          unit={`km² em ${maxYear.year}`}
          sub="Maior área registrada"
          color="var(--danger)"
        />
        <InfoCard
          title="Alertas (12 meses)"
          value={alerts?.total_km2.toLocaleString('pt-BR')}
          unit="km²"
          sub={`${alerts?.total_ha.toLocaleString('pt-BR')} hectares`}
          color="var(--accent)"
        />
        <InfoCard
          title="Estados com Alerta"
          value={alerts?.states.length}
          unit="estados"
          sub="Amazônia Legal"
          color="#a78bfa"
        />
      </div>

      {/* Annual chart */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)' }}>
          Desmatamento Anual — Amazônia Legal (km²) · Fonte: INPE PRODES
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={history} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid stroke="#1e3022" strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v.toLocaleString('pt-BR') + ' km²', 'Área']} />
            <Bar dataKey="area_km2" radius={[4, 4, 0, 0]} name="km²">
              {history.map((h, i) => (
                <Cell
                  key={i}
                  fill={h.area_km2 === maxYear.area_km2 ? '#ef4444' : h.area_km2 > 9000 ? '#f97316' : '#f59e0b'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* State alerts table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)' }}>
          Alertas por Estado — Últimos 12 meses
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['#', 'Estado', 'UF', 'Área (km²)', 'Percentual', 'Barra'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts?.states
                .sort((a, b) => b.area_km2 - a.area_km2)
                .map((s, i) => {
                  const pct = ((s.area_km2 / alerts.total_km2) * 100).toFixed(1)
                  return (
                    <tr key={s.uf} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{s.state}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{s.uf}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: STATE_COLORS[i] }}>{s.area_km2.toLocaleString('pt-BR')}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{pct}%</td>
                      <td style={{ padding: '10px 12px', minWidth: 120 }}>
                        <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: STATE_COLORS[i], borderRadius: 3 }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ title, value, unit, sub, color }) {
  return (
    <div style={{
      flex: 1, minWidth: 160,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '18px 20px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
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
