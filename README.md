# Tower Defense

Un semplice tower defense in HTML/CSS/JS con UI responsive e layout ottimizzato per desktop e mobile (landscape).

## Struttura del progetto

```
/ (root)
  index.html
  README.md
  /js
    globals.js      # variabili globali + riferimenti DOM
    utils.js        # helper matematici + forme
    path.js         # percorso + rendering griglia/path
    grid.js         # snap, selezione, collisione
    entities.js     # Enemy, Tower, Bullet + rendering forme
    ui.js           # HUD, toast, upgrade, wave progress
    input.js        # input mouse/touch/keyboard
    game.js         # loop principale + resize + wave
  /css
    base.css        # reset, variabili, layout di base
    hud.css         # HUD, pulsanti, pannelli
    stage.css       # canvas/stage + overlay retro
    responsive.css  # media queries + layout mobile
```

## Come avviare

Apri `index.html` con un live server (es. estensione "Live Server").

## Dove mettere nuove feature

- **Nuove torri / nemici**: `js/entities.js`
- **Nuove regole / bilanciamento**: `js/game.js`
- **HUD / pannelli / toast**: `js/ui.js`
- **Input (mouse/touch/keyboard)**: `js/input.js`
- **Path / griglia / placement**: `js/path.js` e `js/grid.js`
- **Stili**:
  - layout base: `css/base.css`
  - HUD: `css/hud.css`
  - canvas/stage: `css/stage.css`
  - responsive: `css/responsive.css`

## Note

- L’ordine dei file JS in `index.html` è importante.
- Il layout mobile è ottimizzato per **landscape** (con banner in portrait).

