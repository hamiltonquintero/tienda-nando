import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, MessageSquare, Download, Share2, Copy, Check, 
  Sparkles, ShieldCheck, CheckCircle2, AlertCircle, Phone,
  CreditCard, ExternalLink, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCOP, getCurrentQuincenaName } from '../data/store';
import { openWhatsApp } from '../utils/whatsapp';

const NU_KEY = '@NZU140';

/**
 * Dibuja un rectángulo con esquinas redondeadas compatible con todos los navegadores
 */
function drawRoundRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle, lineWidth = 1) {
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    const r = typeof radius === 'number' ? radius : 8;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }
  ctx.closePath();

  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Trunca texto si excede el ancho máximo
 */
function fitText(ctx, text, maxWidth) {
  let str = text;
  if (ctx.measureText(str).width <= maxWidth) return str;
  while (str.length > 3 && ctx.measureText(str + '…').width > maxWidth) {
    str = str.slice(0, -1);
  }
  return str + '…';
}

export default function AccountSummaryModal({
  isOpen,
  onClose,
  customer,
  sales = [],
  currentPeriod,
  activeAdmin
}) {
  const [customPhone, setCustomPhone] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState('');
  const [robotPirouette, setRobotPirouette] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');

  const canvasRef = useRef(null);
  const imageBlobRef = useRef(null);

  // Inicializar teléfono del cliente
  useEffect(() => {
    if (customer?.phone) {
      setCustomPhone(customer.phone);
    } else {
      setCustomPhone('');
    }
    setRobotPirouette(false);
    setShareFeedback('');
  }, [customer, isOpen]);

  // Periodo actual (traduce meses en inglés si el nombre viene así desde la BD)
  const periodName = useMemo(() => {
    const raw = currentPeriod?.name || getCurrentQuincenaName();
    const EN_ES = {
      January: 'Enero', February: 'Febrero', March: 'Marzo', April: 'Abril',
      May: 'Mayo', June: 'Junio', July: 'Julio', August: 'Agosto',
      September: 'Septiembre', October: 'Octubre', November: 'Noviembre', December: 'Diciembre'
    };
    return raw.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/g, m => EN_ES[m]);
  }, [currentPeriod]);

  // 1. Filtrar ventas de esta quincena para este cliente
  const currentPeriodSales = useMemo(() => {
    if (!customer) return [];
    return sales.filter(s => 
      s.customerId === customer.id && 
      s.type === 'fiado' && 
      currentPeriod && s.periodId === currentPeriod.id
    );
  }, [sales, customer, currentPeriod]);

  // 2. Agrupar consumos de la quincena
  const { itemsSummary, currentPeriodTotal } = useMemo(() => {
    const summary = {};
    let total = 0;
    currentPeriodSales.forEach(sale => {
      (sale.items || []).forEach(item => {
        if (!summary[item.name]) {
          summary[item.name] = { qty: 0, total: 0, price: item.price };
        }
        summary[item.name].qty += item.quantity;
        summary[item.name].total += (item.price * item.quantity);
        total += (item.price * item.quantity);
      });
    });
    return { itemsSummary: summary, currentPeriodTotal: total };
  }, [currentPeriodSales]);

  // 3. Cálculos de deuda anterior vs actual y saldo a favor
  const totalDebt = customer?.totalDebt || 0;
  const hasDebt = totalDebt > 0;
  const hasCredit = totalDebt < 0;
  const creditAmount = Math.abs(totalDebt);

  // Saldo de quincenas anteriores
  const previousDebt = useMemo(() => {
    if (!hasDebt) return 0;
    if (currentPeriodTotal === 0) return totalDebt;
    if (totalDebt > currentPeriodTotal) {
      return totalDebt - currentPeriodTotal;
    }
    return 0;
  }, [hasDebt, totalDebt, currentPeriodTotal]);

  const itemsList = useMemo(() => Object.entries(itemsSummary), [itemsSummary]);

  // 4. Generar texto para WhatsApp
  const whatsAppMessage = useMemo(() => {
    if (!customer) return '';
    const firstName = customer.name.split(' ')[0] || 'Compañero';

    if (hasCredit) {
      return `¡Hola ${firstName}! 👋 Te comparto tu estado de cuenta en *Surtimueve más*:
📅 _${periodName}_

✨ *¡TIENES SALDO A FAVOR!* ✨
💚 Saldo disponible a tu favor: *+${formatCOP(creditAmount)}*

🎉 Tienes este saldo acumulado para consumir en cualquier momento en snacks y bebidas en la tienda sin necesidad de pagar. ¡Muchas gracias por tu confianza! 🍪🥤

—
🤖 Desarrollado con pasión por Hamilton Q. 🚀`;
    }

    let itemsText = '';
    if (itemsList.length > 0) {
      itemsText = itemsList
        .map(([name, data]) => `  • ${name} (x${data.qty}) - ${formatCOP(data.total)}`)
        .join('\n');
    } else {
      itemsText = '  • Sin compras registradas en esta quincena';
    }

    let previousDebtText = '';
    if (previousDebt > 0) {
      previousDebtText = `\n⏳ *Saldo pendiente de quincenas anteriores:* ${formatCOP(previousDebt)}`;
    }

    return `¡Hola ${firstName}! 👋 Te comparto el resumen de tu cuenta en *Surtimueve más*:
📅 _${periodName}_

🛒 *Consumos de esta quincena:*
${itemsText}${previousDebtText}

💰 *TOTAL A PAGAR:* *${formatCOP(totalDebt)}*

🟣 *Para pagar por Nu / Transfiya:*
🔑 Llave Nu: \`${NU_KEY}\`
_(O en efectivo en la caja registradora de la tienda)_

¡Muchas gracias por tu compra! 🙌
—
🤖 Desarrollado con pasión por Hamilton Q. 🚀`;
  }, [customer, hasCredit, creditAmount, periodName, itemsList, previousDebt, totalDebt]);

  // 5. Generar la imagen del Estado de Cuenta en Canvas
  useEffect(() => {
    if (!isOpen || !customer) return;

    let isCancelled = false;
    setIsGeneratingImg(true);

    const generateImage = async () => {
      try {
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const width = 760;
        // Altura dinámica según la cantidad de productos
        const baseHeight = hasCredit ? 720 : 880;
        const itemsExtraHeight = hasCredit ? 0 : Math.max(0, itemsList.length - 3) * 34;
        const height = baseHeight + itemsExtraHeight;

        // Escala 2x para calidad Retina / HD
        const scale = 2;
        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.scale(scale, scale);

        // Fondo general
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        // Tarjeta principal blanca con sombra sutil
        const cardX = 24;
        const cardY = 24;
        const cardW = width - 48;
        const cardH = height - 48;
        drawRoundRect(ctx, cardX, cardY, cardW, cardH, 24, '#ffffff', '#e2e8f0', 2);

        // Banner superior decorativo
        const bannerColor = hasCredit 
          ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' 
          : 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)';

        const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + 120);
        if (hasCredit) {
          grad.addColorStop(0, '#047857');
          grad.addColorStop(1, '#10b981');
        } else {
          grad.addColorStop(0, '#0369a1');
          grad.addColorStop(1, '#0284c7');
        }
        drawRoundRect(ctx, cardX, cardY, cardW, 116, [24, 24, 0, 0], grad, null, 0);

        // Cargar y dibujar Logo si está disponible
        try {
          const logoImg = new window.Image();
          logoImg.crossOrigin = 'anonymous';
          await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve; // continuar si falla
            logoImg.src = '/logo.png';
          });
          if (logoImg.complete && logoImg.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cardX + 60, cardY + 58, 36, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(logoImg, cardX + 24, cardY + 22, 72, 72);
            ctx.restore();
          }
        } catch (e) {}

        // Títulos en el Banner
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('SURTIMUEVE MÁS', cardX + 110, cardY + 48);

        ctx.fillStyle = hasCredit ? '#d1fae5' : '#bae6fd';
        ctx.font = '600 14px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(hasCredit ? '✨ COMPROBANTE DE SALDO A FAVOR' : '📋 ESTADO DE CUENTA Y RESUMEN', cardX + 110, cardY + 74);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(periodName, cardX + cardW - 24, cardY + 62);

        // ── Datos del Compañero ────────────────────────────
        let currentY = cardY + 144;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#64748b';
        ctx.font = '700 11px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('COMPAÑERO / CLIENTE:', cardX + 24, currentY);

        currentY += 24;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(customer.name, cardX + 24, currentY);

        if (customer.area) {
          ctx.fillStyle = '#0284c7';
          ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText(`Área: ${customer.area}`, cardX + 24, currentY + 20);
          currentY += 20;
        }

        // Línea divisoria
        currentY += 18;
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cardX + 24, currentY);
        ctx.lineTo(cardX + cardW - 24, currentY);
        ctx.stroke();

        // ── Si tiene Saldo a Favor ────────────────────────
        if (hasCredit) {
          currentY += 32;

          // Caja Verde de Saldo a Favor
          drawRoundRect(ctx, cardX + 24, currentY, cardW - 48, 140, 18, '#ecfdf5', '#6ee7b7', 2);

          ctx.textAlign = 'center';
          ctx.fillStyle = '#047857';
          ctx.font = 'bold 16px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText('✨ TIENES SALDO A FAVOR EN LA TIENDA ✨', cardX + (cardW / 2), currentY + 40);

          ctx.fillStyle = '#059669';
          ctx.font = '900 42px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText(`+${formatCOP(creditAmount)}`, cardX + (cardW / 2), currentY + 90);

          ctx.fillStyle = '#065f46';
          ctx.font = '500 13px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText('Disponible para cualquier antojo, snack o bebida en Surtimueve Más.', cardX + (cardW / 2), currentY + 120);

          currentY += 165;
        } else {
          // ── Modo Deuda: Desglose de Consumos ───────────────
          currentY += 26;
          ctx.textAlign = 'left';
          ctx.fillStyle = '#475569';
          ctx.font = 'bold 13px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText('🛒 CONSUMOS REGISTRADOS EN ESTA QUINCENA:', cardX + 24, currentY);

          currentY += 14;

          if (itemsList.length === 0) {
            currentY += 24;
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'italic 13px "Plus Jakarta Sans", system-ui, sans-serif';
            ctx.fillText('No hay compras directas registradas en este período.', cardX + 32, currentY);
            currentY += 10;
          } else {
            itemsList.forEach(([name, data]) => {
              currentY += 26;
              // Fondo de línea alternado
              drawRoundRect(ctx, cardX + 24, currentY - 18, cardW - 48, 26, 6, '#f8fafc', null, 0);

              ctx.fillStyle = '#1e293b';
              ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
              ctx.textAlign = 'left';
              const nameText = fitText(ctx, `• ${data.qty}x  ${name}`, cardW - 200);
              ctx.fillText(nameText, cardX + 34, currentY);

              ctx.fillStyle = '#0f172a';
              ctx.font = 'bold 13px "Plus Jakarta Sans", system-ui, sans-serif';
              ctx.textAlign = 'right';
              ctx.fillText(formatCOP(data.total), cardX + cardW - 36, currentY);
            });
          }

          // Saldo de quincenas anteriores (si aplica)
          if (previousDebt > 0) {
            currentY += 34;
            drawRoundRect(ctx, cardX + 24, currentY - 18, cardW - 48, 30, 8, '#fff7ed', '#fed7aa', 1.5);

            ctx.fillStyle = '#c2410c';
            ctx.font = 'bold 13px "Plus Jakarta Sans", system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('⏳ Saldo acumulado quincenas anteriores:', cardX + 34, currentY + 2);

            ctx.font = '900 13px "Plus Jakarta Sans", system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(formatCOP(previousDebt), cardX + cardW - 36, currentY + 2);
          }

          // ── Caja Destacada de Total a Pagar ──────────────
          currentY += 40;
          const totalBoxH = 88;
          const totalGrad = ctx.createLinearGradient(cardX + 24, currentY, cardX + cardW - 24, currentY + totalBoxH);
          totalGrad.addColorStop(0, '#ea580c');
          totalGrad.addColorStop(1, '#f97316');
          drawRoundRect(ctx, cardX + 24, currentY, cardW - 48, totalBoxH, 18, totalGrad, null, 0);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffedd5';
          ctx.font = '800 12px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText('TOTAL PENDIENTE A CANCELAR:', cardX + 46, currentY + 34);

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 34px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText(formatCOP(totalDebt), cardX + 46, currentY + 70);

          currentY += totalBoxH + 20;

          // ── Bloque Morado Nu (Datos de Pago) ─────────────
          const nuBoxH = 74;
          drawRoundRect(ctx, cardX + 24, currentY, cardW - 48, nuBoxH, 16, '#f5f3ff', '#c084fc', 2);

          // Badge Nu
          drawRoundRect(ctx, cardX + 40, currentY + 16, 42, 42, 12, '#820ad1', null, 0);
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 18px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Nu', cardX + 61, currentY + 43);

          ctx.textAlign = 'left';
          ctx.fillStyle = '#581c87';
          ctx.font = 'bold 12px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText('PAGA FÁCIL CON TU LLAVE NU / TRANSFIYA:', cardX + 96, currentY + 30);

          ctx.fillStyle = '#820ad1';
          ctx.font = '900 22px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText(NU_KEY, cardX + 96, currentY + 56);

          ctx.fillStyle = '#6b21a8';
          ctx.font = '600 11px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('o en efectivo en la tienda', cardX + cardW - 42, currentY + 44);

          currentY += nuBoxH + 18;
        }

        // ── Pie de Página: Hamilton Q. + Robot Pirueta ─────
        const footerY = cardY + cardH - 52;
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cardX + 24, footerY);
        ctx.lineTo(cardX + cardW - 24, footerY);
        ctx.stroke();

        // Cargar SVG del robot para el Canvas
        try {
          const robotImg = new window.Image();
          robotImg.crossOrigin = 'anonymous';
          await new Promise((resolve) => {
            robotImg.onload = resolve;
            robotImg.onerror = resolve;
            robotImg.src = '/robot/robot-celebrando.svg';
          });
          if (robotImg.complete && robotImg.naturalWidth > 0) {
            ctx.save();
            // Pirueta: rotado 15 grados en el aire
            ctx.translate(cardX + 44, footerY + 26);
            ctx.rotate(-0.15);
            ctx.drawImage(robotImg, -18, -18, 36, 40);
            ctx.restore();
          }
        } catch (e) {}

        ctx.textAlign = 'left';
        ctx.fillStyle = '#64748b';
        ctx.font = '600 11px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('Desarrollado con pasión por', cardX + 70, footerY + 22);

        ctx.fillStyle = '#0284c7';
        ctx.font = '800 12px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('Hamilton Q. 🚀', cardX + 70, footerY + 38);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('Surtimueve más · Sistema de Ventas', cardX + cardW - 24, footerY + 30);

        if (!isCancelled) {
          const uri = canvas.toDataURL('image/png', 0.95);
          setPreviewImageUri(uri);
          // Guardar también el Blob listo para copiarlo al portapapeles al instante
          canvas.toBlob((blob) => {
            if (!isCancelled) imageBlobRef.current = blob;
          }, 'image/png');
        }
      } catch (err) {
        console.error('[AccountSummaryModal] Error generando imagen canvas:', err);
      } finally {
        if (!isCancelled) setIsGeneratingImg(false);
      }
    };

    generateImage();

    return () => { isCancelled = true; };
  }, [isOpen, customer, itemsList, hasCredit, creditAmount, previousDebt, totalDebt, periodName]);

  if (!isOpen || !customer) return null;

  // Acciones
  const handleTriggerPirouette = () => {
    setRobotPirouette(true);
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.75, x: 0.5 }
      });
    } catch (e) {}
    setTimeout(() => setRobotPirouette(false), 1400);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(whatsAppMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyNuKey = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(NU_KEY);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleDownloadImage = () => {
    if (!previewImageUri) return;
    const cleanName = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
    const a = document.createElement('a');
    a.href = previewImageUri;
    a.download = `Estado_Cuenta_${cleanName}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Botón principal: va DIRECTO al chat de WhatsApp del compañero.
  // Antes copia la imagen al portapapeles para pegarla con Ctrl+V (o "Pegar" en el celular).
  const handleShareImageOrWhatsApp = async () => {
    let imageCopied = false;
    const blob = imageBlobRef.current;
    if (blob && navigator.clipboard?.write && typeof window.ClipboardItem !== 'undefined') {
      try {
        await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
        imageCopied = true;
      } catch (e) {
        console.warn('No se pudo copiar la imagen al portapapeles:', e);
      }
    }

    openWhatsApp(customPhone, whatsAppMessage);

    setShareFeedback(
      imageCopied
        ? '✅ Imagen copiada. En el chat de WhatsApp pega la imagen con Ctrl + V (o mantén presionado → Pegar).'
        : 'Se abrió WhatsApp con el mensaje. Si quieres enviar la imagen, usa "Descargar Imagen" y adjúntala.'
    );
    setTimeout(() => setShareFeedback(''), 9000);
  };

  // Botón secundario: menú nativo de compartir (útil en celular para adjuntar la foto)
  const handleNativeShareImage = async () => {
    const blob = imageBlobRef.current;
    if (!blob || !navigator.canShare) {
      handleDownloadImage();
      return;
    }
    try {
      const file = new File([blob], `Estado_Cuenta_${customer.name}.png`, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Estado de Cuenta - ${customer.name}`,
          text: whatsAppMessage
        });
        return;
      }
      handleDownloadImage();
    } catch (e) {
      if (e?.name !== 'AbortError') console.warn('Share API falló:', e);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content"
        style={{
          maxWidth: '560px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '22px',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: hasCredit ? '#dcfce7' : '#ffedd5',
              color: hasCredit ? '#15803d' : '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {hasCredit ? <Sparkles size={22} /> : <CreditCard size={22} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {hasCredit ? 'Comprobante de Saldo a Favor' : 'Resumen de Cuenta de Cobro'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {customer.name} · {periodName}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Tarjeta Previsualización */}
          <div style={{
            background: hasCredit ? '#f0fdf4' : '#fffaf5',
            border: hasCredit ? '2px solid #86efac' : '2px solid #fed7aa',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            position: 'relative'
          }}>
            {/* Header Tarjeta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '10px', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: hasCredit ? '#15803d' : '#c2410c', letterSpacing: '0.04em' }}>
                  {hasCredit ? 'Saldo a Favor' : 'Cuenta de Cobro'}
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {customer.name}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Total</span>
                <span style={{ 
                  fontSize: '1.45rem', 
                  fontWeight: 900, 
                  color: hasCredit ? '#10b981' : '#ea580c' 
                }}>
                  {hasCredit ? `+${formatCOP(creditAmount)}` : formatCOP(totalDebt)}
                </span>
              </div>
            </div>

            {/* Desglose */}
            {!hasCredit && (
              <div style={{ fontSize: '0.82rem', marginBottom: '12px' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  🛒 Consumos de la quincena:
                </div>
                {itemsList.length === 0 ? (
                  <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', paddingLeft: '8px' }}>
                    Sin consumos en esta quincena
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
                    {itemsList.map(([name, data]) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', color: '#1e293b' }}>
                        <span>• {name} (x{data.qty})</span>
                        <strong style={{ color: '#0f172a' }}>{formatCOP(data.total)}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {previousDebt > 0 && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 10px',
                    background: '#fff1f2',
                    border: '1px solid #fecdd3',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#be123c',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}>
                    <span>⏳ Saldo quincenas anteriores:</span>
                    <span>{formatCOP(previousDebt)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Caja Destacada NU */}
            {!hasCredit && (
              <div style={{
                background: '#f5f3ff',
                border: '1.5px solid #c084fc',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#820ad1',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    Nu
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }}>
                      Llave de pago Nu:
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#820ad1' }}>
                      {NU_KEY}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyNuKey}
                  className="btn-ghost"
                  style={{
                    padding: '5px 10px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: copiedKey ? '#16a34a' : '#820ad1',
                    background: '#ffffff',
                    border: '1px solid #d8b4fe',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Copiar llave Nu"
                >
                  {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                  {copiedKey ? 'Copiada' : 'Copiar'}
                </button>
              </div>
            )}

            {/* Footer con Robot y Hamilton Q. */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              fontSize: '0.74rem',
              color: 'var(--text-dim)'
            }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={handleTriggerPirouette}
                title="¡Haz clic en el robot para verlo hacer una pirueta!"
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  animation: robotPirouette ? 'robotPirouetteAnim 1s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                  display: 'inline-block'
                }}>
                  <img 
                    src="/robot/robot-celebrando.svg" 
                    alt="Robot Hamilton Q." 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <span>
                  Desarrollado por <strong style={{ color: 'var(--brand-blue)' }}>Hamilton Q.</strong> 🚀
                </span>
              </div>

              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Surtimueve más</span>
            </div>
          </div>

          {/* Estado de la Imagen Generada */}
          {previewImageUri && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              background: '#f8fafc', 
              padding: '8px 12px', 
              borderRadius: '10px', 
              border: '1px solid #e2e8f0', 
              fontSize: '0.78rem' 
            }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} color="#16a34a" />
                Imagen PNG HD lista para compartir ({hasCredit ? 'Saldo a favor' : 'Cobro'})
              </span>
              <button
                type="button"
                onClick={handleDownloadImage}
                className="btn-ghost"
                style={{ fontSize: '0.74rem', padding: '3px 8px', color: 'var(--brand-blue)', fontWeight: 700, cursor: 'pointer' }}
              >
                Descargar PNG
              </button>
            </div>
          )}

          {/* Campo Celular / WhatsApp */}
          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
              <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
              WhatsApp del compañero:
            </label>
            <input 
              type="tel"
              className="input"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              placeholder="ej. 3124567890 (o déjalo vacío para elegir chat)"
              style={{ fontSize: '0.86rem', padding: '8px 12px' }}
            />
          </div>

          {/* Canvas oculto usado para generar la imagen */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Feedback de compartir si aplica */}
          {shareFeedback && (
            <div style={{
              background: '#ecfdf5',
              color: '#059669',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '8px 12px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              {shareFeedback}
            </div>
          )}

          <style>{`
            @keyframes robotPirouetteAnim {
              0% { transform: scale(1) rotate(0deg) translateY(0); }
              20% { transform: scale(1.35) rotate(-35deg) translateY(-10px); }
              45% { transform: scale(1.4) rotate(180deg) translateY(-16px); }
              70% { transform: scale(1.3) rotate(320deg) translateY(-8px); }
              85% { transform: scale(1.15) rotate(375deg) translateY(-3px); }
              100% { transform: scale(1) rotate(360deg) translateY(0); }
            }
          `}</style>
        </div>

        {/* Botones de Acción */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginTop: '14px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}>
          {/* Botón Principal: Compartir / Enviar por WhatsApp */}
          <button
            type="button"
            className="btn"
            onClick={handleShareImageOrWhatsApp}
            style={{
              width: '100%',
              background: '#25D366',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.94rem',
              padding: '11px',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <MessageSquare size={18} />
            <span>Abrir Chat de WhatsApp (imagen copiada)</span>
          </button>

          {/* Botones Secundarios */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleNativeShareImage}
              disabled={isGeneratingImg}
              style={{
                flex: 1,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '8px'
              }}
              title="Abrir el menú de compartir del dispositivo (ideal en celular para adjuntar la foto)"
            >
              <Share2 size={14} />
              {isGeneratingImg ? 'Generando imagen…' : 'Compartir Imagen'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCopyText}
              style={{
                flex: 1,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '8px'
              }}
              title="Copiar texto formateado al portapapeles"
            >
              {copiedText ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              {copiedText ? '¡Texto Copiado!' : 'Copiar Texto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
