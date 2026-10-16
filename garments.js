/* Line-drawn garments for the desk-to-drinks story. Each returns SVG markup on a
   200 x 260 canvas; the strokes draw themselves in as a look slides into view
   (see main.js, [data-draw]). */
(function () {
  const S = (inner, cls = '') =>
    `<svg class="garment ${cls}" viewBox="0 0 200 260" fill="none" aria-hidden="true" data-draw>${inner}</svg>`;
  const P = (d, extra = '') => `<path d="${d}" ${extra}/>`;
  const D = (d) => P(d, 'class="g-detail"');

  const ribs = (x0, x1, y0, y1, step = 8) => {
    let out = '';
    for (let x = x0; x <= x1; x += step) out += `M${x} ${y0}V${y1}`;
    return `<path class="g-rib" d="${out}"/>`;
  };

  const G = {
    shirt: () => S(
      P('M70 30 L86 20 L100 34 L114 20 L130 30 L158 46 Q168 120 178 196 L160 200 L146 96 L146 238 Q100 246 54 238 L54 96 L40 200 L22 196 Q32 120 42 46 Z') +
      P('M86 20 L92 48 L100 34 L108 48 L114 20') +
      D('M100 34 V240') +
      D('M64 84 H86 V106 H64 Z') +
      D('M162 186 L179 183 M38 186 L21 183') +
      '<g class="g-btn"><circle cx="104" cy="70" r="1.6"/><circle cx="104" cy="110" r="1.6"/><circle cx="104" cy="150" r="1.6"/><circle cx="104" cy="190" r="1.6"/></g>'
    ),

    vneck: () => S(
      P('M68 30 Q100 22 132 30 L162 50 Q172 124 176 198 L156 202 L146 104 L148 236 Q100 244 52 236 L54 104 L44 202 L24 198 Q28 124 38 50 Z') +
      P('M72 30 L100 86 L128 30') +
      D('M78 30 L100 74 L122 30') +
      D('M52 222 Q100 230 148 222') +
      D('M155 190 L177 187 M45 190 L23 187') +
      ribs(56, 144, 225, 236, 6)
    ),

    polo: () => S(
      P('M62 40 L82 30 Q100 42 118 30 L138 40 L176 70 L162 96 L148 86 L150 220 Q100 228 50 220 L52 86 L38 96 L24 70 Z') +
      P('M82 30 L90 60 L100 48 L110 60 L118 30') +
      D('M100 48 V92') +
      D('M50 206 Q100 214 150 206') +
      '<g class="g-btn"><circle cx="100" cy="64" r="1.6"/><circle cx="100" cy="78" r="1.6"/></g>' +
      ribs(58, 142, 208, 220, 6)
    ),

    overshirt: () => S(
      P('M66 30 L84 18 L100 30 L116 18 L134 30 L162 44 Q172 120 178 200 L158 204 L148 100 L150 240 L50 240 L52 100 L42 204 L22 200 Q28 120 38 44 Z') +
      P('M84 18 L88 46 L100 30 L112 46 L116 18') +
      D('M100 30 V240') +
      D('M62 82 H88 V112 H62 Z M62 82 L75 90 L88 82') +
      D('M112 82 H138 V112 H112 Z M112 82 L125 90 L138 82') +
      D('M50 226 H150') +
      '<g class="g-btn"><circle cx="104" cy="64" r="1.8"/><circle cx="104" cy="104" r="1.8"/><circle cx="104" cy="144" r="1.8"/><circle cx="104" cy="184" r="1.8"/></g>'
    ),

    trouser: () => S(
      P('M60 14 H140 L142 30 L158 250 L114 250 L101 96 H99 L86 250 L42 250 L58 30 Z') +
      D('M58 30 H142') +
      D('M80 30 L86 112 M120 30 L114 112') +
      D('M71 30 L64 250 M129 30 L136 250') +
      D('M100 30 V72') +
      D('M70 14 V30 M100 14 V30 M130 14 V30')
    ),

    wide: () => S(
      P('M58 12 H142 L145 28 L170 250 L110 250 L101 100 H99 L90 250 L30 250 L55 28 Z') +
      D('M55 28 H145') +
      D('M78 28 L82 118 M88 28 L90 100 M122 28 L118 118 M112 28 L110 100') +
      D('M66 28 L58 250 M134 28 L142 250') +
      D('M100 28 V70')
    ),
  };

  window.Garment = (name, cls) => (G[name] ? G[name]().replace('class="garment ', `class="garment ${cls || ''} `) : '');
})();
