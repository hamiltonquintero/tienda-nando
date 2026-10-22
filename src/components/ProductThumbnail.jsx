import React, { useState } from 'react';

/**
 * ProductThumbnail
 * Muestra la imagen real del producto si es una URL, Base64 o ruta pública.
 * Si no hay imagen o falla la carga, muestra el sticker/emoji con respaldo a '📦'.
 * Soporta dimensiones fijas o porcentaje (ej. width: '100%', height: '140px').
 */
export default function ProductThumbnail({ 
  icon, 
  name = 'Producto', 
  size = 46, 
  width, 
  height, 
  fit = 'contain', 
  style = {}, 
  className = '' 
}) {
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

  const widthStyle = width !== undefined 
    ? (typeof width === 'number' ? `${width}px` : width) 
    : (typeof size === 'number' ? `${size}px` : size);

  const heightStyle = height !== undefined 
    ? (typeof height === 'number' ? `${height}px` : height) 
    : (typeof size === 'number' ? `${size}px` : size);

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
          objectFit: fit,
          borderRadius: '10px',
          background: 'transparent',
          flexShrink: 0,
          ...style
        }}
      />
    );
  }

  // Fallback a emoji o sticker
  const emoji = (icon && !isImg) ? icon : '📦';

  // Calcular tamaño de fuente proporcional si el alto es numérico
  let fontSizeStyle = '1.6rem';
  if (typeof height === 'number') {
    fontSizeStyle = `${Math.min(64, Math.round(height * 0.45))}px`;
  } else if (typeof size === 'number') {
    fontSizeStyle = `${Math.round(size * 0.55)}px`;
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: widthStyle,
        height: heightStyle,
        fontSize: fontSizeStyle,
        lineHeight: 1,
        borderRadius: '10px',
        background: 'transparent',
        flexShrink: 0,
        userSelect: 'none',
        ...style
      }}
    >
      {emoji}
    </span>
  );
}
