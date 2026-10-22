import React, { useState, useEffect } from 'react';
import { ShoppingBag, Users, Package, BarChart3, Settings as SettingsIcon, Inbox } from 'lucide-react';
import { useStore } from './data/store';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import POS from './components/POS';
import DebtorsLedger from './components/DebtorsLedger';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import Settings from './components/Settings';
import PinModal from './components/PinModal';
import DigitalCatalog from './components/DigitalCatalog';
import OrdersInboxModal from './components/OrdersInboxModal';
import ShareCatalogModal from './components/ShareCatalogModal';
import DevCreditBadge from './components/DevCreditBadge';

export default function App() {
  const store = useStore();
  const [activeTab, setActiveTab] = useState('pos');
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [saleType, setSaleType] = useState('contado');
  const [pinModalState, setPinModalState] = useState({ isOpen: false, targetAdmin: null });

  // Estado para Catálogo Digital y Pedidos
  const [isCatalogView, setIsCatalogView] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.search.includes('view=catalogo') || window.location.hash === '#catalogo';
  });
  const [isOrdersInboxOpen, setIsOrdersInboxOpen] = useState(false);
  const [isShareCatalogOpen, setIsShareCatalogOpen] = useState(false);
  const [catalogPinModalOpen, setCatalogPinModalOpen] = useState(false);

  // Escuchar cambios de URL para soportar compartir enlace
  useEffect(() => {
    const handlePopState = () => {
      const isCat = window.location.search.includes('view=catalogo') || window.location.hash === '#catalogo';
      setIsCatalogView(isCat);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleFiarToCustomer = (customer) => {
    setSelectedCustomerId(customer.id);
    setSaleType('fiado');
    setActiveTab('pos');
  };

  // ── Pantalla de carga inicial (solo si no hay productos cargados) ──────
  if (store.loading && (!store.products || store.products.length === 0)) {
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

  // ── Error de conexión (solo si no hay productos disponibles) ──────
  if (store.error && (!store.products || store.products.length === 0)) {
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
  const pendingOrdersCount = (store.orders || []).filter(o => o.status === 'pending').length;

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

  // ── Vista Pública: Catálogo Digital para Compañeros ──────
  if (isCatalogView) {
    return (
      <ErrorBoundary>
        <DigitalCatalog 
          products={store.products}
          customers={store.customers}
          onAddCustomer={store.addCustomer}
          onCreateOrder={store.createOrder}
          onSwitchToAdmin={() => setCatalogPinModalOpen(true)}
        />
        <PinModal 
          isOpen={catalogPinModalOpen}
          targetAdmin={store.activeAdmin || store.admins[0]}
          onClose={() => setCatalogPinModalOpen(false)}
          onVerified={() => {
            setCatalogPinModalOpen(false);
            setIsCatalogView(false);
            if (window.history.pushState) {
              window.history.pushState(null, '', window.location.pathname);
            }
          }}
        />
      </ErrorBoundary>
    );
  }

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
        pendingOrdersCount={pendingOrdersCount}
        onOpenOrdersInbox={() => setIsOrdersInboxOpen(true)}
        onOpenShareCatalog={() => setIsShareCatalogOpen(true)}
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
            selectedCustomerId={selectedCustomerId}
            setSelectedCustomerId={setSelectedCustomerId}
            saleType={saleType}
            setSaleType={setSaleType}
            pendingOrdersCount={pendingOrdersCount}
            onOpenOrdersInbox={() => setIsOrdersInboxOpen(true)}
            onOpenShareCatalog={() => setIsShareCatalogOpen(true)}
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
            onDeleteCustomer={store.deleteCustomer}
            onFiarToCustomer={handleFiarToCustomer}
            onCancelSale={store.cancelSale}
            activeAdmin={store.activeAdmin}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory 
            products={store.products}
            onAddProduct={store.addProduct}
            onUpdateProduct={store.updateProduct}
            onUpdateStock={store.updateStock}
            onBulkRestock={store.bulkRestockProducts}
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
            onCancelSale={store.cancelSale}
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
            onOpenShareCatalog={() => setIsShareCatalogOpen(true)}
          />
        )}

        {/* Footer permanente */}
        <footer style={{
          textAlign: 'center',
          padding: '16px',
          marginTop: '28px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.76rem',
          color: '#64748b'
        }}>
          <div><strong>Surtimueve más</strong> · Sistema de Gestión y Ventas</div>
        </footer>
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
          className="mobile-nav-item"
          style={{ position: 'relative' }}
          onClick={() => setIsOrdersInboxOpen(true)}
        >
          <Inbox size={20} color={pendingOrdersCount > 0 ? '#ea580c' : 'currentColor'} />
          <span>Pedidos</span>
          {pendingOrdersCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: 'calc(50% - 18px)',
              background: '#ea580c',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 900,
              borderRadius: '999px',
              padding: '1px 5px',
              lineHeight: 1
            }}>
              {pendingOrdersCount}
            </span>
          )}
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

      {/* Bandeja de Pedidos del Catálogo */}
      <OrdersInboxModal 
        isOpen={isOrdersInboxOpen}
        onClose={() => setIsOrdersInboxOpen(false)}
        orders={store.orders || []}
        onApproveOrder={store.approveOrder}
        onRejectOrder={store.rejectOrder}
      />

      {/* Modal Compartir Catálogo */}
      <ShareCatalogModal 
        isOpen={isShareCatalogOpen}
        onClose={() => setIsShareCatalogOpen(false)}
        onOpenCatalogView={() => {
          setIsShareCatalogOpen(false);
          setIsCatalogView(true);
          if (window.history.pushState) {
            window.history.pushState(null, '', '?view=catalogo');
          }
        }}
      />
      {/* Badge Flotante Animado con Colores y Movimiento */}
      <DevCreditBadge isCatalog={false} />
    </div>
    </ErrorBoundary>
  );
}
