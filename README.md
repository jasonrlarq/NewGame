# UFO Cow Abduction 3D

This is a small browser game built for GitHub Codespaces. You fly a UFO, use a tractor beam to abduct cows, avoid farmer fire, and shoot back at the farmers.

Controls:
- Move: WASD or arrow keys
- Tractor beam: Space
- Shoot: B
- Restart: Enter

## Run locally in Codespaces

From the repo root:

```bash
python3 -m http.server 8000
```

Then open the forwarded port in the browser, or visit:

```text
http://localhost:8000
```

## GitHub workflow

Use this flow as you build and test the game:

```bash
git status
git add .
git commit -m "Add 3D UFO game prototype"
git push origin main
```

If you want a branch-based workflow:

```bash
git checkout -b feature/3d-game-upgrades
git status
git add .
git commit -m "Improve UFO game mechanics"
git push -u origin feature/3d-game-upgrades
```

## Troubleshooting

If the game does not start:

1. Open the browser DevTools console.
2. Look for runtime errors.
3. Check network access for the Three.js CDN script.
4. Confirm the page is being served from the local web server.
5. If you need help, send the exact error message and console stack trace.

The game includes a visible runtime error box for startup failures so you can copy the error text and send it back.

## Good next upgrades

- smoother 3D movement and camera follow
- more enemy types
- sound effects
- start menu and game over screen
- score persistence
- mobile controls
