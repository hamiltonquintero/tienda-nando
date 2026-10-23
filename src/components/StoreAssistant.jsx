import React, { useState } from 'react';
import { 
  Bell, 
  ShoppingBag, 
  Users, 
  ExternalLink, 
  CheckCircle2, 
  X, 
  Sparkles,
  Package,
  AlertTriangle,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { formatCOP } from '../data/store';

export default function StoreAssistant({ 
  store, 
  onOpenOrdersInbox, 
  onNavigateTab, 
  onOpenCatalog,
  isCatalog = false,
  cart = [],
  onOpenCart,
  onSelectCategory
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [customPose, setCustomPose] = useState(null);

  // 1. Datos reales de la tienda (Admin)
  const orders = store?.orders || [];
  const customers = store?.customers || [];
  const products = store?.products || [];
  const sales = store?.sales || [];

  // Pedidos pendientes (en la BD y store el estado es 'pending')
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const hasPendingOrders = pendingOrders.length > 0;

  // Clientes con deuda pendiente (totalDebt > 0)
  const debtors = customers.filter(c => Number(c.totalDebt || 0) > 0);
  const totalPendingDebt = debtors.reduce((sum, c) => sum + Number(c.totalDebt || 0), 0);

  // Clientes con saldo a favor (totalDebt < 0)
  const customersWithCredit = customers.filter(c => Number(c.totalDebt || 0) < 0);

  // Productos con stock bajo o agotados
  const lowStockProducts = products.filter(p => Number(p.stock || 0) <= (p.minStock || 3));
  const outOfStockCount = products.filter(p => Number(p.stock || 0) <= 0).length;

  // Carrito en modo cliente
  const cartTotalCount = cart.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const cartTotalPrice = cart.reduce((acc, it) => acc + ((it.price || 0) * (it.quantity || 1)), 0);

  // Tips informativos
  const adminTips = [
    "Los clientes pueden tener saldo a favor si te pagan de más en sus abonos.",
    "Comparte el enlace del catálogo por WhatsApp para que pidan directo a la bandeja.",
    "Revisa la bandeja de pedidos al inicio de la jornada para despachar a tiempo.",
    "En la sección 'Fiao' puedes filtrar quién debe y enviar recordatorios por WhatsApp.",
    "En 'Inventario' puedes ver los productos con poco stock para surtir a tiempo."
  ];

  const customerTips = [
    "Puedes pedir fiado a fin de quincena o pagar de contado por Nequi, Daviplata o efectivo.",
    "Si buscas algo rápido para calmar el antojo, prueba los snacks salados o galletas.",
    "Tu pedido llega directo al administrador y te avisan cuando esté listo para recoger."
  ];

  const tips = isCatalog ? customerTips : adminTips;

  // Lista de poses interactivas para cambiar al hacer clic en el robot
  const POSES = [
    { id: 'saludando', file: '/robot/robot-saludando.svg', label: 'Saludando' },
    { id: 'feliz', file: '/robot/robot-feliz.svg', label: '¡Feliz!' },
    { id: 'sorprendido', file: '/robot/robot-sorprendido.svg', label: 'Sorprendido' },
    { id: 'trabajando', file: '/robot/robot-trabajando.svg', label: 'Trabajando' },
    { id: 'pensando', file: '/robot/robot-pensando.svg', label: 'Pensativo' },
    { id: 'celebrando', file: '/robot/robot-celebrando.svg', label: 'Celebrando' },
    { id: 'senalando', file: '/robot/robot-senalando.svg', label: 'Señalando' }
  ];

  // Determinar la pose y badges del robot según datos en vivo
  let defaultPose = '/robot/robot-idle.svg';
  let statusBadgeText = 'Todo al día';
  let statusBadgeColor = '#16a34a'; // verde

  if (isCatalog) {
    if (cartTotalCount > 0) {
      defaultPose = '/robot/robot-celebrando.svg';
      statusBadgeText = `${cartTotalCount} en carrito`;
      statusBadgeColor = '#0284c7';
    } else {
      defaultPose = '/robot/robot-saludando.svg';
      statusBadgeText = '¿Qué se te antoja?';
      statusBadgeColor = '#0284c7';
    }
  } else {
    if (hasPendingOrders) {
      defaultPose = '/robot/robot-sorprendido.svg';
      statusBadgeText = `¡${pendingOrders.length} pedido${pendingOrders.length > 1 ? 's' : ''} pendiente${pendingOrders.length > 1 ? 's' : ''}!`;
      statusBadgeColor = '#f97316';
    } else if (lowStockProducts.length > 0) {
      defaultPose = '/robot/robot-pensando.svg';
      statusBadgeText = `${lowStockProducts.length} con poco stock`;
      statusBadgeColor = '#eab308';
    } else if (debtors.length > 0) {
      defaultPose = '/robot/robot-trabajando.svg';
      statusBadgeText = `${debtors.length} cuentas pendientes`;
      statusBadgeColor = '#0284c7';
    } else {
      defaultPose = '/robot/robot-feliz.svg';
    }
  }

  const currentPoseImg = customPose || defaultPose;

  const cycleNextPose = () => {
    const currentIndex = POSES.findIndex(p => p.file === currentPoseImg);
    const nextIndex = (currentIndex + 1) % POSES.length;
    setCustomPose(POSES[nextIndex].file);
  };

  return (
    <>
      {/* Botón flotante del Asistente (Esquina Inferior Izquierda) */}
      <div 
        className="store-assistant-launcher-wrap"
        style={{
          position: 'fixed',
          bottom: '22px',
          left: '22px',
          zIndex: 850
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`store-assistant-launcher-btn ${hasPendingOrders ? 'has-urgent-alerts' : ''}`}
          title="Asistente Robot de Surtimueve Más"
          aria-expanded={isOpen}
        >
          {/* Imagen de la pose actual */}
          <img 
            src={currentPoseImg} 
            alt="Robot Mascota" 
            className="store-assistant-icon-img"
          />

          {/* Badge contador de pedidos pendientes en admin o carrito en catálogo */}
          {!isCatalog && hasPendingOrders && (
            <span className="store-assistant-badge-count">
              {pendingOrders.length}
            </span>
          )}
          {isCatalog && cartTotalCount > 0 && (
            <span className="store-assistant-badge-count" style={{ background: '#0284c7' }}>
              {cartTotalCount}
            </span>
          )}

          {/* Luz de estado activa */}
          <span className="store-assistant-status-dot" style={{ background: statusBadgeColor }} />
        </button>

        {/* Notificación flotante emergente cuando hay pedidos nuevos */}
        {!isCatalog && hasPendingOrders && !isOpen && (
          <div 
            className="store-assistant-bubble-alert"
            onClick={() => {
              setIsOpen(true);
              if (onOpenOrdersInbox) onOpenOrdersInbox();
            }}
          >
            <div className="assistant-bubble-arrow" />
            <div className="assistant-bubble-text">
              <strong>¡Nuevo Pedido! 📦</strong>
              <span>{pendingOrders[0].customerName || 'Cliente'} espera su entrega</span>
            </div>
          </div>
        )}
      </div>

      {/* Ventana Desplegable del Asistente Virtual */}
      {isOpen && (
        <div className="store-assistant-panel" style={{ width: '330px' }}>
          {/* Header del Asistente */}
          <div className="store-assistant-header">
            <div className="assistant-header-profile">
              <div 
                className="assistant-avatar-circle" 
                onClick={cycleNextPose}
                title="¡Haz clic en el robot para cambiar su estado de ánimo!"
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <img src={currentPoseImg} alt="Robot Asistente" />
                <span style={{ 
                  position: 'absolute', 
                  bottom: '-2px', 
                  right: '-2px', 
                  fontSize: '9px',
                  background: '#ffffff',
                  borderRadius: '50%',
                  padding: '1px'
                }}>✨</span>
              </div>
              <div>
                <h4 className="assistant-title">
                  {isCatalog ? 'Asistente de Compras' : 'Asistente Surtimueve'}
                </h4>
                <span className="assistant-status-pill" style={{ background: `${statusBadgeColor}20`, color: statusBadgeColor }}>
                  ● {statusBadgeText}
                </span>
              </div>
            </div>

            <button 
              type="button"
              className="assistant-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar asistente"
            >
              <X size={16} />
            </button>
          </div>

          {/* Contenido / Resumen rápido */}
          <div className="store-assistant-body">
            
            {/* === MODO ADMIN: Estado en vivo de la tienda === */}
            {!isCatalog && (
              <>
                {/* 1. Alerta de Pedidos */}
                {hasPendingOrders ? (
                  <div className="assistant-alert-box urgent">
                    <div className="assistant-alert-icon">
                      <Bell size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong>{pendingOrders.length} pedido{pendingOrders.length > 1 ? 's' : ''} pendiente{pendingOrders.length > 1 ? 's' : ''}</strong>
                      <p>Pedidos en cola esperando despacho o confirmación.</p>
                      <button 
                        type="button" 
                        className="assistant-action-btn primary"
                        onClick={() => {
                          setIsOpen(false);
                          if (onOpenOrdersInbox) onOpenOrdersInbox();
                        }}
                      >
                        <ShoppingBag size={14} />
                        <span>Abrir Bandeja ({pendingOrders.length})</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="assistant-alert-box ok">
                    <CheckCircle2 size={18} color="#16a34a" />
                    <div style={{ flex: 1 }}>
                      <strong>¡Bandeja al día!</strong>
                      <p>No hay pedidos pendientes del catálogo en este momento.</p>
                    </div>
                  </div>
                )}

                {/* 2. Resumen de Métricas Clave */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  background: '#f8fafc',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.74rem' }}>
                    <div style={{ color: '#64748b', fontWeight: 600 }}>Por cobrar:</div>
                    <div style={{ fontWeight: 800, color: debtors.length > 0 ? '#ea580c' : '#16a34a', fontSize: '0.88rem' }}>
                      {formatCOP(totalPendingDebt)}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.68rem' }}>
                      {debtors.length} {debtors.length === 1 ? 'persona' : 'personas'}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.74rem' }}>
                    <div style={{ color: '#64748b', fontWeight: 600 }}>Stock bajo:</div>
                    <div style={{ fontWeight: 800, color: lowStockProducts.length > 0 ? '#d97706' : '#16a34a', fontSize: '0.88rem' }}>
                      {lowStockProducts.length} productos
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.68rem' }}>
                      {outOfStockCount > 0 ? `${outOfStockCount} agotados` : 'inventario activo'}
                    </div>
                  </div>
                </div>

                {/* 3. Accesos Rápidos de Navegación del Admin */}
                <div className="assistant-quick-actions">
                  <span className="assistant-section-label" style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Accesos Directos
                  </span>
                  <div className="assistant-btn-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
                    <button 
                      type="button"
                      className="assistant-grid-btn"
                      onClick={() => {
                        setIsOpen(false);
                        if (onOpenOrdersInbox) onOpenOrdersInbox();
                      }}
                    >
                      <ShoppingBag size={16} color={pendingOrders.length > 0 ? "#ea580c" : "#0284c7"} />
                      <span>Pedidos ({pendingOrders.length})</span>
                    </button>

                    <button 
                      type="button"
                      className="assistant-grid-btn"
                      onClick={() => {
                        setIsOpen(false);
                        if (onNavigateTab) onNavigateTab('fiao');
                      }}
                    >
                      <Users size={16} color="#ea580c" />
                      <span>Fiao ({debtors.length})</span>
                    </button>

                    <button 
                      type="button"
                      className="assistant-grid-btn"
                      onClick={() => {
                        setIsOpen(false);
                        if (onNavigateTab) onNavigateTab('inventory');
                      }}
                    >
                      <Package size={16} color="#0d9488" />
                      <span>Stock ({lowStockProducts.length})</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button 
                      type="button"
                      className="assistant-grid-btn"
                      style={{ flex: 1, padding: '6px 8px' }}
                      onClick={() => {
                        setIsOpen(false);
                        if (onNavigateTab) onNavigateTab('pos');
                      }}
                    >
                      <span>🛒 Punto de Venta</span>
                    </button>

                    <button 
                      type="button"
                      className="assistant-grid-btn"
                      style={{ flex: 1, padding: '6px 8px' }}
                      onClick={() => {
                        setIsOpen(false);
                        if (onOpenCatalog) onOpenCatalog();
                      }}
                    >
                      <ExternalLink size={14} color="#10b981" />
                      <span>Ver Catálogo</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* === MODO CATÁLOGO: Asistente Interactivo para el Cliente === */}
            {isCatalog && (
              <>
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '12px',
                  padding: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Sparkles size={16} color="#0284c7" />
                    <strong style={{ fontSize: '0.84rem', color: '#0369a1' }}>¡Hola! ¿Qué se te antoja hoy?</strong>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                    {cartTotalCount > 0 
                      ? `Llevas ${cartTotalCount} producto(s) por ${formatCOP(cartTotalPrice)}. ¿Listo para enviar tu pedido?`
                      : 'Elige tus golosinas o bebidas favoritas. Puedes pagar de contado o anotarlo a tu cuenta de fiao quincenal.'}
                  </p>
                  {cartTotalCount > 0 && onOpenCart && (
                    <button 
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenCart();
                      }}
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '8px',
                        borderRadius: '8px',
                        background: '#0284c7',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      Ver mi pedido ({formatCOP(cartTotalPrice)}) →
                    </button>
                  )}
                </div>

                {/* Categorías recomendadas */}
                {onSelectCategory && (
                  <div style={{ marginTop: '2px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                      Recomendados de hoy
                    </span>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {['Snacks', 'Bebidas', 'Galletas', 'Dulces'].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            onSelectCategory(cat);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '999px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Selector interactivo de poses del robot */}
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '10px',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                Ánimo del robot:
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {POSES.slice(0, 5).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCustomPose(p.file)}
                    title={p.label}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: currentPoseImg === p.file ? '#bae6fd' : '#ffffff',
                      border: currentPoseImg === p.file ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img src={p.file} alt={p.label} style={{ width: '18px', height: '18px' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Consejo útil rotativo */}
            <div className="assistant-tip-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Sparkles size={14} color="#f59e0b" />
                <strong style={{ fontSize: '0.76rem', color: '#1e293b' }}>
                  {isCatalog ? 'Dato para ti' : 'Tip de la Tienda'}
                </strong>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                "{tips[currentTipIndex]}"
              </p>
              <button 
                type="button" 
                className="assistant-next-tip-btn"
                onClick={() => setCurrentTipIndex((prev) => (prev + 1) % tips.length)}
              >
                Siguiente tip →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
