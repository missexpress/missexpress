// El sitio ya no usa service worker. Este archivo solo existe para que los navegadores que tenian
// instalado el anterior (cuando el sitio era una PWA) lo desinstalen y borren su cache viejo.
// Cuando haya pasado un tiempo (por ejemplo a mediados de 2027) se puede borrar.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
  })());
});
