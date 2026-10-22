import React, { useState } from 'react';
import { ShoppingBag, Users, Package, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { useStore } from './data/store';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import POS from './components/POS';
import DebtorsLedger from './components/DebtorsLedger';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import Settings from './components/Settings';
import PinModal from './components/PinModal';

export default function App() {
  const store = useStore();
  const [activeTab, setActiveTab] = useState('pos');
  const [cart, setCart] = useState([]);
  const [pinModalState, setPinModalState] = useState({ isOpen: false, targetAdmin: null });

  // ── Pantalla de carga inicial ──────────────────────────────
  if (store.loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-main)', gap: '16px',
        fontFamily: 'var(--font-main)'
      }}>
        <img src="/logo.png" alt="Surtimueve" style={{ width: '72px', height: '72px', borderRadius: '16px', objectFit: 'cover' }} />
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Cargando Surtimueve más…
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Conectando con la base de datos</div>
        <div style={{
          width: '180px', height: '4px', borderRadius: '999px',
          background: '#e2e8f0', overflow: 'hidden', marginTop: '4px'
        }}>
          <div style={{
            height: '100%', width: '40%', borderRadius: '999px',
            background: 'var(--brand-blue)',
            animation: 'loadingBar 1.2s ease-in-out infinite alternate'
          }} />
        </div>
        <style>{`
          @keyframes loadingBar {
            from { transform: translateX(-100%); }
            to   { transform: translateX(340%); }
          }
        `}</style>
      </div>
    );
  }

  // ── Error de conexión ──────────────────────────────────────
  if (store.error) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f8fafc', padding: '24px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px',
          padding: '36px', maxWidth: '460px', width: '100%',
          boxShadow: '0 12px 28px rgba(0,0,0,0.08)', textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📡</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '10px' }}>
            Sin conexión con la base de datos
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, marginBottom: '20px' }}>
            No se pudo conectar con Supabase. Verifica que el dispositivo tenga internet y que las variables de entorno estén configuradas correctamente.
          </p>
          <details style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', marginBottom: '20px', textAlign: 'left', fontSize: '0.76rem', color: '#991b1b' }}>
            <summary style={{ fontWeight: 700, cursor: 'pointer' }}>Detalle del error</summary>
            <code style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', display: 'block', marginTop: '6px' }}>{store.error}</code>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 28px', borderRadius: '10px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Calculate total pending debt for badge
  const totalPendingDebt = store.customers.reduce((acc, c) => acc + (c.totalDebt || 0), 0);
  const cartTotalItems = cart.reduce((acc, it) => acc + it.quantity, 0);

  // Switch Admin Handlers
  const handleOpenSwitchAdmin = (targetAdmin = null) => {
    // If no specific target provided, toggle to the other admin
    const nextAdmin = targetAdmin || store.admins.find(a => a.id !== store.activeAdmin.id) || store.admins[0];
    setPinModalState({
      isOpen: true,
      targetAdmin: nextAdmin
    });
  };

  const handleAdminVerified = (newAdminId) => {
    store.setActiveAdminId(newAdminId);
  };

  return (
    <ErrorBoundary>
    <div className="app-container">
      {/* Top Header */}
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAdmin={store.activeAdmin}
        onSwitchAdminClick={() => handleOpenSwitchAdmin()}
        currentPeriod={store.currentPeriod}
        totalPendingDebt={totalPendingDebt}
        cartCount={cartTotalItems}
      />

      {/* Main Tab Views */}
      <main className="main-content">
        {activeTab === 'pos' && (
          <POS 
            products={store.products}
            customers={store.customers}
            onRecordSale={store.recordSale}
            onAddCustomer={store.addCustomer}
            activeAdmin={store.activeAdmin}
            cart={cart}
            setCart={setCart}
          />
        )}

        {activeTab === 'fiao' && (
          <DebtorsLedger 
            customers={store.customers}
            sales={store.sales}
            payments={store.payments}
            currentPeriod={store.currentPeriod}
            onRecordPayment={store.recordPayment}
            onAddCustomer={store.addCustomer}
            onUpdateCustomer={store.updateCustomer}
            activeAdmin={store.activeAdmin}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory 
            products={store.products}
            onAddProduct={store.addProduct}
            onUpdateProduct={store.updateProduct}
            onUpdateStock={store.updateStock}
            onDeleteProduct={store.deleteProduct}
            activeAdmin={store.activeAdmin}
          />
        )}

        {activeTab === 'reports' && (
          <Reports 
            sales={store.sales}
            payments={store.payments}
            currentPeriod={store.currentPeriod}
            archivedPeriods={store.archivedPeriods}
            onClosePeriod={store.closeCurrentPeriod}
            activeAdmin={store.activeAdmin}
          />
        )}

        {activeTab === 'settings' && (
          <Settings 
            admins={store.admins}
            activeAdmin={store.activeAdmin}
            onSwitchAdminClick={handleOpenSwitchAdmin}
            onExportBackup={store.exportBackupJSON}
            onImportBackup={store.importBackupJSON}
            onResetData={store.resetAllDataToDefault}
            onUpdateAdminPin={store.updateAdminPin}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-nav-bar">
        <button 
          className={`mobile-nav-item ${activeTab === 'pos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pos')}
        >
          <ShoppingBag size={20} />
          <span>Vender {cartTotalItems > 0 && `(${cartTotalItems})`}</span>
        </button>

        <button 
          className={`mobile-nav-item ${activeTab === 'fiao' ? 'active' : ''}`}
          onClick={() => setActiveTab('fiao')}
        >
          <Users size={20} />
          <span>Fiao</span>
        </button>

        <button 
          className={`mobile-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Package size={20} />
          <span>Stock</span>
        </button>

        <button 
          className={`mobile-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <BarChart3 size={20} />
          <span>Caja</span>
        </button>

        <button 
          className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <SettingsIcon size={20} />
          <span>Ajustes</span>
        </button>
      </nav>

      {/* Admin Switch PIN Modal */}
      <PinModal 
        isOpen={pinModalState.isOpen}
        targetAdmin={pinModalState.targetAdmin}
        onClose={() => setPinModalState({ isOpen: false, targetAdmin: null })}
        onVerified={handleAdminVerified}
      />
    </div>
    </ErrorBoundary>
  );
}
