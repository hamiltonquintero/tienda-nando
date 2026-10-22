import React, { useState } from 'react';

/**
 * ProductThumbnail
 * Muestra la imagen real del producto si es una URL, Base64 o ruta pública.
 * Si no hay imagen o falla la carga, muestra el sticker/emoji con respaldo a '📦'.
 */
export default function ProductThumbnail({ icon, name = 'Producto', size = 46, style = {}, className = '' }) {
  const [hasError, setHasError] = useState(false);

  const isImg = Boolean(
    icon && (
      icon.startsWith('http://') ||
      icon.startsWith('https://') ||
      icon.startsWith('data:image/') ||
      icon.startsWith('/') ||
      icon.startsWith('./')
    )
  );

  const widthStyle = typeof size === 'number' ? `${size}px` : size;
  const heightStyle = typeof size === 'number' ? `${size}px` : size;

  if (isImg && !hasError) {
    return (
      <img
        src={icon}
        alt={name}
        onError={() => setHasError(true)}
        className={className}
        style={{
          width: widthStyle,
          height: heightStyle,
          objectFit: 'contain',
          borderRadius: '10px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          padding: '2px',
          flexShrink: 0,
          ...style
        }}
      />
    );
  }

  // Fallback a emoji o sticker
  const emoji = (icon && !isImg) ? icon : '📦';

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: widthStyle,
        height: heightStyle,
        fontSize: typeof size === 'number' ? `${Math.round(size * 0.55)}px` : '1.6rem',
        lineHeight: 1,
        borderRadius: '10px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        flexShrink: 0,
        userSelect: 'none',
        ...style
      }}
    >
      {emoji}
    </span>
  );
}
