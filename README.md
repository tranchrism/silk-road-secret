# Andreas & Chris and the Silk Road Secret

A shareable Chengdu + Chongqing travel microsite with:
- District tabs and half-page hotel cards
- One-bed/two-bed refundable vs non-refundable room matrixes
- Trust labels (`Verified`, `Estimated`, `Inferred`) across planning content
- Temple House pricing normalized to USD display with conversion provenance
- City-aware restaurant table (Chengdu vs Chongqing)
- China Tips handbook for US travelers
- Mobile + keyboard playable Silk Snake mini-game
- Local-first image loading for deterministic reliability

## Project files
- `index.html`
- `styles.css`
- `script.js`
- `data/hotels.json`
- `data/restaurants.json`
- `data/shopping.json`
- `data/transit.json`
- `data/chongqing_24h.json`
- `data/china_tips.json`
- `data/data-inline.js`
- `assets/hotels/<hotel-id>/exterior.jpg`
- `assets/hotels/<hotel-id>/interior.jpg`
- `assets/placeholders/image-unavailable.svg`
- `assets/mascot/silk-road-duo.svg`
- `scripts/validate-data-trust.sh`
- `.github/workflows/pages.yml`
- `.nojekyll`

## Open locally
### Option A (direct open)
- Open `index.html` in your browser.
- The page auto-falls back to embedded inline data for `file://` mode.

### Option B (local server)
```bash
cd /Users/chris/Documents/Playground/chengdu-guide
python3 -m http.server 8000
```
Then open `http://localhost:8000`.

## Validate trust metadata
```bash
cd /Users/chris/Documents/Playground/chengdu-guide
bash scripts/validate-data-trust.sh
```

## Export to PDF
1. Open the page in your browser.
2. Click **Print / Save PDF**.
3. Choose **Save as PDF**.

## GitHub Pages deploy
1. Push this project to GitHub (branch `main`).
2. In GitHub repo settings, ensure **Pages** source is set to **GitHub Actions**.
3. Workflow `.github/workflows/pages.yml` deploys automatically on push to `main`.
4. Share the generated Pages URL.

## Notes on image reliability
- Every hotel has deterministic local backup images in `assets/hotels/...`.
- Rendering order is: local image -> external primary -> external fallback -> placeholder.
- This keeps cards clean even if third-party hosts fail.
