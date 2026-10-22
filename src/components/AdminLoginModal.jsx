import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, X, ArrowLeft } from 'lucide-react';

export default function AdminLoginModal({ 
  isOpen, 
  onClose, 
  admins = [], 
  onLoginSuccess 
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setError('Por favor ingresa tu usuario.');
      return;
    }
    if (!cleanPass) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }

    setIsSubmitting(true);

    // Buscar admin por username, name o id
    const matchedAdmin = admins.find(a => {
      const aName = (a.name || '').toLowerCase();
      const aUser = (a.username || '').toLowerCase();
      const aId = (a.id || '').toLowerCase();
      return aName === cleanUser || aUser === cleanUser || aId === cleanUser;
    });

    if (!matchedAdmin) {
      setError('Usuario no encontrado. Verifica el nombre ingresado.');
      setIsSubmitting(false);
      return;
    }

    // Verificar contraseña (almacenada en a.pin o a.password)
    const validPassword = matchedAdmin.pin || matchedAdmin.password;
    if (cleanPass !== validPassword) {
      setError('Contraseña incorrecta. Intenta nuevamente.');
      setIsSubmitting(false);
      return;
    }

    // Éxito
    setIsSubmitting(false);
    setUsername('');
    setPassword('');
    setError('');
    onLoginSuccess(matchedAdmin);
  };

  const handleSelectQuickUser = (name) => {
    setUsername(name);
    setError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1300 }}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '420px', padding: '28px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Acceso de Administrador
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Surtimueve más · Panel de Control
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Acceso rápido por perfil (Pills) */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>
            Selecciona tu usuario o escríbelo:
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {admins.map(admin => {
              const adminDisplayName = admin.name.split(' ')[0];
              const isSelected = username.toLowerCase() === adminDisplayName.toLowerCase() || username.toLowerCase() === admin.name.toLowerCase();
              return (
                <button
                  key={admin.id}
                  type="button"
                  onClick={() => handleSelectQuickUser(adminDisplayName)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid #0284c7' : '1.5px solid #cbd5e1',
                    background: isSelected ? '#f0f9ff' : '#ffffff',
                    color: isSelected ? '#0284c7' : '#334155',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <User size={15} />
                  <span>{adminDisplayName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Campo Usuario */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
              Usuario:
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <User size={17} />
              </div>
              <input 
                type="text"
                className="input"
                required
                placeholder="Ej. Alejandra o Fernando"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                style={{ paddingLeft: '38px', fontSize: '0.92rem' }}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
              Contraseña:
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Lock size={17} />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'}
                className="input"
                required
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                style={{ paddingLeft: '38px', paddingRight: '40px', fontSize: '0.95rem' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ flex: 1 }} 
              onClick={onClose}
              disabled={isSubmitting}
            >
              <ArrowLeft size={16} />
              Catálogo
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 2, padding: '12px', fontSize: '0.95rem' }}
              disabled={isSubmitting}
            >
              <ShieldCheck size={18} />
              {isSubmitting ? 'Verificando…' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
