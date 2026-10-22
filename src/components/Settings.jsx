import React, { useState } from 'react';
import { 
  Shield, Users, Download, Upload, Smartphone, 
  RefreshCw, CheckCircle, Lock, AlertTriangle, KeyRound, Wifi, Eye, EyeOff, X,
  Share2, Copy, Check
} from 'lucide-react';

export default function Settings({ 
  admins, 
  activeAdmin, 
  onSwitchAdminClick, 
  onExportBackup, 
  onImportBackup, 
  onResetData,
  onUpdateAdminPin,
  onOpenShareCatalog
}) {
  const [importStatus, setImportStatus] = useState('');

  // PIN change modal state
  const [pinModalAdmin, setPinModalAdmin] = useState(null); // admin object being edited
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Reset modal state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const success = onImportBackup(content);
      if (success) {
        setImportStatus('¡Copia de seguridad restaurada con éxito!');
        setTimeout(() => setImportStatus(''), 4000);
      } else {
        setImportStatus('error');
        setTimeout(() => setImportStatus(''), 4000);
      }
    };
    reader.readAsText(file);
    // Reset file input so the same file can be re-imported if needed
    e.target.value = '';
  };

  const handleOpenPinModal = (admin) => {
    setPinModalAdmin(admin);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setPinError('');
    setPinSuccess('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleClosePinModal = () => {
    setPinModalAdmin(null);
  };

  const handleChangePinSubmit = (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (currentPin !== (pinModalAdmin.pin || '1234')) {
      setPinError('El PIN actual es incorrecto.');
      return;
    }
    if (newPin.length < 4) {
      setPinError('El nuevo PIN debe tener al menos 4 dígitos.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('Los PINs nuevos no coinciden.');
      return;
    }
    if (newPin === currentPin) {
      setPinError('El nuevo PIN debe ser diferente al actual.');
      return;
    }

    const ok = onUpdateAdminPin(pinModalAdmin.id, newPin);
    if (ok) {
      setPinSuccess('PIN actualizado correctamente.');
      setTimeout(() => {
        handleClosePinModal();
      }, 1500);
    } else {
      setPinError('Error al actualizar el PIN. Intenta nuevamente.');
    }
  };

  const handleConfirmReset = () => {
    onResetData();
    setResetDone(true);
    setTimeout(() => {
      setShowResetConfirm(false);
      setResetDone(false);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px', margin: '0 auto' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Configuración del Sistema</h2>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Control de administradores, acceso compartido en teléfonos y respaldos
        </div>
      </div>

      {/* 1. ADMINISTRADORES AUTORIZADOS */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} color="#38bdf8" />
          Los 2 Administradores del Sistema
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Solo estas dos personas tienen acceso exclusivo para ingresar stock, registrar ventas de contado y fiar a los compañeros.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {admins.map((admin) => {
            const isActive = admin.id === activeAdmin.id;
            return (
              <div 
                key={admin.id}
                style={{
                  background: isActive ? '#f0f9ff' : '#ffffff',
                  border: isActive ? '2px solid var(--brand-blue)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isActive ? '0 4px 12px rgba(2, 132, 199, 0.12)' : 'var(--shadow-sm)',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-main)' }}>{admin.name}</span>
                    {isActive ? (
                      <span className="badge badge-success">Activo Ahora</span>
                    ) : (
                      <span className="badge badge-info">Autorizado</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {admin.role}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={12} />
                    PIN de acceso: •••• (Personalizado)
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {!isActive && (
                    <button 
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '8px' }}
                      onClick={() => onSwitchAdminClick(admin)}
                    >
                      <KeyRound size={14} />
                      Cambiar a este Administrador
                    </button>
                  )}
                  {/* Cambiar PIN — solo disponible para el admin activo */}
                  {isActive && (
                    <button 
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '8px', color: 'var(--brand-blue)', borderColor: 'var(--brand-blue)' }}
                      onClick={() => handleOpenPinModal(admin)}
                    >
                      <Lock size={14} />
                      Cambiar mi PIN
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CATÁLOGO DIGITAL PARA COMPAÑEROS */}
      <div className="card" style={{ borderLeft: '4px solid #059669', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46' }}>
              <Share2 size={18} color="#059669" />
              Catálogo Digital de Oficina
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', maxWidth: '580px', lineHeight: 1.5 }}>
              Comparte el enlace público con tus compañeros de la oficina por WhatsApp. Ellos verán solo el catálogo con fotos, precios y stock disponible para hacer pedidos desde sus puestos sin tener acceso a tus costos, ganancias ni reportes.
            </p>
          </div>
          {onOpenShareCatalog && (
            <button
              type="button"
              className="btn"
              onClick={onOpenShareCatalog}
              style={{
                background: '#059669',
                color: '#ffffff',
                padding: '9px 18px',
                fontSize: '0.86rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                cursor: 'pointer'
              }}
            >
              <Share2 size={16} />
              <span>Ver y Copiar Enlace</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. CÓMO USAR EN LOS 2 TELÉFONOS */}
      <div className="card" style={{ borderLeft: '4px solid #16a34a', background: '#ffffff' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Smartphone size={18} color="#16a34a" />
          ¿Cómo abrir el sistema en los 2 celulares a la vez?
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          El sistema está optimizado para funcionar como una aplicación móvil tanto en Android como en iPhone:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--brand-blue)' }}>Opción 1: Red Wi-Fi de la empresa (Inmediato)</strong>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
              Mientras este computador tenga el sistema corriendo, abre el navegador de tu celular conectado al mismo Wi-Fi y escribe la dirección IP de tu máquina con el puerto <code>:5173</code> (ejemplo: <code>http://192.168.10.37:5173</code>).
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: '#16a34a' }}>Opción 2: Instalar como App en el Celular</strong>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
              En Chrome o Safari en tu teléfono, abre el menú de opciones (tres puntos o botón compartir) y pulsa <strong>"Añadir a la pantalla de inicio"</strong>. Quedará con el logo de <em>Surtimueve más</em> como una app nativa, rápida y sin barras de navegador.
            </p>
          </div>
        </div>
      </div>

      {/* 3. COPIAS DE SEGURIDAD */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} color="#f97316" />
          Copias de Seguridad (Backup)
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Tus datos (los 35 productos, inventario, deudas de compañeros y ventas) están guardados de forma segura en este navegador. Puedes descargar una copia de seguridad cuando desees.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={onExportBackup}>
            <Download size={16} />
            Descargar Copia de Seguridad (.json)
          </button>

          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={16} />
            Restaurar Copia (.json)
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              onChange={handleFileImport}
            />
          </label>

          {importStatus === 'error' && (
            <span style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 600 }}>
              Archivo inválido. Asegúrate de usar un backup de Surtimueve.
            </span>
          )}
          {importStatus && importStatus !== 'error' && (
            <span style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={14} />
              {importStatus}
            </span>
          )}
        </div>

        {/* Reset de datos */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '20px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#ef4444' }}>Reiniciar Datos a los 35 Productos Iniciales</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Restablece el catálogo del cuaderno y borra el historial de pruebas.</div>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '0.8rem' }}
            onClick={() => setShowResetConfirm(true)}
          >
            <RefreshCw size={14} />
            Reiniciar a Catálogo Inicial
          </button>
        </div>
      </div>

      {/* MODAL: CAMBIAR PIN */}
      {pinModalAdmin && (
        <div className="modal-overlay" onClick={handleClosePinModal}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={20} color="var(--brand-blue)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cambiar PIN de Acceso</h3>
              </div>
              <button onClick={handleClosePinModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Cambiando el PIN de <strong>{pinModalAdmin.name}</strong>. El PIN mínimo es de 4 dígitos.
            </p>

            <form onSubmit={handleChangePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* PIN actual */}
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  PIN actual: *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    className="input"
                    required
                    maxLength={8}
                    autoFocus
                    placeholder="••••"
                    value={currentPin}
                    onChange={(e) => { setCurrentPin(e.target.value); setPinError(''); }}
                    style={{ paddingRight: '44px', letterSpacing: '0.3em', fontWeight: 700 }}
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Nuevo PIN */}
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Nuevo PIN (mínimo 4 dígitos): *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="input"
                    required
                    maxLength={8}
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => { setNewPin(e.target.value); setPinError(''); }}
                    style={{ paddingRight: '44px', letterSpacing: '0.3em', fontWeight: 700 }}
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirmar nuevo PIN */}
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Confirmar nuevo PIN: *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="input"
                    required
                    maxLength={8}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => { setConfirmPin(e.target.value); setPinError(''); }}
                    style={{ paddingRight: '44px', letterSpacing: '0.3em', fontWeight: 700 }}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {pinError && (
                <div style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} />
                  {pinError}
                </div>
              )}
              {pinSuccess && (
                <div style={{ color: '#16a34a', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} />
                  {pinSuccess}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={handleClosePinModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Lock size={15} />
                  Guardar Nuevo PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMACIÓN REINICIAR DATOS */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => !resetDone && setShowResetConfirm(false)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            {resetDone ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <CheckCircle size={48} color="#16a34a" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#16a34a' }}>Datos restablecidos</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>El catálogo inicial se ha cargado correctamente.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <AlertTriangle size={22} color="#ef4444" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>¿Reiniciar todos los datos?</h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
                  Esta acción restaurará el catálogo de los 35 productos originales y borrará todo el historial de ventas, pagos y deudas registradas. <strong style={{ color: '#ef4444' }}>Esta acción no se puede deshacer.</strong>
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowResetConfirm(false)}>
                    Cancelar
                  </button>
                  <button
                    className="btn"
                    style={{ flex: 1, background: '#ef4444', color: '#ffffff' }}
                    onClick={handleConfirmReset}
                  >
                    <RefreshCw size={15} />
                    Sí, reiniciar datos
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
