import React, { useState, useMemo } from 'react';
import { 
  Users, Search, UserPlus, DollarSign, MessageSquare, 
  Receipt, ArrowRight, CheckCircle2, AlertCircle, Phone, 
  Sparkles, History, Calendar, Trash2, Pencil
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCOP } from '../data/store';
import ConfirmModal from './ConfirmModal';

export default function DebtorsLedger({ 
  customers, 
  sales, 
  payments, 
  currentPeriod,
  onRecordPayment, 
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  activeAdmin
}) {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('withDebt'); // 'withDebt' | 'all'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  // New / Edit Customer Form State
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [newName, setNewName] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [saveCustomerError, setSaveCustomerError] = useState('');

  // Delete Customer State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Total KPIs
  const totalPendingDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalDebt || 0), 0);
  }, [customers]);

  const debtorsCount = useMemo(() => {
    return customers.filter(c => (c.totalDebt || 0) > 0).length;
  }, [customers]);

  const totalCollectedRecent = useMemo(() => {
    return payments
      .filter(p => currentPeriod && p.periodId === currentPeriod.id)
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments, currentPeriod]);

  // Filtered List
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                            (c.area && c.area.toLowerCase().includes(search.toLowerCase()));
      const matchesDebt = filterMode === 'all' || (c.totalDebt || 0) > 0;
      return matchesSearch && matchesDebt;
    }).sort((a, b) => (b.totalDebt || 0) - (a.totalDebt || 0)); // Highest debt first
  }, [customers, search, filterMode]);

  // Customer sales history
  const customerSales = useMemo(() => {
    if (!selectedCustomer) return [];
    return sales.filter(s => s.customerId === selectedCustomer.id && s.type === 'fiado');
  }, [sales, selectedCustomer]);

  // Customer payments history
  const customerPayments = useMemo(() => {
    if (!selectedCustomer) return [];
    return payments.filter(p => p.customerId === selectedCustomer.id);
  }, [payments, selectedCustomer]);

  // Generate WhatsApp Message
  const generateWhatsAppMessage = (customer) => {
    // Solo incluir ventas fiadas del período actual
    const custSales = sales.filter(s => 
      s.customerId === customer.id && 
      s.type === 'fiado' && 
      currentPeriod && s.periodId === currentPeriod.id
    );
    
    // Group items bought
    const itemsSummary = {};
    custSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!itemsSummary[item.name]) {
          itemsSummary[item.name] = { qty: 0, total: 0 };
        }
        itemsSummary[item.name].qty += item.quantity;
        itemsSummary[item.name].total += item.total;
      });
    });

    let itemsText = '';
    const itemKeys = Object.keys(itemsSummary);
    if (itemKeys.length > 0) {
      itemsText = itemKeys.map(name => `• ${name} (x${itemsSummary[name].qty}) - ${formatCOP(itemsSummary[name].total)}`).join('\n');
    } else {
      itemsText = '• Consumos acumulados de la quincena';
    }

    const message = `¡Hola ${customer.name.split(' ')[0]}! 👋 Te comparto el resumen de tu cuenta en *Surtimueve más* para esta quincena:

${itemsText}

💰 *Saldo total pendiente:* *${formatCOP(customer.totalDebt)}*

Puedes cancelarlo en efectivo o por transferencia (Nequi / Daviplata). ¡Muchas gracias por tu compra! 🙌`;

    return message;
  };

  const handleOpenWhatsApp = (customer) => {
    const text = encodeURIComponent(generateWhatsAppMessage(customer));
    const cleanPhone = (customer.phone || '').replace(/\D/g, '');
    let url = '';
    if (cleanPhone.length >= 10) {
      // Add Colombia prefix 57 if not present
      const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
      url = `https://wa.me/${fullPhone}?text=${text}`;
    } else {
      // Open general WhatsApp web / share
      url = `https://wa.me/?text=${text}`;
    }
    window.open(url, '_blank');
  };

  const handleOpenPayment = (customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount(customer.totalDebt ? customer.totalDebt.toString() : '');
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0 || !selectedCustomer) return;

    onRecordPayment({
      customerId: selectedCustomer.id,
      amount,
      paymentMethod,
      notes: paymentNotes
    });

    if (amount >= selectedCustomer.totalDebt) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {}
    }

    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    setPaymentNotes('');
    
    // Update local selected customer reference
    setSelectedCustomer(prev => prev ? {
      ...prev,
      totalDebt: Math.max(0, (prev.totalDebt || 0) - amount)
    } : null);
  };

  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setNewName('');
    setNewArea('');
    setNewPhone('');
    setSaveCustomerError('');
    setIsAddCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (c) => {
    setEditingCustomer(c);
    setNewName(c.name);
    setNewArea(c.area || '');
    setNewPhone(c.phone || '');
    setSaveCustomerError('');
    setIsAddCustomerModalOpen(true);
  };

  const handleSubmitCustomer = async (e) => {
    e.preventDefault();
    if (!newName.trim() || savingCustomer) return;
    setSavingCustomer(true);
    setSaveCustomerError('');
    try {
      if (editingCustomer) {
        await onUpdateCustomer(editingCustomer.id, {
          name: newName.trim(),
          area: newArea.trim(),
          phone: newPhone.trim()
        });
        if (selectedCustomer?.id === editingCustomer.id) {
          setSelectedCustomer(prev => ({
            ...prev,
            name: newName.trim(),
            area: newArea.trim(),
            phone: newPhone.trim()
          }));
        }
      } else {
        await onAddCustomer({
          name: newName.trim(),
          area: newArea.trim(),
          phone: newPhone.trim()
        });
      }
      setIsAddCustomerModalOpen(false);
      setEditingCustomer(null);
      setNewName('');
      setNewArea('');
      setNewPhone('');
    } catch (err) {
      console.error('[DebtorsLedger] Error guardando compañero:', err);
      setSaveCustomerError('No se pudo guardar. Verifica la conexión e intenta de nuevo.');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDeleteCustomer(deleteTarget.id);
      if (selectedCustomer?.id === deleteTarget.id) {
        setSelectedCustomer(null);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error('[DebtorsLedger] Error eliminando compañero:', err);
      alert('Error al eliminar compañero: ' + (err.message || 'Verifica la conexión.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--brand-orange)', background: '#ffffff' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={16} color="var(--brand-orange)" />
            Total Pendiente por Cobrar
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ea580c', marginTop: '6px' }}>
            {formatCOP(totalPendingDebt)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Acumulado de fiados en la quincena
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--brand-blue)', background: '#ffffff' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} color="var(--brand-blue)" />
            Compañeros con Deuda
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--brand-blue)', marginTop: '6px' }}>
            {debtorsCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>personas</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            De un total de {customers.length} registrados
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #16a34a', background: '#ffffff' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#16a34a" />
            Recaudado en Pagos
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>
            {formatCOP(totalCollectedRecent)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Cobros y abonos de la quincena actual
          </div>
        </div>
      </div>

      {/* Action Bar: Search, Filters, Add Button */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="text"
              placeholder="Buscar compañero por nombre o área..."
              className="input"
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 'var(--radius-md)', padding: '3px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setFilterMode('withDebt')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: filterMode === 'withDebt' ? 'var(--brand-blue)' : 'transparent',
                color: filterMode === 'withDebt' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Con Deuda ({debtorsCount})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: filterMode === 'all' ? 'var(--brand-blue)' : 'transparent',
                color: filterMode === 'all' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Todos ({customers.length})
            </button>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          onClick={handleOpenAddCustomer}
        >
          <UserPlus size={18} />
          Registrar Compañero
        </button>
      </div>

      {/* Debtors List / Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
        {filteredCustomers.map(c => {
          const hasDebt = (c.totalDebt || 0) > 0;
          return (
            <div 
              key={c.id} 
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: hasDebt ? '#fed7aa' : 'var(--border-subtle)',
                background: hasDebt ? '#fffaf5' : '#ffffff',
                boxShadow: hasDebt ? '0 2px 8px rgba(234, 88, 12, 0.08)' : 'var(--shadow-sm)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: hasDebt ? '#ffedd5' : '#e0f2fe',
                      color: hasDebt ? '#ea580c' : '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.05rem'
                    }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{c.name}</h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {c.area || 'Empresa'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>Saldo Actual</div>
                    <div style={{ 
                      fontSize: '1.3rem', 
                      fontWeight: 800, 
                      color: hasDebt ? '#ea580c' : '#16a34a' 
                    }}>
                      {formatCOP(c.totalDebt || 0)}
                    </div>
                  </div>
                </div>

                {c.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    <Phone size={12} color="#16a34a" />
                    <span>WhatsApp: {c.phone}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons for this debtor */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '6px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem' }}
                  onClick={() => setSelectedCustomer(c)}
                >
                  <Receipt size={14} />
                  Ver Detalle
                </button>

                {hasDebt && (
                  <>
                    <button
                      className="btn"
                      style={{ 
                        background: '#25D366', 
                        color: '#ffffff', 
                        padding: '8px 10px', 
                        fontSize: '0.8rem',
                        boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                      }}
                      title="Cobrar por WhatsApp con resumen"
                      onClick={() => handleOpenWhatsApp(c)}
                    >
                      <MessageSquare size={14} />
                      WhatsApp
                    </button>

                    <button
                      className="btn btn-orange"
                      style={{ padding: '8px 10px', fontSize: '0.8rem' }}
                      onClick={() => handleOpenPayment(c)}
                    >
                      <DollarSign size={14} />
                      Abonar
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="btn-ghost"
                  style={{
                    padding: '8px 9px',
                    color: 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #cbd5e1'
                  }}
                  title="Editar datos del compañero"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditCustomer(c);
                  }}
                >
                  <Pencil size={14} />
                </button>

                <button
                  type="button"
                  className="btn-ghost"
                  style={{
                    padding: '8px 9px',
                    color: '#ef4444',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #fee2e2',
                    background: '#fff5f5'
                  }}
                  title="Eliminar compañero"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(c);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCustomers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
            {filterMode === 'withDebt' ? '¡Nadie tiene deudas pendientes en este momento! 🎉' : 'No se encontraron compañeros.'}
          </p>
          <p style={{ fontSize: '0.85rem' }}>Puedes registrar nuevos compañeros con el botón superior.</p>
        </div>
      )}

      {/* CUSTOMER DETAIL MODAL / DRAWER */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>{selectedCustomer.name}</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Área: {selectedCustomer.area || 'General'} {selectedCustomer.phone && `• Tel: ${selectedCustomer.phone}`}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Deuda Total</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: selectedCustomer.totalDebt > 0 ? '#fb923c' : '#10b981' }}>
                  {formatCOP(selectedCustomer.totalDebt || 0)}
                </div>
              </div>
            </div>

            {/* Quick action strip in detail */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              {selectedCustomer.totalDebt > 0 && (
                <>
                  <button 
                    className="btn"
                    style={{ flex: 1, background: '#25D366', color: '#fff' }}
                    onClick={() => handleOpenWhatsApp(selectedCustomer)}
                  >
                    <MessageSquare size={16} />
                    Enviar Cuenta por WhatsApp
                  </button>
                  <button 
                    className="btn btn-orange"
                    style={{ flex: 1 }}
                    onClick={() => handleOpenPayment(selectedCustomer)}
                  >
                    <DollarSign size={16} />
                    Liquidar o Abonar
                  </button>
                </>
              )}
            </div>

            {/* History tabs: Purchases vs Payments */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Receipt size={16} color="#38bdf8" />
                Historial de Compras Fiadas ({customerSales.length})
              </h4>

              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {customerSales.length === 0 ? (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textAlign: 'center', padding: '16px' }}>
                    No hay compras registradas para este compañero.
                  </div>
                ) : (
                  customerSales.map(sale => (
                    <div 
                      key={sale.id}
                      style={{ 
                        background: 'var(--bg-surface-elevated)', 
                        padding: '10px 12px', 
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                          {new Date(sale.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span style={{ fontWeight: 700, color: '#fb923c' }}>{formatCOP(sale.total)}</span>
                      </div>
                      <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                        {sale.items.map(it => `${it.name} (x${it.quantity})`).join(', ')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        Registrado por: {sale.adminName}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Payments History */}
              {customerPayments.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399' }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    Abonos y Pagos Realizados
                  </h4>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {customerPayments.map(pay => (
                      <div 
                        key={pay.id}
                        style={{ 
                          background: 'rgba(16, 185, 129, 0.08)', 
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          padding: '8px 12px', 
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.82rem'
                        }}
                      >
                        <div>
                          <div style={{ color: '#34d399', fontWeight: 700 }}>
                            Pagó {formatCOP(pay.amount)} ({pay.paymentMethod})
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            {new Date(pay.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} • Recibió: {pay.adminName}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                  onClick={() => handleOpenEditCustomer(selectedCustomer)}
                >
                  <Pencil size={13} />
                  Editar Datos
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    fontSize: '0.82rem',
                    padding: '6px 12px'
                  }}
                  onClick={() => setDeleteTarget(selectedCustomer)}
                >
                  <Trash2 size={13} />
                  Eliminar
                </button>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT / ABONO MODAL */}
      {isPaymentModalOpen && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign color="#10b981" />
              Registrar Pago o Abono
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Compañero: <strong>{selectedCustomer.name}</strong> • Saldo actual: <strong style={{ color: '#fb923c' }}>{formatCOP(selectedCustomer.totalDebt)}</strong>
            </p>

            <form onSubmit={handleConfirmPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Monto a Pagar (COP): *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="number"
                    className="input"
                    required
                    min="1"
                    max={selectedCustomer.totalDebt}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Monto"
                    style={{ fontSize: '1.1rem', fontWeight: 700 }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setPaymentAmount(selectedCustomer.totalDebt.toString())}
                    style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}
                  >
                    Pago Total
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Medio de Pago:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['efectivo', 'nequi', 'daviplata'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        border: paymentMethod === m ? '2px solid #10b981' : '1px solid var(--border-subtle)',
                        background: paymentMethod === m ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-surface-elevated)',
                        color: paymentMethod === m ? '#34d399' : 'var(--text-muted)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        textTransform: 'capitalize',
                        cursor: 'pointer'
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Notas u Observaciones (opcional):
                </label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="ej. Pago quincena 15 de Octubre"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  <CheckCircle2 size={16} />
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CUSTOMER MODAL */}
      {isAddCustomerModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsAddCustomerModalOpen(false); setEditingCustomer(null); setSaveCustomerError(''); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editingCustomer ? <Pencil color="#38bdf8" /> : <UserPlus color="#38bdf8" />}
              {editingCustomer ? 'Editar Compañero' : 'Registrar Nuevo Compañero'}
            </h2>
            <form onSubmit={handleSubmitCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Nombre completo: *
                </label>
                <input 
                  type="text" 
                  className="input" 
                  required 
                  placeholder="ej. Diana Marcela Rios"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Área / Piso / Oficina:
                </label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="ej. Comercial / Piso 2"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  WhatsApp / Celular (para cobro automático):
                </label>
                <input 
                  type="tel" 
                  className="input" 
                  placeholder="ej. 3124567890"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => { setIsAddCustomerModalOpen(false); setEditingCustomer(null); setSaveCustomerError(''); }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingCustomer}>
                  {savingCustomer 
                    ? 'Guardando...' 
                    : (editingCustomer ? 'Guardar Cambios' : 'Guardar Compañero')}
                </button>
              </div>

              {saveCustomerError && (
                <div style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, marginTop: '8px', textAlign: 'center' }}>
                  ⚠️ {saveCustomerError}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM DELETE CUSTOMER */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget && (deleteTarget.totalDebt || 0) > 0 ? '¿Eliminar compañero con deuda?' : '¿Eliminar compañero?'}
        message={
          deleteTarget ? (
            (deleteTarget.totalDebt || 0) > 0 ? (
              <span>
                <strong>{deleteTarget.name}</strong> tiene un saldo pendiente de{' '}
                <strong style={{ color: '#ea580c' }}>{formatCOP(deleteTarget.totalDebt)}</strong>.
                <br /><br />
                Si lo eliminas, su historial quedará archivado pero ya no aparecerá en el listado de cobro. ¿Deseas eliminarlo de todos modos?
              </span>
            ) : (
              <span>
                ¿Estás seguro de que deseas eliminar a <strong>{deleteTarget.name}</strong>?
                Esta acción no se puede deshacer.
              </span>
            )
          ) : ''
        }
        confirmLabel={isDeleting ? 'Eliminando...' : 'Eliminar Compañero'}
        cancelLabel="Cancelar"
        danger={true}
        onConfirm={handleConfirmDeleteCustomer}
        onCancel={() => { if (!isDeleting) setDeleteTarget(null); }}
      />
    </div>
  );
}
