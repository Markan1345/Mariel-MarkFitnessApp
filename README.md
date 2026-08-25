# Mark & Mariel Fitness

A shared workout tracker for two people. This first version is the workout log: pick who is training, start a session, record sets, and look back at history.

Weight tracking can land in a later pass.

## What you can do

- Switch between **Mark** and **Mariel**
- Start a blank workout or use a template (push, pull, legs, upper, full body, cardio)
- Add exercises from a built-in list or type a custom name
- Log weight, reps, and completed sets
- Resume an unfinished session
- Repeat the last workout
- Browse history and reopen or delete a session

Data stays in this browser (`localStorage`). Each phone or computer has its own log until we add a shared backend.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run build
```
