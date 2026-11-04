const CACHE_NAME = 'plano-cine-v2';
const WIDGET_DATA_CACHE = 'plano-widget-data-v1';
const WIDGET_TAG = 'plano-watchlist';
const WIDGET_DATA_URL = new URL('./widgets/watchlist-data.json', self.location.href).href;
const APP_FILES = [
  './', './index.html', './styles.css', './app.js', './manifest.webmanifest', './icon.svg',
  './icon-192.png', './icon-512.png', './widgets/watchlist-template.json', './widgets/watchlist-data.json',
  './widgets/widget-screenshot.png'
];

async function updateWidget(widget) {
  if (!self.widgets || typeof self.widgets.updateByTag !== 'function') return;

  const templateUrl = new URL(widget.definition.msAcTemplate, self.registration.scope);
  const dataUrl = new URL(widget.definition.data, self.registration.scope);
  const [templateResponse, dataResponse] = await Promise.all([
    fetch(templateUrl),
    caches.open(WIDGET_DATA_CACHE).then((cache) => cache.match(dataUrl.href))
      .then(async (cached) => cached || await caches.match(dataUrl.href) || fetch(dataUrl))
  ]);
  if (!templateResponse.ok || !dataResponse.ok) throw new Error('No se pudo cargar el widget de Plano.');

  await self.widgets.updateByTag(widget.definition.tag, {
    template: await templateResponse.text(),
    data: await dataResponse.text()
  });
}

async function refreshWidget() {
  if (!self.widgets || typeof self.widgets.getByTag !== 'function') return;
  const widget = await self.widgets.getByTag(WIDGET_TAG);
  if (widget) await updateWidget(widget);
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME && key !== WIDGET_DATA_CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
    await refreshWidget();
  })());
});

self.addEventListener('widgetinstall', (event) => {
  event.waitUntil((async () => {
    await updateWidget(event.widget);

    const { periodicSync } = self.registration;
    const { tag, update } = event.widget.definition;
    if (periodicSync && update) {
      try {
        const tags = await periodicSync.getTags();
        if (!tags.includes(tag)) await periodicSync.register(tag, { minInterval: update });
      } catch (error) {
        console.error('No se pudo programar la actualización periódica del widget de Plano.', error);
      }
    }
  })());
});

self.addEventListener('widgetuninstall', (event) => {
  event.waitUntil((async () => {
    const { periodicSync } = self.registration;
    const { tag, update } = event.widget.definition;
    if (periodicSync && update && event.widget.instances.length === 1) await periodicSync.unregister(tag);
  })());
});

self.addEventListener('widgetresume', (event) => event.waitUntil(updateWidget(event.widget)));
self.addEventListener('periodicsync', (event) => {
  if (event.tag === WIDGET_TAG) event.waitUntil(refreshWidget());
});
self.addEventListener('widgetclick', (event) => {
  if (event.action === 'open-watchlist') event.waitUntil(self.clients.openWindow(new URL('./#catalogo', self.registration.scope).href));
});

self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'plano-widget-data') return;
  event.waitUntil((async () => {
    const cache = await caches.open(WIDGET_DATA_CACHE);
    await cache.put(WIDGET_DATA_URL, new Response(JSON.stringify(event.data.payload), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    }));
    await refreshWidget();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'GET' && url.href === WIDGET_DATA_URL) {
    event.respondWith((async () => {
      const cache = await caches.open(WIDGET_DATA_CACHE);
      return await cache.match(WIDGET_DATA_URL) || await caches.match(WIDGET_DATA_URL) || fetch(event.request);
    })());
    return;
  }

  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => {
    const navigationFallback = event.request.mode === 'navigate' ? caches.match('./index.html') : null;
    return cached || navigationFallback || fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
    });
  }));
});
