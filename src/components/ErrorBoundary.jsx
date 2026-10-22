import React from 'react';

/**
 * ErrorBoundary global — atrapa errores de renderizado en cualquier hijo
 * y muestra una pantalla de recuperación en lugar de una pantalla en blanco.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Error atrapado:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleClearStorage = () => {
    try {
      // Solo borra las claves del sistema, no todo el localStorage
      Object.keys(localStorage)
        .filter(k => k.startsWith('surtimueve_'))
        .forEach(k => localStorage.removeItem(k));
    } catch {
      // ignorar
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '36px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
            Algo salió mal
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>
            La aplicación encontró un error inesperado. Puedes intentar recargar la pantalla. Si el problema persiste, limpia los datos del navegador (esto no borrará tus ventas del servidor).
          </p>

          {this.state.error && (
            <details style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              textAlign: 'left',
              fontSize: '0.78rem',
              color: '#991b1b',
              cursor: 'pointer'
            }}>
              <summary style={{ fontWeight: 700, marginBottom: '6px' }}>Detalle técnico del error</summary>
              <code style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                {this.state.error.message}
              </code>
            </details>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Reintentar
            </button>
            <button
              onClick={this.handleClearStorage}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #e2e8f0',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Limpiar caché y recargar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
