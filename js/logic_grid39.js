mapboxgl.accessToken = "pk.eyJ1IjoiYWdwbCIsImEiOiJjbG1rY3lqdWswMWliMnJuenpndHpnMmh6In0.ZAg3F_H8uxL9jC5h8f41Iw";

// ==========================================
// 1. JÁDRO: MULTI-LANGUAGE GRID 39  vs.5
// ==========================================
const Grid39 = {
    wordlists: {},   // Bude obsahovat: { en: [...], cs: [...], it: [...] }
    activeLang: 'en', // Výchozí jazyk
    
    loadLanguages: function() {
        if (typeof bip39_en !== 'undefined') this.wordlists['en'] = bip39_en.trim().split(/\r?\n/).map(w => w.trim()).filter(w => w.length > 0);
        if (typeof bip39_cs !== 'undefined') this.wordlists['cs'] = bip39_cs.trim().split(/\r?\n/).map(w => w.trim()).filter(w => w.length > 0);
        if (typeof bip39_it !== 'undefined') this.wordlists['it'] = bip39_it.trim().split(/\r?\n/).map(w => w.trim()).filter(w => w.length > 0);
        if (typeof bip39_es !== 'undefined') this.wordlists['es'] = bip39_es.trim().split(/\r?\n/).map(w => w.trim()).filter(w => w.length > 0);
        if (typeof bip39_pt !== 'undefined') this.wordlists['pt'] = bip39_pt.trim().split(/\r?\n/).map(w => w.trim()).filter(w => w.length > 0);
        if (typeof bip39_fr !== 'undefined') this.wordlists['fr'] = bip39_fr.trim().split(/\r?\n/).map(w => w.trim()).filter(w => w.length > 0);
        
        console.log(`Loaded languages: ${Object.keys(this.wordlists).join(', ')}`);
    },

    getWordIndex: function(word) {
        let w = word.toLowerCase();
        // Prohledá VŠECHNY dostupné jazyky a vrátí index slova (0-2047)
        for (let lang in this.wordlists) {
            let idx = this.wordlists[lang].indexOf(w);
            if (idx !== -1) return idx;
        }
        return -1; // Slovo nenalezeno v žádném jazyce
    },

    getWordByIndex: function(idx) {
        // Vrátí slovo v AKTUÁLNĚ VYBRANÉM jazyce
        return this.wordlists[this.activeLang][idx];
    },
    
    R: 6378137.0,
    get MAX_EXTENT() { return Math.PI * this.R; },
    
    DIV_L1: 2024, DIV_L2: 44, DIV_L3: 45, DIV_L4: 10,
    
    get SIZE_L1() { return this.DIV_L1; }, 
    get SIZE_L2() { return this.DIV_L1 * this.DIV_L2; }, 
    get SIZE_L3() { return this.DIV_L1 * this.DIV_L2 * this.DIV_L3; }, 
    get SIZE_L4() { return this.DIV_L1 * this.DIV_L2 * this.DIV_L3 * this.DIV_L4; }, 

    lonLatToXY: function(lon, lat) {
        let safeLat = Math.max(Math.min(lat, 85.05112877980659), -85.05112877980659);
        let x = lon * (this.MAX_EXTENT / 180.0);
        let y = Math.log(Math.tan((90 + safeLat) * Math.PI / 360.0)) * this.R;
        return { x, y };
    },

    xyToLonLat: function(x, y) {
        let lon = (x / this.MAX_EXTENT) * 180.0;
        let lat = (2 * Math.atan(Math.exp(y / this.R)) - Math.PI / 2) * (180.0 / Math.PI);
        return { lon, lat };
    },

    encode: function(lat, lon) {
        let { x, y } = this.lonLatToXY(lon, lat);
        let xFrac = (x + this.MAX_EXTENT) / (2 * this.MAX_EXTENT);
        let yFrac = (y + this.MAX_EXTENT) / (2 * this.MAX_EXTENT);

        let maxIdx = this.SIZE_L4;
        let xIndex = Math.min(Math.floor(xFrac * maxIdx), maxIdx - 1);
        let yIndex = Math.min(Math.floor(yFrac * maxIdx), maxIdx - 1);

        let div_block = this.DIV_L2 * this.DIV_L3 * this.DIV_L4; 

        let x0 = Math.floor(xIndex / div_block);
        let y0 = Math.floor(yIndex / div_block);
        let remX1 = xIndex % div_block;
        let remY1 = yIndex % div_block;

        let x1 = Math.floor(remX1 / (this.DIV_L3 * this.DIV_L4));
        let y1 = Math.floor(remY1 / (this.DIV_L3 * this.DIV_L4));
        let word3_idx = y1 * this.DIV_L2 + x1; 

        let remX2 = remX1 % (this.DIV_L3 * this.DIV_L4);
        let remY2 = remY1 % (this.DIV_L3 * this.DIV_L4);

        let x2 = Math.floor(remX2 / this.DIV_L4);
        let y2 = Math.floor(remY2 / this.DIV_L4);
        let word4_idx = y2 * this.DIV_L3 + x2; 

        let x3 = remX2 % this.DIV_L4;
        let y3 = remY2 % this.DIV_L4;
        let word5_idx = y3 * this.DIV_L4 + x3; 

        // Generujeme slova v aktuálním UI jazyce
        return [
            this.getWordByIndex(x0),
            this.getWordByIndex(y0),
            this.getWordByIndex(word3_idx),
            this.getWordByIndex(word4_idx),
            this.getWordByIndex(word5_idx)
        ];
    },

    decode: function(wordsArray) {
        // Získáme indexy - hledá slova napříč všemi jazyky
        let idxs = wordsArray.map(w => this.getWordIndex(w));
        if (idxs.includes(-1)) throw "Invalid word in the address. Please check spelling.";

        let depth = idxs.length;
        if (depth < 2 || depth > 5) throw "Please enter exactly 2, 3, 4, or 5 words.";

        if (idxs[0] >= this.DIV_L1 || idxs[1] >= this.DIV_L1) throw "Word out of bounds for Region layer.";
        if (depth >= 3 && idxs[2] >= (this.DIV_L2 * this.DIV_L2)) throw "Word out of bounds for Neighborhood layer.";
        if (depth >= 4 && idxs[3] >= (this.DIV_L3 * this.DIV_L3)) throw "Word out of bounds for 10m layer.";
        if (depth === 5 && idxs[4] >= (this.DIV_L4 * this.DIV_L4)) throw "Word out of bounds for 1m layer.";

        let xMinIdx = 0, yMinIdx = 0;
        let xSpan = this.SIZE_L4, ySpan = this.SIZE_L4;

        if (depth >= 2) {
            xMinIdx += idxs[0] * (this.DIV_L2 * this.DIV_L3 * this.DIV_L4);
            yMinIdx += idxs[1] * (this.DIV_L2 * this.DIV_L3 * this.DIV_L4);
            xSpan = (this.DIV_L2 * this.DIV_L3 * this.DIV_L4);
            ySpan = (this.DIV_L2 * this.DIV_L3 * this.DIV_L4);
        }

        if (depth >= 3) {
            let x1 = idxs[2] % this.DIV_L2;
            let y1 = Math.floor(idxs[2] / this.DIV_L2);
            xMinIdx += x1 * (this.DIV_L3 * this.DIV_L4);
            yMinIdx += y1 * (this.DIV_L3 * this.DIV_L4);
            xSpan = (this.DIV_L3 * this.DIV_L4);
            ySpan = (this.DIV_L3 * this.DIV_L4);
        }

        if (depth >= 4) {
            let x2 = idxs[3] % this.DIV_L3;
            let y2 = Math.floor(idxs[3] / this.DIV_L3);
            xMinIdx += x2 * this.DIV_L4;
            yMinIdx += y2 * this.DIV_L4;
            xSpan = this.DIV_L4;
            ySpan = this.DIV_L4;
        }

        if (depth === 5) {
            let x3 = idxs[4] % this.DIV_L4;
            let y3 = Math.floor(idxs[4] / this.DIV_L4);
            xMinIdx += x3;
            yMinIdx += y3;
            xSpan = 1;
            ySpan = 1;
        }

        const cellSize = (this.MAX_EXTENT * 2) / this.SIZE_L4;
        let xMin = -this.MAX_EXTENT + (xMinIdx * cellSize);
        let xMax = -this.MAX_EXTENT + ((xMinIdx + xSpan) * cellSize);
        let yMin = -this.MAX_EXTENT + (yMinIdx * cellSize);
        let yMax = -this.MAX_EXTENT + ((yMinIdx + ySpan) * cellSize);

        let bl = this.xyToLonLat(xMin, yMin);
        let tr = this.xyToLonLat(xMax, yMax);
        let center = this.xyToLonLat((xMin + xMax) / 2, (yMin + yMax) / 2);

        return {
            latCenter: center.lat,
            lonCenter: center.lon,
            bounds: { minLat: bl.lat, maxLat: tr.lat, minLon: bl.lon, maxLon: tr.lon },
            depth: depth
        };
    }
};

// ==========================================
// 2. INICIALIZACE MAPY A UI
// ==========================================
const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/light-v10", 
    center: [15, 50],
    zoom: 4,
    maxZoom: 24
});

let popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: true, anchor: 'bottom', offset: [0, -10] });
let lastBounds = null; 

// Načtení všech vložených jazyků
Grid39.loadLanguages();
if (Object.keys(Grid39.wordlists).length > 0) {
    processUrlHash();
} else {
    alert("Error: No BIP39 wordlists loaded.");
}

// Funkce pro přepínání jazyka uživatelem z dropdown menu
window.changeLanguage = function(lang) {
    if (!Grid39.wordlists[lang]) return alert("Language dictionary not loaded.");
    Grid39.activeLang = lang;
    
    // Pokud je ve vyhledávači lokace, okamžitě ji přeložíme
    const currentText = document.getElementById("universalInput").value.trim();
    if (currentText && !currentText.match(/\d/)) {
        searchUniversal(); 
    }
};

function setMapStyle(styleId) {
    const styles = {
        'light': 'mapbox://styles/mapbox/light-v10',
        'dark': 'mapbox://styles/mapbox/dark-v10',
        'satellite': 'mapbox://styles/mapbox/satellite-streets-v11',
        'streets': 'mapbox://styles/mapbox/streets-v11',
        'outdoors': 'mapbox://styles/mapbox/outdoors-v11'
    };
    if (styles[styleId]) map.setStyle(styles[styleId]);
    document.querySelectorAll('.layer-menu button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-' + styleId).classList.add('active');
}

// ==========================================
// 3. HIERARCHICKÁ MŘÍŽKA A HOVER EFEKTY
// ==========================================
map.on('style.load', () => {
    map.addSource('hover-cell', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'hover-cell-fill', type: 'fill', source: 'hover-cell', paint: { 'fill-color': '#d1d5db', 'fill-opacity': 0.4 } });
    
    map.addSource('viewport-grid', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'viewport-grid-lines', type: 'line', source: 'viewport-grid', paint: { 'line-color': '#d1d5db', 'line-width': 1, 'line-opacity': 0.35 } });
    
    map.addSource('unified-area', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'unified-fill', type: 'fill', source: 'unified-area', paint: { 'fill-color': '#2fd35a', 'fill-opacity': 0.3 } });
    map.addLayer({ id: 'unified-lines', type: 'line', source: 'unified-area', paint: { 'line-color': '#1f9c40', 'line-width': 3 } });

    if (lastBounds !== null) drawUnifiedArea(lastBounds);
    updateViewportGrid();
});

function getActiveGridLevel(zoom) {
    if (zoom < 11.5) return 1;        // 2 slova (19.8 km)
    if (zoom < 15.5) return 2;        // 3 slova (450 m Sousedství)
    if (zoom < 20.5) return 3;        // 4 slova (10m Standard Square)
    return 4;                         // 5 slov (1m PRO Square)
}

function getActiveGridSize(level) {
    if (level === 1) return Grid39.SIZE_L1;
    if (level === 2) return Grid39.SIZE_L2;
    if (level === 3) return Grid39.SIZE_L3;
    return Grid39.SIZE_L4;
}

function updateViewportGrid() {
    const zoom = map.getZoom();
    const sourceId = 'viewport-grid';

    if (zoom < 7) {
        if (map.getSource(sourceId)) map.getSource(sourceId).setData({ type: 'FeatureCollection', features: [] });
        return;
    }

    const level = getActiveGridLevel(zoom);
    const activeGridSize = getActiveGridSize(level);

    let lineOpacity = 0.35;
    let lineWidth = 1;
    if (level === 1) { lineOpacity = 0.4; lineWidth = 2; }
    if (level === 4) { lineOpacity = 0.5; lineWidth = 0.5; }

    if (map.getLayer('viewport-grid-lines')) {
        map.setPaintProperty('viewport-grid-lines', 'line-opacity', lineOpacity);
        map.setPaintProperty('viewport-grid-lines', 'line-width', lineWidth);
    }

    const bounds = map.getBounds();
    const west = Math.max(bounds.getWest(), -180);
    const east = Math.min(bounds.getEast(), 180);
    const south = Math.max(bounds.getSouth(), -85.05);
    const north = Math.min(bounds.getNorth(), 85.05);

    const minXY = Grid39.lonLatToXY(west, south);
    const maxXY = Grid39.lonLatToXY(east, north);
    const cellSize = (Grid39.MAX_EXTENT * 2) / activeGridSize;
    
    let xMinIdx = Math.floor((minXY.x + Grid39.MAX_EXTENT) / cellSize);
    let xMaxIdx = Math.ceil((maxXY.x + Grid39.MAX_EXTENT) / cellSize);
    let yMinIdx = Math.floor((minXY.y + Grid39.MAX_EXTENT) / cellSize);
    let yMaxIdx = Math.ceil((maxXY.y + Grid39.MAX_EXTENT) / cellSize);

    if (xMaxIdx - xMinIdx > 200 || yMaxIdx - yMinIdx > 200) {
        if (map.getSource(sourceId)) map.getSource(sourceId).setData({ type: 'FeatureCollection', features: [] });
        return;
    }

    let features = [];
    for (let i = xMinIdx; i <= xMaxIdx; i++) {
        let x = -Grid39.MAX_EXTENT + (i * cellSize);
        if (x < -Grid39.MAX_EXTENT || x > Grid39.MAX_EXTENT) continue;
        let bottom = Grid39.xyToLonLat(x, minXY.y);
        let top = Grid39.xyToLonLat(x, maxXY.y);
        features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[bottom.lon, bottom.lat], [top.lon, top.lat]] } });
    }
    for (let i = yMinIdx; i <= yMaxIdx; i++) {
        let y = -Grid39.MAX_EXTENT + (i * cellSize);
        if (y < -Grid39.MAX_EXTENT || y > Grid39.MAX_EXTENT) continue;
        let left = Grid39.xyToLonLat(minXY.x, y);
        let right = Grid39.xyToLonLat(maxXY.x, y);
        features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[left.lon, left.lat], [right.lon, right.lat]] } });
    }

    if (map.getSource(sourceId)) map.getSource(sourceId).setData({ type: 'FeatureCollection', features: features });
}

map.on('move', updateViewportGrid);
map.on('zoom', updateViewportGrid);

map.on('mousemove', (e) => {
    const zoom = map.getZoom();
    if (zoom < 7 || Object.keys(Grid39.wordlists).length === 0) {
        if (map.getSource('hover-cell')) map.getSource('hover-cell').setData({type: 'FeatureCollection', features: []});
        return;
    }
    
    const level = getActiveGridLevel(zoom);
    const activeGridSize = getActiveGridSize(level);
    
    let { x, y } = Grid39.lonLatToXY(e.lngLat.lng, e.lngLat.lat);
    const cellSize = (Grid39.MAX_EXTENT * 2) / activeGridSize;
    let xIdx = Math.floor((x + Grid39.MAX_EXTENT) / cellSize);
    let yIdx = Math.floor((y + Grid39.MAX_EXTENT) / cellSize);
    let xMin = -Grid39.MAX_EXTENT + (xIdx * cellSize);
    let yMin = -Grid39.MAX_EXTENT + (yIdx * cellSize);

    let bl = Grid39.xyToLonLat(xMin, yMin);
    let br = Grid39.xyToLonLat(xMin + cellSize, yMin);
    let tr = Grid39.xyToLonLat(xMin + cellSize, yMin + cellSize);
    let tl = Grid39.xyToLonLat(xMin, yMin + cellSize);

    if (map.getSource('hover-cell')) {
        map.getSource('hover-cell').setData({ 
            type: 'FeatureCollection', 
            features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[ [bl.lon, bl.lat], [br.lon, br.lat], [tr.lon, tr.lat], [tl.lon, tl.lat], [bl.lon, bl.lat] ]] } }] 
        });
    }
});

map.on('mouseout', () => { 
    if (map.getSource('hover-cell')) map.getSource('hover-cell').setData({type: 'FeatureCollection', features: []}); 
});

// ==========================================
// 4. OVLÁDÁNÍ A VYHLEDÁVÁNÍ
// ==========================================
function drawUnifiedArea(bounds) {
    lastBounds = bounds;
    const coordinates = [[[bounds.minLon, bounds.minLat], [bounds.maxLon, bounds.minLat], [bounds.maxLon, bounds.maxLat], [bounds.minLon, bounds.maxLat], [bounds.minLon, bounds.minLat]]];
    if (map.getSource('unified-area')) {
        map.getSource('unified-area').setData({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: coordinates } }] });
    }
}

function showResult(wordsArray, centerLat, centerLon, bounds, depth) {
    const rawString = wordsArray.join(" ");
    
    window.history.replaceState(null, null, "#" + wordsArray.join("-"));
    
    document.getElementById('welcomeBox').style.display = 'none';
    document.getElementById('activeResultBox').style.display = 'block';
    document.getElementById('shareBtn').style.display = 'flex'; 
    
    let label = "";
    let zoomTarget = 0;

    if (depth === 2) { label = "19.8km Region"; zoomTarget = 10.5; }
    if (depth === 3) { label = "450m Neighborhood"; zoomTarget = 14; }
    if (depth === 4) { label = "10.0m Square"; zoomTarget = 19.5; }
    if (depth === 5) { label = "1.0m Square"; zoomTarget = 23; }
    
    document.getElementById('areaLabel').innerText = label;
    document.getElementById('resultWords').innerHTML = rawString;
    document.getElementById('universalInput').value = rawString;

    const popupContent = `
        <div style="text-align: center; color: var(--text-secondary); font-size: 0.85rem; font-weight: 600;">${label}</div>
        <div class="popup-words" onclick="copyToClipboard('${rawString}', this)" title="Click to copy" style="border-radius: 8px; padding: 4px; margin-top: 4px; color: var(--accent-dark);">${rawString}</div>
        <div class="popup-gps">${centerLat.toFixed(6)}, ${centerLon.toFixed(6)}</div>
    `;
    popup.setLngLat([centerLon, centerLat]).setHTML(popupContent).addTo(map);
    drawUnifiedArea(bounds);

    map.fitBounds([[bounds.minLon, bounds.minLat], [bounds.maxLon, bounds.maxLat]], { padding: 50, maxZoom: zoomTarget });
}

map.on("click", function (e) {
    if (Object.keys(Grid39.wordlists).length === 0) return alert("Wordlist is loading...");
    try {
        const wordsArray = Grid39.encode(e.lngLat.lat, e.lngLat.lng);
        const level = getActiveGridLevel(map.getZoom());
        
        let sliceCount = 4;
        if (level === 1) sliceCount = 2;
        if (level === 2) sliceCount = 3;
        if (level === 3) sliceCount = 4;
        if (level === 4) sliceCount = 5;

        const wordsToShow = wordsArray.slice(0, sliceCount);
        const result = Grid39.decode(wordsToShow);
        // Vygeneruje zpět slova ve vybraném jazyce a zobrazí je
        const standardWords = Grid39.encode(result.latCenter, result.lonCenter).slice(0, result.depth);
        showResult(standardWords, result.latCenter, result.lonCenter, result.bounds, result.depth);
    } catch (err) { alert(err); }
});

function searchUniversal() {
    const input = document.getElementById("universalInput").value.trim();
    if (!input) return;

    const decRegex = /([-+]?\d{1,3}(?:\.\d+)?)\s*[°]*\s*([NSns])?[,\s;]+([-+]?\d{1,3}(?:\.\d+)?)\s*[°]*\s*([EWOewo])?/;
    const decMatch = input.match(decRegex);
    
    if (decMatch) {
        if (Object.keys(Grid39.wordlists).length === 0) return alert("Wordlist is loading...");
        let lat = parseFloat(decMatch[1]), lon = parseFloat(decMatch[3]);
        if (decMatch[2] && decMatch[2].toUpperCase() === 'S') lat = -lat;
        if (decMatch[4] && (decMatch[4].toUpperCase() === 'W' || decMatch[4].toUpperCase() === 'O')) lon = -lon;
        
        try {
            const wordsArray = Grid39.encode(lat, lon);
            const result = Grid39.decode(wordsArray.slice(0, 4));
            const standardWords = Grid39.encode(result.latCenter, result.lonCenter).slice(0, result.depth);
            showResult(standardWords, result.latCenter, result.lonCenter, result.bounds, result.depth);
        } catch (e) { alert("Invalid location coordinates."); }
        return;
    }

    const wordsArray = input.toLowerCase().split(/[\s.]+/).filter(w => w.length > 0);
    if (wordsArray.length >= 2 && wordsArray.length <= 5) {
        try {
            const result = Grid39.decode(wordsArray);
            // Translate: Vstoupí španělská slova -> vrátí se GPS -> zakóduje do vybraného UI jazyka!
            const standardWords = Grid39.encode(result.latCenter, result.lonCenter).slice(0, result.depth);
            showResult(standardWords, result.latCenter, result.lonCenter, result.bounds, result.depth);
        } catch (e) { alert(e); }
        return;
    }
    alert("Please enter 2, 3, 4, or 5 words, or valid GPS coordinates.");
}

function copyToClipboard(rawText, element) {
    navigator.clipboard.writeText(rawText).then(() => {
        const originalHTML = element.innerHTML;
        element.innerText = "✓ Copied!";
        element.style.backgroundColor = "var(--accent)";
        element.style.color = "#ffffff";
        setTimeout(() => { element.innerHTML = originalHTML; element.style.backgroundColor = "transparent"; element.style.color = "var(--accent-dark)"; }, 1500);
    });
}
function copyResultWords() {
    const text = document.getElementById('universalInput').value;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('activeResultBox');
        btn.style.borderColor = '#17171a';
        setTimeout(() => { btn.style.borderColor = 'var(--accent)'; }, 500);
    });
}
function shareLocation() {
    const text = document.getElementById('universalInput').value;
    if (!text) return;
    if (navigator.share) {
        navigator.share({ title: 'GridMap Location', text: `Find this area at: ${text}`, url: window.location.href }).catch(console.error);
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => { alert("Link copied to clipboard!"); });
    }
}

// ==========================================
// 5. CHYTRÝ MULTI-LANGUAGE NAŠEPTÁVAČ
// ==========================================
const inputEl = document.getElementById("universalInput");
const listEl = document.getElementById("autocomplete-list");

inputEl.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        searchUniversal();
        listEl.style.display = "none";
    }
});

inputEl.addEventListener("input", function() {
    let val = this.value;
    listEl.innerHTML = "";
    
    if (!val || Object.keys(Grid39.wordlists).length === 0 || /\d/.test(val)) {
        listEl.style.display = "none";
        return;
    }

    const parts = val.split(/[\s.]+/);
    if (parts.length > 5) {
        listEl.style.display = "none";
        return;
    }

    const currentWordIndex = parts.length - 1;
    const currentWord = parts[currentWordIndex].toLowerCase();
    
    if (val.match(/[\s.]$/) || currentWord.length === 0) {
        listEl.style.display = "none";
        return;
    }

    // Omezení nápovědy podle toho, jaké slovo uživatel zadává (aby nevybral něco za hranicí mapy)
    let limit = 2048;
    if (currentWordIndex === 0 || currentWordIndex === 1) limit = Grid39.DIV_L1;
    else if (currentWordIndex === 2) limit = Grid39.DIV_L2 * Grid39.DIV_L2;      
    else if (currentWordIndex === 3) limit = Grid39.DIV_L3 * Grid39.DIV_L3;      
    else if (currentWordIndex === 4) limit = Grid39.DIV_L4 * Grid39.DIV_L4;      

    let matches = [];
    
    // 1. PRIORITA: Hledat nejprve v aktuálně vybraném jazyce!
    if (Grid39.wordlists[Grid39.activeLang]) {
        const activeWords = Grid39.wordlists[Grid39.activeLang].slice(0, limit);
        matches.push(...activeWords.filter(w => w.startsWith(currentWord)));
    }

    // 2. ZÁLOHA: Hledat i ve všech ostatních jazycích (aby fungoval globální překlad)
    for (let lang in Grid39.wordlists) {
        if (lang === Grid39.activeLang) continue; // Přeskočit aktuální, ten už máme
        const allowedWords = Grid39.wordlists[lang].slice(0, limit);
        matches.push(...allowedWords.filter(w => w.startsWith(currentWord)));
    }
    
    // Vyřadí případné duplicity a ořízne přesně na 5 nejlepších výsledků
    matches = [...new Set(matches)].slice(0, 5);

    if (matches.length > 0) {
        listEl.style.display = "block";
        matches.forEach(match => {
            const div = document.createElement("div");
            div.className = "autocomplete-item";
            div.innerHTML = `<strong>${match.substring(0, currentWord.length)}</strong>${match.substring(currentWord.length)}`;
            
            div.addEventListener("click", function() {
                parts[parts.length - 1] = match;
                inputEl.value = parts.join(" ") + " ";
                listEl.style.display = "none";
                inputEl.focus();
            });
            
            listEl.appendChild(div);
        });
    } else {
        listEl.style.display = "none";
    }
});

document.addEventListener("click", function (e) {
    if (e.target !== inputEl) listEl.style.display = "none";
});

// ==========================================
// 6. DEEP LINKING 
// ==========================================
function processUrlHash() {
    const hash = window.location.hash.substring(1);
    if (hash && Object.keys(Grid39.wordlists).length > 0) {
        const decodedWords = hash.replace(/[-.]/g, " ");
        const inputEl = document.getElementById("universalInput");
        
        if (inputEl.value.trim() !== decodedWords.trim()) {
            inputEl.value = decodedWords;
            searchUniversal();
        }
    }
}

window.addEventListener("hashchange", processUrlHash);

// ==========================================
// 7. PWA INSTALACE
// ==========================================
let deferredPrompt;
const installAppBtn = document.getElementById('installAppBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installAppBtn) installAppBtn.style.display = 'flex';
});

if (installAppBtn) {
    installAppBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            installAppBtn.style.display = 'none';
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
        }
    });
}

window.addEventListener('appinstalled', () => {
    if (installAppBtn) installAppBtn.style.display = 'none';
    deferredPrompt = null;
});