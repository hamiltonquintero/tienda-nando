import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Calendar, DollarSign, TrendingUp, Archive, 
  Printer, ArrowUpRight, ArrowDownLeft, CheckCircle2, 
  Receipt, ShoppingBag, Clock, ShieldCheck, RotateCcw, AlertTriangle, X
} from 'lucide-react';
import { formatCOP } from '../data/store';

export default function Reports({ 
  sales, 
  payments, 
  currentPeriod, 
  archivedPeriods, 
  onClosePeriod,
  onCancelSale,
  activeAdmin 
}) {
  const [selectedPeriodId, setSelectedPeriodId] = useState(currentPeriod.id);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'contado' | 'fiado'
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  // Estado para Anulación de Venta con PIN
  const [cancellingSale, setCancellingSale] = useState(null);
  const [cancelPin, setCancelPin] = useState('');
  const [cancelPinError, setCancelPinError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccessToast, setCancelSuccessToast] = useState('');

  const isCurrentPeriod = selectedPeriodId === currentPeriod.id;

  // Filter sales & payments for selected period
  const periodSales = useMemo(() => {
    return sales.filter(s => s.periodId === selectedPeriodId);
  }, [sales, selectedPeriodId]);

  const periodPayments = useMemo(() => {
    return payments.filter(p => p.periodId === selectedPeriodId);
  }, [payments, selectedPeriodId]);

  // Calculations
  const totalCashSales = useMemo(() => {
    return periodSales.filter(s => s.type === 'contado').reduce((acc, s) => acc + s.total, 0);
  }, [periodSales]);

  const totalCreditSales = useMemo(() => {
    return periodSales.filter(s => s.type === 'fiado').reduce((acc, s) => acc + s.total, 0);
  }, [periodSales]);

  const totalCollectedFromCredits = useMemo(() => {
    return periodPayments.reduce((acc, p) => acc + p.amount, 0);
  }, [periodPayments]);

  const totalRealCashInHand = totalCashSales + totalCollectedFromCredits;

  const totalSalesOverall = totalCashSales + totalCreditSales;

  // Estimated Profit
  const estimatedProfit = useMemo(() => {
    return periodSales.reduce((acc, sale) => {
      const saleCost = sale.items.reduce((costSum, item) => {
        const itemCost = item.cost || (item.price * 0.7);
        return costSum + (itemCost * item.quantity);
      }, 0);
      return acc + (sale.total - saleCost);
    }, 0);
  }, [periodSales]);

  // Top Products
  const topProducts = useMemo(() => {
    const map = {};
    periodSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!map[item.name]) map[item.name] = { qty: 0, total: 0 };
        map[item.name].qty += item.quantity;
        map[item.name].total += item.total;
      });
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [periodSales]);

  // Combined timeline of events
  const timelineEvents = useMemo(() => {
    const list = [
      ...periodSales.map(s => ({ ...s, eventType: 'sale' })),
      ...periodPayments.map(p => ({ ...p, eventType: 'payment' }))
    ];
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [periodSales, periodPayments]);

  const filteredTimeline = useMemo(() => {
    if (filterType === 'contado') return timelineEvents.filter(e => e.eventType === 'sale' && e.type === 'contado');
    if (filterType === 'fiado') return timelineEvents.filter(e => e.eventType === 'sale' && e.type === 'fiado');
    return timelineEvents;
  }, [timelineEvents, filterType]);

  const handleExecuteCancelSale = async (e) => {
    e.preventDefault();
    if (!cancellingSale || !onCancelSale) return;

    if (cancelPin !== (activeAdmin?.pin || '1234')) {
      setCancelPinError('PIN incorrecto. Intenta de nuevo.');
      return;
    }

    setIsCancelling(true);
    setCancelPinError('');
    try {
      await onCancelSale(cancellingSale.id);
      const totalCancelled = cancellingSale.total;
      setCancellingSale(null);
      setCancelPin('');
      setCancelSuccessToast(`Venta de ${formatCOP(totalCancelled)} anulada. Stock repuesto correctamente.`);
      setTimeout(() => setCancelSuccessToast(''), 4500);
    } catch (err) {
      console.error('Error al anular venta:', err);
      setCancelPinError('Error al anular la venta. Intenta nuevamente.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmClosePeriod = () => {
    onClosePeriod();
    setIsCloseModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar with Period Selector & Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={22} color="#38bdf8" />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Resumen Quincenal & Caja</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Reportes financieros y balance de cobranza
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            className="select" 
            style={{ width: 'auto' }}
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
          >
            <option value={currentPeriod.id}>📌 Actual: {currentPeriod.name}</option>
            {archivedPeriods.map(ap => (
              <option key={ap.id} value={ap.id}>📁 {ap.name} (Cerrada)</option>
            ))}
          </select>

          <button className="btn btn-secondary" onClick={handlePrint} title="Imprimir o guardar PDF">
            <Printer size={16} />
            <span className="desktop-only">Imprimir</span>
          </button>

          {isCurrentPeriod && (
            <button className="btn btn-orange" onClick={() => setIsCloseModalOpen(true)}>
              <Archive size={16} />
              Cerrar Quincena
            </button>
          )}
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ borderLeft: '4px solid #16a34a', background: '#ffffff' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={16} color="#16a34a" />
            Efectivo / Nequi en Caja
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>
            {formatCOP(totalRealCashInHand)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Contado ({formatCOP(totalCashSales)}) + Cobros fiados ({formatCOP(totalCollectedFromCredits)})
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--brand-orange)', background: '#ffffff' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Receipt size={16} color="var(--brand-orange)" />
            Total Fiado en la Quincena
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ea580c', marginTop: '6px' }}>
            {formatCOP(totalCreditSales)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Ventas a crédito concedidas a compañeros
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--brand-blue)', background: '#ffffff' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShoppingBag size={16} color="var(--brand-blue)" />
            Total Ventas Brutas
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--brand-blue)', marginTop: '6px' }}>
            {formatCOP(totalSalesOverall)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            {periodSales.length} transacciones realizadas
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #7c3aed', background: '#ffffff' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} color="#7c3aed" />
            Ganancia Neta Estimada
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7c3aed', marginTop: '6px' }}>
            {formatCOP(estimatedProfit)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Utilidad después del costo de mercancía
          </div>
        </div>
      </div>

      {/* Top 5 Products Bar */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="var(--brand-blue)" />
          Top 5 Productos Más Vendidos en esta Quincena
        </h3>

        {topProducts.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No hay ventas registradas en esta quincena aún.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {topProducts.map((tp, idx) => (
              <div 
                key={tp.name}
                style={{ 
                  background: '#f8fafc', 
                  padding: '12px', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div style={{ 
                  width: '30px', 
                  height: '30px', 
                  borderRadius: '50%', 
                  background: 'var(--brand-blue)', 
                  color: '#fff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.82rem'
                }}>
                  #{idx + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{tp.name}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {tp.qty} unid. • {formatCOP(tp.total)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History Timeline */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Movimientos de la Quincena</h3>

          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 'var(--radius-sm)', padding: '3px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                padding: '5px 12px',
                border: 'none',
                borderRadius: '4px',
                background: filterType === 'all' ? 'var(--brand-blue)' : 'transparent',
                color: filterType === 'all' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('contado')}
              style={{
                padding: '5px 12px',
                border: 'none',
                borderRadius: '4px',
                background: filterType === 'contado' ? 'var(--brand-blue)' : 'transparent',
                color: filterType === 'contado' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Contado
            </button>
            <button
              onClick={() => setFilterType('fiado')}
              style={{
                padding: '5px 12px',
                border: 'none',
                borderRadius: '4px',
                background: filterType === 'fiado' ? 'var(--brand-blue)' : 'transparent',
                color: filterType === 'fiado' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Fiados
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Fecha & Hora</th>
                <th style={{ padding: '12px 16px' }}>Tipo</th>
                <th style={{ padding: '12px 16px' }}>Detalle / Compañero</th>
                <th style={{ padding: '12px 16px' }}>Atendido Por</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Monto</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTimeline.map((item, idx) => {
                const isPayment = item.eventType === 'payment';
                const isCredit = item.eventType === 'sale' && item.type === 'fiado';

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                      {new Date(item.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {isPayment ? (
                        <span className="badge badge-success">Abono Recibido</span>
                      ) : isCredit ? (
                        <span className="badge badge-warning">Fiado (Crédito)</span>
                      ) : (
                        <span className="badge badge-info">Contado ({item.paymentMethod})</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {isPayment ? (
                        <div>
                          <strong>{item.customerName}</strong>
                          {item.notes && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '6px' }}>({item.notes})</span>}
                        </div>
                      ) : (
                        <div>
                          {isCredit && <strong style={{ color: '#ea580c' }}>{item.customerName}: </strong>}
                          <span>{item.items.map(it => `${it.name} (x${it.quantity})`).join(', ')}</span>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {item.adminName}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: isPayment ? '#16a34a' : isCredit ? '#ea580c' : 'var(--brand-blue)' }}>
                      {isPayment ? `+${formatCOP(item.amount)}` : formatCOP(item.total)}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {!isPayment && isCurrentPeriod && onCancelSale ? (
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{
                            padding: '5px 10px',
                            color: '#dc2626',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid #fee2e2',
                            background: '#fff5f5',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                          title="Anular venta accidental y reponer stock"
                          onClick={() => {
                            setCancellingSale(item);
                            setCancelPin('');
                            setCancelPinError('');
                          }}
                        >
                          <RotateCcw size={13} />
                          <span>Anular</span>
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredTimeline.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No hay transacciones que coincidan con el filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ANULACIÓN DE VENTA CON CONFIRMACIÓN DE PIN */}
      {cancellingSale && (
        <div 
          className="modal-overlay" 
          onClick={() => { if (!isCancelling) setCancellingSale(null); }}
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
                  borderRadius: '12px', 
                  background: '#fee2e2', 
                  color: '#dc2626', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <RotateCcw size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    ¿Anular esta Venta?
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Esta acción revertirá los cambios en el sistema.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { if (!isCancelling) setCancellingSale(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Resumen de la venta */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '0.84rem',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Total de la venta:</span>
                <strong style={{ fontSize: '1.05rem', color: cancellingSale.type === 'fiado' ? '#ea580c' : 'var(--brand-blue)' }}>
                  {formatCOP(cancellingSale.total)}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Tipo:</span>
                <span style={{ fontWeight: 700 }}>
                  {cancellingSale.type === 'fiado' 
                    ? `Fiado (${cancellingSale.customerName})` 
                    : `Contado (${cancellingSale.paymentMethod})`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Hora:</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  {new Date(cancellingSale.date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Efectos de la anulación */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', fontSize: '0.82rem' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: '#15803d' }}>
                <strong>🟢 Reposición de Stock Automática:</strong>
                <div style={{ marginTop: '4px', fontSize: '0.78rem' }}>
                  {cancellingSale.items.map(it => `+${it.quantity} ${it.name}`).join(' • ')}
                </div>
              </div>

              {cancellingSale.type === 'fiado' && cancellingSale.customerName && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: '#c2410c' }}>
                  <strong>🟠 Descuento de Deuda:</strong>
                  <div style={{ marginTop: '2px', fontSize: '0.78rem' }}>
                    Se descontarán <strong>{formatCOP(cancellingSale.total)}</strong> del saldo deudor de <strong>{cancellingSale.customerName}</strong>.
                  </div>
                </div>
              )}
            </div>

            {/* Formulario con confirmación de PIN */}
            <form onSubmit={handleExecuteCancelSale}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Ingresa tu PIN de Administrador ({activeAdmin?.name}):
                </label>
                <input 
                  type="password"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="PIN de 4 dígitos"
                  className="input"
                  style={{
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    letterSpacing: '0.3em',
                    fontWeight: 800,
                    padding: '8px'
                  }}
                  value={cancelPin}
                  onChange={(e) => {
                    setCancelPin(e.target.value);
                    setCancelPinError('');
                  }}
                />
                {cancelPinError && (
                  <div style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, marginTop: '6px', textAlign: 'center' }}>
                    ⚠️ {cancelPinError}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  disabled={isCancelling}
                  onClick={() => setCancellingSale(null)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn" 
                  style={{ flex: 1, background: '#dc2626', color: '#fff', fontWeight: 700 }}
                  disabled={isCancelling || !cancelPin}
                >
                  {isCancelling ? 'Anulando…' : 'Confirmar Anulación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST FEEDBACK DE ANULACIÓN */}
      {cancelSuccessToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #10b981',
          backdropFilter: 'blur(12px)',
          borderRadius: 'var(--radius-xl)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          zIndex: 1200,
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '0.88rem'
        }}>
          <CheckCircle2 size={20} color="#10b981" />
          <span>{cancelSuccessToast}</span>
        </div>
      )}

      {/* CLOSE QUINCENA CONFIRMATION MODAL */}
      {isCloseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCloseModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fb923c' }}>
              <Archive color="#fb923c" />
              ¿Cerrar y Archivar la Quincena Actual?
            </h2>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Estás por cerrar <strong>{currentPeriod.name}</strong>. Se creará un registro histórico con el balance de ventas y comenzará una nueva quincena fresca.
            </p>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Dinero total recaudado en caja:</span>
                <strong style={{ color: '#34d399' }}>{formatCOP(totalRealCashInHand)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Ventas totales (Contado + Fiado):</span>
                <strong>{formatCOP(totalSalesOverall)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Cerrado por:</span>
                <strong>{activeAdmin.name}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setIsCloseModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-orange" onClick={handleConfirmClosePeriod}>
                Confirmar y Cerrar Quincena
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
