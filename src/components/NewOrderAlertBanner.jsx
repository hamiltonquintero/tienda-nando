import React from 'react';
import { Bell, ArrowRight, X, ShoppingBag } from 'lucide-react';
import { formatCOP } from '../data/store';

export default function NewOrderAlertBanner({ order, onOpenOrdersInbox, onClose }) {
  if (!order) return null;

  const totalItems = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '560px',
      zIndex: 2000,
      animation: 'slideDownAlert 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 60%, #0ea5e9 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '14px 18px',
        boxShadow: '0 12px 36px rgba(2, 132, 199, 0.45), 0 0 0 2px rgba(255, 255, 255, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        {/* Robot Mascota sorprendido anunciando el pedido */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
          padding: '3px',
          animation: 'bellShake 1.8s ease-in-out infinite'
        }}>
          <img 
            src="/robot/robot-sorprendido.svg" 
            alt="Robot avisando pedido" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* Textos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              background: '#f97316',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 900,
              padding: '2px 7px',
              borderRadius: '999px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              ¡Nuevo Pedido!
            </span>
            <span style={{ fontSize: '0.78rem', color: '#bae6fd', fontWeight: 600 }}>
              Catálogo Digital
            </span>
          </div>

          <div style={{
            fontSize: '0.98rem',
            fontWeight: 800,
            marginTop: '3px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {order.customerName || 'Un compañero'}
          </div>

          <div style={{ fontSize: '0.78rem', color: '#e0f2fe', marginTop: '1px' }}>
            {totalItems} {totalItems === 1 ? 'producto' : 'productos'} · <strong>{formatCOP(order.total || 0)}</strong>
          </div>
        </div>

        {/* Botón de acción */}
        <button
          type="button"
          onClick={() => {
            onOpenOrdersInbox();
            onClose();
          }}
          style={{
            background: '#ffffff',
            color: '#0369a1',
            border: 'none',
            borderRadius: '999px',
            padding: '9px 16px',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            flexShrink: 0,
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span>Revisar</span>
          <ArrowRight size={14} />
        </button>

        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
          title="Ocultar aviso"
        >
          <X size={15} />
        </button>
      </div>

      <style>{`
        @keyframes slideDownAlert {
          0% {
            opacity: 0;
            transform: translate(-50%, -30px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
        @keyframes bellShake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-15deg); }
          60% { transform: rotate(10deg); }
          80% { transform: rotate(-10deg); }
        }
      `}</style>
    </div>
  );
}
