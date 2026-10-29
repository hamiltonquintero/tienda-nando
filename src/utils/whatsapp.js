// Utilidad centralizada para abrir WhatsApp con un mensaje prellenado.
//
// Se usa api.whatsapp.com/send en lugar de wa.me porque el redireccionamiento
// de wa.me (especialmente hacia WhatsApp Desktop en Windows) puede dañar los
// emojis y mostrarlos como "�".

/**
 * Normaliza un teléfono colombiano: deja solo dígitos y antepone 57 si hace falta.
 * Devuelve '' si el número no es válido (menos de 10 dígitos).
 */
export const normalizeColombianPhone = (phone = '') => {
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length < 10) return '';
  return clean.startsWith('57') && clean.length > 10 ? clean : `57${clean}`;
};

/**
 * Construye la URL de WhatsApp con texto (y teléfono opcional).
 */
export const buildWhatsAppUrl = (phone, text = '') => {
  const params = new URLSearchParams();
  const fullPhone = normalizeColombianPhone(phone);
  if (fullPhone) params.set('phone', fullPhone);
  // Normalizar a NFC evita que algunos caracteres compuestos se rompan
  if (text) params.set('text', String(text).normalize('NFC'));
  return `https://api.whatsapp.com/send?${params.toString()}`;
};

/**
 * Abre WhatsApp en una nueva pestaña con el mensaje indicado.
 */
export const openWhatsApp = (phone, text = '') => {
  window.open(buildWhatsAppUrl(phone, text), '_blank');
};

