import React from 'react';
import { ShoppingBag, Users, Package, BarChart3, Settings, ShieldCheck, Calendar, Inbox, Share2, LogOut } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  activeAdmin, 
  onSwitchAdminClick,
  onLogout,
  currentPeriod,
  totalPendingDebt,
  cartCount,
  pendingOrdersCount = 0,
  onOpenOrdersInbox,
  onOpenShareCatalog
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

        {/* Botón Catálogo Digital directamente en la barra principal */}
        <button 
          type="button"
          className="nav-tab-btn"
          style={{ 
            background: '#ecfdf5', 
            color: '#059669', 
            border: '1.5px solid #a7f3d0', 
            fontWeight: 700 
          }}
          onClick={onOpenShareCatalog}
          title="Compartir enlace del Catálogo Digital con la oficina"
        >
          <Share2 size={18} color="#059669" />
          <span>Catálogo Digital</span>
        </button>
      </nav>

      {/* Right side: Orders inbox, Share catalog, Period badge & Admin pill */}
      <div className="admin-badge-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Botón Bandeja de Pedidos */}
        <button 
          type="button"
          onClick={onOpenOrdersInbox}
          style={{
            position: 'relative',
            padding: '7px 12px',
            borderRadius: '999px',
            border: pendingOrdersCount > 0 ? '1.5px solid #ea580c' : '1px solid #cbd5e1',
            background: pendingOrdersCount > 0 ? '#fff7ed' : '#ffffff',
            color: pendingOrdersCount > 0 ? '#ea580c' : 'var(--text-muted)',
            fontSize: '0.8rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Bandeja de pedidos del catálogo digital"
        >
          <Inbox size={15} color={pendingOrdersCount > 0 ? '#ea580c' : 'currentColor'} />
          <span className="desktop-only">Pedidos</span>
          {pendingOrdersCount > 0 && (
            <span style={{
              background: '#ea580c',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 900,
              borderRadius: '999px',
              padding: '1px 7px',
              lineHeight: 1.2
            }}>
              {pendingOrdersCount}
            </span>
          )}
        </button>

        {/* Botón Compartir Catálogo */}
        <button
          type="button"
          onClick={onOpenShareCatalog}
          style={{
            padding: '7px 12px',
            borderRadius: '999px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: 'var(--brand-blue)',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer'
          }}
          title="Compartir enlace del Catálogo Digital"
        >
          <Share2 size={14} />
          <span className="desktop-only">Catálogo</span>
        </button>

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

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 12px',
              borderRadius: '999px',
              border: '1.5px solid #fecaca',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Cerrar sesión de administrador y regresar al Catálogo"
          >
            <LogOut size={14} />
            <span>Salir</span>
          </button>
        )}
      </div>
    </header>
  );
}
