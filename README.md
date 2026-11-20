# CSC Math Arena

A local, mobile-responsive Civil Service Exam math trainer. React, TypeScript, Vite, Tailwind CSS, Lucide, Recharts, and Vitest. No accounts, backend, API keys, or AI question generation.

## Run locally

Use Node.js 22.12+ (Node 24 recommended) and npm.

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite (usually http://localhost:5173).

```sh
npm test
npm run build
npx vite preview
```

## Learning tools

- **Dashboard:** actual totals, accuracy, current/longest correct-answer streaks, speed, daily target, seven-day activity, per-topic mastery, difficulty performance, and exam history. New learners start with honest zero/empty states.
- **Practice:** select any of eight topics and three difficulties. Every answer gets immediate feedback and a full worked solution. Keyboard: A–D or 1–4 to answer; Enter advances after feedback when focus is outside an input/button. Timers measure elapsed solving time.
- **Adaptive training:** topics are weighted by weakness and solving speed. No random difficulty changes. Fewer than five recent attempts or accuracy under 60% → Easy. At least five attempts and 60% → Medium. Ten recent attempts, accuracy at least 85%, and mean time at most 75 seconds → Hard. The last ten attempts determine difficulty. Mastery is correct answers in the last twenty divided by at least ten attempts, so a single correct answer cannot produce full mastery.
- **Mock exams:** generate all 40 questions at once, five per topic, with shuffled order. Choose 5–180 minutes, flag questions, clear answers, skip, or navigate freely. The active exam, choices, answers, time per question, and deadline survive refresh. The timer continues when away; it submits when the app next observes the deadline. Explanations appear after submission. Review every answer, time, and topic score, or target a new question on that concept. Only selected answers count toward daily goals and practice totals; unanswered items still count as incorrect in exam scoring. No separate passing-score claim is made.
- **Mistake review:** missed practice and exam answers remain accessible. Retry the original or generate a new instance of its subtopic. Retries are recorded as new attempts.
- **Formula library:** searchable formulas, worked examples, pitfalls, and mental math shortcuts.
- Light/dark themes and adjustable daily goals are saved locally.

## Architecture

`src/engine/core.ts` defines the seeded PRNG, question contract, exact fraction simplification, and option construction. Each of the eight modules in `src/engine/generators/` creates parameterized templates with computed answers and explanations. `src/engine/index.ts` is the public generator/exam API. `generate(topic, difficulty, seed, variant?)` reproduces a question, including shuffled choices. Each session cycles through subtopics and avoids the last 30 question texts (with a bounded retry).

All 54 templates cover arithmetic and letter sequences; all requested percentage operations; charts, tables and annual comparisons; ratios and recipes; fractions, decimals and order of operations; primes, factors and divisibility; equations, ages and consecutive numbers; travel, combined work, interest, commissions, averages, rectangles and reverse spending. Difficulty controls variable ranges and pattern complexity; adaptive thresholds choose the level from measured results. Fractions are reduced exactly with integer numerator/denominator arithmetic. Currency uses integer amounts where possible and deterministic decimal formatting; percentage chart answers explicitly request two decimals.

`src/progress.ts` handles answer validation, scoring, progress aggregation, mastery, adaptation and storage. `src/App.tsx` supplies the learning flows; `src/components/QuestionCard.tsx` contains reusable question/chart components. `src/formulas.ts` contains teaching content. `src/style.css` contains responsive styling and reduced-motion support alongside the Tailwind integration.

## Verification

Vitest exercises every topic, template and difficulty across many seeds. It checks unique choices, one correct choice, reproducibility, randomized answer positions, numeric equivalence, independent arithmetic checks for fractions, percentages, equations, charts, geometry, work and travel, plus prime/divisibility uniqueness, exam balancing/scoring, adaptive thresholds, and unavailable-storage handling.

## Local data

Progress and exam state use versioned localStorage keys (`csc-progress-v1`, `csc-active-exam`); theme and daily goals have separate keys. There is no data transmission. Clearing site data removes progress. Private browsing, quota limits or browser settings can prevent persistence; the app reports a save failure. Solving time for exams counts time while viewing the exam; the deadline always counts wall time. This is an independent learning tool, not an official CSC product. All questions are generated independently; none reproduce the supplied review booklet.
