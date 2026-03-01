# Andreas & Chris and the Silk Road Secret

A shareable Chengdu + Chongqing travel microsite with:
- District tabs and hotel cards
- One-bed/two-bed refundable vs non-refundable room matrixes
- Michelin restaurant table with budget guidance
- Shopping + transit planning sections
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
- `data/data-inline.js`
- `assets/hotels/<hotel-id>/exterior.svg`
- `assets/hotels/<hotel-id>/interior.svg`
- `assets/placeholders/image-unavailable.svg`
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

## Export to PDF
1. Open the page in your browser.
2. Click **Print / Save PDF**.
3. Choose **Save as PDF**.

## GitHub Pages deploy
1. Push this project to GitHub (branch `main`).
2. In GitHub repo settings, ensure **Pages** source is set to **GitHub Actions**.
3. Workflow `.github/workflows/pages.yml` deploys automatically on push to `main`.
4. Share the generated Pages URL with friends.

## Notes on image reliability
- Every hotel now has deterministic local backup images in `assets/hotels/...`.
- Rendering order is: local image -> external primary -> external fallback -> placeholder.
- This ensures the page still renders cleanly even when third-party hosts fail.
