import React, { useState, useMemo } from 'react';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle, 
  UserPlus, User, CreditCard, DollarSign, AlertTriangle, Sparkles,
  MessageSquare, Copy, Check, CheckCircle2, X, Send, Share2, Inbox
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CATEGORIES } from '../data/initialProducts';
import { formatCOP } from '../data/store';
import ConfirmModal from './ConfirmModal';
import ProductThumbnail from './ProductThumbnail';

export default function POS({ 
  products, 
  customers, 
  onRecordSale, 
  onAddCustomer,
  activeAdmin,
  cart,
  setCart,
  saleType: propSaleType,
  setSaleType: propSetSaleType,
  selectedCustomerId: propSelectedCustomerId,
  setSelectedCustomerId: propSetSelectedCustomerId,
  pendingOrdersCount = 0,
  onOpenOrdersInbox,
  onOpenShareCatalog
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [localSaleType, setLocalSaleType] = useState('contado');
  const saleType = propSaleType !== undefined ? propSaleType : localSaleType;
  const setSaleType = propSetSaleType || setLocalSaleType;

  const [paymentMethod, setPaymentMethod] = useState('efectivo'); // 'efectivo' | 'nequi' | 'daviplata'
  const [localSelectedCustomerId, setLocalSelectedCustomerId] = useState('');
  const selectedCustomerId = propSelectedCustomerId !== undefined ? propSelectedCustomerId : localSelectedCustomerId;
  const setSelectedCustomerId = propSetSelectedCustomerId || setLocalSelectedCustomerId;
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerArea, setNewCustomerArea] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [saveCustomerError, setSaveCustomerError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [fiadoError, setFiadoError] = useState(false); // reemplaza el alert()

  // Estado para el Recibo Digital por WhatsApp
  const [lastCompletedSale, setLastCompletedSale] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptCustomPhone, setReceiptCustomPhone] = useState('');
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  // Cart operations
  const addToCart = (product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Limit to stock
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const product = products.find(p => p.id === productId);
          const maxStock = product ? product.stock : 999;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > maxStock) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Generar texto para el Ticket / Recibo de WhatsApp según la especificación:
  // "Hola Hamilton, compraste: 1 Tosh ($1.400) + 1 Coca Cola ($2.500). Total: $3.900 (Fiado a quincena). ¡Gracias!"
  const generateReceiptWhatsAppMessage = (saleData) => {
    if (!saleData) return '';
    const namePart = saleData.customerName 
      ? `Hola ${saleData.customerName.split(' ')[0]}` 
      : 'Hola';
    
    const itemsText = saleData.items
      .map(it => `${it.quantity} ${it.name} (${formatCOP(it.price * it.quantity)})`)
      .join(' + ');

    let paymentDesc = 'De Contado';
    if (saleData.saleType === 'fiado') {
      paymentDesc = 'Fiado a quincena';
    } else if (saleData.paymentMethod === 'nequi') {
      paymentDesc = 'Contado por Nequi';
    } else if (saleData.paymentMethod === 'daviplata') {
      paymentDesc = 'Contado por Daviplata';
    } else if (saleData.paymentMethod === 'efectivo') {
      paymentDesc = 'Contado en efectivo';
    }

    return `${namePart}, compraste: ${itemsText}. Total: ${formatCOP(saleData.total)} (${paymentDesc}). ¡Gracias! 🙌\n\n— Surtimueve Más (${saleData.adminName})`;
  };

  const handleSendWhatsAppReceipt = (customPhone = '') => {
    if (!lastCompletedSale) return;
    const text = encodeURIComponent(generateReceiptWhatsAppMessage(lastCompletedSale));
    const phoneToUse = (customPhone || lastCompletedSale.phone || '').replace(/\D/g, '');
    let url = '';
    if (phoneToUse.length >= 10) {
      const fullPhone = phoneToUse.startsWith('57') ? phoneToUse : `57${phoneToUse}`;
      url = `https://wa.me/${fullPhone}?text=${text}`;
    } else {
      url = `https://wa.me/?text=${text}`;
    }
    window.open(url, '_blank');
  };

  const handleCopyReceipt = () => {
    if (!lastCompletedSale) return;
    const text = generateReceiptWhatsAppMessage(lastCompletedSale);
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  // Handle Complete Sale
  const handleCheckout = async () => {
    if (cart.length === 0 || isCheckingOut) return;

    if (saleType === 'fiado' && !selectedCustomerId) {
      setFiadoError(true);
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    const saleItemsSnapshot = cart.map(i => ({
      id: i.id,
      name: i.name,
      price: i.price,
      cost: i.cost,
      quantity: i.quantity,
      total: i.price * i.quantity
    }));

    const saleSnapshot = {
      total: cartTotal,
      saleType,
      paymentMethod: saleType === 'contado' ? paymentMethod : 'credito',
      customer: customer ? { ...customer } : null,
      customerName: customer ? customer.name : '',
      phone: customer ? (customer.phone || '') : '',
      items: saleItemsSnapshot,
      date: new Date().toISOString(),
      adminName: activeAdmin ? activeAdmin.name : 'Administrador'
    };

    setIsCheckingOut(true);
    setCheckoutError('');

    try {
      await onRecordSale({
        type: saleType,
        customerId: customer ? customer.id : null,
        customerName: customer ? customer.name : null,
        items: saleItemsSnapshot,
        total: cartTotal,
        paymentMethod: saleType === 'contado' ? paymentMethod : 'credito'
      });

      // Trigger celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      } catch (e) {
        // ignore
      }

      // Guardar para el modal de Recibo por WhatsApp
      setLastCompletedSale(saleSnapshot);
      setReceiptCustomPhone(customer?.phone || '');
      setIsReceiptModalOpen(true);

      // Reset cart and selection
      clearCart();
      setSelectedCustomerId('');
      setShowMobileCart(false);
    } catch (err) {
      console.error('[POS] Error al registrar venta:', err);
      setCheckoutError('No se pudo registrar la venta. Verifica la conexión a internet e intenta de nuevo.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Quick Add Customer
  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim() || savingCustomer) return;
    setSavingCustomer(true);
    setSaveCustomerError('');
    try {
      const added = await onAddCustomer({
        name: newCustomerName,
        area: newCustomerArea,
        phone: newCustomerPhone
      });
      if (added) setSelectedCustomerId(added.id);
      setIsNewCustomerModalOpen(false);
      setNewCustomerName('');
      setNewCustomerArea('');
      setNewCustomerPhone('');
    } catch (err) {
      console.error('[POS] Error guardando compañero:', err);
      setSaveCustomerError('No se pudo guardar el compañero. Verifica la conexión e intenta de nuevo.');
    } finally {
      setSavingCustomer(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(320px, 380px)', gap: '20px', alignItems: 'start' }} className="pos-layout">
      {/* LEFT COLUMN: Catalog */}
      <div style={{ position: 'relative' }}>
        {/* Botón flotante "Ver Canasta" en móvil */}
        {cart.length > 0 && (
          <button
            className="btn btn-primary no-print"
            style={{
              display: 'none', // sobreescrito en móvil por CSS
              position: 'fixed',
              bottom: '76px', // encima de la nav bar móvil
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 200,
              borderRadius: '999px',
              padding: '12px 28px',
              fontSize: '0.95rem',
              boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)',
              whiteSpace: 'nowrap'
            }}
            onClick={() => setShowMobileCart(true)}
            aria-label="Ver canasta de venta"
          >
            <ShoppingCart size={18} />
            Ver Canasta · {cartCount} {cartCount === 1 ? 'ítem' : 'ítems'} · {formatCOP(cartTotal)}
          </button>
        )}
        {/* Banner de Pedidos Pendientes del Catálogo */}
        {pendingOrdersCount > 0 && onOpenOrdersInbox && (
          <div style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            border: '1.5px solid #fdba74',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            boxShadow: '0 4px 14px rgba(234, 88, 12, 0.12)',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: '#ea580c',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.86rem'
              }}>
                {pendingOrdersCount}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#9a3412' }}>
                  {pendingOrdersCount === 1 ? '¡Hay 1 pedido pendiente del catálogo!' : `¡Hay ${pendingOrdersCount} pedidos pendientes del catálogo!`}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#c2410c' }}>
                  Un compañero acaba de hacer un pedido desde su puesto
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-orange"
              style={{ padding: '7px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
              onClick={onOpenOrdersInbox}
            >
              Revisar y Entregar ➔
            </button>
          </div>
        )}

        {/* Banner Destacado: Compartir Catálogo Digital con la Oficina */}
        {onOpenShareCatalog && (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1.5px solid #86efac',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#16a34a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
              }}>
                🛍️
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#14532d' }}>
                  Catálogo Digital para la Oficina
                </div>
                <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                  Comparte el link con tus compañeros para que puedan pedir y comprar desde su puesto
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={onOpenShareCatalog}
                className="btn"
                style={{
                  background: '#16a34a',
                  color: '#ffffff',
                  padding: '8px 16px',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                  cursor: 'pointer'
                }}
              >
                <Share2 size={16} />
                <span>🔗 Compartir Enlace / WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        {/* Search & Categories Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} 
              />
              <input 
                type="text"
                placeholder="Buscar producto (ej. Tosh, Coca Cola, Papas, Trident...)"
                className="input"
                style={{ paddingLeft: '42px', fontSize: '1rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>

            {onOpenShareCatalog && (
              <button
                type="button"
                className="btn btn-secondary desktop-only"
                onClick={onOpenShareCatalog}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', fontSize: '0.86rem', padding: '0 14px' }}
                title="Compartir enlace del Catálogo Digital"
              >
                <Share2 size={15} />
                <span>Compartir Catálogo</span>
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '999px',
                  border: selectedCategory === cat ? '1px solid var(--brand-blue)' : '1.5px solid #cbd5e1',
                  background: selectedCategory === cat ? 'linear-gradient(135deg, var(--brand-blue) 0%, var(--brand-blue-dark) 100%)' : '#ffffff',
                  color: selectedCategory === cat ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  boxShadow: selectedCategory === cat ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', 
          gap: '14px' 
        }}>
          {filteredProducts.map(p => {
            const inCart = cart.find(item => item.id === p.id);
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock > 0 && p.stock <= (p.minStock || 3);

            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && addToCart(p)}
                style={{
                  background: inCart ? '#f0f9ff' : '#ffffff',
                  border: inCart ? '2px solid var(--brand-blue)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  opacity: isOutOfStock ? 0.5 : 1,
                  position: 'relative',
                  boxShadow: inCart ? '0 4px 14px rgba(2, 132, 199, 0.15)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                  userSelect: 'none'
                }}
                onMouseDown={(e) => {
                  if (!isOutOfStock) e.currentTarget.style.transform = 'scale(0.97)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {/* Quantity badge in cart */}
                {inCart && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: 'var(--brand-orange-light)',
                    color: '#fff',
                    borderRadius: '999px',
                    padding: '3px 9px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.35)',
                    zIndex: 2
                  }}>
                    {inCart.quantity}
                  </span>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <ProductThumbnail icon={p.icon} name={p.name} size={48} />
                    {isOutOfStock ? (
                      <span className="badge badge-danger">Agotado</span>
                    ) : isLowStock ? (
                      <span className="badge badge-warning">{p.stock} unid.</span>
                    ) : (
                      <span className="badge badge-info">{p.stock} unid.</span>
                    )}
                  </div>

                  <h3 style={{ 
                    fontSize: '0.98rem', 
                    fontWeight: 700, 
                    marginBottom: '4px',
                    color: 'var(--text-main)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {p.name}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
                    {p.category}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-blue)' }}>
                    {formatCOP(p.price)}
                  </span>
                  <button 
                    disabled={isOutOfStock}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: inCart ? 'var(--brand-blue)' : '#f1f5f9',
                      border: inCart ? 'none' : '1px solid #cbd5e1',
                      color: inCart ? '#ffffff' : '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No se encontraron productos con "{search}"</p>
            <p style={{ fontSize: '0.85rem' }}>Prueba con otra categoría o revisa la ortografía.</p>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Cart Panel (Sticky en desktop / Overlay en móvil) */}
      {/* Overlay backdrop en móvil */}
      {showMobileCart && (
        <div
          onClick={() => setShowMobileCart(false)}
          style={{
            display: 'none', // mostrado en móvil por CSS
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 198
          }}
          className="mobile-cart-backdrop"
        />
      )}
      <div 
        className={`cart-panel ${showMobileCart ? 'mobile-cart-open' : ''}`}
        style={{
          position: 'sticky',
          top: '80px',
          background: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '22px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 100px)'
        }}
      >
        {/* Botón cerrar en móvil */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={20} color="var(--brand-blue)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Canasta de Venta</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {cart.length > 0 && (
              <button 
                onClick={clearCart}
                className="btn-ghost"
                style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}
              >
                Vaciar
              </button>
            )}
            {/* Botón X solo visible en móvil */}
            <button
              onClick={() => setShowMobileCart(false)}
              className="mobile-cart-close-btn"
              style={{
                display: 'none', // mostrado en móvil por CSS
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px'
              }}
              aria-label="Cerrar canasta"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-dim)' }}>
              <ShoppingCart size={40} style={{ margin: '0 auto 12px', opacity: 0.25 }} />
              <p style={{ fontSize: '0.92rem', fontWeight: 600 }}>La canasta está vacía</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--text-muted)' }}>Toca cualquier producto para agregarlo a la venta.</p>
            </div>
          ) : (
            cart.map(item => (
              <div 
                key={item.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: '10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--brand-blue)', fontWeight: 700 }}>
                    {formatCOP(item.price)} c/u
                  </div>
                </div>

                {/* Counter buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button 
                    onClick={() => updateQuantity(item.id, -1)}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Minus size={13} />
                  </button>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, minWidth: '22px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button 
                    onClick={() => updateQuantity(item.id, 1)}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Plus size={13} />
                  </button>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'transparent', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '4px' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* SALE TYPE SELECTOR: CONTADO vs FIADO */}
        {cart.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                Tipo de Venta
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSaleType('contado')}
                  style={{
                    padding: '11px',
                    borderRadius: 'var(--radius-md)',
                    border: saleType === 'contado' ? '2px solid #16a34a' : '1.5px solid #cbd5e1',
                    background: saleType === 'contado' ? '#f0fdf4' : '#ffffff',
                    color: saleType === 'contado' ? '#15803d' : 'var(--text-muted)',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <DollarSign size={17} />
                  De Contado
                </button>

                <button
                  type="button"
                  onClick={() => setSaleType('fiado')}
                  style={{
                    padding: '11px',
                    borderRadius: 'var(--radius-md)',
                    border: saleType === 'fiado' ? '2px solid #ea580c' : '1.5px solid #cbd5e1',
                    background: saleType === 'fiado' ? '#fff7ed' : '#ffffff',
                    color: saleType === 'fiado' ? '#c2410c' : 'var(--text-muted)',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <User size={17} />
                  Fiado (Quincena)
                </button>
              </div>
            </div>

            {/* If Contado: Payment Method */}
            {saleType === 'contado' && (
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '6px', display: 'block' }}>
                  Medio de Pago:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['efectivo', 'nequi', 'daviplata'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      style={{
                        flex: 1,
                        padding: '7px',
                        borderRadius: 'var(--radius-sm)',
                        border: paymentMethod === method ? '1px solid var(--brand-blue)' : '1px solid #cbd5e1',
                        background: paymentMethod === method ? 'var(--brand-blue)' : '#f1f5f9',
                        color: paymentMethod === method ? '#fff' : 'var(--text-muted)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        cursor: 'pointer'
                      }}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Coworker Selector + Quick Add (Opcional en Contado, Obligatorio en Fiado) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: saleType === 'fiado' ? '#ea580c' : 'var(--text-muted)'
                }}>
                  {saleType === 'fiado' ? '¿A quién se le fía? (Obligatorio)' : 'Compañero que compra (Opcional):'}
                </label>
                <button
                  type="button"
                  onClick={() => { setIsNewCustomerModalOpen(true); setSaveCustomerError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--brand-blue)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <UserPlus size={14} />
                  + Nuevo
                </button>
              </div>
              <select 
                className="select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{ borderColor: selectedCustomerId ? (saleType === 'fiado' ? '#ea580c' : 'var(--brand-blue)') : '#cbd5e1' }}
              >
                <option value="">
                  {saleType === 'fiado' ? '-- Selecciona el compañero --' : '-- Venta rápida / Cliente general --'}
                </option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.area ? `(${c.area})` : ''} {c.totalDebt > 0 ? `· Saldo: ${formatCOP(c.totalDebt)}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Total and Checkout button */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total a Pagar:</span>
                <span style={{ fontSize: '1.7rem', fontWeight: 800, color: saleType === 'fiado' ? '#ea580c' : '#16a34a' }}>
                  {formatCOP(cartTotal)}
                </span>
              </div>

              <button
                type="button"
                className={`btn ${saleType === 'fiado' ? 'btn-orange' : 'btn-success'}`}
                style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: 'var(--radius-lg)' }}
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                <CheckCircle size={20} />
                {isCheckingOut
                  ? 'Guardando venta…'
                  : (saleType === 'fiado' ? 'Registrar Fiao a Quincena' : 'Cobrar Venta de Contado')}
              </button>

              {checkoutError && (
                <div style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, marginTop: '8px', textAlign: 'center' }}>
                  ⚠️ {checkoutError}
                </div>
              )}

              <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                Atendido por: <strong>{activeAdmin.name}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QUICK ADD CUSTOMER MODAL */}
      {isNewCustomerModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsNewCustomerModalOpen(false); setSaveCustomerError(''); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus color="#38bdf8" />
              Nuevo Compañero ({saleType === 'fiado' ? 'para Fiar' : 'para Venta'})
            </h2>
            <form onSubmit={handleQuickAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Nombre completo: *
                </label>
                <input 
                  type="text" 
                  className="input" 
                  required 
                  placeholder="ej. Juan Carlos Gómez"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Área / Piso / Puesto (opcional):
                </label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="ej. Contabilidad / Piso 3"
                  value={newCustomerArea}
                  onChange={(e) => setNewCustomerArea(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  WhatsApp / Celular (opcional, para cobrarle luego):
                </label>
                <input 
                  type="tel" 
                  className="input" 
                  placeholder="ej. 3001234567"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                />
              </div>

              {saveCustomerError && (
                <div style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center' }}>
                  ⚠️ {saveCustomerError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => { setIsNewCustomerModalOpen(false); setSaveCustomerError(''); }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingCustomer}>
                  {savingCustomer ? 'Guardando...' : 'Guardar y Seleccionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Fiado sin cliente seleccionado */}
      <ConfirmModal
        isOpen={fiadoError}
        title="Falta seleccionar compañero"
        message="Para registrar una venta fiada debes seleccionar el compañero a quien se le va a fiar. Elige uno de la lista o agrega uno nuevo."
        confirmLabel="Entendido"
        cancelLabel={null}
        onConfirm={() => setFiadoError(false)}
        onCancel={() => setFiadoError(false)}
      />

      {/* MODAL: TICKET / RECIBO DIGITAL POR WHATSAPP */}
      {isReceiptModalOpen && lastCompletedSale && (
        <div 
          className="modal-overlay" 
          onClick={() => setIsReceiptModalOpen(false)}
          style={{ zIndex: 1100 }}
        >
          <div 
            className="modal-content" 
            style={{ maxWidth: '440px', padding: '24px' }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '50%', 
                  background: '#dcfce7', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#16a34a',
                  flexShrink: 0
                }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    ¡Venta Registrada!
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    {lastCompletedSale.customerName 
                      ? `Cliente: ${lastCompletedSale.customerName}` 
                      : 'Venta de mostrador rápida'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsReceiptModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Total Highlight */}
            <div style={{
              background: lastCompletedSale.saleType === 'fiado' ? '#fff7ed' : '#f0fdf4',
              border: lastCompletedSale.saleType === 'fiado' ? '1.5px solid #fdba74' : '1.5px solid #86efac',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px'
            }}>
              <div>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: lastCompletedSale.saleType === 'fiado' ? '#c2410c' : '#15803d', letterSpacing: '0.04em' }}>
                  {lastCompletedSale.saleType === 'fiado' ? 'Fiado a Quincena' : `Contado (${lastCompletedSale.paymentMethod})`}
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: lastCompletedSale.saleType === 'fiado' ? '#ea580c' : '#16a34a' }}>
                  {formatCOP(lastCompletedSale.total)}
                </div>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                {lastCompletedSale.items.reduce((acc, it) => acc + it.quantity, 0)} ítems
              </span>
            </div>

            {/* Preview del Mensaje de WhatsApp (Burbuja de Chat) */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MessageSquare size={13} color="#25D366" />
                  Ticket para enviar al compañero:
                </label>
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedReceipt ? '#16a34a' : 'var(--brand-blue)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedReceipt ? <Check size={12} /> : <Copy size={12} />}
                  {copiedReceipt ? '¡Copiado!' : 'Copiar texto'}
                </button>
              </div>

              <div style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: '0.84rem',
                lineHeight: 1.5,
                color: '#0f172a',
                fontFamily: 'inherit',
                position: 'relative'
              }}>
                <div style={{ fontStyle: 'italic', color: '#1e293b' }}>
                  "{generateReceiptWhatsAppMessage(lastCompletedSale)}"
                </div>
              </div>
            </div>

            {/* Teléfono de destino (editable si el cliente no tenía o si desea cambiarlo) */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Enviar al número (opcional si ya lo tienes en tus contactos):
              </label>
              <input 
                type="tel"
                className="input"
                placeholder="ej. 3001234567 o déjalo vacío para elegir chat"
                value={receiptCustomPhone}
                onChange={(e) => setReceiptCustomPhone(e.target.value)}
                style={{ fontSize: '0.88rem', padding: '8px 12px' }}
              />
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                type="button"
                className="btn"
                onClick={() => handleSendWhatsAppReceipt(receiptCustomPhone)}
                style={{
                  width: '100%',
                  background: '#25D366',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.98rem',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <MessageSquare size={18} />
                Enviar Recibo por WhatsApp
              </button>

              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsReceiptModalOpen(false)}
                style={{ width: '100%', padding: '10px' }}
              >
                Listo / Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS TOAST NOTIFICATION */}
      {successToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(19, 29, 49, 0.95)',
          border: '1px solid #10b981',
          backdropFilter: 'blur(12px)',
          borderRadius: 'var(--radius-xl)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle size={24} color="#10b981" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
              ¡Venta registrada con éxito!
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {successToast.type === 'fiado' 
                ? `Fiado a ${successToast.customer} por ${formatCOP(successToast.total)}` 
                : `Venta de contado por ${formatCOP(successToast.total)}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
