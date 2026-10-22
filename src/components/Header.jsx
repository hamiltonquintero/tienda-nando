import React from 'react';
import { ShoppingBag, Users, Package, BarChart3, Settings, ShieldCheck, Calendar } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  activeAdmin, 
  onSwitchAdminClick,
  currentPeriod,
  totalPendingDebt,
  cartCount
}) {
  return (
    <header className="app-header">
      {/* Brand */}
      <div className="brand-section">
        <img 
          src="/logo.jpg" 
          alt="Surtimueve más" 
          className="brand-logo-badge"
        />
        <div className="brand-text-block">
          <div className="brand-name">
            <span style={{ color: '#38bdf8' }}>Surtimue</span>
            <span style={{ color: '#f97316', fontWeight: 900 }}>V</span>
            <span style={{ color: '#38bdf8' }}>e</span>
            <span style={{ color: '#f97316', marginLeft: '5px' }}>más</span>
          </div>
          <div className="brand-slogan">
            ¡Todo lo que buscas y algo más! <span className="desktop-only">• Atendido por su propietario</span>
          </div>
        </div>
      </div>

      {/* Navigation for Desktop */}
      <nav className="nav-tabs">
        <button 
          className={`nav-tab-btn ${activeTab === 'pos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pos')}
        >
          <ShoppingBag size={18} />
          <span>Vender {cartCount > 0 && `(${cartCount})`}</span>
        </button>

        <button 
          className={`nav-tab-btn ${activeTab === 'fiao' ? 'active' : ''}`}
          onClick={() => setActiveTab('fiao')}
        >
          <Users size={18} />
          <span>Cuentas por Cobrar</span>
          {totalPendingDebt > 0 && (
            <span style={{ 
              background: '#ea580c', 
              color: '#fff', 
              borderRadius: '999px', 
              padding: '1px 6px', 
              fontSize: '0.7rem' 
            }}>
              !
            </span>
          )}
        </button>

        <button 
          className={`nav-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Package size={18} />
          <span>Inventario</span>
        </button>

        <button 
          className={`nav-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <BarChart3 size={18} />
          <span>Quincena & Caja</span>
        </button>

        <button 
          className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          <span>Ajustes</span>
        </button>
      </nav>

      {/* Right side: Period badge & Admin pill */}
      <div className="admin-badge-container">
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            color: 'var(--text-muted)', 
            fontSize: '0.8rem',
            fontWeight: 600,
            background: '#f1f5f9',
            padding: '6px 12px',
            borderRadius: '999px',
            border: '1px solid var(--border-subtle)'
          }}
          className="desktop-only"
        >
          <Calendar size={14} color="#0284c7" />
          <span>{currentPeriod.name}</span>
        </div>

        <button 
          className="admin-pill" 
          onClick={onSwitchAdminClick}
          title="Cambiar Administrador activo"
        >
          <span className="admin-dot" />
          <ShieldCheck size={15} />
          <span>{activeAdmin.name.split(' ')[0]}</span>
        </button>
      </div>
    </header>
  );
}
