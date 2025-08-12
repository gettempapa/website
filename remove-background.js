// Advanced client-side background remover using proper image processing techniques
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
  const aggrEl = document.getElementById('aggr');
  const aggrOut = document.getElementById('aggrOut');
  const bOut = document.getElementById('bOut');
  const dOut = document.getElementById('dOut');
  const vOut = document.getElementById('vOut');
  const sOut = document.getElementById('sOut');
  const fOut = document.getElementById('fOut');

  // Enhanced slider event handling with debouncing for better performance
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const debouncedRerun = debounce(rerun, 50); // 50ms debounce for smooth performance

  [
    [brightnessEl, bOut, (v) => v],
    [distanceEl, dOut, (v) => v],
    [valueEl, vOut, (v) => v],
    [saturationEl, sOut, (v) => (v/100).toFixed(2)],
    [featherEl, fOut, (v) => v],
    [aggrEl, aggrOut, (v) => v]
  ].forEach(([input, out, fmt]) => {
    input.addEventListener('input', () => { 
      out.textContent = fmt(input.value); 
      debouncedRerun(); 
    });
  });

  // Initialize readouts to match defaults
  bOut.textContent = brightnessEl.value;
  dOut.textContent = distanceEl.value;
  vOut.textContent = valueEl.value;
  sOut.textContent = (parseInt(saturationEl.value,10)/100).toFixed(2);
  fOut.textContent = featherEl.value;
  aggrOut.textContent = aggrEl.value;

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
  let originalImageData = null; // Store the original image data
  let currentMask = null; // Store the current mask

  // Initialize canvas with a visible placeholder
  function initCanvas() {
    const ctx = outCanvas.getContext('2d');
    outCanvas.width = 400;
    outCanvas.height = 300;
    
    // Draw a placeholder
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
    
    ctx.fillStyle = '#48dbfb';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Drop an image to start processing', outCanvas.width/2, outCanvas.height/2);
    
    outCanvas.style.display = 'block';
    outCanvas.style.maxHeight = '40vh';
    outCanvas.style.width = '100%';
    outCanvas.style.objectFit = 'contain';
  }

  // Initialize canvas on page load
  initCanvas();

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        sourceImage = img;
        origImg.src = img.src;
        
        // Store original image data
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.naturalWidth;
        tempCanvas.height = img.naturalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);
        originalImageData = tempCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
        
        rerun();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  let currentAnimToken = 0;

  // Convert RGB to HSV (proper color space for background detection)
  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    
    let h = 0;
    if (diff !== 0) {
      switch (max) {
        case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
        case g: h = (b - r) / diff + 2; break;
        case b: h = (r - g) / diff + 4; break;
      }
      h /= 6;
    }
    
    const s = max === 0 ? 0 : diff / max;
    const v = max;
    
    return [h, s, v];
  }

  // Advanced background detection using multiple techniques
  function isBackgroundPixel(r, g, b, params, aggr) {
    const [h, s, v] = rgbToHsv(r, g, b);
    const brightness = (r + g + b) / 3;
    
    // 1. HSV-based detection (most reliable for white/light backgrounds)
    if (v >= params.valueThreshold && s <= params.saturationThreshold) {
      return true;
    }
    
    // 2. RGB brightness + distance to white
    if (brightness >= params.brightnessThreshold) {
      const distToWhite = Math.sqrt((255-r)**2 + (255-g)**2 + (255-b)**2);
      if (distToWhite <= params.distanceThreshold) {
        return true;
      }
    }
    
    // 3. Uniform color detection (for solid backgrounds)
    const maxDiff = Math.max(Math.abs(r-g), Math.abs(g-b), Math.abs(b-r));
    if (maxDiff <= params.uniformThreshold && brightness >= params.uniformBrightness) {
      return true;
    }
    
    // 4. EXTREME MODE: At high aggressiveness, remove almost everything except very dark colors
    if (aggr > 0.8) { // Only apply extreme mode at 80%+ aggressiveness
      // Progressive extreme mode - gets more aggressive as we approach 100%
      const extremeFactor = (aggr - 0.8) / 0.2; // 0 to 1 as we go from 80% to 100%
      
      // Remove anything that's not very dark (progressive)
      const dynamicBrightnessThreshold = 30 + extremeFactor * 225; // 30 to 255
      if (brightness >= dynamicBrightnessThreshold) {
        return true;
      }
      
      // Remove anything with significant saturation (except very dark colors)
      const dynamicSaturationThreshold = 0.05 + extremeFactor * 0.95; // 0.05 to 1.0
      if (s >= dynamicSaturationThreshold && brightness > 20) {
        return true;
      }
      
      // Remove anything with high value (HSV) except very dark
      const dynamicValueThreshold = 20 + extremeFactor * 235; // 20 to 255
      if (v >= dynamicValueThreshold && brightness > 20) {
        return true;
      }
    }
    
    return false;
  }

  // Morphological operations for noise reduction
  function morphologicalClose(mask, width, height, radius) {
    const result = new Uint8Array(mask);
    
    // Dilation
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (mask[y * width + x]) continue;
        let hasNeighbor = false;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (mask[ny * width + nx]) {
                hasNeighbor = true;
                break;
              }
            }
          }
          if (hasNeighbor) break;
        }
        if (hasNeighbor) result[y * width + x] = 1;
      }
    }
    
    // Erosion
    const temp = new Uint8Array(result);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!temp[y * width + x]) continue;
        let allNeighbors = true;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (!temp[ny * width + nx]) {
                allNeighbors = false;
                break;
              }
            }
          }
          if (!allNeighbors) break;
        }
        if (!allNeighbors) result[y * width + x] = 0;
      }
    }
    
    return result;
  }

  // Flood fill with connectivity analysis
  function floodFillFromEdges(data, width, height, params, aggr) {
    const mask = new Uint8Array(width * height);
    const visited = new Uint8Array(width * height);
    const queue = [];
    const clearOrder = [];
    
    function idx(x, y) { return y * width + x; }
    
    function enqueue(x, y) {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      const p = idx(x, y);
      if (visited[p]) return;
      
      visited[p] = 1;
      const i = p * 4;
      const r = data[i], g = data[i+1], b = data[i+2];
      
      if (isBackgroundPixel(r, g, b, params, aggr)) {
        mask[p] = 1;
        queue.push([x, y]);
        clearOrder.push(p);
      }
    }
    
    // Seed from edges
    for (let x = 0; x < width; x++) {
      enqueue(x, 0);
      enqueue(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      enqueue(0, y);
      enqueue(width - 1, y);
    }
    
    // Flood fill
    while (queue.length > 0) {
      const [x, y] = queue.shift();
      
      // 8-connectivity for better coverage
      enqueue(x-1, y-1); enqueue(x, y-1); enqueue(x+1, y-1);
      enqueue(x-1, y);                     enqueue(x+1, y);
      enqueue(x-1, y+1); enqueue(x, y+1); enqueue(x+1, y+1);
    }
    
    return { mask, clearOrder };
  }

  function rerun() {
    if (!sourceImage || !originalImageData) return;
    currentAnimToken++;
    const animToken = currentAnimToken;
    
    // Map aggressiveness (0-100) to extreme parameter ranges
    const aggr = parseInt(aggrEl.value, 10) / 100; // 0..1
    
    // Extreme parameter mapping based on aggressiveness
    const params = {
      // At 0: Very conservative (only pure white)
      // At 100: Outrageously aggressive (removes almost everything except very dark colors)
      brightnessThreshold: Math.round(200 + aggr * 55), // 200-255
      distanceThreshold: Math.round(20 + aggr * 235),   // 20-255 (much larger range)
      valueThreshold: Math.round(200 + aggr * 55),      // 200-255
      saturationThreshold: 0.05 + aggr * 0.95,          // 0.05-1.00 (much higher saturation tolerance)
      uniformThreshold: Math.round(5 + aggr * 95),      // 5-100 (much larger uniform tolerance)
      uniformBrightness: Math.round(180 + aggr * 75),   // 180-255
      morphologicalRadius: Math.round(1 + aggr * 5),    // 1-6 (larger morphological operations)
    };
    
    // Update slider displays to show current effective values
    brightnessEl.value = params.brightnessThreshold;
    distanceEl.value = params.distanceThreshold;
    valueEl.value = params.valueThreshold;
    saturationEl.value = Math.round(params.saturationThreshold * 100);
    bOut.textContent = params.brightnessThreshold;
    dOut.textContent = params.distanceThreshold;
    vOut.textContent = params.valueThreshold;
    sOut.textContent = params.saturationThreshold.toFixed(2);
    
    // Show extreme mode indicator with styling
    if (aggr > 0.8) {
      aggrOut.textContent = aggrEl.value + " (EXTREME)";
      aggrOut.style.background = 'rgba(255,107,107,0.2)';
      aggrOut.style.borderColor = 'rgba(255,107,107,0.5)';
      aggrOut.style.color = '#ff6b6b';
    } else {
      aggrOut.textContent = aggrEl.value;
      aggrOut.style.background = 'rgba(72,219,251,0.1)';
      aggrOut.style.borderColor = 'rgba(72,219,251,0.3)';
      aggrOut.style.color = '#48dbfb';
    }

    const w = sourceImage.naturalWidth;
    const h = sourceImage.naturalHeight;
    outCanvas.width = w; outCanvas.height = h;
    const ctx = outCanvas.getContext('2d');
    
    // Set canvas background to checkerboard pattern for transparency
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);
    
    // Restore original image data
    const imgData = new ImageData(
      new Uint8ClampedArray(originalImageData.data),
      originalImageData.width,
      originalImageData.height
    );
    const data = imgData.data;

    // Step 1: Advanced flood fill with proper connectivity
    const { mask, clearOrder } = floodFillFromEdges(data, w, h, params, aggr);
    
    // Step 2: Morphological operations for noise reduction
    const cleanedMask = morphologicalClose(mask, w, h, params.morphologicalRadius);
    
    // Step 3: Feathering (edge softening)
    const featherAmount = parseInt(featherEl.value, 10);
    if (featherAmount > 0) {
      const featheredMask = new Uint8Array(cleanedMask);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const p = y * w + x;
          if (cleanedMask[p]) continue;
          
          // Check if near a background pixel
          let nearBackground = false;
          for (let dy = -featherAmount; dy <= featherAmount; dy++) {
            for (let dx = -featherAmount; dx <= featherAmount; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                if (cleanedMask[ny * w + nx]) {
                  nearBackground = true;
                  break;
                }
              }
            }
            if (nearBackground) break;
          }
          
          if (nearBackground) {
            featheredMask[p] = 1;
            // Add to clear order for animation
            if (!clearOrder.includes(p)) {
              clearOrder.push(p);
            }
          }
        }
      }
      
      // Update mask and reorder clearOrder to prioritize edge pixels
      for (let i = 0; i < featheredMask.length; i++) {
        if (featheredMask[i] && !cleanedMask[i]) {
          cleanedMask[i] = 1;
        }
      }
    }

    // Create final clear order prioritizing edge pixels
    const finalClearOrder = [];
    const edgePixels = new Set();
    const interiorPixels = new Set();
    
    // Separate edge and interior pixels
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (!cleanedMask[p]) continue;
        
        let isEdge = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              if (!cleanedMask[ny * w + nx]) {
                isEdge = true;
                break;
              }
            }
          }
          if (isEdge) break;
        }
        
        if (isEdge) {
          edgePixels.add(p);
        } else {
          interiorPixels.add(p);
        }
      }
    }
    
    // Add edge pixels first, then interior
    finalClearOrder.push(...edgePixels);
    finalClearOrder.push(...interiorPixels);

    // Apply mask immediately (no animation for slider changes)
    console.log(`Applying mask to ${finalClearOrder.length} pixels with aggressiveness ${aggr}`);
    for (let i = 0; i < finalClearOrder.length; i++) {
      const p = finalClearOrder[i];
      const aIndex = p * 4 + 3;
      data[aIndex] = 0; // Set alpha to 0
    }
    
    ctx.putImageData(imgData, 0, 0);
    downloadBtn.href = outCanvas.toDataURL('image/png');
    
    // Ensure the canvas is visible and has proper styling
    outCanvas.style.display = 'block';
    outCanvas.style.maxHeight = '40vh';
    outCanvas.style.width = '100%';
    outCanvas.style.objectFit = 'contain';
    
    console.log('Canvas updated, pixels processed:', finalClearOrder.length);
    console.log('Canvas dimensions:', outCanvas.width, 'x', outCanvas.height);
  }
})();




