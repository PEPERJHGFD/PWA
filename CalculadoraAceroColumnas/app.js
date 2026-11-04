const form = document.querySelector('#calculator-form');
const installButton = document.querySelector('#install-button');
const shareButton = document.querySelector('#share-button');
const overlay = navigator.windowControlsOverlay;
const numberFormat = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });
let installPrompt;

function buildShareText() {
  const summary = {
    section: `${form.elements.width.value} × ${form.elements.depth.value} cm`,
    height: `${form.elements.height.value} m`,
    barCount: document.querySelector('#longitudinal-result').textContent,
    stirrups: document.querySelector('#ties-result').textContent,
    total: document.querySelector('#total-result').textContent.trim(),
    ratio: `${document.querySelector('#ratio-value').textContent}%`
  };

  return `Estimación de acero para columna\nSección: ${summary.section}\nAltura: ${summary.height}\nCuantía: ${summary.ratio}\nLongitudinal: ${summary.barCount}\nEstribos: ${summary.stirrups}\nCompra estimada: ${summary.total}`;
}

function buildSummaryFile() {
  const summary = buildShareText();
  return new File([summary], 'estimacion-acero-columna.txt', { type: 'text/plain;charset=utf-8' });
}

function escapePdfText(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[×·]/g, 'x')
    .replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/[\\()]/g, '\\$&');
}

function buildPdfFile() {
  const lines = [
    `Seccion: ${form.elements.width.value} x ${form.elements.depth.value} cm`,
    `Altura: ${form.elements.height.value} m`,
    `Cuantia de acero: ${document.querySelector('#ratio-value').textContent}%`,
    `Refuerzo longitudinal: ${document.querySelector('#longitudinal-result').textContent}`,
    `Diametro longitudinal: ${values().barDiameter} mm`,
    `Compra longitudinal: ${document.querySelector('#longitudinal-stock').textContent}`,
    `Estribos: ${document.querySelector('#ties-result').textContent}`,
    `Diametro de estribo: ${values().tieDiameter} mm`,
    `Compra de estribos: ${document.querySelector('#ties-stock').textContent}`,
    `Separacion: ${form.elements.spacing.value} cm`,
    `Desperdicio: ${form.elements.waste.value}%`,
    `Compra estimada total: ${document.querySelector('#total-result').textContent.trim()}`,
    '',
    'Estimacion de cantidades, no es un diseno estructural.',
    'Consulta a un profesional estructural antes de construir.'
  ];
  const textCommands = [
    'BT',
    '/F1 18 Tf',
    '50 790 Td',
    '(Estimacion de acero para columna) Tj',
    '/F1 11 Tf'
  ];

  lines.forEach((line) => {
    textCommands.push('0 -25 Td');
    textCommands.push(`(${escapePdfText(line)}) Tj`);
  });
  textCommands.push('ET');

  const stream = textCommands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new File([pdf], 'estimacion-acero-columna.pdf', { type: 'application/pdf' });
}

function showSharedContentNotice() {
  const params = new URLSearchParams(window.location.search);
  const title = params.get('sharedTitle');
  const text = params.get('sharedText');
  const url = params.get('sharedUrl');

  if (!title && !text && !url) return;

  const message = [
    title && `Compartido: ${title}`,
    text && `Contenido: ${text}`,
    url && `Enlace: ${url}`
  ].filter(Boolean).join('\n');

  if (!window.__appSharedNotice) {
    window.__appSharedNotice = document.createElement('div');
    window.__appSharedNotice.className = 'toast-notice';
    window.__appSharedNotice.setAttribute('role', 'status');
    document.body.appendChild(window.__appSharedNotice);
  }

  window.__appSharedNotice.textContent = message;
  window.__appSharedNotice.hidden = false;
  clearTimeout(window.__appSharedNoticeTimer);
  window.__appSharedNoticeTimer = setTimeout(() => {
    window.__appSharedNotice.hidden = true;
  }, 5000);
}

function debounce(callback, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), wait);
  };
}

const updateWindowsWidget = debounce(() => {
  if (!('serviceWorker' in navigator)) return;

  const payload = {
    section: `${form.elements.width.value} × ${form.elements.depth.value} cm`,
    height: `${form.elements.height.value} m`,
    ratio: `${document.querySelector('#ratio-value').textContent}%`,
    longitudinal: document.querySelector('#longitudinal-result').textContent,
    ties: document.querySelector('#ties-result').textContent,
    purchase: document.querySelector('#total-result').textContent.trim(),
    updated: new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())
  };

  navigator.serviceWorker.ready.then((registration) => {
    const worker = navigator.serviceWorker.controller || registration.active;
    if (worker) worker.postMessage({ type: 'calculator-widget-data', payload });
  }).catch((error) => {
    console.error('No se pudo actualizar el widget de Windows.', error);
  });
}, 300);

function values() {
  const data = new FormData(form);
  const diameterChoice = data.get('barDiameter');
  return {
    width: Number(data.get('width')),
    depth: Number(data.get('depth')),
    height: Number(data.get('height')),
    barCount: Number(data.get('barCount')),
    barDiameter: diameterChoice === 'custom' ? Number(data.get('customBarDiameter')) : Number(diameterChoice),
    tieDiameter: Number(data.get('tieDiameter')),
    spacing: Number(data.get('spacing')),
    cover: Number(data.get('cover')),
    stockLength: Number(data.get('stockLength')),
    waste: Number(data.get('waste'))
  };
}

function format(value, digits = 1) {
  return new Intl.NumberFormat('es-MX', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

function plural(count, singular, pluralLabel = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralLabel}`;
}

function calculate() {
  if (!form.checkValidity()) return;
  const input = values();
  if (input.width <= 2 * input.cover || input.depth <= 2 * input.cover) {
    document.querySelector('[name="cover"]').setCustomValidity('El recubrimiento debe ser menor que la mitad de cada lado.');
    document.querySelector('[name="cover"]').reportValidity();
    document.querySelector('[name="cover"]').setCustomValidity('');
    return;
  }

  const sectionArea = input.width * input.depth;
  const singleBarArea = Math.PI * (input.barDiameter ** 2) / 4 / 100;
  const minimumBarCount = Math.ceil(sectionArea * 0.01 / singleBarArea);
  const steelArea = singleBarArea * input.barCount;
  const ratio = steelArea / sectionArea * 100;
  const longitudinalMeters = input.height * input.barCount;
  const longitudinalPurchase = Math.ceil(longitudinalMeters * (1 + input.waste / 100) / input.stockLength);
  const tieCount = Math.floor(input.height * 100 / input.spacing) + 1;
  const tiePerimeter = 2 * ((input.width - 2 * input.cover) + (input.depth - 2 * input.cover));
  const hookLength = 20 * input.tieDiameter / 1000;
  const tieLength = (tiePerimeter / 100 + hookLength) * tieCount;
  const tiePurchase = Math.ceil(tieLength * (1 + input.waste / 100) / input.stockLength);
  const totalPieces = longitudinalPurchase + tiePurchase;

  document.querySelector('#ratio-value').textContent = format(ratio, 2);
  document.querySelector('#section-area').textContent = `${format(sectionArea)} cm²`;
  document.querySelector('#steel-area').textContent = format(steelArea, 2);
  document.querySelector('#minimum-steel-area').textContent = format(sectionArea * 0.01, 2);
  document.querySelector('#minimum-bar-count').textContent = plural(minimumBarCount, 'barra', 'barras');
  const ratioStatus = document.querySelector('#ratio-status');
  ratioStatus.classList.toggle('warning', ratio < 1 || ratio > 8);
  ratioStatus.classList.toggle('error', ratio > 12);
  ratioStatus.textContent = ratio < 1 ? 'BAJO REFERENCIA' : ratio <= 8 ? 'EN RANGO DE REFERENCIA' : ratio <= 12 ? 'SOBRE REFERENCIA' : 'REVISIÓN NECESARIA';
  document.querySelector('#ratio-fill').style.width = `${Math.min(ratio / 12 * 100, 100)}%`;
  document.querySelector('#ratio-fill').style.background = ratio >= 1 && ratio <= 8 ? '#e8c969' : '#e99365';
  document.querySelector('#longitudinal-result').textContent = plural(input.barCount, 'barra', 'barras');
  document.querySelector('#longitudinal-meters').textContent = `${format(longitudinalMeters)} m netos`;
  document.querySelector('#longitudinal-stock').textContent = `${plural(longitudinalPurchase, 'pieza')} de ${format(input.stockLength)} m`;
  document.querySelector('#ties-result').textContent = plural(tieCount, 'pieza', 'pzas');
  document.querySelector('#ties-length').textContent = `${format(tieLength)} m de varilla`;
  document.querySelector('#ties-stock').textContent = `${plural(tiePurchase, 'pieza')} de ${format(input.stockLength)} m`;
  document.querySelector('#total-result').innerHTML = `${totalPieces} <small>${totalPieces === 1 ? 'varilla' : 'varillas'}</small>`;
  document.querySelector('#total-caption').textContent = `${longitudinalPurchase} longitudinales + ${tiePurchase} para estribos`;
  document.querySelector('#material-note').textContent = `Diámetros de compra: ${input.barDiameter} mm longitudinal · ${input.tieDiameter} mm estribos · ${input.waste}% desperdicio`;
  document.querySelector('.ratio-track').setAttribute('aria-label', `Cuantía de ${format(ratio, 2)} por ciento; referencia de 1 a 8 por ciento`);
  updateWindowsWidget();
}

form.addEventListener('input', calculate);
form.addEventListener('change', calculate);
document.querySelector('#reset-button').addEventListener('click', () => {
  form.reset();
  calculate();
});
document.querySelector('#export-button').addEventListener('click', () => {
  if (!form.reportValidity()) return;
  calculate();
  const summary = [
    'Estimación de acero para columna',
    `Sección: ${form.elements.width.value} × ${form.elements.depth.value} cm`,
    `Altura: ${form.elements.height.value} m`,
    `Refuerzo longitudinal: ${document.querySelector('#longitudinal-result').textContent} (${document.querySelector('#longitudinal-stock').textContent})`,
    `Estribos: ${document.querySelector('#ties-result').textContent} (${document.querySelector('#ties-stock').textContent})`,
    `Compra estimada: ${document.querySelector('#total-result').textContent.trim()}`,
    '',
    'Estimación de cantidades, no diseño estructural.'
  ].join('\n');
  const downloadUrl = URL.createObjectURL(new Blob([summary], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = 'estimacion-acero-columna.txt';
  link.click();
  URL.revokeObjectURL(downloadUrl);
});
const fullscreenButton = document.querySelector('#fullscreen-button');
fullscreenButton.addEventListener('click', async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
});
document.addEventListener('fullscreenchange', () => {
  const isFullscreen = Boolean(document.fullscreenElement);
  fullscreenButton.title = isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa';
  fullscreenButton.setAttribute('aria-label', fullscreenButton.title);
});
document.querySelector('#help-button').addEventListener('click', () => {
  document.querySelector('#criteria').scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.querySelector('#criteria').focus({ preventScroll: true });
});
document.querySelector('[name="barDiameter"]').addEventListener('change', (event) => {
  const customInput = document.querySelector('.custom-diameter');
  customInput.hidden = event.target.value !== 'custom';
  if (!customInput.hidden) customInput.focus();
  calculate();
});
window.addEventListener('online', () => { document.querySelector('#connection-label').textContent = 'En línea'; });
window.addEventListener('offline', () => { document.querySelector('#connection-label').textContent = 'Sin conexión'; });
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});
shareButton.addEventListener('click', async () => {
  const shareData = {
    title: 'Estimación de acero para columna',
    text: buildShareText(),
    url: window.location.href
  };

  const summaryFile = buildSummaryFile();
  const canShareFiles = navigator.canShare && navigator.canShare({ files: [summaryFile] });

  if (navigator.share) {
    try {
      await navigator.share(canShareFiles ? { ...shareData, files: [summaryFile] } : shareData);
      return;
    } catch (error) {
      if (error && error.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(shareData.text);
    window.__appSharedNotice = window.__appSharedNotice || document.createElement('div');
    window.__appSharedNotice.className = 'toast-notice';
    window.__appSharedNotice.setAttribute('role', 'status');
    window.__appSharedNotice.textContent = 'Resultado copiado al portapapeles';
    if (!window.__appSharedNotice.parentNode) document.body.appendChild(window.__appSharedNotice);
    window.__appSharedNotice.hidden = false;
    clearTimeout(window.__appSharedNoticeTimer);
    window.__appSharedNoticeTimer = setTimeout(() => {
      window.__appSharedNotice.hidden = true;
    }, 3000);
  } catch (error) {
    window.alert('Tu navegador no admite compartir ni copiar.');
  }
});
document.querySelector('#pdf-share-button').addEventListener('click', async () => {
  if (!form.reportValidity()) return;
  calculate();

  const pdfFile = buildPdfFile();
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        title: 'Estimación de acero para columna',
        text: 'Resumen de materiales en PDF',
        files: [pdfFile]
      });
      return;
    } catch (error) {
      if (error && error.name === 'AbortError') return;
    }
  }

  const downloadUrl = URL.createObjectURL(pdfFile);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = pdfFile.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  window.alert('El navegador no permite compartir archivos directamente. Se descargó el PDF para que puedas adjuntarlo en Windows.');
});

if (overlay) {
  const updateOverlayState = debounce(() => {
    document.documentElement.dataset.wcoVisible = String(overlay.visible);
  }, 200);
  document.documentElement.dataset.wcoVisible = String(overlay.visible);
  overlay.addEventListener('geometrychange', updateOverlayState);
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch((error) => {
    console.error('No se pudo registrar el service worker de la PWA.', error);
  }));
}
showSharedContentNotice();
calculate();
