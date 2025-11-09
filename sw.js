const CACHE_NAME = 'solar-system-v4';
const ASSETS = [
  './',
  'index.html',
  'css/style.css',
  'css/controls.css',
  'css/responsive.css',
  'js/scene.js',
  'js/planets.js',
  'js/controls.js',
  'js/audio.js',
  'js/main.js',
  'js/OrbitControls.js',
  'js/postprocessing.js',
  'assets/favicon.svg',
  'assets/images/mercury.jpg',
  'assets/images/venus.jpg',
  'assets/images/earth.jpg',
  'assets/images/mars.jpg',
  'assets/images/jupiter.jpg',
  'assets/images/saturn.jpg',
  'assets/images/uranus.jpg',
  'assets/images/neptune.jpg',
  'assets/images/pluto.jpg',
  'assets/images/moon.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
});
