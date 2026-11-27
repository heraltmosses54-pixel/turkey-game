# Gobble Run — The Great Turkey Escape

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/heraltmosses54-pixel/turkey-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/heraltmosses54-pixel/turkey-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

Thanksgiving is coming, and one turkey refuses to be dinner. **Gobble Run** is a
side-view farmyard runner: sprint 1200m from the farmyard, through Barn Lane
and the kitchen, to the forest gate — while the farmer chases you from behind
and the oven and the carving knife wait in your path.

## How to play

- **SPACE / ↑ / W / click** — jump (press twice for a double jump)
- **↓ / S** — slide under the swinging carving knife
- **P** — pause · **M** — mute

Grab corn for +50 points — it also slows the farmer down. Jump an obstacle
cleanly for a near-miss bonus. Three hearts: every hit lets the farmer close
in, and if he catches you, it's Thanksgiving dinner. Reach 1200m and you're
free.

## What's inside

- `game/index.html` + `game/src/` — the whole game, zero libraries, zero
  network requests. All art is drawn on canvas, all sound is synthesised
  with WebAudio (gobbles included).
- `game/src/config.js` — tuning (speed, lives, stages, spawns)
- `game/src/audio.js` — synthesised sound effects
- `game/src/input.js` — keyboard + mouse
- `game/src/turkey.js` — the turkey: physics, squash-and-stretch, dust
- `game/src/world.js` — stages, spawns, corn, and the chasing farmer
- `game/src/render.js` — all canvas art: farm, kitchen, turkey, farmer, HUD
- `game/src/shots.js` — `?shot=` staging for the screenshots
- `game/src/main.js` — game loop, states, title / pause / end screens
- `tools/` — headless-Chrome CDP driver, screenshot capture and smoke test
- `main.ts` — the make.fun hand-in program (Node 22, stdlib only)

## Play it locally

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
