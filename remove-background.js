// Client-side background remover with edge flood-fill + near-white detection
(function() {
  // Prevent browser from opening dropped files in a new tab
  ['dragenter','dragover','dragleave','drop'].forEach(evt => {
    window.addEventListener(evt, (e) => {
      e.preventDefault();
    });
  });

  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const origImg = document.getElementById('orig');
  const outCanvas = document.getElementById('outCanvas');
  const downloadBtn = document.getElementById('downloadBtn');

  const brightnessEl = document.getElementById('brightness');
  const distanceEl = document.getElementById('distance');
  const valueEl = document.getElementById('valueT');
  const saturationEl = document.getElementById('saturation');
  const featherEl = document.getElementById('feather');
  const bOut = document.getElementById('bOut');
  const dOut = document.getElementById('dOut');
  const vOut = document.getElementById('vOut');
  const sOut = document.getElementById('sOut');
  const fOut = document.getElementById('fOut');

  [
    [brightnessEl, bOut, (v) => v],
    [distanceEl, dOut, (v) => v],
    [valueEl, vOut, (v) => v],
    [saturationEl, sOut, (v) => (v/100).toFixed(2)],
    [featherEl, fOut, (v) => v]
  ].forEach(([input, out, fmt]) => {
    input.addEventListener('input', () => { out.textContent = fmt(input.value); rerun(); });
  });

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault(); dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
  // Also accept drop anywhere on the page
  window.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  let sourceImage = null;

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        sourceImage = img;
        origImg.src = img.src;
        rerun();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  let currentAnimToken = 0;

  function rerun() {
    if (!sourceImage) return;
    currentAnimToken++;
    const animToken = currentAnimToken;
    const brightness = parseInt(brightnessEl.value, 10);
    const distance = parseInt(distanceEl.value, 10);
    const valueT = parseInt(valueEl.value, 10);
    const saturation = parseInt(saturationEl.value, 10) / 100;
    const feather = parseInt(featherEl.value, 10);

    const w = sourceImage.naturalWidth;
    const h = sourceImage.naturalHeight;
    outCanvas.width = w; outCanvas.height = h;
    const ctx = outCanvas.getContext('2d');
    ctx.drawImage(sourceImage, 0, 0);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Flood-fill mask from edges for near-white background
    const mask = new Uint8Array(w * h); // 0/1
    const clearOrder = new Int32Array(w * h); // order indices for animation
    let clearCount = 0;
    const qx = new Int32Array(w * h);
    const qy = new Int32Array(w * h);
    let qs = 0, qe = 0;

    function idx(x, y) { return (y * w + x) | 0; }
    function getRGB(i) { return [data[i], data[i+1], data[i+2]]; }
    function isNearWhite(r, g, b) {
      // Brightness + distance to white + HSV-like saturation/value test
      const bright = r >= brightness && g >= brightness && b >= brightness;
      if (bright) {
        const dr = 255 - r, dg = 255 - g, db = 255 - b;
        if ((dr*dr + dg*dg + db*db) <= (distance * distance)) return true;
      }
      const v = Math.max(r, g, b);
      if (v >= valueT) {
        const m = Math.min(r, g, b);
        const sat = v === 0 ? 0 : (v - m) / v;
        if (sat <= saturation) return true;
      }
      return false;
    }

    const visited = new Uint8Array(w * h);
    function enqueue(x, y) {
      const p = idx(x, y);
      if (mask[p]) return;
      const i = p * 4;
      const [r, g, b] = getRGB(i);
      if (isNearWhite(r, g, b)) {
        mask[p] = 1;
        qx[qe] = x; qy[qe] = y; qe++;
        clearOrder[clearCount++] = p; // base order: edge-first fill
      }
    }

    // seed from edges
    for (let x = 0; x < w; x++) { enqueue(x, 0); enqueue(x, h - 1); }
    for (let y = 0; y < h; y++) { enqueue(0, y); enqueue(w - 1, y); }

    // BFS 4-neighborhood
    while (qs < qe) {
      const x = qx[qs]; const y = qy[qs]; qs++;
      if (x + 1 < w) enqueue(x + 1, y);
      if (x - 1 >= 0) enqueue(x - 1, y);
      if (y + 1 < h) enqueue(x, y + 1);
      if (y - 1 >= 0) enqueue(x, y - 1);
    }

    // Optional feather (dilation)
    for (let f = 0; f < feather; f++) {
      const grown = new Uint8Array(mask);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const p = idx(x, y);
          if (mask[p]) continue;
          for (let ny = y - 1; ny <= y + 1; ny++) {
            for (let nx = x - 1; nx <= x + 1; nx++) {
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                if (mask[idx(nx, ny)]) { grown[p] = 1; nx = w; ny = h; break; }
              }
            }
          }
        }
      }
      for (let i = 0; i < mask.length; i++) {
        if (!mask[i] && grown[i]) {
          // Add newly grown pixels to the end of clear order so user sees expansion
          clearOrder[clearCount++] = i;
        }
        mask[i] = grown[i];
      }
    }

    // If some masked pixels were not captured in the initial BFS order (e.g., isolated islands), add them now
    for (let p = 0; p < mask.length; p++) {
      if (mask[p]) {
        // ensure present in order
        // We used an Int32Array; we'll just append duplicates safely by tracking a separate seen map
      }
    }

    // Build a set of which pixels are already included in clearOrder (first clearCount entries)
    const inOrder = new Uint8Array(mask.length);
    for (let i = 0; i < clearCount; i++) inOrder[clearOrder[i]] = 1;
    for (let p = 0; p < mask.length; p++) {
      if (mask[p] && !inOrder[p]) {
        clearOrder[clearCount++] = p;
      }
    }

    // Animate removal pixel-by-pixel in batches so user watches it vanish
    const desiredMs = 1200; // aim ~1.2s animation
    const perFrame = Math.max(500, Math.floor(clearCount / (desiredMs / 16))); // batch size per frame
    let pos = 0;

    function step() {
      if (animToken !== currentAnimToken) return; // canceled by new run
      const end = Math.min(clearCount, pos + perFrame);
      for (let i = pos; i < end; i++) {
        const p = clearOrder[i];
        const aIndex = p * 4 + 3;
        data[aIndex] = 0;
      }
      pos = end;
      ctx.putImageData(imgData, 0, 0);
      if (pos < clearCount) {
        requestAnimationFrame(step);
      } else {
        downloadBtn.href = outCanvas.toDataURL('image/png');
      }
    }

    // Start animation
    requestAnimationFrame(step);
  }
})();


