import React, { useState } from 'react';
import { 
  Inbox, CheckCircle2, XCircle, Clock, MessageSquare, 
  X, Check, AlertTriangle, ArrowRight, User, ShoppingBag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCOP } from '../data/store';
import { openWhatsApp } from '../utils/whatsapp';

export default function OrdersInboxModal({ 
  isOpen, 
  onClose, 
  orders, 
  onApproveOrder, 
  onRejectOrder 
}) {
  const [filter, setFilter] = useState('pending'); // 'pending' | 'approved' | 'all'
  const [processingId, setProcessingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  if (!isOpen) return null;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const approvedOrders = orders.filter(o => o.status === 'approved');

  const displayedOrders = orders.filter(o => {
    if (filter === 'pending') return o.status === 'pending';
    if (filter === 'approved') return o.status === 'approved';
    return true;
  });

  const handleApprove = async (orderId) => {
    setProcessingId(orderId);
    try {
      await onApproveOrder(orderId);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch (e) {}
      setActionSuccess('¡Pedido aprobado y cargado a las ventas!');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error('Error aprobando pedido:', err);
      alert('Error al aprobar pedido. Intenta nuevamente.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId) => {
    if (!window.confirm('¿Estás seguro de rechazar este pedido?')) return;
    setProcessingId(orderId);
    try {
      await onRejectOrder(orderId);
      setActionSuccess('Pedido rechazado.');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error('Error rechazando pedido:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleNotifyCustomerReady = (order) => {
    const text = `¡Hola ${order.customerName.split(' ')[0]}! 👋 Tu pedido de Surtimueve Más ya está listo para recoger en la caja. ¡Te esperamos!`;
    openWhatsApp(order.customerPhone || '', text);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '680px', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '24px',
          overflow: 'hidden'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '12px', 
              background: '#ffedd5', 
              color: '#ea580c', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Inbox size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Bandeja de Pedidos del Catálogo
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {pendingOrders.length} {pendingOrders.length === 1 ? 'pedido pendiente por aprobar' : 'pedidos pendientes por aprobar'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setFilter('pending')}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: filter === 'pending' ? '1px solid #ea580c' : '1px solid #cbd5e1',
              background: filter === 'pending' ? '#ea580c' : '#ffffff',
              color: filter === 'pending' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Pendientes ({pendingOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('approved')}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: filter === 'approved' ? '1px solid #16a34a' : '1px solid #cbd5e1',
              background: filter === 'approved' ? '#16a34a' : '#ffffff',
              color: filter === 'approved' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Aprobados ({approvedOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: filter === 'all' ? '1px solid var(--brand-blue)' : '1px solid #cbd5e1',
              background: filter === 'all' ? 'var(--brand-blue)' : '#ffffff',
              color: filter === 'all' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Todos ({orders.length})
          </button>
        </div>

        {/* Feedback message */}
        {actionSuccess && (
          <div style={{
            background: '#dcfce7',
            border: '1px solid #86efac',
            color: '#15803d',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.84rem',
            fontWeight: 700,
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            ✓ {actionSuccess}
          </div>
        )}

        {/* Orders list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
          {displayedOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
              <Inbox size={40} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0 0 4px' }}>
                {filter === 'pending' ? 'No hay pedidos pendientes por aprobar' : 'No hay pedidos en esta sección'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>
                Cuando los compañeros pidan desde el catálogo digital, aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            displayedOrders.map(order => {
              const isPending = order.status === 'pending';
              const isApproved = order.status === 'approved';
              const isRejected = order.status === 'rejected';

              return (
                <div 
                  key={order.id}
                  style={{
                    background: isPending ? '#fffdfa' : '#ffffff',
                    border: isPending ? '1.5px solid #fdba74' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px 16px',
                    boxShadow: isPending ? '0 2px 10px rgba(234, 88, 12, 0.08)' : 'var(--shadow-sm)'
                  }}
                >
                  {/* Top Bar of Card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                          {order.customerName}
                        </span>
                        {order.customerArea && (
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', background: '#f1f5f9', padding: '2px 8px', borderRadius: '999px' }}>
                            {order.customerArea}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {new Date(order.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: order.paymentType === 'fiado' ? '#ea580c' : '#16a34a' }}>
                        {formatCOP(order.total)}
                      </div>
                      <span className={order.paymentType === 'fiado' ? 'badge badge-warning' : 'badge badge-success'} style={{ fontSize: '0.7rem' }}>
                        {order.paymentType === 'fiado' ? 'Fiado a quincena' : `Contado (${order.paymentMethod})`}
                      </span>
                    </div>
                  </div>

                  {/* Items detail */}
                  <div style={{ 
                    background: '#f8fafc', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '8px 12px', 
                    fontSize: '0.82rem',
                    marginBottom: '10px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                      Artículos pedidos:
                    </div>
                    {order.items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>• {it.quantity}x {it.name}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{formatCOP(it.price * it.quantity)}</span>
                      </div>
                    ))}
                    {order.notes && (
                      <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', fontStyle: 'italic', color: '#0369a1' }}>
                        💬 Nota del compañero: "{order.notes}"
                      </div>
                    )}
                  </div>

                  {/* Actions according to status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                      Estado: {isPending && <strong style={{ color: '#ea580c' }}>⏳ Pendiente de entrega</strong>}
                      {isApproved && <strong style={{ color: '#16a34a' }}>✓ Aprobado y entregado</strong>}
                      {isRejected && <strong style={{ color: '#dc2626' }}>✕ Rechazado</strong>}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {order.customerPhone && (
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{
                            padding: '6px 10px',
                            color: '#16a34a',
                            border: '1px solid #bbf7d0',
                            background: '#f0fdf4',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          onClick={() => handleNotifyCustomerReady(order)}
                          title="Avisar por WhatsApp al compañero que su pedido está listo"
                        >
                          <MessageSquare size={13} />
                          Avisar
                        </button>
                      )}

                      {isPending && (
                        <>
                          <button
                            type="button"
                            className="btn-ghost"
                            style={{
                              padding: '6px 10px',
                              color: '#dc2626',
                              border: '1px solid #fee2e2',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.78rem',
                              fontWeight: 700
                            }}
                            disabled={processingId === order.id}
                            onClick={() => handleReject(order.id)}
                          >
                            Rechazar
                          </button>

                          <button
                            type="button"
                            className="btn btn-success"
                            style={{
                              padding: '7px 14px',
                              fontSize: '0.84rem',
                              fontWeight: 800,
                              background: '#16a34a',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            disabled={processingId === order.id}
                            onClick={() => handleApprove(order.id)}
                          >
                            <Check size={14} />
                            {processingId === order.id ? 'Aprobando…' : 'Aprobar y Entregar'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
