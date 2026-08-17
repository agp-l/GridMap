# GridMap 🌍

> **The world addressed in simple words.**

GridMap is a free and open-source alternative to proprietary geolocation systems. It divides the entire planet into a hierarchical grid, allowing you to identify any location using a few simple, everyday English words. 

No complex GPS coordinates, no hidden licensing fees. Just an open standard for everyone.

## 🌟 Key Features

* **🎯 Scalable Precision:** The system dynamically scales based on your needs. Use 4 words for a 10-meter square, or 5 words for an exact 1-meter spot.
* **🗣️ Built for Humans:** Everyday words are easy to remember, dictate over the phone, and transcribe without errors.
* **🔓 Completely Free and Open:** No subscriptions or commercial licensing paywalls. You are free to integrate this into your own apps.
* **📱 PWA Ready:** Works as a Progressive Web App. Install it directly to your iOS or Android home screen for a native-like experience.
* **🚫 Curated Vocabulary:** A carefully filtered dictionary (8,111 words) designed to exclude words that sound similar, are offensive, or are difficult to spell.

## ⚖️ Precision Levels (Hierarchical Z-Order)

GridMap uses a space-filling curve (Z-order) that interleaves coordinates, meaning fewer words describe a larger area, and adding words zooms you in:

* **1 Word:** ~890 km Zone
* **2 Words:** ~19.8 km Region
* **3 Words:** ~440 m Neighborhood
* **4 Words (Standard Layer):** **10x10 meter square.** The universal standard for human communication. Perfect for meetups, parking spots, or building entrances.
* **5 Words (PRO Layer):** **1x1 meter square.** Microscopic precision for automated systems. The 5th word is always an animal. Ideal for logistics, drone deliveries, and pinpoint accuracy.

## 📂 Repository Structure

The project is lightweight and written in vanilla HTML, CSS, and JavaScript.

* `index.html` - The main presentation page (Landing page).
* `grid10.html` - The interactive GridMap web application.
* `logic_grid10.js` - Core mathematical encoding/decoding and Mapbox UI integration.
* `wordlist.json` - Database of unambiguous English words.
* `manifest.json` & `sw.js` - Service Worker and PWA configuration for mobile installation.
* `icon.svg` & `icon-192.png` - App icons for browsers and mobile devices.
* `favicon.ico` - Standard website favicon.

## 🚀 How to Run Locally

No complex build tools or bundlers are required. Mapbox GL JS is used for rendering the maps.

1. Clone this repository: `git clone https://github.com/agp-l/GridMap.git`
2. Open the project folder and start a local web server. 
   *(Note: Opening the files directly via `file://` will block the loading of `wordlist.json` and PWA features due to browser security policies).*
   * **VS Code:** Use the *Live Server* extension.
   * **Python:** Run `python -m http.server` in your terminal.
3. Open `http://localhost:5500` (or your specific local port) in your browser.

> **⚠️ Developer Note (API Key):** The project currently includes a testing Mapbox Access Token. For production deployment or heavy usage, please generate your own free token at [mapbox.com](https://www.mapbox.com/) and replace the `mapboxgl.accessToken` variable at the very top of the `logic_grid10.js` file.

## 📜 License

GridMap is designed to be a free and open standard. You are free to use, modify, and distribute the code for both personal and commercial projects.
