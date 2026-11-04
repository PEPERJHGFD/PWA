const STORAGE_KEY = 'plano-cine-library-v1';
const form = document.querySelector('#title-form');
const grid = document.querySelector('#catalog-grid');
const genreFilter = document.querySelector('#genre-filter');
const searchInput = document.querySelector('#search-input');
const toast = document.querySelector('#toast-notice');
const dialog = document.querySelector('#title-dialog');
const installButton = document.querySelector('#install-button');
const palette = [
  ['#cf8057', '#523b5e'], ['#4c7092', '#1d283c'], ['#ae7457', '#483044'],
  ['#657d69', '#24333b'], ['#aa7b51', '#39334d'], ['#805f99', '#252643']
];

const catalog = [
  { id: 'marea-alta', title: 'Marea alta', posterTitle: 'MAREA<br>ALTA', type: 'movie', genre: 'Drama', year: 2024, rating: '8.4', tagline: 'VOLVER A EMPEZAR', note: 'Dos hermanas regresan al pueblo donde aprendieron a despedirse.', colors: ['#d18160', '#382b4b'], symbol: '✳' },
  { id: 'orbita-cero', title: 'Órbita cero', posterTitle: 'ÓRBITA<br>CERO', type: 'series', genre: 'Ciencia ficción', year: 2025, rating: '9.1', tagline: 'NO ESTAMOS SOLOS', note: 'Una señal perdida pone a prueba a la tripulación de una estación orbital.', colors: ['#4f81a0', '#1b263f'], symbol: '◉' },
  { id: 'casa-limon', title: 'La casa de limón', posterTitle: 'CASA DE<br>LIMÓN', type: 'movie', genre: 'Comedia', year: 2023, rating: '7.8', tagline: 'UN LUGAR MUY PARTICULAR', note: 'Una herencia inesperada reúne a una familia bajo el mismo techo.', colors: ['#c19a57', '#5a463e'], symbol: '☼' },
  { id: 'norte-adentro', title: 'Norte adentro', posterTitle: 'NORTE<br>ADENTRO', type: 'series', genre: 'Misterio', year: 2024, rating: '8.7', tagline: 'EL BOSQUE RECUERDA', note: 'Una periodista vuelve a investigar el caso que cambió su ciudad.', colors: ['#688174', '#263344'], symbol: '⌁' },
  { id: 'ultimo-tren', title: 'El último tren', posterTitle: 'ÚLTIMO<br>TREN', type: 'movie', genre: 'Suspenso', year: 2022, rating: '8.2', tagline: 'DESTINO DESCONOCIDO', note: 'Un viaje nocturno y cinco pasajeros que no son lo que parecen.', colors: ['#795d78', '#29253d'], symbol: '↗' },
  { id: 'jardin-estelar', title: 'Jardín estelar', posterTitle: 'JARDÍN<br>ESTELAR', type: 'series', genre: 'Fantasía', year: 2025, rating: '8.9', tagline: 'CRECER ENTRE MUNDOS', note: 'En un jardín imposible, cada flor guarda un recuerdo ajeno.', colors: ['#648b78', '#3a3654'], symbol: '✿' },
  { id: 'domingo-rojo', title: 'Domingo rojo', posterTitle: 'DOMINGO<br>ROJO', type: 'movie', genre: 'Drama', year: 2021, rating: '7.9', tagline: 'UN DÍA PARA RECORDAR', note: 'Un pequeño gesto cambia el rumbo de tres desconocidos.', colors: ['#b86855', '#453044'], symbol: '◌' },
  { id: 'frecuencia-n', title: 'Frecuencia N', posterTitle: 'FRECUENCIA<br>N', type: 'series', genre: 'Ciencia ficción', year: 2023, rating: '8.5', tagline: 'SINTONIZA EL FUTURO', note: 'Una locutora recibe mensajes de una emisora que no existe.', colors: ['#6976aa', '#292745'], symbol: '⌁' }
];

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => { toast.hidden = true; }, 3200);
}

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      saved: Array.isArray(saved.saved) ? saved.saved.filter((id) => typeof id === 'string') : [],
      favorites: Array.isArray(saved.favorites) ? saved.favorites.filter((id) => typeof id === 'string') : [],
      watched: Array.isArray(saved.watched) ? saved.watched.filter((id) => typeof id === 'string') : [],
      custom: Array.isArray(saved.custom) ? saved.custom.filter((item) => item && typeof item.id === 'string' && typeof item.title === 'string') : []
    };
  } catch (error) {
    showToast('No se pudo leer la biblioteca guardada. Se mostrará el catálogo inicial.');
    return { saved: [], favorites: [], watched: [], custom: [] };
  }
}

let state = readState();
let activeFilter = 'all';
let installPrompt;

function items() {
  return catalog.concat(state.custom);
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    showToast('No se pudo guardar el cambio. Revisa el almacenamiento de tu navegador.');
  }
  updateWidget();
}

function titleType(item) {
  return item.type === 'series' ? 'Serie' : 'Película';
}

function updateGenres() {
  const selected = genreFilter.value || 'all';
  const genres = [...new Set(items().map((item) => item.genre).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  genreFilter.replaceChildren(new Option('Todos', 'all'));
  genres.forEach((genre) => genreFilter.add(new Option(genre, genre)));
  genreFilter.value = genres.includes(selected) ? selected : 'all';
}

function matchesFilter(item) {
  if (activeFilter === 'movie' || activeFilter === 'series') return item.type === activeFilter;
  if (activeFilter === 'saved') return state.saved.includes(item.id) || state.favorites.includes(item.id);
  if (activeFilter === 'watched') return state.watched.includes(item.id);
  return true;
}

function makeButton(className, label, action, id, text) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.setAttribute('aria-label', label);
  button.dataset.action = action;
  button.dataset.id = id;
  button.textContent = text;
  return button;
}

function buildCard(item, index) {
  const saved = state.saved.includes(item.id);
  const favorite = state.favorites.includes(item.id);
  const watched = state.watched.includes(item.id);
  const [colorA, colorB] = item.colors || palette[index % palette.length];
  const card = document.createElement('article');
  card.className = 'movie-card';
  card.style.animationDelay = `${Math.min(index, 7) * 35}ms`;

  const poster = document.createElement('div');
  poster.className = 'poster';
  poster.style.setProperty('--poster', `linear-gradient(145deg, ${colorA}, ${colorB})`);

  const shape = document.createElement('span');
  shape.className = 'poster-shape';
  shape.setAttribute('aria-hidden', 'true');
  const symbol = document.createElement('span');
  symbol.className = 'poster-symbol';
  symbol.setAttribute('aria-hidden', 'true');
  symbol.textContent = item.symbol || '✦';
  const typeLabel = document.createElement('span');
  typeLabel.className = 'poster-top';
  typeLabel.textContent = item.type === 'series' ? 'SERIE' : 'PELÍCULA';
  const posterTitle = document.createElement('span');
  posterTitle.className = 'poster-label';
  const tagline = document.createElement('small');
  tagline.textContent = item.tagline || 'UNA HISTORIA PARA TI';
  const title = document.createElement('strong');
  title.textContent = item.posterTitle ? item.posterTitle.replace(/<br\s*\/?>/gi, ' ') : item.title.toLocaleUpperCase('es');
  posterTitle.append(tagline, title);
  const posterActions = document.createElement('div');
  posterActions.className = 'poster-actions';
  posterActions.append(
    makeButton(`round-action${favorite ? ' active' : ''}`, favorite ? 'Quitar de favoritos' : 'Agregar a favoritos', 'favorite', item.id, favorite ? '♥' : '♡'),
    makeButton('round-action', 'Compartir título', 'share-title', item.id, '↗')
  );
  poster.append(shape, symbol, typeLabel, posterTitle, posterActions);

  const info = document.createElement('div');
  info.className = 'card-info';
  const titleRow = document.createElement('div');
  titleRow.className = 'card-title-row';
  const cardTitle = document.createElement('h3');
  cardTitle.className = 'card-title';
  cardTitle.textContent = item.title;
  const rating = document.createElement('span');
  rating.className = 'rating';
  rating.append(document.createTextNode('★ '), document.createTextNode(item.rating || '—'));
  titleRow.append(cardTitle, rating);
  const meta = document.createElement('div');
  meta.className = 'card-meta';
  const year = document.createElement('span');
  year.textContent = item.year || 'Sin año';
  const separator = document.createElement('i');
  separator.setAttribute('aria-hidden', 'true');
  const genre = document.createElement('span');
  genre.textContent = item.genre || 'Sin género';
  meta.append(year, separator, genre);
  const note = document.createElement('p');
  note.className = 'card-note';
  note.textContent = item.note || item.tagline || 'Una historia para tu próxima noche de cine.';
  const footer = document.createElement('div');
  footer.className = 'card-footer';
  footer.append(
    makeButton(`save-button${saved ? ' saved' : ''}`, saved ? 'Quitar de Mi lista' : 'Agregar a Mi lista', 'save', item.id, saved ? '✓ En Mi lista' : '＋ Mi lista'),
    makeButton(`watched-button${watched ? ' active' : ''}`, watched ? 'Marcar como no vista' : 'Marcar como vista', 'watched', item.id, watched ? '✓' : '○')
  );
  info.append(titleRow, meta, note, footer);
  card.append(poster, info);
  return card;
}

function render() {
  updateGenres();
  const query = searchInput.value.trim().toLocaleLowerCase('es');
  const selectedGenre = genreFilter.value;
  const visible = items().filter((item) => matchesFilter(item)
    && (selectedGenre === 'all' || item.genre === selectedGenre)
    && (!query || `${item.title} ${item.genre} ${item.note || ''} ${item.tagline || ''}`.toLocaleLowerCase('es').includes(query)));

  grid.replaceChildren(...visible.map(buildCard));
  document.querySelector('#empty-state').hidden = visible.length > 0;
  document.querySelector('#collection-count').textContent = `${visible.length} ${visible.length === 1 ? 'título' : 'títulos'}`;
  document.querySelector('#saved-count').textContent = String(new Set([...state.saved, ...state.favorites]).size);

  const heading = {
    all: ['Descubre algo nuevo', 'Historias seleccionadas para tu próxima noche de sofá.'],
    movie: ['Películas para cada momento', 'Elige una historia para disfrutar de principio a fin.'],
    series: ['Una serie para maratonear', 'Nuevos mundos y personajes para seguir capítulo a capítulo.'],
    saved: ['Tu lista personal', 'Todo lo que guardaste para ver después.'],
    watched: ['Historias que ya viviste', 'Tu pequeño registro de películas y series vistas.']
  }[activeFilter];
  document.querySelector('#section-title').textContent = heading[0];
  document.querySelector('#section-description').textContent = heading[1];
  document.querySelectorAll('.filter-button').forEach((button) => {
    const active = button.dataset.filter === activeFilter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function updateWidget() {
  if (!('serviceWorker' in navigator)) return;
  const savedItems = items().filter((item) => state.saved.includes(item.id) || state.favorites.includes(item.id));
  const next = savedItems[0];
  const payload = {
    count: `${savedItems.length}`,
    next: next ? `${next.title} · ${titleType(next)}` : 'Agrega una película o serie a Mi lista',
    updated: `Actualizado ${new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}`
  };
  navigator.serviceWorker.ready.then((registration) => {
    const worker = navigator.serviceWorker.controller || registration.active;
    if (worker) worker.postMessage({ type: 'plano-widget-data', payload });
  }).catch((error) => console.error('No se pudo actualizar el widget de Plano.', error));
}

function libraryText() {
  const savedItems = items().filter((item) => state.saved.includes(item.id) || state.favorites.includes(item.id));
  if (!savedItems.length) return 'Mi lista de Plano\nAún no tienes títulos guardados.';
  return ['Mi lista de Plano', '', ...savedItems.map((item) => {
    const status = state.watched.includes(item.id) ? 'Vista' : 'Pendiente';
    const favorite = state.favorites.includes(item.id) ? ' · Favorita' : '';
    return `${item.title} — ${titleType(item)} (${item.year || 'sin año'}) · ${item.genre || 'sin género'} · ${status}${favorite}`;
  })].join('\n');
}

function downloadText() {
  const blob = new Blob([libraryText()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mi-lista-plano.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function printLibrary() {
  const entries = items().filter((item) => state.saved.includes(item.id) || state.favorites.includes(item.id));
  const rows = entries.map((item) => `<li><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(titleType(item))} · ${escapeHtml(item.year || 'Sin año')} · ${escapeHtml(item.genre || 'Sin género')}</span><p>${escapeHtml(item.note || item.tagline || '')}</p></li>`).join('');
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Permite las ventanas emergentes para imprimir o guardar tu lista como PDF.');
    return;
  }
  printWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Mi lista de Plano</title><style>body{font:15px Arial,sans-serif;max-width:760px;margin:48px auto;color:#222}h1{font-size:28px}p{color:#555}li{padding:14px 0;border-bottom:1px solid #ddd}li span{display:block;color:#666;font-size:12px;margin-top:5px}li p{font-size:13px}</style></head><body><h1>Mi lista de Plano</h1><p>${entries.length} ${entries.length === 1 ? 'título guardado' : 'títulos guardados'}</p><ul>${rows || '<li>Tu lista está vacía.</li>'}</ul><script>window.addEventListener('load',()=>window.print())<\/script></body></html>`);
  printWindow.document.close();
}

function showSharedContentNotice() {
  const params = new URLSearchParams(window.location.search);
  const title = params.get('sharedTitle');
  const text = params.get('sharedText');
  const url = params.get('sharedUrl');
  if (title || text || url) showToast(['Recibiste algo para ver:', title, text, url].filter(Boolean).join(' · '));
}

async function shareContent(title, text) {
  const shareData = { title, text, url: window.location.href };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error && error.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${shareData.url}`);
    showToast('Enlace y selección copiados al portapapeles.');
  } catch (error) {
    showToast('Tu navegador no permite compartir ni copiar el enlace.');
  }
}

function showView(view) {
  activeFilter = view;
  searchInput.value = '';
  genreFilter.value = 'all';
  render();
  document.querySelector('#catalogo').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('[data-view]').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach((navLink) => navLink.classList.toggle('active', navLink === link));
    showView(link.dataset.view === 'discover' ? 'all' : link.dataset.view);
  });
});

document.querySelectorAll('.filter-button').forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    render();
  });
});
searchInput.addEventListener('input', render);
genreFilter.addEventListener('change', render);
grid.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  const item = items().find((entry) => entry.id === id);
  if (!item) return;

  if (action === 'save' || action === 'favorite' || action === 'watched') {
    const key = action === 'save' ? 'saved' : action === 'favorite' ? 'favorites' : 'watched';
    state[key] = state[key].includes(id) ? state[key].filter((entry) => entry !== id) : [...state[key], id];
    saveState();
    render();
    return;
  }
  if (action === 'share-title') await shareContent(`Plano: ${item.title}`, `${item.title} — ${titleType(item)} (${item.year || 'sin año'}) · ${item.genre || 'sin género'}`);
});

document.querySelector('#hero-explore').addEventListener('click', () => showView('all'));
document.querySelector('#hero-add').addEventListener('click', () => dialog.showModal());
document.querySelector('#cancel-add').addEventListener('click', () => dialog.close());
document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const title = String(data.get('title')).trim();
  const custom = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    type: String(data.get('type')),
    genre: String(data.get('genre')).trim() || 'Sin género',
    year: Number(data.get('year')) || '',
    note: String(data.get('note')).trim(),
    tagline: 'A TU PROPIO RITMO',
    colors: palette[state.custom.length % palette.length],
    symbol: '✦'
  };
  state.custom.push(custom);
  state.saved.push(custom.id);
  saveState();
  form.reset();
  form.elements.genre.value = 'Drama';
  dialog.close();
  activeFilter = 'saved';
  render();
  showToast(`${custom.title} ya está en Mi lista.`);
});

document.querySelector('#clear-filters').addEventListener('click', () => {
  activeFilter = 'all';
  searchInput.value = '';
  genreFilter.value = 'all';
  render();
});
document.querySelector('#reset-button').addEventListener('click', () => {
  if (!window.confirm('¿Restablecer tu biblioteca? Se eliminarán los títulos agregados y el seguimiento guardado en este dispositivo.')) return;
  state = { saved: [], favorites: [], watched: [], custom: [] };
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    showToast('No se pudo borrar el almacenamiento del navegador.');
  }
  activeFilter = 'all';
  render();
  showToast('Tu biblioteca volvió a su estado inicial.');
});
document.querySelector('#export-button').addEventListener('click', downloadText);
document.querySelector('#share-button').addEventListener('click', () => shareContent('Mi lista de Plano', libraryText()));
document.querySelector('#help-button').addEventListener('click', () => {
  const guide = document.querySelector('#como-funciona');
  guide.scrollIntoView({ behavior: 'smooth', block: 'center' });
  guide.focus({ preventScroll: true });
});

const fullscreenButton = document.querySelector('#fullscreen-button');
fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch (error) {
    showToast('El navegador no permite cambiar a pantalla completa.');
  }
});
document.addEventListener('fullscreenchange', () => {
  const label = document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa';
  fullscreenButton.title = label;
  fullscreenButton.setAttribute('aria-label', label);
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
document.querySelector('#pdf-share-button').addEventListener('click', printLibrary);
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === 'Escape' && dialog.open) dialog.close();
});

render();
showSharedContentNotice();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').then(updateWidget).catch((error) => {
    console.error('No se pudo registrar el modo sin conexión de Plano.', error);
    showToast('No se pudo activar el modo sin conexión en este navegador.');
  });
}
