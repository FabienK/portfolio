# AGENTS.md — portfolio

## Nature
- Portfolio Fabien — 8 produits shippés (Figma 14 DS, draw-it, Pack V1, Audit LinkedIn, App guitare, Prisme, Encyclo-Nana, ShowMe5WH) — `FDFBF7` + `Plus Jakarta Sans` + `Instrument Serif`. `file://` offline-first + `https://fabienk.github.io/portfolio/` OK.
- Stack : HTML statique pur (`index.html` canonique) + `DATA` embarquée (`<script id="DATA">` JSON 8 projets) + Tailwind CDN + Phosphor Icons CDN. Pas de `package.json`, pas de build — ne pas `npm install`/`build`.
- Spec canonique : `prompt-portfolio.md:1` — hero réduit `pt-24 pb-10`, bezel `p-6 sm:p-8 py-8`, titre `32/44/52px`, stats `22px`.

## Workspace
- Chemin avec espace — toujours quoter : `"/Users/fabien_1/Documents/Projet opencode/Agents/portfolio"`. `Projet opencode` non quoté casse `open`, `node`, et globs (même gotcha que `Pronote`/`Viz-projet`).
- Parent `Projet opencode/` est un umbrella, pas un monorepo — siblings `../Pronote`, `../Viz-projet`, `../Figma`, `../../draw-it`, `../../Figma` sont indépendants. Ne pas lire/écrire hors `portfolio/` sans demande.
- Git repo actif (`a19426e` HEAD) — 2 HTML vitrine (`index.html`, `gallery-showme5wh.html` 24 max), `placard.html` local 904 (ignoré), `assets/fog-hero-2400.jpg` tracké, `assets/showme5wh/` 24 fichiers trackés (12 JPG lexique + 12 PNG 4w1h).
- Pas de `opencode.json` local. Global : `~/.config/opencode/opencode.jsonc` (Playwright MCP activé). Pas de CI, pas de lockfile.
- Placard rangé 2026-09-11 : `pack-V1-Complet-39 2/Images générés` supprimé, `ComfyUI/output` dédupliqué, `backend/generated_batches` nettoyé (~268M gagnés) — voir `../Image generator/agents.md:1`. Vitrine limitée à 24, placard complet 904 en local.

## Commandes
```bash
open "/Users/fabien_1/Documents/Projet opencode/Agents/portfolio/index.html"  # file:// canonique — hero fog + grille 8 + filtres
open "/Users/fabien_1/Documents/Projet opencode/Agents/portfolio/gallery-showme5wh.html"  # vitrine musée 24 — propre sans croix, on regarde on ne touche pas
open "/Users/fabien_1/Documents/Projet opencode/Agents/portfolio/placard.html"  # placard local 904 — file:// uniquement (ignoré git), filtres + pagination 48
```

## Architecture — non-évident
- **Papier vs fond** (`index.html:22-27`) : `body #E8E6E1` + `fog-bg fixed inset-0 z:-2` (`assets/fog-hero-2400.jpg` `50% 38%` `saturate 0.65`) derrière `paper #FFFEFB` (grain `feTurbulence 0.04`, `shadow 0 32px 80px rgba(251,191,114,0.24) + 0 16px 48px rgba(0,0,0,0.08)`) + `fog-veil`/`fog-bloom`/`warm-light` en `z:-1`. Le papier n'est pas dedans le brouillard, il passe devant.
- **Même volume 3D** (`index.html:22`, `index.html:192`) : `.scene {perspective:1200px; perspective-origin:50% 18%}` + `fog-bg translateZ(-180px) scale(1.18)` + `paper translateZ(0)`. Parallaxe scroll : `fog-bg y*0.06`, `scene y*-0.015`, `fog-front-* y*0.02/0.028/0.036`, `fog-veil opacity max(0.45, 1-y*0.001)`. `prefers-reduced-motion` coupe tout (`index.html:33`).
- **3 calques devant sans cassure** (`index.html:49-52`) : `fixed inset-0 z:8` avec `background-image:url('assets/fog-hero-2400.jpg')` + `mask-image radial-gradient circle` :
  - calque 1 `760px at 50% 38%, transparent 48% → 0.14→0.34→0.62→0.86→black 88%` opacité `0.88` `saturate 0.72`
  - calque 2 `820px, transparent 52% → 0.08→0.22→0.48→0.72` opacité `0.42`
  - calque 3 `880px, transparent 58% → 0.06→0.16→0.32` opacité `0.22`
  Centre = cercle englobant le hero (pas un point). Règle des tiers : foyer lumineux `33% 38%` (aube, pin, backlight rasant).
- **Grille** (`index.html:130-179`) : `grid-cols-12 gap-5`, `col-span-12 lg:col-span-8` pour le 1er, `col-span-12 sm:col-span-6 lg:col-span-4` ensuite. Cartes bezel `rounded-[32px]/[24px]` `border-left:3px`, `reveal` `translateY 14px blur 4px 700ms cubic-bezier(0.32,0.72,0,1)` + stagger `40ms` + `IntersectionObserver threshold 0.1`. Filtres `data-filter` (`all/prod/WIP/opencode/claude`).
- **Galerie vitrine** (`gallery-showme5wh.html:1`) : 24 max, musée — grille `1/2/3` propre sans croix, `lightbox` seul, pas de `localStorage`, pas de picker. `images` hardcodé 12 lexique + 12 4w1h. Limite 24 fixée.
- **Placard local** (`placard.html:1`, ignoré git) : 904 pièces (`wardrobeFull` embarqué 1.1GB scan `Images générés` 120 + `ComfyUI/output` 701 + `typst` 27 + `batch` 24 + `autre` 32) via symlink `assets/wardrobe-full` → `../Image generator `, filtres `all/perspective/style/comfy/...` + recherche + pagination 48 + `toggle` + limite 24 + `Publier` → `cp` vers `showme5wh`.
- **DATA** (`index.html:103-116`) : JSON inliné, pas de fetch — `file://` offline direct. `runtime` = `opencode` (4) / `claude` (4), `statut` = `prod` (6) / `WIP` (2).

## Gotchas vérifiés
- `cdn.tailwindcss.com` + `fonts.googleapis.com` + `unpkg.com/@phosphor-icons` requièrent réseau — en `file://` offline sans réseau, hero non stylé / icons manquantes. Pas de fallback local.
- `assets/fog-hero-2400.jpg` (249 Ko) est le seul asset fog tracké et référencé (`og:image`, `fog-bg`, 3 calques). `fog-hero-flux-*.png` (1 Mo+) et `fog-hero-warm-2400.jpg` (3 Mo) sont untracked et ignorés (`.gitignore`).
- Espace dans `Projet opencode` et `Image generator ` — toujours quoter, symlink `wardrobe-full` pointe vers chemin avec espace + accent. `placard.html` = `file://` uniquement, pas sur GitHub.
- `gallery-showme5wh.html` vitrine n'a plus de `localStorage` — plus de bug cache. `placard.html` garde `showme5wh:selection` + `fileKey` pour sync local vs fichier (bandeau jaune si divergent). Vitrine limitée à 24, placard aussi.
- `assets/showme5wh/` 24 trackés — ne pas dépasser 24 en vitrine. Pour publier depuis placard : `cp wardrobe-full/... showme5wh/...` + `git add && git push`.

## Assets
- `assets/fog-hero-2400.jpg` — Flux schnell `1216×832 → 2048×1400` recadré, aube pins + cône volumétrique `33% 38%`
- `assets/showme5wh/` — 24 fichiers (12 JPG lexique `perspectives_print/styles-starter` + 12 PNG `4w1h_*`) — trackés, vitrine 24 max
- `assets/wardrobe` + `assets/wardrobe-full` — symlinks locaux vers `Images générés` et `Image generator ` (ignorés, 904 au placard)
- `assets/comfy-output` — symlink local vers `ComfyUI/output` (ignoré)
- `placard.html` — 904 placard local (ignoré git), pagination 48, filtres, publier
