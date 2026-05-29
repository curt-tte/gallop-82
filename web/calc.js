/* Shared calculator engine for Gallop 82 web games.
 * Usage:
 *   const c = Calc({ brand: "GALLOP 82" });
 *   c.clr(); c.out(1,1,"HELLO"); c.render();
 *   c.setControls([{ label:"GO", primary:true, keys:["g"], onClick:fn }]);
 *   c.setHint("text with <kbd>Enter</kbd>");
 * Provides a 16x8 LCD buffer, on-screen + keyboard controls, and Web Audio sound.
 */
(function (global) {
  function Calc(opts) {
    opts = opts || {};
    const ROWS = opts.rows || 8, COLS = opts.cols || 16;
    const brand = opts.brand || "GALLOP 82";

    const calc = document.createElement("div");
    calc.className = "calc";
    calc.innerHTML =
      '<div class="brand">' +
        '<span><span class="led"></span>' + brand + '</span>' +
        '<button class="sound-toggle" type="button">&#128266; SOUND ON</button>' +
      '</div>' +
      '<div class="bezel"><div class="lcd"></div></div>' +
      '<div class="controls"></div>' +
      '<div class="hint"></div>' +
      '<div class="backlink"><a href="../index.html">&#8592; All games</a></div>';
    (opts.mount || document.body).appendChild(calc);

    const screenEl = calc.querySelector(".lcd");
    const controlsEl = calc.querySelector(".controls");
    const hintEl = calc.querySelector(".hint");
    const soundBtn = calc.querySelector(".sound-toggle");

    // ---- screen buffer ----
    let grid;
    function clr() { grid = Array.from({ length: ROWS }, () => Array(COLS).fill(" ")); }
    function out(row, col, text) {
      text = String(text);
      for (let i = 0; i < text.length; i++) {
        const c = col - 1 + i, r = row - 1;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) grid[r][c] = text[i];
      }
    }
    function render() { screenEl.textContent = grid.map(r => r.join("")).join("\n"); }
    clr();

    // ---- audio ----
    let actx = null, soundOn = true;
    function ensureAudio() {
      if (!actx) { try { actx = new (global.AudioContext || global.webkitAudioContext)(); } catch (e) {} }
      if (actx && actx.state === "suspended") actx.resume();
    }
    function tone(freq, dur, type, vol, when) {
      if (!soundOn || !actx) return;
      type = type || "square"; vol = vol || 0.14; when = when || 0;
      const t = actx.currentTime + when;
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    }
    function noise(dur, vol, cutoff) {
      if (!soundOn || !actx) return;
      dur = dur || 0.06; vol = vol || 0.18; cutoff = cutoff || 900;
      const n = Math.floor(actx.sampleRate * dur);
      const buf = actx.createBuffer(1, n, actx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = actx.createBufferSource(); src.buffer = buf;
      const g = actx.createGain(); g.gain.value = vol;
      const f = actx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = cutoff;
      src.connect(f).connect(g).connect(actx.destination); src.start();
    }
    const blip = () => tone(660, 0.05, "square", 0.08);
    function arp(freqs, type, step, vol) {
      type = type || "triangle"; step = step || 0.1; vol = vol || 0.15;
      freqs.forEach((f, i) => tone(f, 0.16, type, vol, i * step));
    }
    soundBtn.onclick = () => {
      soundOn = !soundOn;
      soundBtn.innerHTML = soundOn ? "&#128266; SOUND ON" : "&#128263; SOUND OFF";
      if (soundOn) { ensureAudio(); blip(); }
    };

    // ---- controls + keyboard ----
    let keyMap = {};
    function setControls(buttons) {
      controlsEl.innerHTML = ""; keyMap = {};
      let primary = null;
      buttons.forEach(b => {
        const el = document.createElement("button");
        el.type = "button"; el.textContent = b.label;
        if (b.primary) { el.classList.add("primary"); primary = b; }
        if (b.disabled) el.disabled = true;
        el.onclick = () => { ensureAudio(); blip(); b.onClick(); };
        controlsEl.appendChild(el);
        if (b.keys) b.keys.forEach(k => keyMap[k] = b);
      });
      if (primary && !keyMap["Enter"]) keyMap["Enter"] = primary;
    }
    document.addEventListener("keydown", e => {
      const b = keyMap[e.key];
      if (b && !b.disabled) { e.preventDefault(); ensureAudio(); b.onClick(); }
    });
    function setHint(html) { hintEl.innerHTML = html; }

    return {
      ROWS, COLS, clr, out, render, setControls, setHint,
      ensureAudio, tone, noise, blip, arp,
      get soundOn() { return soundOn; }
    };
  }
  global.Calc = Calc;
})(window);
