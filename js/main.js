/* ============================================
   MAIN — App initialization
   ============================================ */

(function () {
  'use strict';

  function init() {
    SolarScene.init();
    Planets.init();
    Controls.init();
    Audio.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Register service worker for PWA / offline support
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
