# GridMap > **🌐 Live Demo:** You can test the application directly in your browser without local setup at **[map.dobrodruzi.cz](https://map.dobrodruzi.cz/)**.

> **The world addressed in simple words.**

GridMap is a free and open-source alternative to proprietary geolocation systems. It divides the entire planet into a hierarchical grid, allowing you to identify any location using a few simple words from the highly secure **BIP39 standard dictionary**.

No complex GPS coordinates, no hidden licensing fees. Just an open standard for everyone, available in multiple languages.

## 🌟 Key Features

* **🎯 Scalable Precision:** The system dynamically scales based on your needs. Use 2 words for a city region, 4 words for a 10-meter square, or 5 words for an exact 1-meter spot.
* **🌐 Multi-Language & Auto-Translate:** Powered by official BIP39 dictionaries (English, Czech, Spanish, Italian, French, Portuguese). The system understands all loaded languages simultaneously—you can search using Spanish words and display the result in English!
* **🛡️ BIP39 Security:** Uses the battle-tested 2048-word dictionary originally designed for cryptocurrency recovery seeds. This guarantees words are easy to spell, uniquely identifiable by their first 4 letters, and safe from phonetic confusion.
* **🔓 Completely Free and Open:** No subscriptions or commercial licensing paywalls. You are free to integrate this into your own apps.
* **📱 PWA Ready:** Works as a Progressive Web App. Install it directly to your iOS or Android home screen for a native-like offline experience.

## ⚖️ Precision Levels (Hybrid 2D-Zoom Model)

GridMap uses a unique mathematical "Hybrid X/Y" model. The first two words set the base grid, and every subsequent word acts as a 2D magnifier, dividing the previous square into perfectly rounded metric units:

* **2 Words:** ~19.8 km Region
* **3 Words:** ~450 m Neighborhood
* **4 Words (Standard Layer):** **10.0 x 10.0 meter square.** The universal standard for human communication. Perfect for meetups, parking spots, or building entrances.
* **5 Words (PRO Layer):** **1.0 x 1.0 meter square.** Microscopic precision for automated systems, logistics, and drone deliveries.

## 📂 Repository Structure

The project is lightweight and written in vanilla HTML, CSS, and JavaScript.

* `index.html` - The main presentation page (Landing page).
* `grid39.html` - The modern interactive GridMap web application (BIP39 version).
* `logic_grid39.js` - Core mathematical hybrid encoding/decoding and Mapbox UI integration.
* `bip39_*.js` - The 2048-word BIP39 dictionaries for various languages (en, cs, es, it, pt, fr).
* `grid10.html` & `logic_grid10.js` - Legacy/Alternative version utilizing an 8,111-word Z-Order curve model.
* `manifest.json` & `sw.js` - Service Worker and PWA configuration for mobile installation.
* `icon.svg` & `icon-192.png` - App icons for browsers and mobile devices.

## 🚀 How to Run Locally

No complex build tools or bundlers are required. Mapbox GL JS is used for rendering the maps.

1. Clone this repository: `git clone https://github.com/agp-l/GridMap.git`
2. Open the project folder and start a local web server. 
   *(Note: For PWA features and modules to work properly, do not open files directly via `file://`)*
   * **VS Code:** Use the *Live Server* extension.
   * **Python:** Run `python -m http.server` in your terminal.
3. Open `http://localhost:8000` (or your specific local port) in your browser and navigate to `grid39.html`.

> **⚠️ Developer Note (API Key):** The project currently includes a testing Mapbox Access Token. For production deployment or heavy usage, please generate your own free token at [mapbox.com](https://www.mapbox.com/) and replace the `mapboxgl.accessToken` variable at the very top of the `logic_grid39.js` file.

## 📜 License

GridMap is designed to be a free and open standard. You are free to use, modify, and distribute the code for both personal and commercial projects.
