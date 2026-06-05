import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, BarChart, Bar, Cell
} from 'recharts'
import { getAnnualEmissions, calculateEmissions, getBiomeBiomass } from '../services/api'

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  fontSize: 13,
}

const BIOME_LABELS = {
  amazonia: 'Amazônia',
  cerrado: 'Cerrado',
  caatinga: 'Caatinga',
  mata_atlantica: 'Mata Atlântica',
  pampa: 'Pampa',
  pantanal: 'Pantanal',
}

export default function Carbon() {
  const [emissions, setEmissions]   = useState([])
  const [biomes, setBiomes]         = useState([])
  const [area, setArea]             = useState(1000)
  const [biome, setBiome]           = useState('amazonia')
  const [calc, setCalc]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [calcLoading, setCalcLoading] = useState(false)

  useEffect(() => {
    Promise.all([getAnnualEmissions(), getBiomeBiomass()])
      .then(([e, b]) => {
        setEmissions(e.data.data)
        setBiomes(b.data.biomes)
      })
      .finally(() => setLoading(false))
  }, [])

  const runCalc = () => {
    setCalcLoading(true)
    calculateEmissions(area, biome)
      .then(r => setCalc(r.data))
      .finally(() => setCalcLoading(false))
  }

  if (loading) return <Loading />

  const peakYear = emissions.reduce((a, b) => a.MtCO2e > b.MtCO2e ? a : b, {})

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Emissões de CO₂</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Estimativas baseadas em SEEG / MapBiomas · Metodologia IPCC 2006
        </p>
      </div>

      {/* Annual chart */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)' }}>
          Emissões Anuais por Desmatamento — Amazônia (Mt CO₂e)
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={emissions} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e3022" strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v.toLocaleString('pt-BR') + ' Mt CO₂e', 'Emissões']} />
            <ReferenceLine y={peakYear.MtCO2e} stroke="#ef444450" strokeDasharray="4 4" label={{ value: `Pico: ${peakYear.year}`, fill: '#ef4444', fontSize: 11 }} />
            <Line type="monotone" dataKey="MtCO2e" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Calculator + Biome table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Calculator */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)' }}>
            Calculadora de Emissões
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ fontSize: 13 }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>Área desmatada (hectares)</div>
              <input
                type="number"
                value={area}
                min={1}
                onChange={e => setArea(Number(e.target.value))}
                style={{
                  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 14,
                }}
              />
            </label>

            <label style={{ fontSize: 13 }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>Bioma</div>
              <select
                value={biome}
                onChange={e => setBiome(e.target.value)}
                style={{
                  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontSize: 14,
                }}
              >
                {Object.entries(BIOME_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>

            <button
              onClick={runCalc}
              disabled={calcLoading}
              style={{
                background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                color: 'var(--accent)', borderRadius: 6, padding: '10px 16px',
                fontWeight: 600, cursor: 'pointer', fontSize: 14,
              }}
            >
              {calcLoading ? 'Calculando...' : 'Calcular Emissões'}
            </button>

            {calc && (
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ResultRow label="Área analisada" value={`${calc.area_ha.toLocaleString('pt-BR')} ha`} />
                <ResultRow label="Biomassa total" value={`${calc.biomass_tC_per_ha} tC/ha`} />
                <ResultRow label="Carbono removido" value={`${calc.total_biomass_tC.toLocaleString('pt-BR')} tC`} />
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <ResultRow
                    label="Emissões CO₂e"
                    value={`${calc.co2_emissions_t.toLocaleString('pt-BR')} t`}
                    highlight
                  />
                </div>
                <ResultRow label="Equivalente a" value={`${calc.trees_equivalent.toLocaleString('pt-BR')} árvores`} />
                <ResultRow label="Equivalente a" value={`${calc.cars_equivalent_year.toLocaleString('pt-BR')} carros/ano`} />
              </div>
            )}
          </div>
        </div>

        {/* Biome biomass */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-muted)' }}>
            Estoque de Carbono por Bioma (tCO₂/ha)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={biomes} layout="vertical" margin={{ top: 0, right: 16, left: 60, bottom: 0 }}>
              <CartesianGrid stroke="#1e3022" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="biome"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={v => BIOME_LABELS[v] || v}
                width={56}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v) => [v.toFixed(1) + ' tCO₂/ha', 'Carbono']}
                labelFormatter={v => BIOME_LABELS[v] || v}
              />
              <Bar dataKey="tCO2_ha" radius={[0, 4, 4, 0]}>
                {biomes.map((_, i) => (
                  <Cell key={i} fill={`hsl(${140 - i * 20}, 60%, ${45 + i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            Valores de biomassa (acima do solo + raízes + carbono orgânico do solo)<br />
            Fonte: IPCC 2006 Guidelines, Vol. 4 Agriculture, Forestry
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: highlight ? 16 : 13, fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--accent)' : 'var(--text)' }}>
        {value}
      </span>
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
