/* ============================================
   PLANETS — Data & info panel logic
   ============================================ */

const Planets = (() => {
  const data = {
    sun: {
      name: 'Sun', type: 'G-type Main Sequence Star',
      diameter: '1,391,000 km', mass: '1.989 × 10³⁰ kg',
      distance: '0 (center)', period: '—', moons: '—',
      temperature: '5,500 °C (surface) / 15 million °C (core)',
      atmosphere: 'Hydrogen (73%), Helium (25%)',
      fact: 'The Sun contains 99.86% of the total mass of the solar system. Its core temperature reaches 15 million °C, and it converts about 600 million tons of hydrogen into helium every second through nuclear fusion.',
      color: '#ffaa00', texture: 'assets/images/earth.jpg'
    },
    mercury: {
      name: 'Mercury', type: 'Terrestrial',
      diameter: '4,879 km', mass: '3.30 × 10²³ kg',
      distance: '57.9 million km', period: '88 days', moons: '0',
      temperature: '−173 to 427 °C',
      atmosphere: 'Virtually none (thin exosphere of O₂, Na, H₂)',
      fact: 'Mercury is the smallest planet in our solar system and the closest to the Sun. Despite being nearest to the Sun, it is not the hottest — Venus holds that record due to its greenhouse effect.',
      color: '#b5a18e', texture: 'assets/images/mercury.jpg'
    },
    venus: {
      name: 'Venus', type: 'Terrestrial',
      diameter: '12,104 km', mass: '4.87 × 10²⁴ kg',
      distance: '108.2 million km', period: '225 days', moons: '0',
      temperature: '462 °C (average)',
      atmosphere: 'CO₂ (96.5%), N₂ (3.5%), sulfuric acid clouds',
      fact: 'Venus rotates backwards compared to most planets, meaning the Sun rises in the west and sets in the east. A day on Venus is longer than its year.',
      color: '#e6c878', texture: 'assets/images/venus.jpg'
    },
    earth: {
      name: 'Earth', type: 'Terrestrial',
      diameter: '12,756 km', mass: '5.97 × 10²⁴ kg',
      distance: '149.6 million km', period: '365.25 days', moons: '1',
      temperature: '15 °C (average)',
      atmosphere: 'N₂ (78%), O₂ (21%), Ar (0.9%), CO₂ (0.04%)',
      fact: 'Earth is the only known planet to harbor life. Its surface is 71% water, earning it the nickname "The Blue Marble." It has a powerful magnetic field that shields it from solar wind.',
      color: '#6496ff', texture: 'assets/images/earth.jpg'
    },
    mars: {
      name: 'Mars', type: 'Terrestrial',
      diameter: '6,792 km', mass: '6.42 × 10²³ kg',
      distance: '227.9 million km', period: '687 days', moons: '2',
      temperature: '−65 °C (average)',
      atmosphere: 'CO₂ (95.3%), N₂ (2.7%), Ar (1.6%)',
      fact: 'Mars is home to Olympus Mons, the tallest volcano in the solar system at 21.9 km high — nearly 2.5 times the height of Mount Everest. Its two moons, Phobos and Deimos, are likely captured asteroids.',
      color: '#c86432', texture: 'assets/images/mars.jpg'
    },
    jupiter: {
      name: 'Jupiter', type: 'Gas Giant',
      diameter: '142,984 km', mass: '1.90 × 10²⁷ kg',
      distance: '778.6 million km', period: '11.86 years', moons: '95',
      temperature: '−110 °C (cloud tops)',
      atmosphere: 'H₂ (89.8%), He (10.2%), traces of CH₄, NH₃',
      fact: 'Jupiter\'s Great Red Spot is a storm larger than Earth that has been raging for over 350 years. Jupiter acts as a cosmic vacuum cleaner, protecting inner planets by attracting asteroids with its massive gravity.',
      color: '#c8aa78', texture: 'assets/images/jupiter.jpg'
    },
    saturn: {
      name: 'Saturn', type: 'Gas Giant',
      diameter: '120,536 km', mass: '5.68 × 10²⁶ kg',
      distance: '1.43 billion km', period: '29.46 years', moons: '146',
      temperature: '−140 °C (cloud tops)',
      atmosphere: 'H₂ (96.3%), He (3.25%), traces of CH₄, NH₃',
      fact: 'Saturn\'s rings are made of ice and rock particles ranging from tiny grains to house-sized chunks. Despite its enormous size, Saturn is less dense than water — it would float in a bathtub large enough to hold it.',
      color: '#d2be8c', texture: 'assets/images/saturn.jpg'
    },
    uranus: {
      name: 'Uranus', type: 'Ice Giant',
      diameter: '51,118 km', mass: '8.68 × 10²⁵ kg',
      distance: '2.87 billion km', period: '84 years', moons: '28',
      temperature: '−195 °C (cloud tops)',
      atmosphere: 'H₂ (82.5%), He (15.2%), CH₄ (2.3%)',
      fact: 'Uranus rotates on its side with an axial tilt of 98°, likely due to a collision with an Earth-sized object long ago. This gives it the most extreme seasons of any planet.',
      color: '#82c8dc', texture: 'assets/images/uranus.jpg'
    },
    neptune: {
      name: 'Neptune', type: 'Ice Giant',
      diameter: '49,528 km', mass: '1.02 × 10²⁶ kg',
      distance: '4.50 billion km', period: '165 years', moons: '16',
      temperature: '−200 °C (cloud tops)',
      atmosphere: 'H₂ (80%), He (19%), CH₄ (1.5%)',
      fact: 'Neptune has the strongest sustained winds of any planet, reaching speeds of 2,100 km/h. It was the first planet located through mathematical prediction rather than direct observation.',
      color: '#3c64dc', texture: 'assets/images/neptune.jpg'
    },
    pluto: {
      name: 'Pluto', type: 'Dwarf Planet',
      diameter: '2,377 km', mass: '1.31 × 10²² kg',
      distance: '5.91 billion km', period: '248 years', moons: '5',
      temperature: '−230 °C (average)',
      atmosphere: 'Thin: N₂, CH₄, CO (seasonally)',
      fact: 'Pluto was reclassified as a dwarf planet in 2006. Its heart-shaped nitrogen glacier, Tombaugh Regio, is larger than Texas. Pluto and its largest moon Charon are tidally locked, always showing the same face to each other.',
      color: '#b4a08c', texture: 'assets/images/pluto.jpg'
    }
  };

  const panel = document.getElementById('info-panel');
  const closeBtn = document.getElementById('info-close');

  function showInfo(planetKey) {
    const info = data[planetKey];
    if (!info) return;

    document.getElementById('info-name').textContent = info.name;
    document.getElementById('info-type').textContent = info.type;
    document.getElementById('info-diameter').textContent = info.diameter;
    document.getElementById('info-mass').textContent = info.mass;
    document.getElementById('info-distance').textContent = info.distance;
    document.getElementById('info-period').textContent = info.period;
    document.getElementById('info-moons').textContent = info.moons;
    document.getElementById('info-temperature').textContent = info.temperature;
    document.getElementById('info-atmosphere').textContent = info.atmosphere;
    document.getElementById('info-fact').textContent = info.fact;

    if (planetKey === 'sun') {
      document.getElementById('info-icon').style.backgroundImage = 'none';
      document.getElementById('info-icon').style.background = 'radial-gradient(circle at 30% 30%, #ffd200, #f7971e, #ff512f)';
    } else {
      document.getElementById('info-icon').style.background = '';
      document.getElementById('info-icon').style.backgroundImage = `url('${info.texture}')`;
    }

    const badge = document.getElementById('info-badge');
    if (planetKey === 'pluto') { badge.textContent = 'Dwarf Planet'; badge.style.display = 'inline-block'; }
    else if (planetKey === 'sun') { badge.textContent = 'Star'; badge.style.display = 'inline-block'; }
    else { badge.style.display = 'none'; }

    SolarScene.clearHighlight();
    panel.classList.add('open');
  }

  function hideInfo() {
    panel.classList.remove('open');
    SolarScene.clearHighlight();
  }

  function searchPlanets(query) {
    const q = query.toLowerCase().trim();
    if (!q) return Object.keys(data);
    return Object.keys(data).filter(key => {
      const d = data[key];
      return d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q);
    });
  }

  function init() {
    closeBtn.addEventListener('click', hideInfo);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideInfo(); });
  }

  return { init, showInfo, hideInfo, data, searchPlanets };
})();
