import { useEffect, useState } from 'react'
import { Flame, TreePine, Wind, AlertTriangle } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import StatCard from './StatCard'
import { getDashboard, getDeforestHistory, getAnnualEmissions } from '../services/api'

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  fontSize: 13,
}

export default function Dashboard() {
  const [summary, setSummary]       = useState(null)
  const [history, setHistory]       = useState([])
  const [emissions, setEmissions]   = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([getDashboard(), getDeforestHistory(), getAnnualEmissions()])
      .then(([d, h, e]) => {
        setSummary(d.data)
        setHistory(h.data.data)
        setEmissions(e.data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Visão Geral</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Monitoramento em tempo real — Amazônia & Biomas Brasileiros
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatCard
          title="Focos de Calor (7 dias)"
          value={summary.fires_last_7_days}
          sub={`${summary.high_confidence_fires} alta confiança`}
          color="var(--danger)"
          Icon={Flame}
        />
        <StatCard
          title="Desmatamento (12 meses)"
          value={summary.deforestation_km2_12m.toLocaleString('pt-BR')}
          unit="km²"
          sub={`${(summary.deforestation_ha_12m).toLocaleString('pt-BR')} hectares`}
          color="var(--warn)"
          Icon={TreePine}
        />
        <StatCard
          title={`Emissões CO₂ (${summary.carbon_year})`}
          value={summary.carbon_MtCO2e_latest.toLocaleString('pt-BR')}
          unit="Mt CO₂e"
          sub="Estimativa SEEG/MapBiomas"
          color="var(--accent)"
          Icon={Wind}
        />
        <StatCard
          title="Alertas Ativos"
          value={10}
          sub="Estados monitorados"
          color="#a78bfa"
          Icon={AlertTriangle}
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="Desmatamento Anual — Amazônia (km²)">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={history} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="defGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e3022" strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="area_km2" stroke="#f59e0b" fill="url(#defGrad)" strokeWidth={2} name="km²" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Emissões de CO₂ — Amazônia (Mt CO₂e)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={emissions} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#1e3022" strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="MtCO2e" fill="#22c55e" radius={[4, 4, 0, 0]} name="Mt CO₂e" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)' }}>{title}</h3>
      {children}
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
