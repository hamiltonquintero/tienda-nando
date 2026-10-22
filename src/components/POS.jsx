import React, { useState, useMemo } from 'react';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle, 
  UserPlus, User, CreditCard, DollarSign, AlertTriangle, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CATEGORIES } from '../data/initialProducts';
import { formatCOP } from '../data/store';
import ConfirmModal from './ConfirmModal';

export default function POS({ 
  products, 
  customers, 
  onRecordSale, 
  onAddCustomer,
  activeAdmin,
  cart,
  setCart
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [saleType, setSaleType] = useState('contado'); // 'contado' | 'fiado'
  const [paymentMethod, setPaymentMethod] = useState('efectivo'); // 'efectivo' | 'nequi' | 'daviplata'
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerArea, setNewCustomerArea] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [fiadoError, setFiadoError] = useState(false); // reemplaza el alert()

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

  // Handle Complete Sale
  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (saleType === 'fiado' && !selectedCustomerId) {
      setFiadoError(true);
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);

    const saleRecord = onRecordSale({
      type: saleType,
      customerId: saleType === 'fiado' ? selectedCustomerId : null,
      customerName: saleType === 'fiado' && customer ? customer.name : null,
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        cost: i.cost,
        quantity: i.quantity,
        total: i.price * i.quantity
      })),
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

    // Success toast
    setSuccessToast({
      total: cartTotal,
      type: saleType,
      customer: customer ? customer.name : null
    });
    setTimeout(() => setSuccessToast(null), 4000);

    // Reset cart and selection
    clearCart();
    setSelectedCustomerId('');
    setShowMobileCart(false);
  };

  // Quick Add Customer
  const handleQuickAddCustomer = (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    const added = onAddCustomer({
      name: newCustomerName,
      area: newCustomerArea,
      phone: newCustomerPhone
    });
    setSelectedCustomerId(added.id);
    setIsNewCustomerModalOpen(false);
    setNewCustomerName('');
    setNewCustomerArea('');
    setNewCustomerPhone('');
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
        {/* Search & Categories Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
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
                    <span style={{ fontSize: '1.9rem', lineHeight: 1 }}>{p.icon || '📦'}</span>
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

            {/* If Fiado: Coworker Selector + Quick Add */}
            {saleType === 'fiado' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ea580c' }}>
                    ¿A quién se le fía?
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewCustomerModalOpen(true)}
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
                  style={{ borderColor: selectedCustomerId ? '#ea580c' : '#cbd5e1' }}
                >
                  <option value="">-- Selecciona el compañero --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.area ? `(${c.area})` : ''} - Saldo: {formatCOP(c.totalDebt || 0)}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
              >
                <CheckCircle size={20} />
                {saleType === 'fiado' ? 'Registrar Fiao a Quincena' : 'Cobrar Venta de Contado'}
              </button>
              <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                Atendido por: <strong>{activeAdmin.name}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QUICK ADD CUSTOMER MODAL */}
      {isNewCustomerModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewCustomerModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus color="#38bdf8" />
              Nuevo Compañero para Fiar
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar y Seleccionar
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
