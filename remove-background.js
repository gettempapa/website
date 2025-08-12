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

  function rerun() {
    if (!sourceImage) return;
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

    function enqueue(x, y) {
      const p = idx(x, y);
      if (mask[p]) return;
      const i = p * 4;
      const [r, g, b] = getRGB(i);
      if (isNearWhite(r, g, b)) {
        mask[p] = 1;
        qx[qe] = x; qy[qe] = y; qe++;
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
      for (let i = 0; i < mask.length; i++) mask[i] = grown[i];
    }

    // Apply transparency to mask
    for (let p = 0; p < mask.length; p++) {
      if (mask[p]) data[p * 4 + 3] = 0;
    }
    ctx.putImageData(imgData, 0, 0);
    downloadBtn.href = outCanvas.toDataURL('image/png');
  }
})();


