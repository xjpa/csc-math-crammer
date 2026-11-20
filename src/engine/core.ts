export const topics = [
  "Sequences",
  "Percentages",
  "Charts & tables",
  "Ratios",
  "Fractions & decimals",
  "Number theory",
  "Algebra",
  "Applied math",
] as const;
export type Topic = (typeof topics)[number];
export type Difficulty = "Easy" | "Medium" | "Hard";
export interface Question {
  id: string;
  topic: Topic;
  subtopic: string;
  difficulty: Difficulty;
  text: string;
  choices: string[];
  answer: string;
  steps: string[];
  data?: { year: string; value: number }[];
  display?: "bar" | "table";
}
export class Random {
  constructor(public seed: number) {}
  next() {
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  int(a: number, b: number) {
    return a + Math.floor(this.next() * (b - a + 1));
  }
  pick<T>(a: readonly T[]): T {
    return a[this.int(0, a.length - 1)];
  }
  shuffle<T>(a: T[]) {
    return [...a]
      .map((v) => ({ v, k: this.next() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.v);
  }
}
export const gcd = (a: number, b: number): number =>
  b ? gcd(b, a % b) : Math.abs(a);
export const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;
export function fraction(n: number, d: number) {
  if (!d) throw Error("Zero denominator");
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`;
}
export const num = (n: number) =>
  Number(n.toFixed(4)).toLocaleString("en-US", { maximumFractionDigits: 4 });
export interface Draft {
  subtopic: string;
  text: string;
  answer: string | number;
  wrong: (string | number)[];
  steps: string[];
  data?: Question["data"];
  display?: Question["display"];
}
export type Generator = (r: Random, d: Difficulty, variant?: number) => Draft;
export function choiceKey(value: string): string {
  const cleaned = value.replaceAll(",", "").trim();
  if (/^-?\d+(?:\.\d+)?$/.test(cleaned)) return `n:${Number(cleaned)}`;
  if (/^-?\d+\/\d+$/.test(cleaned)) {
    const [a, b] = cleaned.split("/").map(Number);
    return `n:${a / b}`;
  }
  return cleaned;
}
export function finish(
  draft: Draft,
  topic: Topic,
  difficulty: Difficulty,
  r: Random,
  id: string,
): Question {
  const answer = String(draft.answer),
    seen = new Set([choiceKey(answer)]),
    wrong: string[] = [];
  for (const candidate of draft.wrong.map(String)) {
    const key = choiceKey(candidate);
    if (!seen.has(key)) {
      seen.add(key);
      wrong.push(candidate);
    }
  }
  let offset = 1;
  while (wrong.length < 3) {
    const base = Number(answer.replaceAll(",", ""));
    const candidate = Number.isFinite(base)
      ? num(base + offset)
      : String(offset);
    const key = choiceKey(candidate);
    if (!seen.has(key)) {
      seen.add(key);
      wrong.push(candidate);
    }
    offset++;
  }
  return {
    ...draft,
    id,
    topic,
    difficulty,
    answer,
    choices: r.shuffle([answer, ...wrong.slice(0, 3)]),
  };
}
