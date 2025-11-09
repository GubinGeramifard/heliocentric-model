/* ============================================
   CONTROLS — Speed, pause, view toggles, keyboard,
   search, share, scale, gravity, constellations
   ============================================ */

const Controls = (() => {
  const pauseBtn = document.getElementById('btn-pause');
  const speedSlider = document.getElementById('speed-slider');
  const speedDisplay = document.getElementById('speed-value');
  const resetBtn = document.getElementById('btn-reset');
  const orbitsBtn = document.getElementById('btn-orbits');
  const trailsBtn = document.getElementById('btn-trails');
  const compareBtn = document.getElementById('btn-compare');
  const tourBtn = document.getElementById('btn-tour');
  const screenshotBtn = document.getElementById('btn-screenshot');
  const constellBtn = document.getElementById('btn-constellations');
  const spacecraftBtn = document.getElementById('btn-spacecraft');
  const scaleBtn = document.getElementById('btn-scale');
  const gravityBtn = document.getElementById('btn-gravity');
  const shareBtn = document.getElementById('btn-share');
  const pipBtn = document.getElementById('btn-pip');
  const hints = document.getElementById('keyboard-hints');

  let paused = false;

  function setSpeed(val) {
    const speed = Math.max(0.1, Math.min(5, val));
    SolarScene.setSpeed(speed);
    speedSlider.value = speed;
    speedDisplay.textContent = speed.toFixed(1) + 'x';
  }

  function togglePause() {
    paused = !paused;
    SolarScene.setPaused(paused);
    pauseBtn.classList.toggle('paused', paused);
    pauseBtn.setAttribute('aria-label', paused ? 'Play orbits' : 'Pause orbits');
    const svg = pauseBtn.querySelector('svg');
    if (paused) svg.innerHTML = '<polygon points="6,4 20,12 6,20"/>';
    else svg.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  }

  function toggleOrbits() { orbitsBtn.classList.toggle('active', SolarScene.toggleOrbits()); }
  function toggleTrails() { trailsBtn.classList.toggle('active', SolarScene.toggleTrails()); }
  function toggleCompare() { compareBtn.classList.toggle('active', SolarScene.toggleComparison()); }

  function toggleTour() {
    if (SolarScene.tourActive) { SolarScene.stopTour(); tourBtn.classList.remove('active'); }
    else { SolarScene.startTour(); tourBtn.classList.add('active'); }
  }

  function toggleConstellations() {
    if (constellBtn) constellBtn.classList.toggle('active', SolarScene.toggleConstellations());
  }
  function toggleSpacecraft() {
    if (spacecraftBtn) spacecraftBtn.classList.toggle('active', SolarScene.toggleSpacecraft());
  }
  function toggleScale() {
    if (scaleBtn) scaleBtn.classList.toggle('active', SolarScene.toggleScale());
  }
  function toggleGravity() {
    if (gravityBtn) gravityBtn.classList.toggle('active', SolarScene.toggleGravity());
  }
  function togglePiP() {
    if (pipBtn) pipBtn.classList.toggle('active', SolarScene.togglePiP());
  }

  function shareUrl() {
    const url = SolarScene.getShareUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        if (shareBtn) {
          shareBtn.textContent = '✓';
          setTimeout(() => { shareBtn.textContent = ''; shareBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>'; }, 2000);
        }
      });
    }
  }

  function resetView() {
    SolarScene.resetCamera();
    compareBtn.classList.remove('active');
    if (SolarScene.tourActive) { SolarScene.stopTour(); tourBtn.classList.remove('active'); }
  }

  function onKeyDown(e) {
    if (e.target.tagName === 'INPUT') return;
    switch (e.key) {
      case ' ': e.preventDefault(); togglePause(); break;
      case 'm': case 'M': Audio.toggle(); break;
      case 'o': case 'O': toggleOrbits(); break;
      case 't': case 'T': toggleTrails(); break;
      case 'c': case 'C': toggleCompare(); break;
      case 'g': case 'G': toggleTour(); break;
      case 'p': case 'P': SolarScene.takeScreenshot(); break;
      case 'r': case 'R': resetView(); break;
      case 'n': case 'N': toggleConstellations(); break;
      case 'v': case 'V': toggleSpacecraft(); break;
      case 'k': case 'K': toggleScale(); break;
      case 'f': case 'F': togglePiP(); break;
      case '/': e.preventDefault(); focusSearch(); break;
    }
  }

  // ---- Search ----
  function initSearch() {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    if (!input || !results) return;

    input.addEventListener('input', () => {
      const q = input.value;
      const matches = Planets.searchPlanets(q);
      results.innerHTML = '';
      if (q.length === 0) { results.style.display = 'none'; return; }
      results.style.display = 'block';
      for (const key of matches) {
        const btn = document.createElement('button');
        btn.className = 'search-result';
        btn.textContent = Planets.data[key].name;
        btn.addEventListener('click', () => {
          SolarScene.focusOnPlanet(key);
          Planets.showInfo(key);
          input.value = '';
          results.style.display = 'none';
        });
        results.appendChild(btn);
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => { results.style.display = 'none'; }, 200);
    });
  }

  function focusSearch() {
    const input = document.getElementById('search-input');
    if (input) input.focus();
  }

  // ---- Planet Nav ----
  function initPlanetNav() {
    document.querySelectorAll('.nav-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        SolarScene.focusOnPlanet(dot.dataset.planet);
        Planets.showInfo(dot.dataset.planet);
      });
    });
  }

  function showHints() {
    hints.classList.add('visible');
    setTimeout(() => hints.classList.remove('visible'), 5000);
  }

  function init() {
    speedSlider.addEventListener('input', () => setSpeed(parseFloat(speedSlider.value)));
    pauseBtn.addEventListener('click', togglePause);
    resetBtn.addEventListener('click', resetView);
    orbitsBtn.addEventListener('click', toggleOrbits);
    trailsBtn.addEventListener('click', toggleTrails);
    compareBtn.addEventListener('click', toggleCompare);
    if (tourBtn) tourBtn.addEventListener('click', toggleTour);
    if (screenshotBtn) screenshotBtn.addEventListener('click', () => SolarScene.takeScreenshot());
    if (constellBtn) constellBtn.addEventListener('click', toggleConstellations);
    if (spacecraftBtn) spacecraftBtn.addEventListener('click', toggleSpacecraft);
    if (scaleBtn) scaleBtn.addEventListener('click', toggleScale);
    if (gravityBtn) gravityBtn.addEventListener('click', toggleGravity);
    if (shareBtn) shareBtn.addEventListener('click', shareUrl);
    if (pipBtn) pipBtn.addEventListener('click', togglePiP);

    const tourStopBtn = document.getElementById('btn-tour-stop');
    if (tourStopBtn) tourStopBtn.addEventListener('click', () => { SolarScene.stopTour(); tourBtn.classList.remove('active'); });

    document.addEventListener('keydown', onKeyDown);
    initPlanetNav();
    initSearch();
    showHints();
  }

  return { init, setSpeed, togglePause };
})();
