import { Flame, TreePine, Wind, LayoutDashboard, Satellite, Map } from 'lucide-react'

const NAV = [
  { id: 'dashboard',     label: 'Dashboard',      Icon: LayoutDashboard },
  { id: 'map',           label: 'Mapa ao Vivo',   Icon: Map },
  { id: 'fires',         label: 'Queimadas',       Icon: Flame },
  { id: 'deforestation', label: 'Desmatamento',    Icon: TreePine },
  { id: 'carbon',        label: 'Emissões CO₂',    Icon: Wind },
]

export default function Sidebar({ active, onChange }) {
  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 28px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Satellite size={26} color="var(--accent)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>GreenSky</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Monitoramento Ambiental</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ marginTop: 16, flex: 1 }}>
        {NAV.map(({ id, label, Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 20px',
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                border: 'none',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: '16px 20px', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
        Dados: INPE · NASA FIRMS · SEEG
      </div>
    </aside>
  )
}
