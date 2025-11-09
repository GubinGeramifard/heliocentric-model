/* ============================================
   AUDIO — Background music controller
   ============================================ */

const Audio = (() => {
  const music = document.getElementById('bg-music');
  const toggleBtn = document.getElementById('btn-audio');
  const volumeSlider = document.getElementById('volume-slider');
  const iconOn = document.getElementById('icon-audio-on');
  const iconOff = document.getElementById('icon-audio-off');

  let playing = false;
  let userInteracted = false;

  function updateIcon() {
    iconOn.style.display = playing ? '' : 'none';
    iconOff.style.display = playing ? 'none' : '';
    toggleBtn.classList.toggle('active', playing);
    toggleBtn.setAttribute('aria-label', playing ? 'Mute music' : 'Play music');
  }

  function toggle() {
    if (!music.src && music.querySelector('source')) {
      // Trigger load on first interaction
      music.load();
    }
    if (playing) {
      music.pause();
      playing = false;
    } else {
      music.play().then(() => {
        playing = true;
        updateIcon();
      }).catch(() => {
        // Autoplay blocked — will work after user gesture
        playing = false;
        updateIcon();
      });
    }
    updateIcon();
  }

  function setVolume(val) {
    music.volume = Math.max(0, Math.min(1, val));
    volumeSlider.value = music.volume;
  }

  function init() {
    music.volume = parseFloat(volumeSlider.value);

    toggleBtn.addEventListener('click', toggle);
    volumeSlider.addEventListener('input', () => {
      setVolume(parseFloat(volumeSlider.value));
    });

    // Handle music ending/error gracefully
    music.addEventListener('error', () => {
      playing = false;
      updateIcon();
    });
  }

  return { init, toggle };
})();
