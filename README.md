# Conservation of Mass

An interactive CE2134 pipe-flow lesson with Explore and Quiz modes. The light theme and controls follow the Bernoulli Pipe learning page.

## Control volume

The fixed control volume follows the inside of the pipe wall and closes at two transverse faces. Students can highlight the whole volume, inlet, outlet or wall, and show outward normals.

- Fluid crosses the inlet and outlet faces. It does not cross the wall.
- Steady flow gives equal mass flow in and out, with no accumulation.
- The model uses `ρ₁V₁A₁ = ρ₂V₂A₂` and `A = πD²/4`.
- Equal density also gives equal volume flow. Different densities can give different volume flow while conserving mass.
- Setting the inlet velocity to zero stops the fluid. Animation can also be paused without changing the flow values.

The pipe uses uniform section velocities. Its smooth diameter and density transitions illustrate continuity, rather than solving the full flow field. Particle motion is scaled for visibility. Reduced-motion preferences start the animation paused.

## Quiz

Each round contains ten outlet-velocity questions. The diagram uses the question's values. Calculated outputs and worked solutions appear after submission. Solutions use exactly the rounded values shown in the question. Answers within 1% or 0.01 m/s are accepted. Quiz state remains separate from Explore controls.

## Run and test

No external libraries, build step or API keys are needed. Use Node.js 18 or later:

```sh
npm run dev
```

Open `http://127.0.0.1:4177/`. Use a web server instead of opening the HTML as a local file because the page uses JavaScript modules.

```sh
npm test
```

The tests cover continuity, unequal densities, zero flow, input validation, local tracer speed and quiz answers.

## Hosting

GitHub Pages serves the repository root from `main`. Keep `index.html`, `styles.css`, `app.js` and `physics.js` together. Asset paths are relative so the page works under the repository's Pages path.

This page has no analytics or response-recording service. Quiz progress is kept in memory and clears on reload.
