import React, { useState } from 'react';
import { Share2, Copy, Check, MessageSquare, ExternalLink, X, QrCode } from 'lucide-react';

export default function ShareCatalogModal({ isOpen, onClose, onOpenCatalogView }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Construir URL pública del catálogo
  const catalogUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?view=catalogo`
    : 'https://tienda-nando.vercel.app/?view=catalogo';

  const shareText = `¡Hola a todos! 👋 Les comparto el *Catálogo Digital de Surtimueve Más* para que vean los productos disponibles y puedan pedir directamente desde su puesto:

👉 ${catalogUrl}

Pueden pagar de contado o cargarlo al fiao quincenal. ¡A la orden! 🍪🥤🍫`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(catalogUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '460px', padding: '24px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '12px', 
              background: '#e0f2fe', 
              color: 'var(--brand-blue)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Share2 size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Compartir Catálogo Digital
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Enlace para los compañeros de la oficina
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Info card */}
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
          Comparte este enlace por el grupo de WhatsApp de la oficina. Los compañeros podrán ver los precios, el stock disponible y pedir desde su puesto sin ver costos ni reportes.
        </p>

        {/* Link Box */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Enlace directo del catálogo:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              readOnly 
              className="input" 
              value={catalogUrl} 
              style={{ fontSize: '0.84rem', background: '#f8fafc', color: 'var(--brand-blue-dark)', fontWeight: 600 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCopyLink}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', padding: '8px 14px' }}
            >
              {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="btn"
            onClick={handleShareWhatsApp}
            style={{
              width: '100%',
              background: '#25D366',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.94rem',
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
            Compartir por WhatsApp al Grupo
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              onClose();
              if (onOpenCatalogView) onOpenCatalogView();
            }}
            style={{
              width: '100%',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.86rem'
            }}
          >
            <ExternalLink size={15} />
            Abrir y Probar Catálogo Ahora
          </button>
        </div>
      </div>
    </div>
  );
}
