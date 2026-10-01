# Vidhi Agarwal — Portfolio

A single-page portfolio site for **Vidhi Agarwal** — B.Com graduate, CA Foundation cleared,
working in Tally Prime, GST, bookkeeping and Advanced Excel / MIS reporting.

Static HTML, CSS and vanilla JavaScript. **No build step, no dependencies, no framework** —
push the folder and it runs.

---

## Deploying to GitHub Pages

### 1. Create the repository

Two options for the URL you end up with:

| Repo name | Live URL |
|---|---|
| `agarwalvidhi432-eng.github.io` | `https://agarwalvidhi432-eng.github.io` ← cleanest |
| anything else, e.g. `portfolio` | `https://agarwalvidhi432-eng.github.io/portfolio/` |

The first option is the one to use for a personal site. GitHub allows exactly one per account,
and the repo name must match the username exactly.

### 2. Push this folder

```bash
cd /Users/piyushsinha/Desktop/Project/AnshiResume

git init
git add .
git commit -m "Portfolio site"
git branch -M main
git remote add origin https://github.com/agarwalvidhi432-eng/agarwalvidhi432-eng.github.io.git
git push -u origin main
```

### 3. Turn Pages on

Repository → **Settings** → **Pages** → under *Build and deployment*:

- **Source:** Deploy from a branch
- **Branch:** `main`, folder `/ (root)`
- **Save**

First publish takes a minute or two. After that, every `git push` redeploys automatically.

---

## Files

```
index.html                          the entire page
assets/css/styles.css               design tokens + all styling
assets/js/main.js                   animation, interaction, GST engine
assets/Vidhi_Agarwal_Resume.pdf     served by the Résumé download button
.nojekyll                           tells Pages to serve files as-is
```

`Vidhi_Agarwal_Resume_Final.pdf` in the root is the original source document and isn't used by
the site — safe to delete from the repo if you'd rather not publish it twice.

---

## Editing content

Everything visible lives in `index.html` as plain text — no templating to learn.

**Updating the résumé PDF.** Replace `assets/Vidhi_Agarwal_Resume.pdf`, keeping the same filename,
and both download links keep working.

**Changing the colours.** Every colour in the site comes from the token block at the top of
`assets/css/styles.css` — `:root` for dark mode, `[data-theme="light"]` for light. Change `--gold`
in both places and the whole site re-themes.

> One caveat if you do: the current values are checked against WCAG AA (4.5:1 for body text).
> `--on-gold` is the text colour used on top of gold fills — it's near-black in dark mode but
> **white** in light mode, because the light-mode gold is dark enough that black text on it fails.

**Adding a project.** Copy any `<article class="acc">` block in the Work section and edit it.
The only thing to keep unique is the `aria-controls` / `id` pair (`p1`, `p2`, …).

---

## Notes on how it works

- **The trial balance in the hero** genuinely balances — ₹12,25,500 on both sides. Debits and
  credits are hardcoded in `index.html`; if you edit the figures, keep the two totals equal, because
  an accountant will check.
- **The GST desk** is a real calculator, not a mockup. Intra-state supply splits the tax into
  CGST + SGST at half the rate each; inter-state puts the whole amount in IGST. Amounts render in
  the Indian numbering system and the amount-in-words converter handles lakh/crore grouping and
  paise. Logic is in the `gstDesk` block of `main.js`.
- **Theme** follows the visitor's OS preference on first visit, then remembers their toggle in
  `localStorage`.
- **Motion** is fully disabled for visitors who set *Reduce Motion* in their OS accessibility
  settings — the canvas, cursor, tilt and typewriter all switch off.
- **Without JavaScript** the page still renders and reads completely; a `<noscript>` block unhides
  the animated-in content.
- **Printing** the page produces a clean document — the nav, canvas, ticker and cursor drop out and
  all project panels expand.

---

## Working on it locally

```bash
cd /Users/piyushsinha/Desktop/Project/AnshiResume
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` directly via `file://` mostly works, but
serving it is closer to how Pages will behave.
