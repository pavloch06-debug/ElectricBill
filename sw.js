const CACHE = 'elec-v3'; // Змінюй версію (v3, v4...), коли суттєво оновлюєш дизайн чи формули
const ASSETS = ['./index.html', './manifest.json'];

// Встановлення: кешуємо початкові файли
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting(); // Примусово активувати новий SW
});

// Активація: видаляємо старі версії кешу
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Розумне кешування: віддаємо копію з кешу миттєво, але у фоні качаємо оновлення з мережі
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open(CACHE).then(cache => {
      return cache.match(e.request).then(cachedResponse => {
        // Фоновий запит в мережу для перевірки оновлень
        const fetchPromise = fetch(e.request).then(networkResponse => {
          if (networkResponse.status === 200) {
            cache.put(e.request, networkResponse.clone()); // Оновлюємо кеш новою версією
          }
          return networkResponse;
        }).catch(() => {/* Ігноруємо помилки мережі (офлайн) */});

        // Повертаємо закешовану версію (якщо є) або чекаємо відповіді з мережі
        return cachedResponse || fetchPromise;
      });
    })
  );
});