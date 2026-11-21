import { generate, variantCounts } from "./index";
import {
  fraction,
  Random,
  topics,
  type Difficulty,
  type Question,
  type Topic,
} from "./core";

export const RECENT_QUESTION_LIMIT = 300;

/** Identify the problem, independently of its ID or shuffled answer positions. */
export function questionFingerprint(q: Question): string {
  const arithmetic =
    q.topic === "Fractions & decimals"
      ? q.text.match(/^Calculate (\d+)\/(\d+) ([+−×÷]) (\d+)\/(\d+)\./)
      : null;
  if (arithmetic) {
    const [, a, b, operation, c, d] = arithmetic;
    const operands = [
      fraction(Number(a), Number(b)),
      fraction(Number(c), Number(d)),
    ];
    // Addition and multiplication do not become new problems by swapping operands.
    if (operation === "+" || operation === "×") operands.sort();
    return JSON.stringify([q.topic, operation, ...operands]);
  }
  const mixed =
    q.topic === "Fractions & decimals"
      ? q.text.match(/^Calculate (\d+) (\d+)\/(\d+) \+ (\d+)\/(\d+)\./)
      : null;
  if (mixed) {
    const [, whole, a, b, c, d] = mixed;
    const operands = [
      fraction(Number(whole) * Number(b) + Number(a), Number(b)),
      fraction(Number(c), Number(d)),
    ].sort();
    return JSON.stringify([q.topic, "+", ...operands]);
  }
  // These questions rely on the options themselves, rather than on varying text.
  const options =
    q.subtopic === "Prime numbers" ? [...q.choices].sort() : undefined;
  return JSON.stringify([q.topic, q.subtopic, q.text, q.data, options]);
}

export function rememberQuestion(
  history: readonly string[],
  q: Question,
): string[] {
  const fingerprint = questionFingerprint(q);
  return [
    ...history.filter((entry) => entry !== fingerprint),
    fingerprint,
  ].slice(-RECENT_QUESTION_LIMIT);
}

/** Migrate previously answered questions into history, and tolerate invalid stored history. */
export function restoreQuestionHistory(
  saved: unknown,
  answered: readonly Question[],
): string[] {
  const entries = Array.isArray(saved)
    ? saved.filter((entry): entry is string => typeof entry === "string")
    : [];
  const fingerprints = [
    ...answered.slice(-RECENT_QUESTION_LIMIT).map(questionFingerprint),
    ...entries,
  ];
  return [...new Set(fingerprints.slice().reverse())]
    .reverse()
    .slice(-RECENT_QUESTION_LIMIT);
}

export interface FreshQuestionOptions {
  history: readonly string[];
  variant?: number;
  subtopic?: string;
  maxAttempts?: number;
}

/** Keep the requested concept while retrying collisions with reproducible new seeds. */
export function generateFreshQuestion(
  topic: Topic,
  difficulty: Difficulty,
  seed: number,
  options: FreshQuestionOptions,
): Question {
  const random = new Random(seed);
  const count = variantCounts[topics.indexOf(topic)];
  let variant = options.variant;
  if (options.subtopic) {
    const match = Array.from({ length: count }, (_, i) => i).find(
      (i) => generate(topic, difficulty, seed, i).subtopic === options.subtopic,
    );
    if (match === undefined)
      throw new Error(`Unknown subtopic: ${options.subtopic}`);
    variant = match;
  }
  variant ??= random.int(0, count - 1);
  const seen = new Map(options.history.map((key, index) => [key, index]));
  let oldest: Question | undefined;
  let oldestIndex = Infinity;
  const attempts = Math.max(1, options.maxAttempts ?? 256);
  for (let i = 0; i < attempts; i++) {
    const q = generate(
      topic,
      difficulty,
      i === 0 ? seed : random.int(1, 2147483647),
      variant,
    );
    const position = seen.get(questionFingerprint(q));
    if (position === undefined) return q;
    if (position < oldestIndex) {
      oldest = q;
      oldestIndex = position;
    }
  }
  // Finite pools can eventually be exhausted. Prefer the oldest sampled question.
  return oldest!;
}
