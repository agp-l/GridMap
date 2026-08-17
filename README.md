# Grid4 🌍

> **The world addressed in four words.**

Grid4 is a free and open-source alternative to proprietary geolocation systems (such as what3words). It divides the entire planet into a grid of 3x3 meter squares and assigns each one a unique, easy-to-remember address composed of 4 common English words. 

No complex GPS coordinates, no licensing fees. Just an open standard for everyone.

## 🌟 Key Features

* **🎯 Maximum Precision:** The grid covers the entire world in 3-meter squares.
* **🗣️ Natural Communication:** Four words are easy to remember, dictate over the phone, and transcribe.
* **🔓 Completely Free and Open-Source:** No subscriptions or licensing fees for commercial or personal use.
* **🚫 Error Elimination:** A carefully curated dictionary (4096 words) excluding words that sound similar or are difficult to spell.

## ⚖️ Two Available Models

The project offers two different mathematical methods for encoding location, both wrapped in the same user interface:

### 1. Grid4 System (Linear X/Y)
* **How it works:** Independently encodes the X-axis (longitude) using 2 words and the Y-axis (latitude) using another 2 words.
* **Advantages:** Mathematically very simple, robust, and accurate. It always requires exactly 4 words.

### 2. Fixphrase System (Hierarchical Z-Order)
* **How it works:** Utilizes a space-filling curve (Z-order curve) that interleaves the coordinates. 
* **Advantages:** A smaller number of words designates a larger geographic area (1 word = continent, 4 words = 3m square). It includes built-in error correction and scrambled word detection.

## 📂 Repository Structure

* `index.html` - The main presentation page of the project (Landing page).
* `mapa.html` - Interactive map for the basic **Grid4** system.
* `map_logic.js` - Translation logic between coordinates and words for Grid4.
* `fixphrase.html` - Interactive map for the hierarchical **Fixphrase** system.
* `fixphrase_logic.js` - Integration of the map (Mapbox) with the Fixphrase algorithm.
* `fixphrase.js` - Core mathematical encoding and decoding logic for Fixphrase.
* `wordlist.json` - Database of 4096 unambiguous English words.
* `locate.png` - Illustrative graphic for the web.

## 🚀 How to Run Locally

The project is written in vanilla HTML, CSS, and JavaScript (no complex bundling required). Mapbox GL JS is used for rendering maps.

1. Clone this repository.
2. Open the project folder and start a local web server (e.g., using the *Live Server* extension in VS Code or via Python: `python -m http.server`). Opening the files directly (`file://`) might block the loading of `wordlist.json` due to the browser's CORS policy.
3. Open `index.html` in your browser.

> **Developer Note:** The project includes a testing Mapbox Access Token. For production deployment, please generate your own token at [mapbox.com](https://www.mapbox.com/) and replace the `mapboxgl.accessToken` variable in the `map_logic.js` and `fixphrase_logic.js` files.

## 📜 License

Most of the code and concepts are intended as a free and open standard. The `fixphrase.js` library is subject to an open-source license (see the file header - Copyright 2021 Netsyms Technologies).


# Grid4 🌍

> **Svět adresovaný pomocí čtyř slov.**

Grid4 je bezplatná a open-source alternativa k proprietárním geolokačním systémům (jako je např. what3words). Rozděluje celou planetu na mřížku čtverců o rozměrech 3x3 metry a každému z nich přiřazuje unikátní, snadno zapamatovatelnou adresu složenou ze 4 běžných anglických slov. 

Žádné složité GPS souřadnice, žádné licenční poplatky. Jen otevřený standard pro každého.

## 🌟 Hlavní vlastnosti

* **🎯 Maximální přesnost:** Mřížka pokrývá celý svět čtverci o velikosti 3 metry.
* **🗣️ Přirozená komunikace:** Čtyři slova se snadno pamatují, diktují do telefonu i přepisují.
* **🔓 Zcela zdarma a Open-Source:** Žádné předplatné ani licenční poplatky pro komerční či osobní užití.
* **🚫 Eliminace chyb:** Pečlivě vybraný slovník (4096 slov) bez slov, která znějí stejně nebo se složitě píšou.

## ⚖️ Dva dostupné modely

Projekt nabízí dvě různé matematické metody pro kódování lokace, obě zabalené ve stejném uživatelském rozhraní:

### 1. Grid4 System (Lineární X/Y)
* **Jak funguje:** Kóduje nezávisle osu X (zeměpisnou délku) pomocí 2 slov a osu Y (zeměpisnou šířku) pomocí dalších 2 slov.
* **Výhody:** Matematicky velmi jednoduché, robustní a přesné. Vždy vyžaduje přesně 4 slova.

### 2. Fixphrase System (Hierarchický Z-Order)
* **Jak funguje:** Využívá prostorově vyplňující křivku (Z-order curve), která prolíná souřadnice. 
* **Výhody:** Menší počet slov označuje větší geografickou oblast (1 slovo = kontinent, 4 slova = 3m čtverec). Obsahuje vestavěnou korekci chyb a detekci přeházených slov.

## 📂 Struktura repozitáře

* `index.html` - Hlavní prezentační stránka projektu (Landing page).
* `mapa.html` - Interaktivní mapa pro základní **Grid4** systém.
* `map_logic.js` - Logika překladu mezi souřadnicemi a slovy pro Grid4.
* `fixphrase.html` - Interaktivní mapa pro hierarchický systém **Fixphrase**.
* `fixphrase_logic.js` - Propojení mapy (Mapbox) s algoritmem Fixphrase.
* `fixphrase.js` - Jádro matematického kódování a dekódování pro Fixphrase.
* `wordlist.json` - Databáze 4096 bezproblémových anglických slov.
* `locate.png` - Ilustrační grafika pro web.

## 🚀 Jak spustit projekt lokálně

Projekt je napsán v čistém HTML, CSS a JavaScriptu (bez nutnosti složitého bundlování). K vykreslování map se využívá Mapbox GL JS.

1. Naklonujte si tento repozitář.
2. Otevřete složku s projektem a spusťte lokální webový server (např. pomocí rozšíření *Live Server* ve VS Code nebo Pythonu: `python -m http.server`). Otevření souborů napřímo (`file://`) může zablokovat načítání `wordlist.json` kvůli CORS politice prohlížeče.
3. Otevřete `index.html` ve svém prohlížeči.

> **Poznámka pro vývojáře:** Projekt obsahuje testovací Mapbox Access Token. Pro nasazení do produkce si prosím vygenerujte vlastní token na [mapbox.com](https://www.mapbox.com/) a nahraďte proměnnou `mapboxgl.accessToken` v souborech `map_logic.js` a `fixphrase_logic.js`.

## 📜 Licence

Většina kódu a konceptu je určena jako svobodný a otevřený standard. Knihovna `fixphrase.js` podléhá open-source licenci (viz hlavička souboru - Copyright 2021 Netsyms Technologies).
