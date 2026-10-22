// Utilidad de Notificaciones Audibles y Visuales para Nuevos Pedidos
// Diseñado para funcionar 100% offline y en tiempo real sin dependencias externas

let audioCtx = null;
let titleBlinkerInterval = null;
const ORIGINAL_TITLE = 'Surtimueve más - Sistema de Inventario y Fiao';

/**
 * Genera un timbre alegre y nítido de notificación ("Ding-Dong!" / Caja Registradora)
 * usando la Web Audio API nativa sin requerir archivos de audio externos.
 */
export const playOrderChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    if (!audioCtx || audioCtx.state === 'suspended') {
      audioCtx = new AudioContext();
    }

    const now = audioCtx.currentTime;

    // Primer tono (Agudo brillante - 784Hz / Sol5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Segundo tono (Armónico alegre - 1046.5Hz / Do6)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1046.5, now + 0.12);
    gain2.gain.setValueAtTime(0.4, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);

    // Tercer tono (Cierre de timbre brillante - 1318.5Hz / Mi6)
    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1318.51, now + 0.25);
    gain3.gain.setValueAtTime(0.45, now + 0.25);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    osc3.connect(gain3);
    gain3.connect(audioCtx.destination);
    osc3.start(now + 0.25);
    osc3.stop(now + 0.85);
  } catch (err) {
    console.warn('[orderNotification] No se pudo reproducir el timbre:', err);
  }
};

/**
 * Solicita permiso al usuario para mostrar notificaciones nativas en el sistema
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('[orderNotification] Error solicitando permiso:', err);
    return 'error';
  }
};

/**
 * Consulta el estado actual de los permisos de notificación
 */
export const getNotificationPermissionStatus = () => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

/**
 * Muestra una notificación nativa emergente en Windows, Android o Mac
 */
export const showSystemNotification = (order) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    const customerName = order.customerName || 'Un compañero';
    const totalItems = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
    const totalFormatted = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.total || 0);

    const title = `🔔 ¡Nuevo Pedido de ${customerName}!`;
    const body = `${totalItems} ${totalItems === 1 ? 'producto' : 'productos'} · Total: ${totalFormatted}\nToca para revisar y entregar.`;

    const notification = new Notification(title, {
      body,
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      tag: `order-${order.id || Date.now()}`,
      renotify: true,
      requireInteraction: true // Permanece hasta que el usuario interactúe
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (err) {
    console.warn('[orderNotification] Error mostrando notificación nativa:', err);
  }
};

/**
 * Hace parpadear el título de la pestaña del navegador para captar la atención visual
 */
export const updateTabTitleAlert = (pendingCount) => {
  if (titleBlinkerInterval) {
    clearInterval(titleBlinkerInterval);
    titleBlinkerInterval = null;
  }

  if (pendingCount <= 0) {
    document.title = ORIGINAL_TITLE;
    return;
  }

  let isAlert = true;
  document.title = `🔴 (${pendingCount}) ¡NUEVO PEDIDO! - Surtimueve más`;

  titleBlinkerInterval = setInterval(() => {
    isAlert = !isAlert;
    document.title = isAlert 
      ? `🔴 (${pendingCount}) ¡NUEVO PEDIDO!` 
      : `🛍️ Surtimueve más (${pendingCount} pend.)`;
  }, 1200);
};
