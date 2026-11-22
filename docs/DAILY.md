# Wall of the day, sharing and measurement

Neon Bricks has one challenge per day, the same for everyone, and a result worth comparing with friends. Every link
leads to the portal, <https://games.johnandrestrujillo.com>. The daily module (`js/daily.js`) is the one Neon Raiders
uses, adapted; its full description is in Neon Raiders' `docs/DAILY.md`.

## The wall

- The day is the player's local calendar date. Challenge #1 is `firstDay` in `js/daily.js`.
- The date seeds a random generator (`NeonDaily.rng('wall' + n)`). From it come, for every wall `n` of the run:
  - **the shape**: one of block, pyramid, valley, diamond, stripes, checker, frame, columns, arches, or a random
    mirrored pattern; always symmetric and at least 30 bricks;
  - **the hard bricks** (two hits), more of them on later walls;
  - **three power-ups** hidden in ordinary bricks (marked ✦): wide paddle, three balls, slow motion.
- Walls get taller (7 rows, up to 10) and the ball faster with every wall.
- The physics runs at a fixed 120 steps per second, so the same moves give the same result on any device.

## Points

| What | Points |
|---|---|
| Brick | 10 × combo |
| Hard brick, first hit / broken | 5 / 25 × combo |
| Wall cleared | 250 × wall number |

The combo counts bricks broken since the ball last touched the paddle: ×2 from the 4th, ×3 from the 7th, up to ×5.

## A score to beat

`...?d=2026-11-23&vs=1200` (and `&by=bot` for the auto-player's score) shows the goal on the title screen and in the
score line. A score in a link is *declared*; it is *verified* only when it matches a run on record in `VERIFIED`
(`js/daily.js`). The result card and the shared text differ for a win, a tie and a loss.

## Progress and measurement

Kept in the browser only: `nb.day`, `nb.streak`, `nb.shared`, `nb.days`, `nb.lang`, `nb.mute`. Anonymous counters go
to the portal (`/e`) as in Neon Raiders: `arrive`, `run`, `over` (`s` score, `w` wall, `k` bricks, `c` best combo,
`p` power-ups caught, `n` attempt, `vs`, `o` outcome), `share_tap`, `share`, `rec`, `more`. Nothing is sent with
"Do Not Track", on `localhost` or on plain `http`.

## Testing

`?debug=true&day=2026-11-30` plays another day's wall without touching saved progress. `game.events` logs what
happened in the run; `NeonDaily.sent` lists the counters.
