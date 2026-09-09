# Prompt — Portfolio Fabien (version qui aurait donné le résultat final du premier coup)

Crée mon portfolio dans `Agents/portfolio/` — 8 produits (retire Business Vapi, mindmap-generator, Blog de demain, Pronote, Interface espace, Trading, World-nana — garde Figma 14 DS, draw-it, Pack V1, Audit LinkedIn, App guitare, Blog photo Prisme, Encyclo-Nana, Image generator).

Hero réduit : `pt-24 pb-10`, `bezel p-6 sm:p-8 py-8`, titre `Instrument Serif 32/44/52px` (pas 48/64/76), stats `22px` (pas 28), tout le reste identique. File:// offline, `Plus Jakarta Sans` + `Fraunces`, `FDFBF7`.

Background : génère une photo de brouillard `2400px` (`Flux schnell 1216×832 → 2048×1400`, aube, forêt pins, un seul cône lumineux volumétrique en backlight rasant) et mets-la **derrière un papier paint** — pas dedans. Le papier c'est tout le portfolio (`paper #FFFEFB` + grain `feTurbulence 0.04`, `shadow 0 16px 48px`), la photo est le fond de page (`body fixed inset-0`), visible **autour** du papier, pas dessus. Règle des tiers : foyer lumineux à `33% 38%`, horizon 1/3 haut.

Même plan + mouvement : photo et papier dans le même volume 3D (`perspective:1200px`, `fog-bg translateZ(-180px) scale(1.18)` + `paper translateZ(0)`). Parallaxe douce au scroll : `fog-bg y*0.06`, `scene y*-0.015`. Le portfolio doit donner la sensation de **passer devant et de s'extirper** du brouillard, pas d'être posé devant.

Calque devant qui cache : mets l'image du brouillard aussi sur un **calque devant** (`fixed inset-0 z-10`) qui **cache tout le portfolio**, puis applique un **filtre d'opacité croissant linéaire du centre vers l'extérieur** — le centre n'est pas un point, c'est un **cercle qui englobe** tout le hero (voir croquis). Pour éviter toute cassure dans la linéarité, fais **3 calques superposés** :
- Calque 1 `cercle 760px at 50% 38%, transparent 48% → 0.14→0.34→0.62→0.86→black 88%` opacité `0.88`
- Calque 2 `820px, transparent 52% → 0.08→0.22→0.48→0.72` opacité `0.42`
- Calque 3 `880px, transparent 58% → 0.06→0.16→0.32` opacité `0.22`
Chaque calque a `background-image:url('assets/fog-hero-2400.jpg')` + `filter` légèrement différent et `transform y*0.02/0.028/0.036` pour la profondeur. Le centre reste transparent, l'opacité croît linéairement sans saut.

Livrables : `portfolio/assets/fog-hero-2400.jpg` local, `index.html` avec `DATA` embarquée, `file://` + `https://fabienk.github.io/portfolio/` OK, `prefers-reduced-motion` statique.
