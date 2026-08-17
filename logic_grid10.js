mapboxgl.accessToken = "pk.eyJ1IjoiYWdwbCIsImEiOiJjbG1rY3lqdWswMWliMnJuenpndHpnMmh6In0.ZAg3F_H8uxL9jC5h8f41Iw";

// ==========================================
// 1. JÁDRO: GRID MAP HIERARCHICAL SYSTEM
// ==========================================
const UnifiedGrid = {
    wordlist: [],
    
    // 5 kroků: Zóna, Region, Sousedství, Čtverec 10m, PRO Čtverec 1m
    STEPS: [45, 45, 45, 44, 10], 
    
    get WORDS_PER_GROUP() { return this.STEPS.map(s => s * s); },
    get OFFSETS() {
        let off = [0];
        for (let i = 1; i < this.STEPS.length; i++) off.push(off[i-1] + this.WORDS_PER_GROUP[i-1]);
        return off;
    },
    get TOTAL_WORDS_NEEDED() { return this.WORDS_PER_GROUP.reduce((a, b) => a + b, 0); }, 
    R: 6378137.0,
    get MAX_EXTENT() { return Math.PI * this.R; },
    get GRID_SIZE() { return this.STEPS.reduce((a, b) => a * b, 1); }, 

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
        if (this.wordlist.length < this.TOTAL_WORDS_NEEDED) throw `GridMap requires exactly ${this.TOTAL_WORDS_NEEDED} words.`;

        let { x, y } = this.lonLatToXY(lon, lat);
        let xFrac = (x + this.MAX_EXTENT) / (2 * this.MAX_EXTENT);
        let yFrac = (y + this.MAX_EXTENT) / (2 * this.MAX_EXTENT);

        let xIndex = Math.min(Math.floor(xFrac * this.GRID_SIZE), this.GRID_SIZE - 1);
        let yIndex = Math.min(Math.floor(yFrac * this.GRID_SIZE), this.GRID_SIZE - 1);

        let x_steps = [], y_steps = [];
        for (let i = this.STEPS.length - 1; i >= 0; i--) {
            x_steps[i] = xIndex % this.STEPS[i];
            y_steps[i] = yIndex % this.STEPS[i];
            xIndex = Math.floor(xIndex / this.STEPS[i]);
            yIndex = Math.floor(yIndex / this.STEPS[i]);
        }

        let words = [];
        for (let i = 0; i < this.STEPS.length; i++) {
            let w_idx = y_steps[i] * this.STEPS[i] + x_steps[i];
            words.push(this.wordlist[this.OFFSETS[i] + w_idx]);
        }
        return words; 
    },

    decode: function(wordsArray) {
        if (this.wordlist.length < this.TOTAL_WORDS_NEEDED) throw `GridMap requires exactly ${this.TOTAL_WORDS_NEEDED} words.`;

        let levels = new Array(this.STEPS.length).fill(-1);
        let canonical = new Array(this.STEPS.length).fill("");

        for (let word of wordsArray) {
            let w = word.toLowerCase();
            let idx = this.wordlist.indexOf(w);
            if (idx === -1) continue; 

            for (let i = 0; i < this.STEPS.length; i++) {
                if (idx >= this.OFFSETS[i] && idx < this.OFFSETS[i] + this.WORDS_PER_GROUP[i]) {
                    levels[i] = idx - this.OFFSETS[i];
                    canonical[i] = w;
                }
            }
        }

        if (levels[0] === -1) throw "Location cannot be calculated. The primary Zone word is missing.";
        
        let depth = 0;
        for (let i = 0; i < this.STEPS.length; i++) {
            if (levels[i] !== -1) depth = i + 1;
            else break; 
        }

        let xMinIdx = 0, yMinIdx = 0;
        let span = this.GRID_SIZE; 

        for (let i = 0; i < depth; i++) {
            span /= this.STEPS[i];
            let y_step = Math.floor(levels[i] / this.STEPS[i]);
            let x_step = levels[i] % this.STEPS[i];
            xMinIdx += x_step * span;
            yMinIdx += y_step * span;
        }

        const cellSize = (this.MAX_EXTENT * 2) / this.GRID_SIZE;
        let xMin = -this.MAX_EXTENT + (xMinIdx * cellSize);
        let xMax = -this.MAX_EXTENT + ((xMinIdx + span) * cellSize);
        let yMin = -this.MAX_EXTENT + (yMinIdx * cellSize);
        let yMax = -this.MAX_EXTENT + ((yMinIdx + span) * cellSize);

        let bl = this.xyToLonLat(xMin, yMin);
        let tr = this.xyToLonLat(xMax, yMax);
        let center = this.xyToLonLat((xMin + xMax) / 2, (yMin + yMax) / 2);

        return {
            latCenter: center.lat,
            lonCenter: center.lon,
            bounds: { minLat: bl.lat, maxLat: tr.lat, minLon: bl.lon, maxLon: tr.lon },
            words: canonical.filter(w => w !== ""),
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
    maxZoom: 24 // Odemyká extrémní přiblížení
});

let popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: true, anchor: 'bottom', offset: [0, -10] });
let lastBounds = null; 

fetch('wordlist.json')
    .then(response => { if (!response.ok) throw new Error("Network error"); return response.json(); })
    .then(data => {
        UnifiedGrid.wordlist = data;
        processUrlHash(); // Pro deep-linking po načtení slov
    })
    .catch(error => { alert("Failed to load wordlist.json."); });

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

// Určuje aktivní úroveň dělení mapy na základě ZOOMU
function getActiveGridLevel(zoom) {
    if (zoom < 7) return 1;          // Zóna (1 slovo)
    if (zoom < 11.5) return 2;       // Region (2 slova)
    if (zoom < 16) return 3;         // Sousedství (3 slova)
    if (zoom < 20.5) return 4;       // Základní 10m čtverec (4 slova)
    return 5;                        // PRO 1m čtverec (5 slov)
}

function getActiveGridSize(level) {
    if (level === 1) return UnifiedGrid.STEPS[0];
    if (level === 2) return UnifiedGrid.STEPS[0] * UnifiedGrid.STEPS[1];
    if (level === 3) return UnifiedGrid.STEPS[0] * UnifiedGrid.STEPS[1] * UnifiedGrid.STEPS[2];
    if (level === 4) return UnifiedGrid.GRID_SIZE / 10;
    return UnifiedGrid.GRID_SIZE;
}

function updateViewportGrid() {
    const zoom = map.getZoom();
    const sourceId = 'viewport-grid';

    // Skrytí při úplném oddálení, aby mřížka nespálila oči
    if (zoom < 3) {
        if (map.getSource(sourceId)) map.getSource(sourceId).setData({ type: 'FeatureCollection', features: [] });
        return;
    }

    const level = getActiveGridLevel(zoom);
    const activeGridSize = getActiveGridSize(level);

    // Dynamická úprava tloušťky a průhlednosti mřížky podle úrovně
    let lineOpacity = 0.25;
    let lineWidth = 1;
    if (level === 1) { lineOpacity = 0.4; lineWidth = 2; }
    if (level === 2) { lineOpacity = 0.35; lineWidth = 1.5; }
    if (level === 5) { lineOpacity = 0.4; lineWidth = 0.5; }

    if (map.getLayer('viewport-grid-lines')) {
        map.setPaintProperty('viewport-grid-lines', 'line-opacity', lineOpacity);
        map.setPaintProperty('viewport-grid-lines', 'line-width', lineWidth);
    }

    const bounds = map.getBounds();
    // Ochrana před vykreslováním mimo mapu
    const west = Math.max(bounds.getWest(), -180);
    const east = Math.min(bounds.getEast(), 180);
    const south = Math.max(bounds.getSouth(), -85.05);
    const north = Math.min(bounds.getNorth(), 85.05);

    const minXY = UnifiedGrid.lonLatToXY(west, south);
    const maxXY = UnifiedGrid.lonLatToXY(east, north);
    const cellSize = (UnifiedGrid.MAX_EXTENT * 2) / activeGridSize;
    
    let xMinIdx = Math.floor((minXY.x + UnifiedGrid.MAX_EXTENT) / cellSize);
    let xMaxIdx = Math.ceil((maxXY.x + UnifiedGrid.MAX_EXTENT) / cellSize);
    let yMinIdx = Math.floor((minXY.y + UnifiedGrid.MAX_EXTENT) / cellSize);
    let yMaxIdx = Math.ceil((maxXY.y + UnifiedGrid.MAX_EXTENT) / cellSize);

    // Bezpečnostní limit renderování (zabrání seku prohlížeče)
    if (xMaxIdx - xMinIdx > 300 || yMaxIdx - yMinIdx > 300) {
        if (map.getSource(sourceId)) map.getSource(sourceId).setData({ type: 'FeatureCollection', features: [] });
        return;
    }

    let features = [];
    for (let i = xMinIdx; i <= xMaxIdx; i++) {
        let x = -UnifiedGrid.MAX_EXTENT + (i * cellSize);
        if (x < -UnifiedGrid.MAX_EXTENT || x > UnifiedGrid.MAX_EXTENT) continue;
        let bottom = UnifiedGrid.xyToLonLat(x, minXY.y);
        let top = UnifiedGrid.xyToLonLat(x, maxXY.y);
        features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[bottom.lon, bottom.lat], [top.lon, top.lat]] } });
    }
    for (let i = yMinIdx; i <= yMaxIdx; i++) {
        let y = -UnifiedGrid.MAX_EXTENT + (i * cellSize);
        if (y < -UnifiedGrid.MAX_EXTENT || y > UnifiedGrid.MAX_EXTENT) continue;
        let left = UnifiedGrid.xyToLonLat(minXY.x, y);
        let right = UnifiedGrid.xyToLonLat(maxXY.x, y);
        features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[left.lon, left.lat], [right.lon, right.lat]] } });
    }

    if (map.getSource(sourceId)) map.getSource(sourceId).setData({ type: 'FeatureCollection', features: features });
}

map.on('move', updateViewportGrid);
map.on('zoom', updateViewportGrid);

// Dynamický Hover (kopíruje úroveň mřížky)
map.on('mousemove', (e) => {
    const zoom = map.getZoom();
    if (zoom < 3 || UnifiedGrid.wordlist.length === 0) {
        if (map.getSource('hover-cell')) map.getSource('hover-cell').setData({type: 'FeatureCollection', features: []});
        return;
    }
    
    const level = getActiveGridLevel(zoom);
    const activeGridSize = getActiveGridSize(level);
    
    let { x, y } = UnifiedGrid.lonLatToXY(e.lngLat.lng, e.lngLat.lat);
    const cellSize = (UnifiedGrid.MAX_EXTENT * 2) / activeGridSize;
    let xIdx = Math.floor((x + UnifiedGrid.MAX_EXTENT) / cellSize);
    let yIdx = Math.floor((y + UnifiedGrid.MAX_EXTENT) / cellSize);
    let xMin = -UnifiedGrid.MAX_EXTENT + (xIdx * cellSize);
    let yMin = -UnifiedGrid.MAX_EXTENT + (yIdx * cellSize);

    let bl = UnifiedGrid.xyToLonLat(xMin, yMin);
    let br = UnifiedGrid.xyToLonLat(xMin + cellSize, yMin);
    let tr = UnifiedGrid.xyToLonLat(xMin + cellSize, yMin + cellSize);
    let tl = UnifiedGrid.xyToLonLat(xMin, yMin + cellSize);

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
    
    // Zapsat slova čistě do URL s pomlčkami
    window.history.replaceState(null, null, "#" + wordsArray.join("-"));
    
    document.getElementById('welcomeBox').style.display = 'none';
    document.getElementById('activeResultBox').style.display = 'block';
    document.getElementById('shareBtn').style.display = 'flex'; 
    
    let label = "";
    let zoomTarget = 0;

    // Dynamické nastavení cílového zoomu po kliknutí
    if (depth === 1) { label = "890km Zone"; zoomTarget = 6; }
    if (depth === 2) { label = "19.8km Region"; zoomTarget = 10.5; }
    if (depth === 3) { label = "440m Neighborhood"; zoomTarget = 15.5; }
    if (depth === 4) { label = "10m Square"; zoomTarget = 19.5; }
    if (depth === 5) { label = "1m PRO Square"; zoomTarget = 23; }
    
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

// Dynamický klik (Kopíruje úroveň mřížky)
map.on("click", function (e) {
    if (UnifiedGrid.wordlist.length === 0) return alert("Wordlist is loading...");
    try {
        const wordsArray = UnifiedGrid.encode(e.lngLat.lat, e.lngLat.lng);
        const level = getActiveGridLevel(map.getZoom());
        const wordsToShow = wordsArray.slice(0, level); // Vrátí tolik slov, jakou mřížku zrovna vidíme!
        
        const result = UnifiedGrid.decode(wordsToShow);
        showResult(result.words, result.latCenter, result.lonCenter, result.bounds, result.depth);
    } catch (err) { alert(err); }
});

function searchUniversal() {
    const input = document.getElementById("universalInput").value.trim();
    if (!input) return;

    const decRegex = /([-+]?\d{1,3}(?:\.\d+)?)\s*[°]*\s*([NSns])?[,\s;]+([-+]?\d{1,3}(?:\.\d+)?)\s*[°]*\s*([EWOewo])?/;
    const decMatch = input.match(decRegex);
    
    if (decMatch) {
        if (UnifiedGrid.wordlist.length === 0) return alert("Wordlist is loading...");
        let lat = parseFloat(decMatch[1]), lon = parseFloat(decMatch[3]);
        if (decMatch[2] && decMatch[2].toUpperCase() === 'S') lat = -lat;
        if (decMatch[4] && (decMatch[4].toUpperCase() === 'W' || decMatch[4].toUpperCase() === 'O')) lon = -lon;
        
        try {
            // Hledání přes GPS natvrdo vrátí nejvyšší 10m přesnost (4 slova)
            const wordsArray = UnifiedGrid.encode(lat, lon);
            const result = UnifiedGrid.decode(wordsArray.slice(0, 4));
            showResult(result.words, result.latCenter, result.lonCenter, result.bounds, result.depth);
        } catch (e) { alert("Invalid location coordinates."); }
        return;
    }

    const wordsArray = input.toLowerCase().split(/[\s.]+/).filter(w => w.length > 0);
    if (wordsArray.length >= 1 && wordsArray.length <= 5) {
        try {
            const result = UnifiedGrid.decode(wordsArray);
            showResult(result.words, result.latCenter, result.lonCenter, result.bounds, result.depth);
        } catch (e) { alert(e); }
        return;
    }
    alert("Please enter 1 to 5 words or valid GPS coordinates.");
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
// 5. CHYTRÝ NAŠEPTÁVAČ SLOV (SMART AUTOCOMPLETE)
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
    
    if (!val || UnifiedGrid.wordlist.length === 0 || /\d/.test(val)) {
        listEl.style.display = "none";
        return;
    }

    const parts = val.split(/[\s.]+/);
    const completedWords = parts.slice(0, -1).map(w => w.toLowerCase());
    const currentWord = parts[parts.length - 1].toLowerCase();
    
    if (val.match(/[\s.]$/) || currentWord.length === 0) {
        listEl.style.display = "none";
        return;
    }

    let usedGroups = [];
    for (let w of completedWords) {
        let idx = UnifiedGrid.wordlist.indexOf(w);
        if (idx !== -1) {
            for (let i = 0; i < UnifiedGrid.STEPS.length; i++) {
                if (idx >= UnifiedGrid.OFFSETS[i] && idx < UnifiedGrid.OFFSETS[i] + UnifiedGrid.WORDS_PER_GROUP[i]) {
                    usedGroups.push(i);
                    break;
                }
            }
        }
    }

    let allowedWords = [];
    for (let i = 0; i < UnifiedGrid.STEPS.length; i++) {
        if (!usedGroups.includes(i)) {
            let start = UnifiedGrid.OFFSETS[i];
            let end = start + UnifiedGrid.WORDS_PER_GROUP[i];
            allowedWords = allowedWords.concat(UnifiedGrid.wordlist.slice(start, end));
        }
    }

    const matches = allowedWords.filter(w => w.startsWith(currentWord)).slice(0, 5);

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
// 6. DEEP LINKING (Přečte adresu ze sdíleného odkazu)
// ==========================================
function processUrlHash() {
    const hash = window.location.hash.substring(1);
    if (hash && UnifiedGrid.wordlist.length > 0) {
        const decodedWords = hash.replace(/[-.]/g, " ");
        const inputEl = document.getElementById("universalInput");
        
        if (inputEl.value.trim() !== decodedWords.trim()) {
            inputEl.value = decodedWords;
            searchUniversal();
        }
    }
}

window.addEventListener("hashchange", processUrlHash);
// Vyvoláno v sekci 2 po stažení slovníku.

// ==========================================
// 7. PWA INSTALACE (PŘIDAT NA PLOCHU)
// ==========================================
let deferredPrompt;
const installAppBtn = document.getElementById('installAppBtn');

// Prohlížeč zjistil, že appka jde nainstalovat
window.addEventListener('beforeinstallprompt', (e) => {
    // Zabránit výchozímu automatickému zobrazení výzvy (chceme vlastní tlačítko)
    e.preventDefault();
    // Uložíme událost na později
    deferredPrompt = e;
    // Zobrazíme naše tlačítko
    if (installAppBtn) {
        installAppBtn.style.display = 'flex';
    }
});

// Co se stane, když uživatel klikne na naše tlačítko
if (installAppBtn) {
    installAppBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            // Skryjeme tlačítko
            installAppBtn.style.display = 'none';
            // Zobrazíme systémovou instalační výzvu
            deferredPrompt.prompt();
            // Počkáme na odpověď uživatele
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`); // 'accepted' nebo 'dismissed'
            // Událost lze použít jen jednou, takže ji vymažeme
            deferredPrompt = null;
        }
    });
}

// Pokud uživatel aplikaci úspěšně nainstaluje, schováme tlačítko navždy
window.addEventListener('appinstalled', () => {
    if (installAppBtn) installAppBtn.style.display = 'none';
    deferredPrompt = null;
    console.log('PWA was installed');
});