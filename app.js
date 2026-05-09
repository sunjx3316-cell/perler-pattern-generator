// Global State
let state = {
    originalImage: null, // HTMLImageElement
    processedGrid: [],   // 2D Array of { colorId, hex, r, g, b }
    rawGrid: [], // 2D Array of { r, g, b, a } (Source pixels for background removal)
    transparencyMask: new Set(), // Set of "x,y" strings
    wandHistory: [], // Array of Sets for undo
    isWandActive: false,
    lastWidth: 0,
    lastHeight: 0,
    settings: {
        width: 50, // Beads wide
        palette: 'mard', // Default to new Mard palette
        brightness: 0,
        contrast: 0,
        saturation: 0,
        showGrid: true,
        showRefGrid: false,
        refGridSize: 29,
        showCoords: true,
        showCodes: true,
        dithering: false,
        matchMode: 'rgb', // Default RGB (Redmean)
        autoEnhance: true,
        preserveLines: true,
        wandTolerance: 30,
        resizeMode: 'dominant', // 'dominant' or 'average'
        gridOffsetX: 0,
        gridOffsetY: 0
    }
};

const elements = {
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('fileInput'),
    controlsSection: document.getElementById('controlsSection'),
    downloadSection: document.getElementById('downloadSection'),
    emptyState: document.getElementById('emptyState'),
    
    // Inputs
    widthRange: document.getElementById('widthRange'),
    widthVal: document.getElementById('widthVal'),
    paletteSelect: document.getElementById('paletteSelect'),
    brightnessRange: document.getElementById('brightnessRange'),
    brightnessVal: document.getElementById('brightnessVal'),
    contrastRange: document.getElementById('contrastRange'),
    contrastVal: document.getElementById('contrastVal'),
    saturationRange: document.getElementById('saturationRange'),
    saturationVal: document.getElementById('saturationVal'),
    
    ditheringCheck: document.getElementById('ditheringCheck'),
    matchModeSelect: document.getElementById('matchModeSelect'),
    resizeModeSelect: document.getElementById('resizeModeSelect'),
    autoEnhanceCheck: document.getElementById('autoEnhanceCheck'),
    preserveLinesCheck: document.getElementById('preserveLinesCheck'),
    
    gridOffsetXInput: document.getElementById('gridOffsetXInput'),
    gridOffsetYInput: document.getElementById('gridOffsetYInput'),
    
    // Wand
    toggleWandBtn: document.getElementById('toggleWandBtn'),
    wandToleranceRange: document.getElementById('wandToleranceRange'),
    wandToleranceVal: document.getElementById('wandToleranceVal'),
    undoWandBtn: document.getElementById('undoWandBtn'),
    resetWandBtn: document.getElementById('resetWandBtn'),
    autoBgBtn: document.getElementById('autoBgBtn'),
    wandControls: document.getElementById('bgRemovalTool'),
    
    // Canvas
    canvasContainer: document.getElementById('canvasContainer'),
    pixelCanvas: document.getElementById('pixelCanvas'),
    processCanvas: document.createElement('canvas'),
    previewDims: document.getElementById('previewDims'),
    
    // View Options
    showGridCheck: document.getElementById('showGridCheck'),
    showRefGridCheck: document.getElementById('showRefGridCheck'),
    refGridSize: document.getElementById('refGridSize'),
    showCoordsCheck: document.getElementById('showCoordsCheck'),
    showCodesCheck: document.getElementById('showCodesCheck'),
    
    // BOM
    bomSection: document.getElementById('bomSection'),
    bomBody: document.getElementById('bomBody'),
    
    // Actions
    processBtn: document.getElementById('processBtn'),
    downloadImgBtn: document.getElementById('downloadImgBtn'),
    downloadPdfBtn: document.getElementById('downloadPdfBtn'),
    
    // Slice
    sliceBtn: document.getElementById('sliceBtn'),
    sliceSection: document.getElementById('sliceSection'),
    sliceContainer: document.getElementById('sliceContainer'),
    sliceSizeInput: document.getElementById('sliceSizeInput'),
    regenerateSlicesBtn: document.getElementById('regenerateSlicesBtn'),
    closeSliceBtn: document.getElementById('closeSliceBtn')
};

// --- Initialization ---
function init() {
    setupEventListeners();
    // Populate palette select if needed, but it's hardcoded in HTML for now. 
    // Let's ensure 'mard' is selected by default if not present
    if (elements.paletteSelect.value !== 'mard') {
        // If mard exists in options, select it. If not, we might need to add it dynamically?
        // Assuming HTML has generic options or we just override logic.
        // Actually, let's inject options based on JS object to be safe.
        renderPaletteOptions();
    }
}

function renderPaletteOptions() {
    elements.paletteSelect.innerHTML = '';
    const options = [
        { value: 'mard', label: '通用拼豆 (A-H 色号系统)' },
        { value: 'perler', label: 'Perler (P系列)' },
        { value: 'artkal', label: 'Artkal (S系列)' },
        { value: 'hama', label: 'Hama (H系列)' }
    ];
    
    options.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt.value;
        el.textContent = opt.label;
        elements.paletteSelect.appendChild(el);
    });
    elements.paletteSelect.value = 'mard';
}

// --- Event Listeners ---
function setupEventListeners() {
    // Upload
    elements.dropzone.addEventListener('click', () => elements.fileInput.click());
    elements.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropzone.classList.add('border-primary', 'bg-blue-50');
    });
    elements.dropzone.addEventListener('dragleave', () => {
        elements.dropzone.classList.remove('border-primary', 'bg-blue-50');
    });
    elements.dropzone.addEventListener('drop', handleDrop);
    elements.fileInput.addEventListener('change', handleFileSelect);

    // Controls
    elements.widthRange.addEventListener('input', (e) => updateSetting('width', parseInt(e.target.value)));
    elements.paletteSelect.addEventListener('change', (e) => updateSetting('palette', e.target.value));
    elements.brightnessRange.addEventListener('input', (e) => updateSetting('brightness', parseInt(e.target.value)));
    elements.contrastRange.addEventListener('input', (e) => updateSetting('contrast', parseInt(e.target.value)));
    elements.saturationRange.addEventListener('input', (e) => updateSetting('saturation', parseInt(e.target.value)));
    
    // Advanced
    if (elements.ditheringCheck) {
        elements.ditheringCheck.addEventListener('change', (e) => updateSetting('dithering', e.target.checked));
    }
    if (elements.matchModeSelect) {
        elements.matchModeSelect.addEventListener('change', (e) => updateSetting('matchMode', e.target.value));
    }
    if (elements.autoEnhanceCheck) {
        elements.autoEnhanceCheck.addEventListener('change', (e) => updateSetting('autoEnhance', e.target.checked));
    }

    if (elements.resizeModeSelect) {
        elements.resizeModeSelect.addEventListener('change', (e) => updateSetting('resizeMode', e.target.value));
    }

    if (elements.preserveLinesCheck) {
        elements.preserveLinesCheck.addEventListener('change', (e) => {
            state.settings.preserveLines = e.target.checked;
            processImage();
        });
    }
    
    // Grid Offset
    if (elements.gridOffsetXInput) {
        elements.gridOffsetXInput.addEventListener('input', (e) => updateSetting('gridOffsetX', parseInt(e.target.value) || 0));
    }
    if (elements.gridOffsetYInput) {
        elements.gridOffsetYInput.addEventListener('input', (e) => updateSetting('gridOffsetY', parseInt(e.target.value) || 0));
    }
    
    // Wand Tool
    if (elements.toggleWandBtn) {
        elements.toggleWandBtn.addEventListener('click', toggleWand);
    }
    if (elements.wandToleranceRange) {
        elements.wandToleranceRange.addEventListener('input', (e) => {
            state.settings.wandTolerance = parseInt(e.target.value);
            elements.wandToleranceVal.textContent = e.target.value;
        });
    }
    if (elements.undoWandBtn) {
        elements.undoWandBtn.addEventListener('click', undoWand);
    }
    if (elements.resetWandBtn) {
        elements.resetWandBtn.addEventListener('click', resetWand);
    }
    if (elements.autoBgBtn) {
        elements.autoBgBtn.addEventListener('click', autoRemoveBackground);
    }
    
    // Pencil Tool Removed
    
    // Canvas Interaction
    elements.pixelCanvas.addEventListener('click', handleCanvasClick);
    
    // Mouse Drawing Removed
    
    // BOM Color Selection (Visual Only)
    elements.bomBody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row && row.dataset.colorId) {
            // Remove highlight from others
            Array.from(elements.bomBody.querySelectorAll('tr')).forEach(tr => {
                tr.classList.remove('bg-yellow-50', 'ring-1', 'ring-yellow-300');
            });
            // Add highlight to selected
            row.classList.add('bg-yellow-50', 'ring-1', 'ring-yellow-300');
        }
    });

    elements.processBtn.addEventListener('click', processImage);
    elements.showGridCheck.addEventListener('change', (e) => {
        state.settings.showGrid = e.target.checked;
        renderPreview();
    });
    if (elements.showRefGridCheck) {
        elements.showRefGridCheck.addEventListener('change', (e) => {
            state.settings.showRefGrid = e.target.checked;
            renderPreview();
        });
    }
    if (elements.refGridSize) {
        elements.refGridSize.addEventListener('input', (e) => {
            state.settings.refGridSize = parseInt(e.target.value) || 29;
            renderPreview();
        });
    }
    elements.showCoordsCheck.addEventListener('change', (e) => {
        state.settings.showCoords = e.target.checked;
        renderPreview();
    });
    elements.showCodesCheck.addEventListener('change', (e) => {
        state.settings.showCodes = e.target.checked;
        renderPreview();
    });

    // Download
    elements.downloadImgBtn.addEventListener('click', downloadImage);
    elements.downloadPdfBtn.addEventListener('click', downloadPDF);
    
    // Slice
    if (elements.sliceBtn) {
        elements.sliceBtn.addEventListener('click', () => generateSlices());
    }
    if (elements.regenerateSlicesBtn) {
        elements.regenerateSlicesBtn.addEventListener('click', () => generateSlices());
    }
    if (elements.closeSliceBtn) {
        elements.closeSliceBtn.addEventListener('click', () => {
            elements.sliceSection.classList.add('hidden');
        });
    }
}

function updateSetting(key, value) {
    state.settings[key] = value;
    
    // Update UI labels
    if (key === 'width') elements.widthVal.textContent = value;
    if (key === 'brightness') elements.brightnessVal.textContent = value > 0 ? `+${value}` : value;
    if (key === 'contrast') elements.contrastVal.textContent = value > 0 ? `+${value}` : value;
    if (key === 'saturation') elements.saturationVal.textContent = value > 0 ? `+${value}` : value;

    // Debounce processing for sliders
    if (['width', 'brightness', 'contrast', 'saturation'].includes(key)) {
        debounce(processImage, 100)();
    } else {
        processImage();
    }
}

// --- File Handling ---
function handleDrop(e) {
    e.preventDefault();
    elements.dropzone.classList.remove('border-primary', 'bg-blue-50');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        loadFile(e.dataTransfer.files[0]);
    }
}

function handleFileSelect(e) {
    if (e.target.files && e.target.files[0]) {
        loadFile(e.target.files[0]);
    }
}

function loadFile(file) {
    if (!file.type.match('image.*')) {
        alert('请上传图片文件 (JPG, PNG, GIF)');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            state.originalImage = img;
            enableControls();
            processImage();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function enableControls() {
    elements.controlsSection.classList.remove('disabled-section');
    elements.controlsSection.classList.add('active');
    elements.downloadSection.classList.remove('disabled-section');
    elements.downloadSection.classList.add('active');
    elements.emptyState.classList.add('hidden');
    elements.pixelCanvas.classList.remove('hidden');
    elements.bomSection.classList.remove('hidden');
}

// --- Image Processing ---
function processImage() {
    if (!state.originalImage) return;

    const { width, palette, brightness, contrast, saturation, dithering, matchMode, autoEnhance } = state.settings;
    const img = state.originalImage;
    
    // Calculate aspect ratio and new height
    const aspectRatio = img.height / img.width;
    const height = Math.round(width * aspectRatio);
    
    // Clear mask if dimensions changed
    if (state.lastWidth !== width || state.lastHeight !== height) {
        state.transparencyMask.clear();
        state.wandHistory = [];
        state.lastWidth = width;
        state.lastHeight = height;
    }

    // Setup processing canvas (small size for pixelation)
    const ctx = elements.processCanvas.getContext('2d');
    elements.processCanvas.width = width;
    elements.processCanvas.height = height;

    let imageData;

    // Resize Logic
    if (state.settings.resizeMode === 'dominant') {
        imageData = resizeImageDominant(img, width, height);
        ctx.putImageData(imageData, 0, 0);
    } else {
        // Standard Average/Bilinear
        ctx.drawImage(img, 0, 0, width, height);
        imageData = ctx.getImageData(0, 0, width, height);
    }
    
    // Get pixel data reference (for modification)
    // Note: ctx.getImageData returns a COPY, so we need to put it back later if we modify it in place
    // But subsequent steps (Median, Sharpen) return NEW ImageData objects, so it's fine.
    
    // Filters removed as per user request


    // Apply Filters
    let data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i+1];
        let b = data[i+2];

        // Auto Enhance (Subtle)
            if (autoEnhance) {
                 const max = Math.max(r, g, b);
                 const min = Math.min(r, g, b);
                 const delta = max - min;
                 if (delta > 0) {
                     const factor = 1.05; // Reduced from 1.2 to avoid color shifting
                     r = r + (r - min) * (factor - 1);
                     g = g + (g - min) * (factor - 1);
                     b = b + (b - min) * (factor - 1);
                 }
                 // Subtle Contrast
                 r = (r - 128) * 1.05 + 128;
                 g = (g - 128) * 1.05 + 128;
                 b = (b - 128) * 1.05 + 128;
            }

        // Brightness
        r += brightness * 2.55;
        g += brightness * 2.55;
        b += brightness * 2.55;

        // Contrast
        if (contrast !== 0) {
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            r = factor * (r - 128) + 128;
            g = factor * (g - 128) + 128;
            b = factor * (b - 128) + 128;
        }

        // Saturation
        if (saturation !== 0) {
            const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
            const satMultiplier = 1 + (saturation / 100); 
            r = gray + (r - gray) * satMultiplier;
            g = gray + (g - gray) * satMultiplier;
            b = gray + (b - gray) * satMultiplier;
        }

        data[i] = Math.min(255, Math.max(0, r));
        data[i+1] = Math.min(255, Math.max(0, g));
        data[i+2] = Math.min(255, Math.max(0, b));
    }

    // Capture Raw Grid (For Background Removal) - BEFORE Posterization
    // This ensures we can distinguish subtle dark background from black outlines
    const rawGrid = []; 
    for (let y = 0; y < height; y++) {
        const rawRow = [];
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            rawRow.push({ 
                r: data[idx], 
                g: data[idx+1], 
                b: data[idx+2], 
                a: data[idx+3] 
            });
        }
        rawGrid.push(rawRow);
    }
    state.rawGrid = rawGrid;
    
    data = imageData.data; // Update reference just in case

    // Color Quantization & Dithering
    let currentPalette = PALETTES[palette] || PALETTES['mard'];
    
    // Pre-calculate LAB
    if (matchMode === 'lab' && !currentPalette[0].lab) {
        currentPalette.forEach(c => {
            c.lab = rgbToLab(c.r, c.g, c.b);
        });
    }

    let newGrid = []; // 2D array [y][x]
    const floatData = new Float32Array(data);

    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            
            const oldR = floatData[idx];
            const oldG = floatData[idx+1];
            const oldB = floatData[idx+2];
            const a = floatData[idx+3];
            
            if (a < 128) {
                row.push(null);
                continue;
            }

            // Find Closest Color
            let match = findClosestColor(oldR, oldG, oldB, currentPalette, matchMode);
            
            row.push(match);

            // Dithering (Floyd-Steinberg)
            if (dithering) {
                const quantR = match.r;
                const quantG = match.g;
                const quantB = match.b;

                const errR = oldR - quantR;
                const errG = oldG - quantG;
                const errB = oldB - quantB;

                const distribute = (dx, dy, factor) => {
                    if (x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height) {
                        const nIdx = ((y + dy) * width + (x + dx)) * 4;
                        floatData[nIdx] += errR * factor;
                        floatData[nIdx+1] += errG * factor;
                        floatData[nIdx+2] += errB * factor;
                    }
                };

                distribute(1, 0, 7/16);
                distribute(-1, 1, 3/16);
                distribute(0, 1, 5/16);
                distribute(1, 1, 1/16);
            }
        }
        newGrid.push(row);
    }

    state.processedGrid = newGrid;
    elements.previewDims.textContent = `${width} x ${height}`;
    
    renderPreview();
    updateBOM();
}

function findClosestColor(r, g, b, palette, mode) {
    let minDist = Infinity;
    let closest = palette[0];

    // Cache target LAB if needed
    let targetLab = null;

    if (mode === 'lab') {
        targetLab = rgbToLab(r, g, b);
    }

    for (const color of palette) {
        let dist;
        if (mode === 'lab') {
            // Balanced Delta E (Prioritize Hue Accuracy)
            const dl = (targetLab.l - color.lab.l) * 1.0; 
            const da = (targetLab.a - color.lab.a) * 1.2; // Increase weight for Red-Green axis
            const db = (targetLab.b - color.lab.b) * 1.2; // Increase weight for Blue-Yellow axis
            dist = Math.sqrt(dl * dl + da * da + db * db);

            // Green Noise Reduction Heuristic (Enhanced V2)
            // 1. Strong protection for Warm colors (Red/Orange/Brown) against Green/Teal
            // Expanded range: a > -2 (covers weak browns) and b > 5 (yellowish)
            if (targetLab.a > -2 && targetLab.b > 5 && color.lab.a < -5) {
                dist += 35; // Increased penalty to prevent orange shadows turning green
            }
            // 2. Standard protection for Neutrals/Skin against Green
            // If target is not Green (a > -5), and candidate is very Green (a < -10)
            else if (targetLab.a > -5 && color.lab.a < -10) {
                 // Exception: High B (Yellows) are allowed to be slightly green-shifted in Lab
                 if (targetLab.b < 45) {
                    dist += 20;
                 }
            }
        } else {
            // Redmean Color Distance (Better than Euclidean for RGB)
            // As used in sucr233's bead tool
            const rmean = (r + color.r) / 2;
            const rd = r - color.r;
            const gd = g - color.g;
            const bd = b - color.b;
            dist = (((512 + rmean) * rd * rd) >> 8) + 4 * gd * gd + (((767 - rmean) * bd * bd) >> 8);
        }
        
        // Removed complex heuristics (Warm/Green/Saturation penalties) 
        // to provide more predictable and faithful color matching as requested.

        if (dist < minDist) {
            minDist = dist;
            closest = color;
        }
    }
    return closest;
}

// --- Color Utils (LAB) ---
function rgbToLab(r, g, b) {
    // RGB to XYZ
    let r1 = r / 255, g1 = g / 255, b1 = b / 255;
    r1 = (r1 > 0.04045) ? Math.pow((r1 + 0.055) / 1.055, 2.4) : r1 / 12.92;
    g1 = (g1 > 0.04045) ? Math.pow((g1 + 0.055) / 1.055, 2.4) : g1 / 12.92;
    b1 = (b1 > 0.04045) ? Math.pow((b1 + 0.055) / 1.055, 2.4) : b1 / 12.92;

    r1 *= 100; g1 *= 100; b1 *= 100;

    const x = r1 * 0.4124 + g1 * 0.3576 + b1 * 0.1805;
    const y = r1 * 0.2126 + g1 * 0.7152 + b1 * 0.0722;
    const z = r1 * 0.0193 + g1 * 0.1192 + b1 * 0.9505;

    // XYZ to Lab
    let x1 = x / 95.047, y1 = y / 100.000, z1 = z / 108.883;
    x1 = (x1 > 0.008856) ? Math.pow(x1, 1/3) : (7.787 * x1) + (16/116);
    y1 = (y1 > 0.008856) ? Math.pow(y1, 1/3) : (7.787 * y1) + (16/116);
    z1 = (z1 > 0.008856) ? Math.pow(z1, 1/3) : (7.787 * z1) + (16/116);

    return {
        l: (116 * y1) - 16,
        a: 500 * (x1 - y1),
        b: 200 * (y1 - z1)
    };
}

function deltaE(lab1, lab2) {
    // CIE76 Delta E
    const dl = lab1.l - lab2.l;
    const da = lab1.a - lab2.a;
    const db = lab1.b - lab2.b;
    return Math.sqrt(dl * dl + da * da + db * db);
}

// --- Rendering ---
function renderPreview() {
    if (state.processedGrid.length === 0) return;

    const grid = state.processedGrid;
    const height = grid.length;
    const width = grid[0].length;
    
    // Scale for display
    const containerWidth = elements.canvasContainer.clientWidth - 40;
    const maxPixelSize = 30;
    const minPixelSize = 8; 
    
    let pixelSize = Math.floor(containerWidth / width);
    const coordOffset = state.settings.showCoords ? 20 : 0;
    
    if (state.settings.showCoords) {
        pixelSize = Math.floor((containerWidth - coordOffset) / width);
    }
    
    if (pixelSize > maxPixelSize) pixelSize = maxPixelSize;
    if (pixelSize < minPixelSize) pixelSize = minPixelSize;

    const canvas = elements.pixelCanvas;
    const totalWidth = (width * pixelSize) + coordOffset;
    const totalHeight = (height * pixelSize) + coordOffset;
    
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    canvas.style.display = 'block';

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Coordinates
    if (state.settings.showCoords) {
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // X Axis
        for (let x = 0; x < width; x += 5) {
            ctx.fillText(x, coordOffset + (x * pixelSize) + (pixelSize/2), 10);
            ctx.beginPath();
            ctx.moveTo(coordOffset + (x * pixelSize) + (pixelSize/2), 15);
            ctx.lineTo(coordOffset + (x * pixelSize) + (pixelSize/2), 20);
            ctx.stroke();
        }

        // Y Axis
        for (let y = 0; y < height; y += 5) {
            ctx.fillText(y, 10, coordOffset + (y * pixelSize) + (pixelSize/2));
            ctx.beginPath();
            ctx.moveTo(15, coordOffset + (y * pixelSize) + (pixelSize/2));
            ctx.lineTo(20, coordOffset + (y * pixelSize) + (pixelSize/2));
            ctx.stroke();
        }
    }

    // Draw Grid
    const startX = coordOffset;
    const startY = coordOffset;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const color = grid[y][x];
            
            // Check Transparency Mask
            if (state.transparencyMask.has(`${x},${y}`) || !color) {
                // Draw checkerboard for transparency
                ctx.fillStyle = ((x + y) % 2 === 0) ? '#e5e7eb' : '#ffffff';
                ctx.fillRect(startX + x * pixelSize, startY + y * pixelSize, pixelSize, pixelSize);
                continue;
            }

            // Fill Cell
            ctx.fillStyle = color.hex;
            ctx.fillRect(startX + x * pixelSize, startY + y * pixelSize, pixelSize, pixelSize);

            // Draw Grid Lines
            if (state.settings.showGrid) {
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.lineWidth = 1;
                ctx.strokeRect(startX + x * pixelSize, startY + y * pixelSize, pixelSize, pixelSize);
            }

            // Draw Color Code
            if (state.settings.showCodes && pixelSize >= 8) {
                // Calculate Luma for text color
                const luma = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
                ctx.fillStyle = luma > 128 ? '#000' : '#fff';
                
                // Allow smaller font for smaller pixels
                const fontSize = Math.max(6, pixelSize / 2.5);
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // Show short ID (A1, H23)
                ctx.fillText(color.id, startX + x * pixelSize + pixelSize/2, startY + y * pixelSize + pixelSize/2);
            }
        }
    }

    // Draw Reference Grid (Big Grid)
    if (state.settings.showRefGrid) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = 2;
        const refSize = state.settings.refGridSize || 29;
        
        // Vertical lines
        for (let x = refSize; x < width; x += refSize) {
             const px = startX + x * pixelSize;
             ctx.beginPath();
             ctx.moveTo(px, startY);
             ctx.lineTo(px, startY + height * pixelSize);
             ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = refSize; y < height; y += refSize) {
             const py = startY + y * pixelSize;
             ctx.beginPath();
             ctx.moveTo(startX, py);
             ctx.lineTo(startX + width * pixelSize, py);
             ctx.stroke();
        }
    }
}

function updateBOM() {
    if (state.processedGrid.length === 0) return;
    
    const counts = {};
    
    state.processedGrid.forEach((row, y) => {
        row.forEach((color, x) => {
            if (color && !state.transparencyMask.has(`${x},${y}`)) {
                if (!counts[color.id]) {
                    counts[color.id] = { ...color, count: 0 };
                }
                counts[color.id].count++;
            }
        });
    });

    const sorted = Object.values(counts).sort((a, b) => {
        return a.id.localeCompare(b.id, undefined, { numeric: true });
    });

    elements.bomBody.innerHTML = sorted.map(c => `
        <tr class="hover:bg-gray-50 cursor-pointer transition-colors" data-color-id="${c.id}" title="点击选择此颜色进行绘制">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="h-6 w-6 rounded-full border border-gray-200 shadow-sm" style="background-color: ${c.hex}"></div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span class="font-medium">${c.id}</span> - ${c.name}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${c.count}
            </td>
        </tr>
    `).join('');
}

// --- Utils ---
let debounceTimer;
function debounce(func, timeout = 300) {
    return (...args) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

// --- Download ---
function downloadImage() {
    if (state.processedGrid.length === 0) return;

    const grid = state.processedGrid;
    const height = grid.length;
    const width = grid[0].length;
    
    // Calculate BOM for Legend
    const counts = {};
    grid.forEach((row, y) => {
        row.forEach((color, x) => {
            if (color && !state.transparencyMask.has(`${x},${y}`)) {
                if (!counts[color.id]) {
                    counts[color.id] = { ...color, count: 0 };
                }
                counts[color.id].count++;
            }
        });
    });
    const sortedColors = Object.values(counts).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    // Dimensions
    const pixelSize = 30; // Large enough for text
    const coordSize = 40; // Space for axis numbers
    const titleHeight = 60; // Title + Date
    const margin = 20;
    
    // Legend Calculation
    const legendItemWidth = 120;
    const legendItemHeight = 40;
    const contentWidth = width * pixelSize;
    const totalCanvasWidth = Math.max(contentWidth + coordSize + margin * 2, 800); // Min width for aesthetics
    
    const itemsPerRow = Math.floor((totalCanvasWidth - margin * 2) / legendItemWidth);
    const legendRows = Math.ceil(sortedColors.length / itemsPerRow);
    const legendHeight = legendRows * legendItemHeight + 40; // +Header
    
    const totalCanvasHeight = titleHeight + coordSize + (height * pixelSize) + legendHeight + margin * 2;

    // Create Canvas
    const canvas = document.createElement('canvas');
    canvas.width = totalCanvasWidth;
    canvas.height = totalCanvasHeight;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, totalCanvasWidth, totalCanvasHeight);
    
    // 1. Title Header
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText("像素图纸 (Pixel Art Pattern)", margin, margin);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#666';
    const dateStr = new Date().toLocaleDateString();
    ctx.fillText(`Export date: ${dateStr}`, margin, margin + 35);
    
    // Grid Offset
    const gridStartX = Math.floor((totalCanvasWidth - (width * pixelSize) - coordSize) / 2) + coordSize; 
    const gridStartY = titleHeight + margin + coordSize;

    // 2. Coordinates
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // X Axis (Top)
    for (let x = 0; x < width; x++) {
        const cx = gridStartX + x * pixelSize + pixelSize/2;
        ctx.fillText(x + 1, cx, gridStartY - 15);
        // Tick
        ctx.beginPath();
        ctx.moveTo(cx, gridStartY - 5);
        ctx.lineTo(cx, gridStartY);
        ctx.stroke();
    }
    
    // Y Axis (Left)
    for (let y = 0; y < height; y++) {
        const cy = gridStartY + y * pixelSize + pixelSize/2;
        ctx.fillText(y + 1, gridStartX - 15, cy);
        // Tick
        ctx.beginPath();
        ctx.moveTo(gridStartX - 5, cy);
        ctx.lineTo(gridStartX, cy);
        ctx.stroke();
    }

    // 3. Draw Grid & Pixels
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const px = gridStartX + x * pixelSize;
            const py = gridStartY + y * pixelSize;
            
            const color = grid[y][x];
            
            // Transparency Check
            if (state.transparencyMask.has(`${x},${y}`) || !color) {
                // Empty white block (already filled by background)
                // Draw light grid line
                ctx.strokeStyle = '#eee';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, pixelSize, pixelSize);
                continue;
            }

            // Fill Color
            ctx.fillStyle = color.hex;
            ctx.fillRect(px, py, pixelSize, pixelSize);
            
            // Grid Line
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, pixelSize, pixelSize);
            
            // Text Label (Always draw if not transparent)
            // Determine text color based on Luma
            const luma = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
            ctx.fillStyle = luma > 128 ? '#000' : '#fff';
            
            // Font sizing
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(color.id, px + pixelSize/2, py + pixelSize/2);
        }
    }
    
    // 4. Draw Legend (BOM)
    const legendStartY = gridStartY + (height * pixelSize) + 40;
    
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText("颜色用量表 (Color Legend)", margin, legendStartY);
    
    const itemsStartY = legendStartY + 30;
    
    sortedColors.forEach((c, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        
        const itemX = margin + (col * legendItemWidth);
        const itemY = itemsStartY + (row * legendItemHeight);
        
        // Swatch
        ctx.fillStyle = c.hex;
        ctx.fillRect(itemX, itemY, 20, 20);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(itemX, itemY, 20, 20);
        
        // Text
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.id, itemX + 28, itemY + 10);
        
        ctx.font = '11px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText(`: ${c.count}`, itemX + 60, itemY + 10);
    });

    // Trigger Download
    const link = document.createElement('a');
    link.download = `pixel-pattern-${new Date().getTime()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    
    const grid = state.processedGrid;
    if (grid.length === 0) return;
    
    const height = grid.length;
    const width = grid[0].length;
    const isLandscape = width > height;
    
    const doc = new jsPDF({
        orientation: isLandscape ? 'l' : 'p',
        unit: 'mm',
        format: 'a4'
    });
    
    // Add unicode font support if needed, but for now using standard font
    // Note: jsPDF standard fonts don't support Chinese characters.
    // Ideally we should add a font, but for now we'll stick to English labels where possible or hope for best.
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    
    // Title
    doc.setFontSize(16);
    doc.text("拼豆图纸 (Pixel Art Pattern)", pageWidth / 2, margin + 5, null, null, "center");
    
    // Calculate cell size
    const availWidth = pageWidth - (margin * 2);
    const availHeight = pageHeight - (margin * 3) - 10; 
    const coordSize = 6; 
    const maxCellWidth = (availWidth - coordSize) / width;
    const maxCellHeight = (availHeight - coordSize) / height;
    const cellSize = Math.min(maxCellWidth, maxCellHeight);
    
    const startX = margin + coordSize;
    const startY = margin + 15 + coordSize; 
    
    // Draw Coords (Numbers)
    doc.setFontSize(6);
    doc.setTextColor(0, 0, 0);
    
    // X Axis
    for (let x = 0; x < width; x++) {
        if ((x + 1) % 5 === 0 || x === 0 || x === width - 1) {
            const xPos = startX + (x * cellSize) + (cellSize / 2);
            doc.text(`${x + 1}`, xPos, startY - 2, null, null, "center");
        }
    }
    
    // Y Axis
    for (let y = 0; y < height; y++) {
        if ((y + 1) % 5 === 0 || y === 0 || y === height - 1) {
            const yPos = startY + (y * cellSize) + (cellSize / 2);
            doc.text(`${y + 1}`, margin + 2, yPos + 1); 
        }
    }
    
    // Draw Grid
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const color = grid[y][x];
            
            if (state.transparencyMask.has(`${x},${y}`) || !color) {
                continue;
            }

            const px = startX + x * cellSize;
            const py = startY + y * cellSize;
            
            doc.setFillColor(color.r, color.g, color.b);
            doc.rect(px, py, cellSize, cellSize, 'F');
            
            const luma = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
            doc.setTextColor(luma < 128 ? 255 : 0);
            
            let fontSize = cellSize * 0.4; 
            if (fontSize > 6) fontSize = 6;
            if (fontSize < 3) fontSize = 3;
            
            doc.setFontSize(fontSize);
            doc.text(color.id, px + cellSize/2, py + cellSize/2 + (fontSize/3), null, null, "center");
        }
    }
    
    // Add BOM Page
    doc.addPage();
    doc.setFontSize(14);
    doc.text("颜色用量表 (Color BOM)", margin, margin + 10);
    
    // Recalculate counts for BOM
    const counts = {};
    grid.forEach((row, y) => {
        row.forEach((c, x) => {
            if(c && !state.transparencyMask.has(`${x},${y}`)) {
                if(!counts[c.id]) counts[c.id] = { ...c, count: 0};
                counts[c.id].count++;
            }
        });
    });
    
    const sorted = Object.values(counts).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    
    let yPos = margin + 20;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    sorted.forEach(c => {
        if (yPos > pageHeight - margin) {
            doc.addPage();
            yPos = margin + 20;
        }
        
        // Draw little color box
        doc.setFillColor(c.r, c.g, c.b);
        doc.rect(margin, yPos - 4, 6, 6, 'F');
        doc.rect(margin, yPos - 4, 6, 6, 'S'); // Border
        
        doc.text(`${c.id} - ${c.name}: ${c.count} 颗`, margin + 10, yPos);
        yPos += 8;
    });
    
    doc.save('pixel-pattern.pdf');
}

// 2. Magic Wand Tool
function toggleWand() {
    state.isWandActive = !state.isWandActive;
    updateWandUI();
}

function updateWandUI() {
    if (state.isWandActive) {
        elements.toggleWandBtn.textContent = '退出魔棒';
        elements.toggleWandBtn.classList.remove('bg-white', 'text-blue-600');
        elements.toggleWandBtn.classList.add('bg-blue-600', 'text-white');
        elements.wandControls.classList.remove('hidden');
        elements.pixelCanvas.style.cursor = 'crosshair';
    } else {
        elements.toggleWandBtn.textContent = '启用魔棒';
        elements.toggleWandBtn.classList.add('bg-white', 'text-blue-600');
        elements.toggleWandBtn.classList.remove('bg-blue-600', 'text-white');
        elements.wandControls.classList.add('hidden');
        elements.pixelCanvas.style.cursor = 'default';
    }
}

function handleCanvasClick(e) {
    if (!state.isWandActive || state.processedGrid.length === 0) return;
    
    const rect = elements.pixelCanvas.getBoundingClientRect();
    const scaleX = elements.pixelCanvas.width / rect.width;
    const scaleY = elements.pixelCanvas.height / rect.height;
    
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    
    const grid = state.processedGrid;
    const height = grid.length;
    const width = grid[0].length;
    
    // Calculate pixel size (should match renderPreview logic)
    const containerWidth = elements.canvasContainer.clientWidth - 40;
    const maxPixelSize = 30;
    const minPixelSize = 8; 
    const coordOffset = state.settings.showCoords ? 20 : 0;
    
    let pixelSize = Math.floor((state.settings.showCoords ? (containerWidth - coordOffset) : containerWidth) / width);
    if (state.settings.showCoords) {
        pixelSize = Math.floor((containerWidth - coordOffset) / width);
    }
    
    if (pixelSize > maxPixelSize) pixelSize = maxPixelSize;
    if (pixelSize < minPixelSize) pixelSize = minPixelSize;
    
    const startX = coordOffset;
    const startY = coordOffset;
    
    const gridX = Math.floor((clickX - startX) / pixelSize);
    const gridY = Math.floor((clickY - startY) / pixelSize);
    
    if (gridX < 0 || gridX >= width || gridY < 0 || gridY >= height) return;
    
    // Pencil Mode Removed
    
    // Wand Mode logic...
    // Perform Flood Fill Remove
    // Use RAW color for click target too if available
    const targetColor = state.rawGrid ? state.rawGrid[gridY][gridX] : grid[gridY][gridX];
    
    if (!targetColor) return; // Already transparent
    
    // Save state for undo
    state.wandHistory.push(new Set(state.transparencyMask));
    
    floodFillRemove(gridX, gridY, targetColor, width, height, !!state.rawGrid);
    
    renderPreview();
    updateBOM();
}

function floodFillRemove(startX, startY, targetColor, width, height, useRaw = false) {
    const queue = [[startX, startY]];
    const seen = new Set();
    const tolerance = state.settings.wandTolerance;
    
    // Helper to get color difference
    const getColorDiff = (c1, c2) => {
        // Simple RGB euclidean
        return Math.sqrt(
            Math.pow(c1.r - c2.r, 2) + 
            Math.pow(c1.g - c2.g, 2) + 
            Math.pow(c1.b - c2.b, 2)
        );
    };
    
    while (queue.length > 0) {
        const [x, y] = queue.pop();
        const key = `${x},${y}`;
        
        if (seen.has(key)) continue;
        seen.add(key);
        
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        
        // If already masked, stop (act as boundary)? Or treat as empty?
        // Usually we traverse visible pixels.
        if (state.transparencyMask.has(key)) continue;
        
        const currentColor = useRaw ? state.rawGrid[y][x] : state.processedGrid[y][x];
        if (!currentColor) continue;
        
        const diff = getColorDiff(targetColor, currentColor);
        
        // RGB Distance max is ~441. 
        // Tolerance 0-100 maps to 0-441 approx? Or just 0-100 raw distance?
        // Let's use raw distance for better control. 
        // 30 is a good default (approx 10% variation).
        // Let's map slider 0-100 to 0-200 distance.
        const threshold = tolerance * 2;
        
        if (diff <= threshold) {
            state.transparencyMask.add(key);
            
            queue.push([x + 1, y]);
            queue.push([x - 1, y]);
            queue.push([x, y + 1]);
            queue.push([x, y - 1]);
        }
    }
}

function undoWand() {
    if (state.wandHistory.length > 0) {
        state.transparencyMask = state.wandHistory.pop();
        renderPreview();
        updateBOM();
    }
}

function resetWand() {
    if (state.transparencyMask.size > 0) {
        state.wandHistory.push(new Set(state.transparencyMask));
        state.transparencyMask.clear();
        renderPreview();
        updateBOM();
    }
}

function autoRemoveBackground() {
    if (state.processedGrid.length === 0) return;
    
    // Save state for undo
    state.wandHistory.push(new Set(state.transparencyMask));
    
    const grid = state.processedGrid;
    const height = grid.length;
    const width = grid[0].length;
    
    // Check 4 corners
    const corners = [
        [0, 0],
        [width - 1, 0],
        [0, height - 1],
        [width - 1, height - 1]
    ];
    
    let changed = false;
    
    corners.forEach(([x, y]) => {
        const key = `${x},${y}`;
        if (!state.transparencyMask.has(key)) {
            // Use Raw Grid for more accurate background detection
            const color = state.rawGrid[y][x];
            // Also need quantized color to verify it's valid
            const quantColor = grid[y][x];

            if (color && quantColor) {
                // Adaptive tolerance for dark backgrounds
                // If corner is very dark (Black), use higher tolerance to catch compression artifacts
                // BUT be careful not to eat black outlines.
                // Reverted aggressive boost. Rely on standard tolerance but on RAW pixels.
                
                floodFillRemove(x, y, color, width, height, true); // true = useRaw
                
                changed = true;
            }
        }
    });
    
    if (changed) {
        renderPreview();
        updateBOM();
    }
}

// --- Pencil Tool Removed ---



// K-Means Color Quantization removed


function resizeImageDominant(img, targetWidth, targetHeight) {
    // Smart Resizing Config
    const QUANTIZE_STEP = 24; // Keep 24 for color consistency
    const PRESERVE_LINES = state.settings.preserveLines !== false; 
    const LINE_BOOST_THRESHOLD = 130; // Adjusted to focus on dark lines and shadows
    const LINE_BOOST_WEIGHT = PRESERVE_LINES ? 20.0 : 1.0; // Massive boost to ensure broken lines are closed 

    // 1. Get full source data
    // Use an offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const srcData = ctx.getImageData(0, 0, img.width, img.height).data;
    
    // 2. Prepare target
    const output = new ImageData(targetWidth, targetHeight);
    const dstData = output.data;
    
    const scaleX = img.width / targetWidth;
    const scaleY = img.height / targetHeight;
    
    // Grid Offset
    const offX = state.settings.gridOffsetX || 0;
    const offY = state.settings.gridOffsetY || 0;
    
    for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
            // Define sampling region
            const srcX = Math.floor(x * scaleX) + offX;
            const srcY = Math.floor(y * scaleY) + offY;
            // Ensure we sample at least 1 pixel
            const srcW = Math.max(1, Math.floor((x + 1) * scaleX) - Math.floor(x * scaleX));
            const srcH = Math.max(1, Math.floor((y + 1) * scaleY) - Math.floor(y * scaleY));
            
            // Collect colors in this region
            const histogram = {};
            let maxScore = 0;
            let bestKey = null;
            let hasVisible = false;
            
            // Optimization: If 1x1 sampling, just take the pixel
            if (srcW === 1 && srcH === 1) {
                if (srcX >= 0 && srcX < img.width && srcY >= 0 && srcY < img.height) {
                    const idx = (srcY * img.width + srcX) * 4;
                    dstData[(y * targetWidth + x) * 4] = srcData[idx];
                    dstData[(y * targetWidth + x) * 4 + 1] = srcData[idx+1];
                    dstData[(y * targetWidth + x) * 4 + 2] = srcData[idx+2];
                    dstData[(y * targetWidth + x) * 4 + 3] = srcData[idx+3];
                } else {
                     dstData[(y * targetWidth + x) * 4 + 3] = 0;
                }
                continue;
            }

            for (let sy = srcY; sy < srcY + srcH; sy++) {
                if (sy < 0 || sy >= img.height) continue;
                for (let sx = srcX; sx < srcX + srcW; sx++) {
                    if (sx < 0 || sx >= img.width) continue;
                    
                    const idx = (sy * img.width + sx) * 4;
                    const a = srcData[idx+3];
                    
                    if (a < 128) continue; 
                    hasVisible = true;

                    const r = srcData[idx];
                    const g = srcData[idx+1];
                    const b = srcData[idx+2];
                    
                    // Quantize Key (Group similar colors)
                    const qr = Math.round(r / QUANTIZE_STEP) * QUANTIZE_STEP;
                    const qg = Math.round(g / QUANTIZE_STEP) * QUANTIZE_STEP;
                    const qb = Math.round(b / QUANTIZE_STEP) * QUANTIZE_STEP;
                    const key = `${qr},${qg},${qb}`;
                    
                    // Calculate Weight
                    let weight = 1.0;
                    if (PRESERVE_LINES) {
                        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                        if (luminance < LINE_BOOST_THRESHOLD) {
                            weight = LINE_BOOST_WEIGHT;
                        }
                    }
                    
                    if (!histogram[key]) {
                        histogram[key] = { score: 0, rSum: 0, gSum: 0, bSum: 0, count: 0 };
                    }
                    
                    histogram[key].score += weight;
                    histogram[key].rSum += r;
                    histogram[key].gSum += g;
                    histogram[key].bSum += b;
                    histogram[key].count++;
                    
                    if (histogram[key].score > maxScore) {
                        maxScore = histogram[key].score;
                        bestKey = key;
                    }
                }
            }
            
            // Assign winner
            const dstIdx = (y * targetWidth + x) * 4;
            if (!hasVisible || !bestKey) {
                dstData[dstIdx] = 0;
                dstData[dstIdx+1] = 0;
                dstData[dstIdx+2] = 0;
                dstData[dstIdx+3] = 0;
            } else {
                const bucket = histogram[bestKey];
                dstData[dstIdx] = Math.round(bucket.rSum / bucket.count);
                dstData[dstIdx+1] = Math.round(bucket.gSum / bucket.count);
                dstData[dstIdx+2] = Math.round(bucket.bSum / bucket.count);
                dstData[dstIdx+3] = 255;
            }
        }
    }
    return output;
}

// --- Slicing ---
function generateSlices() {
    if (state.processedGrid.length === 0) return;
    
    const sliceSize = parseInt(elements.sliceSizeInput.value) || 29;
    const grid = state.processedGrid;
    const height = grid.length;
    const width = grid[0].length;
    
    const rows = Math.ceil(height / sliceSize);
    const cols = Math.ceil(width / sliceSize);
    
    elements.sliceContainer.innerHTML = '';
    elements.sliceSection.classList.remove('hidden');
    
    // Create temp canvas for slicing
    const canvas = document.createElement('canvas');
    const pixelSize = 20; // Fixed size for slice images
    const padding = 20;
    
    // We need to render each slice
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const startX = c * sliceSize;
            const startY = r * sliceSize;
            
            // Calculate slice dimensions
            const sliceW = Math.min(sliceSize, width - startX);
            const sliceH = Math.min(sliceSize, height - startY);
            
            // Set canvas size
            const totalW = sliceW * pixelSize + padding * 2;
            const totalH = sliceH * pixelSize + padding * 2;
            canvas.width = totalW;
            canvas.height = totalH;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, totalW, totalH);
            
            // Draw Grid & Pixels
            for (let y = 0; y < sliceH; y++) {
                for (let x = 0; x < sliceW; x++) {
                    const gx = startX + x;
                    const gy = startY + y;
                    const color = grid[gy][gx];
                    
                    const px = padding + x * pixelSize;
                    const py = padding + y * pixelSize;
                    
                    if (state.transparencyMask.has(`${gx},${gy}`) || !color) {
                         // Empty
                         ctx.strokeStyle = '#eee';
                         ctx.strokeRect(px, py, pixelSize, pixelSize);
                         continue;
                    }
                    
                    ctx.fillStyle = color.hex;
                    ctx.fillRect(px, py, pixelSize, pixelSize);
                    
                    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                    ctx.strokeRect(px, py, pixelSize, pixelSize);
                    
                    // Symbol/Text
                    const luma = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
                    ctx.fillStyle = luma > 128 ? '#000' : '#fff';
                    ctx.font = 'bold 8px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(color.id, px + pixelSize/2, py + pixelSize/2);
                }
            }
            
            // Add Coordinates Text
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`Slice ${r+1}-${c+1} (${startX+1},${startY+1})`, 5, 12);
            
            // Create Image Element
            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');
            img.className = 'w-full border border-gray-200 rounded shadow-sm hover:shadow-md transition cursor-pointer';
            img.title = `Click to download slice ${r+1}-${c+1}`;
            
            // Wrap in div with label
            const wrapper = document.createElement('div');
            wrapper.className = 'flex flex-col items-center';
            wrapper.appendChild(img);
            
            const label = document.createElement('span');
            label.className = 'text-xs text-gray-500 mt-1';
            label.textContent = `Part ${r+1}-${c+1}`;
            wrapper.appendChild(label);
            
            // Click to download
            img.onclick = () => {
                const link = document.createElement('a');
                link.download = `pixel-art-slice-${r+1}-${c+1}.png`;
                link.href = img.src;
                link.click();
            };
            
            elements.sliceContainer.appendChild(wrapper);
        }
    }
}

// Start
init();
