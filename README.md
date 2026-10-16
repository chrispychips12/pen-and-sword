# Pen and Sword

Brand site for Pen and Sword, menswear for the first chapter. Static HTML, CSS and JS with no build step.

## Run it

```bash
python3 -m http.server 5173 --bind 127.0.0.1
```

Then open http://127.0.0.1:5173.

Temporary live preview: https://chrispychips12.github.io/pen-and-sword/ (GitHub Pages, from `main`). Any static host works (Netlify, Vercel, GitHub Pages, Cloudflare Pages): upload the folder as-is.

## Files

| File | What it holds |
|---|---|
| `index.html` | Page structure and all copy |
| `styles.css` | Tokens (colours, type scale, spacing) at the top, then sections in page order |
| `main.js` | Interactions: intro, smooth scroll, the desk-to-drinks day, values, product rail, mark story |
| `products.js` | Collection 01 data. **Edit this to add real products** |
| `garments.js` | Line drawings for the desk-to-drinks story (they draw themselves in on scroll) |
| `assets/photos/` | Placeholder product photos taken from the brandbook moodboard. Replace before launch |
| `assets/` | Logo mark, sword, quill and wordmark as SVG, extracted from the brandbook PDF |

## Adding real products

In `products.js`, set each piece's `image` (an 800px-wide JPEG fallback), `webp` (480px and 800px WebP versions, so phones download the small one), `imageAlt` and `price`. Give it an `href` and the tile becomes a link. `focus` sets which part of the photo stays in frame (CSS object-position). A piece with no image shows a faint brand mark. Recommended photo ratio: 4:5.

The current photos are the brandbook's reference imagery, which isn't Pen and Sword's own photography. Swap them all for real shoots before a proper launch.

## Typeface

The brandbook specifies **The Seasons** (Adobe Fonts). Bellefair stands in until it's licensed. To switch, add the Adobe Fonts kit `<link>` to `index.html`. The `--font-display` token in `styles.css` already lists "The Seasons" first, so it takes over automatically.

The logo and wordmark are vector outlines taken from the brandbook, not live text, so they're already exact.

## Motion and accessibility

- `prefers-reduced-motion` gives a still page: no smooth scroll, no pinning, and the day section becomes a vertical list.
- The custom cursor and magnetic buttons only run on mouse or trackpad devices.
- If the GSAP or Lenis CDNs fail to load, the page still renders fully, just without motion.
