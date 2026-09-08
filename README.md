# Conservation of Mass (Week 5)

An interactive CE2134 pipe-flow lesson. Adjust the pipe diameters, inlet velocity and fluid densities to explore continuity. The light theme and controls follow the Bernoulli Pipe learning page.

## Control volume

The fixed control volume follows the inside of the pipe wall and closes at two transverse faces. Students can highlight the whole volume, inlet, outlet or wall.

- Fluid crosses the inlet and outlet faces. It does not cross the wall.
- Steady flow gives equal mass flow in and out, with no accumulation.
- The model uses `ρ₁V₁A₁ = ρ₂V₂A₂` and `A = πD²/4`.
- Equal density also gives equal volume flow. Different densities can give different volume flow while conserving mass.
- Setting the inlet velocity to zero stops the fluid. Animation can also be paused without changing the flow values.

The pipe uses uniform section velocities. Its smooth diameter and density transitions illustrate continuity, rather than solving the full flow field. Animated tracers fill the pipe and follow the local velocity. Their motion is scaled for visibility, keeping the speed differences between sections. The animation plays by default and can be paused with the animation control.

## Run and test

No external libraries, build step or API keys are needed. Use Node.js 18 or later:

```sh
npm run dev
```

Open `http://127.0.0.1:4177/`. Use a web server instead of opening the HTML as a local file because the page uses JavaScript modules.

```sh
npm test
```

The tests cover continuity, unequal densities, zero flow, input validation and tracer motion.

## Hosting

GitHub Pages serves the repository root from `main`. Keep `index.html`, `styles.css`, `app.js`, `physics.js` and `particles.js` together. Asset paths are relative so the page works under the repository's Pages path.

This page has no analytics or response-recording service.
