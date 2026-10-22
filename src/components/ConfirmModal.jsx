import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Modal de confirmación reutilizable.
 * 
 * Props:
 *   isOpen       — boolean
 *   title        — string
 *   message      — string | ReactNode
 *   confirmLabel — string (default: "Confirmar")
 *   cancelLabel  — string (default: "Cancelar")
 *   danger       — boolean — aplica estilo rojo al botón de confirmar
 *   onConfirm    — () => void
 *   onCancel     — () => void
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content"
        style={{ maxWidth: '420px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} color={danger ? '#ef4444' : '#d97706'} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{title}</h3>
          </div>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.87rem', color: 'var(--text-muted)', marginBottom: '22px', lineHeight: 1.6 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className="btn"
            style={{
              background: danger
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, var(--brand-blue) 0%, var(--brand-blue-dark) 100%)',
              color: '#ffffff',
              boxShadow: danger
                ? '0 3px 10px rgba(239, 68, 68, 0.25)'
                : '0 3px 10px rgba(2, 132, 199, 0.25)'
            }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
