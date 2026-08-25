# Lifting Together

A shared mobile website for two people. Log both sessions at the same time, including custom days, imported lifting programs, cardio, estimated calories, and body weight in pounds.

**Live site:** [https://markan1345.github.io/Mariel-MarkFitnessApp/](https://markan1345.github.io/Mariel-MarkFitnessApp/)

Open that link on your phones. Add it to the home screen for a full-screen app. Data stays in that phone’s browser (`localStorage`).

## What you can do

- Start both workouts together, with a different session for each person
- Build a **custom workout for each weekday**
- Import weight programs (5x5, push/pull/legs, upper/lower, and more) or a JSON file
- Track cardio with minutes, miles, and intensity
- See **estimated calories** from lifts and cardio (uses the latest body weight in lb)
- Log **body weight in pounds**, view it by date, and follow the trend

## Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run lint
npm run build
```
