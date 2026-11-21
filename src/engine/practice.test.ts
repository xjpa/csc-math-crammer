import { describe, expect, it } from "vitest";
import { generate, type Question } from "./index";
import {
  generateFreshQuestion,
  questionFingerprint,
  rememberQuestion,
  restoreQuestionHistory,
  RECENT_QUESTION_LIMIT,
} from "./practice";

const fractions = (seed: number, variant = 0) =>
  generate("Fractions & decimals", "Easy", seed, variant);
const withText = (text: string): Question => ({ ...fractions(1), text });

describe("practice question identity", () => {
  it("ignores shuffled options, IDs, difficulty and equivalent fraction notation", () => {
    const a = withText(
      "Calculate 1/2 + 3/4. Give the answer in simplest form.",
    );
    const b = {
      ...withText("Calculate 6/8 + 2/4. Give the answer in simplest form."),
      id: "new",
      difficulty: "Hard" as const,
      choices: [...a.choices].reverse(),
    };
    expect(questionFingerprint(a)).toBe(questionFingerprint(b));
  });
  it("recognizes multiplication with swapped, equivalent operands", () => {
    expect(questionFingerprint(withText("Calculate 2/3 × 3/5."))).toBe(
      questionFingerprint(withText("Calculate 6/10 × 4/6.")),
    );
  });
  it("keeps subtraction and division operand order significant", () => {
    for (const op of ["−", "÷"])
      expect(
        questionFingerprint(withText(`Calculate 1/2 ${op} 3/4.`)),
      ).not.toBe(questionFingerprint(withText(`Calculate 3/4 ${op} 1/2.`)));
  });
  it("distinguishes identical chart prompts with different data", () => {
    const q = generate("Charts & tables", "Easy", 1, 0);
    expect(questionFingerprint(q)).not.toBe(
      questionFingerprint({
        ...q,
        data: q.data!.map((x) => ({ ...x, value: x.value + 1 })),
      }),
    );
  });
  it("distinguishes prime questions by options, but ignores their order", () => {
    const q = generate("Number theory", "Easy", 1, 0);
    expect(questionFingerprint(q)).toBe(
      questionFingerprint({ ...q, choices: [...q.choices].reverse() }),
    );
    expect(questionFingerprint(q)).not.toBe(
      questionFingerprint({ ...q, choices: ["2", "4", "6", "8"] }),
    );
  });
});

it("recognizes equivalent mixed-number operands", () => {
  expect(
    questionFingerprint(
      withText(
        "Calculate 2 1/2 + 2/6. Express as a simplified fraction or integer.",
      ),
    ),
  ).toBe(
    questionFingerprint(
      withText(
        "Calculate 2 2/4 + 1/3. Express as a simplified fraction or integer.",
      ),
    ),
  );
});

describe("persistent repeat prevention", () => {
  it("avoids a repeated seed while preserving the requested fraction subtopic", () => {
    const original = fractions(42, 2);
    const options = { history: [questionFingerprint(original)], variant: 2 };
    const fresh = generateFreshQuestion(
      "Fractions & decimals",
      "Easy",
      42,
      options,
    );
    expect(questionFingerprint(fresh)).not.toBe(questionFingerprint(original));
    expect(fresh.subtopic).toBe(original.subtopic);
    expect(fresh).toEqual(
      generateFreshQuestion("Fractions & decimals", "Easy", 42, options),
    );
  });
  it("uses saved history after a simulated reload, including unanswered questions", () => {
    const original = fractions(25);
    const saved = JSON.parse(JSON.stringify(rememberQuestion([], original)));
    const restored = restoreQuestionHistory(saved, []);
    const next = generateFreshQuestion("Fractions & decimals", "Easy", 25, {
      history: restored,
      variant: 0,
    });
    expect(questionFingerprint(next)).not.toBe(questionFingerprint(original));
  });
  it("restores existing attempts when upgrading from session-only history", () => {
    expect(restoreQuestionHistory(null, [fractions(19)])).toEqual([
      questionFingerprint(fractions(19)),
    ]);
    expect(restoreQuestionHistory([null, 12, "valid"], [])).toEqual(["valid"]);
  });
  it("bounds history and refreshes recency without duplicates", () => {
    const q = fractions(42);
    const history = Array.from({ length: RECENT_QUESTION_LIMIT }, (_, i) =>
      String(i),
    );
    const next = rememberQuestion(history, q);
    expect(next).toHaveLength(RECENT_QUESTION_LIMIT);
    expect(next[0]).toBe("1");
    expect(rememberQuestion(next, q)).toEqual(next);
  });
  it("avoids every recent question over 1,000 fraction questions and reloads", () => {
    let history: string[] = [];
    for (let i = 0; i < 1000; i++) {
      const q = generateFreshQuestion(
        "Fractions & decimals",
        "Easy",
        (i % 55) + 1,
        { history, variant: i % 7 },
      );
      expect(history).not.toContain(questionFingerprint(q));
      history = rememberQuestion(history, q);
      if (i % 23 === 0)
        history = restoreQuestionHistory(
          JSON.parse(JSON.stringify(history)),
          [],
        );
    }
  });
  it("keeps targeted mistake practice on the same concept even after a collision", () => {
    const q = fractions(22, 3);
    const fresh = generateFreshQuestion(q.topic, q.difficulty, 22, {
      history: [questionFingerprint(q)],
      subtopic: q.subtopic,
    });
    expect(fresh.subtopic).toBe(q.subtopic);
    expect(questionFingerprint(fresh)).not.toBe(questionFingerprint(q));
  });
  it("terminates for a finite exhausted pool, returning the oldest sampled question", () => {
    const first = fractions(6);
    const next = generateFreshQuestion(first.topic, first.difficulty, 6, {
      history: [questionFingerprint(first)],
      variant: 0,
      maxAttempts: 1,
    });
    expect(next).toEqual(first);
  });
});
