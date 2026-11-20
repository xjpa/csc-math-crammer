import { describe, it, expect } from "vitest";
import {
  generate,
  topics,
  variantCounts,
  fraction,
  gcd,
  lcm,
  makeExam,
  Random,
  type Difficulty,
} from "./index";
import {
  recordAttempt,
  examAttempts,
  validateAnswer,
  scoreExam,
  stats,
  adaptiveDifficulty,
  adaptiveTopic,
  mastery,
  loadProgress,
  readSaved,
  type Attempt,
} from "../progress";
const numeric = (s: string) => Number(s.replaceAll(",", ""));
function rational(s: string) {
  const [n, d = "1"] = s.split("/");
  return Number(n) / Number(d);
}
describe("seeded generation contracts", () => {
  for (const [ti, t] of topics.entries())
    for (const difficulty of ["Easy", "Medium", "Hard"] as Difficulty[])
      it(`${t}: ${difficulty}, every template across 80 seeds`, () => {
        for (let v = 0; v < variantCounts[ti]; v++)
          for (let seed = 1; seed <= 80; seed++) {
            const q = generate(t, difficulty, seed, v);
            expect(q.choices).toHaveLength(4);
            expect(new Set(q.choices).size).toBe(4);
            expect(q.choices.filter((c) => c === q.answer)).toHaveLength(1);
            expect(q.topic).toBe(t);
            expect(q.difficulty).toBe(difficulty);
            expect(q.steps.length).toBeGreaterThan(0);
            expect(q.text).not.toMatch(/undefined|NaN|Infinity/);
            expect(q.answer).not.toMatch(/undefined|NaN|Infinity/);
            expect(q).toEqual(generate(t, difficulty, seed, v));
            // No two differently written numeric/fraction choices represent the same number.
            const values = q.choices.map((c) =>
              c.includes("/") ? rational(c) : numeric(c),
            );
            const finite = values.filter(Number.isFinite);
            expect(new Set(finite).size).toBe(finite.length);
          }
      });
  it("varies answer positions and question content", () => {
    const positions = new Set(),
      texts = new Set();
    for (let s = 1; s <= 100; s++) {
      const q = generate("Percentages", "Medium", s * 9451);
      positions.add(q.choices.indexOf(q.answer));
      texts.add(q.text);
    }
    expect(positions.size).toBe(4);
    expect(texts.size).toBeGreaterThan(60);
  });
  it("random seed zero is valid", () =>
    expect(new Random(0).next()).toBeGreaterThan(0));
});
describe("independent mathematical checks", () => {
  it("checks exact fractions, negatives, cancellation and zero", () => {
    expect(fraction(2, 4)).toBe("1/2");
    expect(fraction(0, 8)).toBe("0");
    expect(fraction(4, -6)).toBe("-2/3");
    expect(fraction(-3, -6)).toBe("1/2");
    expect(() => fraction(1, 0)).toThrow();
    expect(gcd(0, 12)).toBe(12);
    expect(lcm(12, 18)).toBe(36);
  });
  it("verifies every rational operation against independently parsed operands", () => {
    for (let seed = 1; seed <= 200; seed++)
      for (let v = 0; v < 4; v++) {
        const q = generate("Fractions & decimals", "Hard", seed, v);
        const match = q.text.match(/(\d+)\/(\d+) ([+−×÷]) (\d+)\/(\d+)/)!;
        const a = +match[1] / +match[2],
          b = +match[4] / +match[5];
        const expected = [a + b, a - b, a * b, a / b][v];
        expect(rational(q.answer)).toBeCloseTo(expected, 10);
      }
  });
  it("verifies tables, extrema, totals, averages, comparisons and growth against raw data", () => {
    for (let s = 1; s <= 150; s++)
      for (let v = 0; v < 6; v++) {
        const q = generate("Charts & tables", "Hard", s, v);
        const values = q.data!.map((x) => x.value),
          total = values.reduce((a, b) => a + b, 0);
        if (v === 0) expect(numeric(q.answer)).toBe(total);
        if (v === 1) {
          const high = q.text.includes("highest");
          expect(q.data!.find((x) => x.year === q.answer)!.value).toBe(
            high ? Math.max(...values) : Math.min(...values),
          );
        }
        if (v === 2) expect(numeric(q.answer)).toBe(total / 5);
        if (v === 3)
          expect(numeric(q.answer)).toBe(Math.abs(values[1] - values[0]));
        if (v >= 4) {
          expect(q.answer).toBe(
            `${((Math.abs(values[1] - values[0]) / values[0]) * 100).toFixed(2)}%`,
          );
          expect(values[1] > values[0]).toBe(v === 4);
        }
      }
  });
  it("verifies linear equations by substitution and consecutive integer sums", () => {
    for (let s = 1; s < 150; s++) {
      const q = generate("Algebra", "Hard", s, 0);
      const m = q.text.match(/(\d+)x \+ (\d+) = (\d+)/)!;
      expect(+m[1] * +q.answer + +m[2]).toBe(+m[3]);
      const c = generate("Algebra", "Hard", s, 2),
        sum = +c.text.match(/sum of (\d+)/)![1],
        largest = +c.answer;
      expect(largest + largest - 1 + largest - 2).toBe(sum);
    }
  });
  it("verifies money, geometry, meeting speeds and work rates", () => {
    for (let s = 1; s <= 100; s++) {
      const money = generate("Applied math", "Hard", s, 7),
        nums = money.text.match(/\d[\d,]*/g)!.map(numeric);
      expect(numeric(money.answer) / 4 - nums[0]).toBe(nums[1]);
      const rect = generate("Applied math", "Hard", s, 6),
        n = rect.text.match(/\d+/g)!.map(Number);
      const width = (n[0] / 2 - n[1]) / 2;
      expect(numeric(rect.answer)).toBe(width * (width + n[1]));
      const work = generate("Applied math", "Hard", s, 2),
        w = work.text.match(/\d+/g)!.map(Number);
      expect(rational(work.answer)).toBeCloseTo(1 / (1 / w[0] + 1 / w[1]), 10);
      const travel = generate("Applied math", "Hard", s, 1),
        z = travel.text.match(/\d+/g)!.map(Number);
      expect(numeric(travel.answer) * (z[1] + z[2])).toBe(z[0]);
    }
  });
  it("verifies percent of a number, sale price, original price and consecutive changes", () => {
    for (let s = 1; s <= 100; s++)
      for (const v of [0, 2, 3, 4]) {
        const q = generate("Percentages", "Hard", s, v);
        const n = q.text.match(/\d[\d,]*/g)!.map(numeric);
        if (v === 0) expect(numeric(q.answer)).toBe((n[0] * n[1]) / 100);
        if (v === 2)
          expect(
            numeric(q.answer) *
              (1 + (q.text.includes("increase") ? n[0] : -n[0]) / 100),
          ).toBeCloseTo(n[1], 8);
        if (v === 3)
          expect(numeric(q.answer)).toBe((n[0] * (100 - n[1])) / 100);
        if (v === 4)
          expect(numeric(q.answer)).toBeCloseTo(
            n[0] * (1 + n[1] / 100) * (1 - n[2] / 100),
            8,
          );
      }
  });
  it("only one option is prime or divisible when requested", () => {
    const prime = (n: number) => {
      if (n < 2) return false;
      for (let x = 2; x * x <= n; x++) if (n % x === 0) return false;
      return true;
    };
    for (let s = 1; s <= 150; s++) {
      const p = generate("Number theory", "Easy", s, 0);
      expect(p.choices.filter((x) => prime(+x))).toEqual([p.answer]);
      const d = generate("Number theory", "Hard", s, 4);
      const by = +d.text.match(/by (\d+)/)![1];
      expect(d.choices.filter((x) => +x % by === 0)).toEqual([d.answer]);
    }
  });
});
describe("exams, scoring and adaptation", () => {
  it("generates a stable balanced 40-question exam with unique ids", () => {
    const exam = makeExam(912812, "Medium");
    expect(exam).toEqual(makeExam(912812, "Medium"));
    expect(exam.length).toBe(40);
    expect(new Set(exam.map((q) => q.id)).size).toBe(40);
    topics.forEach((t) =>
      expect(exam.filter((q) => q.topic === t)).toHaveLength(5),
    );
    const snapshot = JSON.stringify(exam);
    const answers = Object.fromEntries(exam.map((q, i) => [i, q.answer]));
    expect(scoreExam(exam, answers)).toBe(40);
    expect(scoreExam(exam, {})).toBe(0);
    expect(scoreExam(exam, { 0: exam[0].answer })).toBe(1);
    expect(JSON.stringify(exam)).toBe(snapshot);
  });
  it("rejects invalid answers and scores the actual correct value", () => {
    const q = generate("Algebra", "Easy", 10);
    expect(validateAnswer(q, q.answer)).toBe(true);
    expect(validateAnswer(q, "garbage")).toBe(false);
    expect(
      validateAnswer(
        q,
        q.choices.find((c) => c !== q.answer)!,
      ),
    ).toBe(false);
  });
  const attempts = (count: number, correct: number, time: number): Attempt[] =>
    Array.from({ length: count }, (_, i) => {
      const q = generate("Ratios", "Easy", i);
      return recordAttempt(
        q,
        i < correct ? q.answer : q.choices.find((c) => c !== q.answer)!,
        time,
        "test",
      );
    });
  it("computes current and longest streaks plus accuracy and time", () => {
    const a = attempts(5, 3, 30);
    expect(stats(a)).toMatchObject({
      total: 5,
      correct: 3,
      accuracy: 60,
      streak: 0,
      longest: 3,
      average: 30,
    });
    expect(stats([])).toMatchObject({ total: 0, accuracy: 0, average: 0 });
  });
  it("uses explicit evidence thresholds for difficulty", () => {
    expect(adaptiveDifficulty(attempts(4, 4, 20), "Ratios")).toBe("Easy");
    expect(adaptiveDifficulty(attempts(10, 5, 20), "Ratios")).toBe("Easy");
    expect(adaptiveDifficulty(attempts(5, 3, 20), "Ratios")).toBe("Medium");
    expect(adaptiveDifficulty(attempts(10, 9, 70), "Ratios")).toBe("Hard");
    expect(adaptiveDifficulty(attempts(10, 9, 90), "Ratios")).toBe("Medium");
    expect(adaptiveDifficulty(attempts(10, 8, 30), "Ratios")).toBe("Medium");
  });
  it("weights weak topics more often, rather than selecting topics uniformly", () => {
    const a = attempts(20, 20, 20);
    expect(mastery(a, "Ratios")).toBe(100);
    let strong = 0;
    for (let i = 1; i <= 4000; i++)
      if (adaptiveTopic(a, i * 9127) === "Ratios") strong++;
    expect(strong / 4000).toBeLessThan(0.06);
  });
  it("handles unavailable storage safely", () => {
    expect(readSaved("any", 42)).toBe(42);
    expect(loadProgress()).toMatchObject({
      version: 1,
      attempts: [],
      exams: [],
    });
  });
});

describe("exam progress accounting", () => {
  it("counts only selected answers toward daily practice totals", () => {
    const qs = makeExam(42, "Easy");
    const answers = {
      0: qs[0].answer,
      3: qs[3].choices.find((c) => c !== qs[3].answer)!,
    };
    const attempts = examAttempts(qs, answers, { 0: 12, 3: 25 });
    expect(attempts).toHaveLength(2);
    expect(stats(attempts)).toMatchObject({
      total: 2,
      correct: 1,
      accuracy: 50,
    });
    expect(scoreExam(qs, answers)).toBe(1);
    expect(attempts[1].seconds).toBe(25);
  });
  it("does not create attempts for empty or invalid answers", () => {
    expect(examAttempts(makeExam(1, "Hard"), { 0: "invalid" }, {})).toEqual([]);
  });
});
