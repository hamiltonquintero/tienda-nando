import React, { useState, useMemo } from 'react';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle2, 
  MessageSquare, Lock, ArrowLeft, Send, Sparkles, User, 
  MapPin, Phone, CreditCard, DollarSign, X, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CATEGORIES, STORE_OWNER_PHONE } from '../data/initialProducts';
import { formatCOP } from '../data/store';
import ProductThumbnail from './ProductThumbnail';
import DevCreditBadge from './DevCreditBadge';

export default function DigitalCatalog({ 
  products, 
  customers, 
  onAddCustomer, 
  onCreateOrder, 
  onSwitchToAdmin 
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Formulario del comprador
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isNewCoworker, setIsNewCoworker] = useState(false);
  const [newName, setNewName] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [paymentType, setPaymentType] = useState('fiado'); // 'fiado' | 'contado'
  const [paymentMethod, setPaymentMethod] = useState('credito'); // 'credito' | 'efectivo' | 'nequi' | 'daviplata'
  const [orderNotes, setOrderNotes] = useState('');

  // Estados de proceso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Cart operations
  const addToCart = (product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
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

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  // Submit order
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || isSubmitting) return;

    let customerIdToUse = selectedCustomerId;
    let customerNameToUse = '';
    let customerAreaToUse = newArea;
    let customerPhoneToUse = newPhone;

    if (isNewCoworker) {
      if (!newName.trim()) {
        setErrorMessage('Por favor escribe tu nombre completo.');
        return;
      }
      try {
        const added = await onAddCustomer({
          name: newName.trim(),
          area: newArea.trim(),
          phone: newPhone.trim()
        });
        if (added) {
          customerIdToUse = added.id;
          customerNameToUse = added.name;
        } else {
          customerNameToUse = newName.trim();
        }
      } catch (err) {
        console.warn('No se pudo registrar cliente en DB, usando nombre directo:', err);
        customerNameToUse = newName.trim();
      }
    } else {
      if (!selectedCustomerId) {
        setErrorMessage('Por favor selecciona tu nombre de la lista o regístrate como nuevo.');
        return;
      }
      const existingCustomer = customers.find(c => c.id === selectedCustomerId);
      customerNameToUse = existingCustomer ? existingCustomer.name : 'Compañero';
      customerAreaToUse = existingCustomer?.area || '';
      customerPhoneToUse = existingCustomer?.phone || '';
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const orderItems = cart.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        cost: i.cost || Math.round(i.price * 0.7),
        quantity: i.quantity,
        total: i.price * i.quantity
      }));

      const finalPaymentMethod = paymentType === 'fiado' 
        ? 'credito' 
        : (paymentMethod === 'credito' ? 'efectivo' : paymentMethod);

      const created = await onCreateOrder({
        customerId: customerIdToUse || null,
        customerName: customerNameToUse,
        customerArea: customerAreaToUse,
        customerPhone: customerPhoneToUse,
        paymentType,
        paymentMethod: finalPaymentMethod,
        items: orderItems,
        total: cartTotal,
        notes: orderNotes
      });

      try {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      } catch (e) {}

      setOrderSuccess({
        order: created,
        customerName: customerNameToUse,
        customerArea: customerAreaToUse,
        items: orderItems,
        total: cartTotal,
        paymentType,
        paymentMethod: finalPaymentMethod
      });

      setCart([]);
      setIsCartOpen(false);
    } catch (err) {
      console.error('[Catalog] Error enviando pedido:', err);
      setErrorMessage('No se pudo enviar el pedido. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp Alert to Owner
  const handleSendWhatsAppToOwner = () => {
    if (!orderSuccess) return;
    const itemsList = orderSuccess.items
      .map(it => `  ▪️ ${it.quantity}x ${it.name} - ${formatCOP(it.price * it.quantity)}`)
      .join('\n');

    let pagoDesc = '💵 Contado en efectivo';
    if (orderSuccess.paymentType === 'fiado') {
      pagoDesc = '📝 Fiado a quincena';
    } else if (orderSuccess.paymentMethod === 'nequi') {
      pagoDesc = '📲 Transferencia Nequi';
    } else if (orderSuccess.paymentMethod === 'daviplata') {
      pagoDesc = '📲 Transferencia Daviplata';
    }

    const message = `👋 ¡Hola! Quiero *confirmar mi pedido* de Surtimueve Más:

🛍️ *PRODUCTOS SOLICITADOS:*
${itemsList}

💰 *TOTAL A PAGAR:* *${formatCOP(orderSuccess.total)}*
💳 *FORMA DE PAGO:* ${pagoDesc}
👤 *PEDIDO POR:* *${orderSuccess.customerName}*${orderSuccess.customerArea ? `\n📍 *UBICACIÓN / ÁREA:* ${orderSuccess.customerArea}` : ''}

Quedo atento cuando lo tengas listo. ¡Muchas gracias! 🙌`;

    const cleanPhone = (STORE_OWNER_PHONE || '573174374336').replace(/\D/g, '');
    const destinationNumber = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    const url = `https://wa.me/${destinationNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingBottom: '90px' }}>
      {/* Top Header del Catálogo */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '14px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/logo.jpg" 
              alt="Surtimueve más" 
              style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover' }} 
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38bdf8' }}>Surtimue</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f97316' }}>V</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#38bdf8' }}>e</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f97316', marginLeft: '3px' }}>más</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Catálogo Digital de Oficina · Pide desde tu puesto
              </div>
            </div>
          </div>

          <button 
            type="button"
            className="btn-ghost"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.80rem', 
              fontWeight: 700,
              color: '#0369a1',
              background: '#f0f9ff',
              border: '1.5px solid #bae6fd',
              borderRadius: '999px',
              padding: '7px 14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 3px rgba(2, 132, 199, 0.1)'
            }}
            onClick={onSwitchToAdmin}
            title="Ingreso protegido para administradores con usuario y contraseña"
          >
            <Lock size={14} color="#0284c7" />
            <span>Ingreso Administrador</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="catalog-container">
        {/* Banner de Bienvenida */}
        <div style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '20px 24px',
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(2, 132, 199, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#bae6fd', marginBottom: '6px' }}>
              <Sparkles size={16} />
              Snacks, bebidas y dulces listos para ti
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
              ¿Qué se te antoja hoy?
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#e0f2fe', margin: 0, maxWidth: '520px' }}>
              Elige tus productos favoritos. Puedes pagar de contado o cargarlo a tu cuenta de fiao quincenal.
            </p>
          </div>
        </div>

        {/* Search & Categories Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} 
            />
            <input 
              type="text"
              placeholder="Buscar en el catálogo (Tosh, Papas, Coca Cola, Trident...)"
              className="input"
              style={{ paddingLeft: '42px', fontSize: '0.98rem' }}
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

          {/* Category Chips */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '999px',
                  border: selectedCategory === cat ? '1px solid var(--brand-blue)' : '1.5px solid #cbd5e1',
                  background: selectedCategory === cat ? 'linear-gradient(135deg, var(--brand-blue) 0%, var(--brand-blue-dark) 100%)' : '#ffffff',
                  color: selectedCategory === cat ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="catalog-grid">
          {filteredProducts.map(p => {
            const inCart = cart.find(it => it.id === p.id);
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock > 0 && p.stock <= (p.minStock || 3);

            return (
              <div 
                key={p.id}
                className={`catalog-card ${inCart ? 'in-cart' : ''}`}
                style={{ opacity: isOutOfStock ? 0.6 : 1 }}
              >
                <div>
                  {/* Top: Large Photo Box with Floating Stock Badge */}
                  <div className="catalog-card-image-wrap">
                    <ProductThumbnail 
                      icon={p.icon} 
                      name={p.name} 
                      width="100%" 
                      height="100%" 
                      fit="contain"
                    />

                    {/* Floating Stock Badge */}
                    <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 2 }}>
                      {isOutOfStock ? (
                        <span className="badge badge-danger" style={{ fontSize: '0.68rem', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                          Agotado
                        </span>
                      ) : isLowStock ? (
                        <span className="badge badge-warning" style={{ fontSize: '0.68rem', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                          Últimas {p.stock}
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ fontSize: '0.68rem', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                          Disponible
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Name & Category */}
                  <div style={{ 
                    fontWeight: 800, 
                    fontSize: '0.96rem', 
                    color: 'var(--text-main)', 
                    lineHeight: 1.3, 
                    marginBottom: '3px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '2.4em'
                  }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                    {p.category}
                  </div>
                </div>

                {/* Bottom: Price & Add Button */}
                <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--brand-blue)', marginBottom: '8px' }}>
                    {formatCOP(p.price)}
                  </div>

                  {inCart ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f0f9ff',
                      border: '1.5px solid #bae6fd',
                      borderRadius: 'var(--radius-md)',
                      padding: '4px 6px'
                    }}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(p.id, -1)}
                        style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#fff', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--brand-blue)' }}>
                        {inCart.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(p.id, 1)}
                        disabled={inCart.quantity >= p.stock}
                        style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#fff', border: '1px solid #cbd5e1', cursor: inCart.quantity >= p.stock ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => addToCart(p)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: isOutOfStock ? '#e2e8f0' : 'var(--brand-blue)',
                        color: isOutOfStock ? '#94a3b8' : '#ffffff',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: isOutOfStock ? 'none' : '0 2px 8px rgba(2, 132, 199, 0.25)',
                        transition: 'transform 0.1s ease'
                      }}
                    >
                      <Plus size={16} />
                      <span>{isOutOfStock ? 'Sin stock' : 'Pedir'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>No encontramos productos con "{search}"</p>
            <p style={{ fontSize: '0.84rem' }}>Prueba con otra palabra o revisa otra categoría.</p>
          </div>
        )}

        {/* Footer con crédito permanente */}
        <footer style={{
          textAlign: 'center',
          padding: '24px 16px',
          marginTop: '36px',
          borderTop: '1px solid #e2e8f0',
          fontSize: '0.78rem',
          color: '#64748b'
        }}>
          <div><strong>Surtimueve más</strong> · Catálogo Digital de Oficina</div>
        </footer>
      </main>

      {/* FLOATING BOTTOM CART BAR */}
      {cart.length > 0 && !isCartOpen && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '540px',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          borderRadius: '999px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 30px rgba(2, 132, 199, 0.45)',
          zIndex: 500,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#bae6fd', fontWeight: 600 }}>Tu Pedido:</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900 }}>
                {cartCount} {cartCount === 1 ? 'producto' : 'productos'} · {formatCOP(cartTotal)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            style={{
              background: '#ffffff',
              color: 'var(--brand-blue-dark)',
              border: 'none',
              borderRadius: '999px',
              padding: '10px 20px',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            Ver Pedido ➔
          </button>
        </div>
      )}

      {/* CHECKOUT MODAL / DRAWER */}
      {isCartOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => { if (!isSubmitting) setIsCartOpen(false); }}
          style={{ zIndex: 1100 }}
        >
          <div 
            className="modal-content" 
            style={{ maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto', padding: '24px' }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={22} color="var(--brand-blue)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Confirmar Pedido</h2>
              </div>
              <button 
                onClick={() => { if (!isSubmitting) setIsCartOpen(false); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* List of items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {cart.map(item => (
                <div 
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#f8fafc',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, marginRight: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--brand-blue)', fontWeight: 700 }}>
                      {formatCOP(item.price)} c/u
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button 
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#ffffff', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button 
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#ffffff', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Plus size={12} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'transparent', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '2px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total del pedido:</span>
                <span style={{ fontWeight: 900, color: 'var(--brand-blue)', fontSize: '1.4rem' }}>
                  {formatCOP(cartTotal)}
                </span>
              </div>
            </div>

            {/* FORMULARIO DE COMPRA */}
            <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Sección 1: ¿Quién eres? */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    1. ¿Quién realiza el pedido? *
                  </label>
                  <button
                    type="button"
                    onClick={() => { setIsNewCoworker(!isNewCoworker); setErrorMessage(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--brand-blue)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {isNewCoworker ? '← Seleccionar de la lista' : '+ Soy nuevo / Registrarme'}
                  </button>
                </div>

                {!isNewCoworker ? (
                  <select 
                    className="select"
                    required
                    value={selectedCustomerId}
                    onChange={(e) => { setSelectedCustomerId(e.target.value); setErrorMessage(''); }}
                    style={{ fontSize: '0.92rem' }}
                  >
                    <option value="">-- Elige tu nombre de la lista --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.area ? `(${c.area})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tu Nombre completo: *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="ej. Carlos Gómez"
                        className="input" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)} 
                        autoFocus
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Área / Piso / Puesto (opcional):</label>
                      <input 
                        type="text" 
                        placeholder="ej. Piso 3 - Soporte"
                        className="input" 
                        value={newArea} 
                        onChange={(e) => setNewArea(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Celular / WhatsApp (opcional):</label>
                      <input 
                        type="tel" 
                        placeholder="ej. 3001234567"
                        className="input" 
                        value={newPhone} 
                        onChange={(e) => setNewPhone(e.target.value)} 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sección 2: Forma de Pago */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  2. ¿Cómo vas a pagar? *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => { setPaymentType('fiado'); setPaymentMethod('credito'); }}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: paymentType === 'fiado' ? '2px solid #ea580c' : '1.5px solid #cbd5e1',
                      background: paymentType === 'fiado' ? '#fff7ed' : '#ffffff',
                      color: paymentType === 'fiado' ? '#c2410c' : 'var(--text-muted)',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>💳 Fiado a Quincena</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-dim)' }}>Anotar a mi cuenta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPaymentType('contado'); setPaymentMethod('efectivo'); }}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: paymentType === 'contado' ? '2px solid #16a34a' : '1.5px solid #cbd5e1',
                      background: paymentType === 'contado' ? '#f0fdf4' : '#ffffff',
                      color: paymentType === 'contado' ? '#15803d' : 'var(--text-muted)',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>💵 De Contado</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-dim)' }}>Efectivo / Transferencia</span>
                  </button>
                </div>

                {paymentType === 'contado' && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['efectivo', 'nequi', 'daviplata'].map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: 'var(--radius-sm)',
                          border: paymentMethod === method ? '1px solid var(--brand-blue)' : '1px solid #cbd5e1',
                          background: paymentMethod === method ? 'var(--brand-blue)' : '#f1f5f9',
                          color: paymentMethod === method ? '#fff' : 'var(--text-muted)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          cursor: 'pointer'
                        }}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sección 3: Nota adicional */}
              <div>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Nota opcional para Hamilton:
                </label>
                <input 
                  type="text"
                  placeholder="ej. Por favor bien fría / te la paso a recoger en 5 min"
                  className="input"
                  style={{ fontSize: '0.84rem' }}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>

              {errorMessage && (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center' }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Botón de envío */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={isSubmitting}
                  onClick={() => setIsCartOpen(false)}
                >
                  Seguir Comprando
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, padding: '12px', fontSize: '0.95rem' }}
                  disabled={isSubmitting}
                >
                  <Send size={16} />
                  {isSubmitting ? 'Enviando Pedido…' : `Enviar Pedido (${formatCOP(cartTotal)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PEDIDO EXITOSO */}
      {orderSuccess && (
        <div 
          className="modal-overlay" 
          onClick={() => setOrderSuccess(null)}
          style={{ zIndex: 1200 }}
        >
          <div 
            className="modal-content" 
            style={{ maxWidth: '440px', padding: '28px', textAlign: 'center' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle2 size={34} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '6px', color: 'var(--text-main)' }}>
              ¡Pedido Recibido con Éxito!
            </h3>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.5 }}>
              Gracias <strong>{orderSuccess.customerName}</strong>. Tu pedido ha sido enviado a Hamilton y está en la bandeja de pedidos pendientes de la tienda.
            </p>

            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              textAlign: 'left',
              fontSize: '0.84rem',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Total:</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--brand-blue)' }}>{formatCOP(orderSuccess.total)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Pago:</span>
                <span style={{ fontWeight: 700 }}>
                  {orderSuccess.paymentType === 'fiado' ? 'Fiado a quincena' : `Contado (${orderSuccess.paymentMethod})`}
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                {orderSuccess.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
              </div>
            </div>

            {/* Botón WhatsApp */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn"
                onClick={handleSendWhatsAppToOwner}
                style={{
                  width: '100%',
                  background: '#25D366',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.96rem',
                  padding: '13px',
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
                Confirmar pedido por WhatsApp
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setOrderSuccess(null)}
                style={{ width: '100%', padding: '10px' }}
              >
                Hacer otro pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badge Flotante Animado con Colores y Movimiento */}
      <DevCreditBadge isCatalog={true} />
    </div>
  );
}
