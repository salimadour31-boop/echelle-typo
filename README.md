# Échelle Typo / Type Scale

**FR** — Générateur d’échelle typographique modulaire pour graphistes (print & web). 100 % navigateur, sans dépendances, multilangue (FR / EN / Taqbaylit).

**EN** — Free modular typographic scale generator for designers (print & web). Pure HTML/CSS/JS, no build step, multilingual (FR / EN / Kabyle).

## Démo

https://salimadour31-boop.github.io/echelle-typo/

## Fonctionnalités / Features

- Taille de base + unités `px` / `rem` / `em` / `pt`
- Ratios musicaux (seconde mineure → nombre d’or) + ratio personnalisé
- Nombre d’échelons au-dessus / en-dessous de la base
- Tableau live : nom (`xs`…`base`…`2xl`), taille, équivalent px, interligne rythmé
- Unité de ligne de base éditable (snap des line-heights)
- Aperçu live avec texte éditable + largeur A4 / Letter / custom
- Export : CSS custom properties, JSON, fichier `.css`, PNG (canvas natif)
- Thème texte / fond pour le contraste
- i18n FR (défaut) / EN / Taqbaylit — préférence en `localStorage`

## Usage

Ouvre `index.html` dans un navigateur, ou sers le dossier en local :

```bash
python3 -m http.server 8080
```

Puis va sur `http://localhost:8080`.

1. Choisis taille de base, unité et ratio.
2. Ajuste les échelons et l’unité de baseline.
3. Prévisualise, puis exporte CSS / JSON / PNG.

## Screenshots

Voir `screenshot.png` (généré depuis l’outil).

## Licence

MIT © 2026 salimadour31-boop
