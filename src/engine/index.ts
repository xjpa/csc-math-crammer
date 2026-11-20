import {
  Random,
  finish,
  topics,
  type Topic,
  type Difficulty,
  type Generator,
} from "./core";
import { sequences } from "./generators/sequences";
import { percentages } from "./generators/percentages";
import { charts } from "./generators/charts";
import { ratios } from "./generators/ratios";
import { fractions } from "./generators/fractions";
import { theory } from "./generators/numberTheory";
import { algebra } from "./generators/algebra";
import { applied } from "./generators/applied";
export * from "./core";
export const generators: Record<Topic, Generator> = {
  Sequences: sequences,
  Percentages: percentages,
  "Charts & tables": charts,
  Ratios: ratios,
  "Fractions & decimals": fractions,
  "Number theory": theory,
  Algebra: algebra,
  "Applied math": applied,
};
export const variantCounts = [9, 5, 6, 6, 7, 5, 7, 9];
export function generate(
  topic: Topic,
  difficulty: Difficulty,
  seed: number,
  variant?: number,
) {
  const r = new Random(seed);
  return finish(
    generators[topic](r, difficulty, variant),
    topic,
    difficulty,
    r,
    `${topic}-${difficulty}-${seed}-${variant ?? "r"}`,
  );
}
export function makeExam(seed: number, difficulty: Difficulty) {
  const r = new Random(seed);
  return r.shuffle(
    Array.from({ length: 40 }, (_, i) =>
      generate(
        topics[i % 8],
        difficulty,
        r.int(1, 2147483647),
        r.int(0, variantCounts[i % 8] - 1),
      ),
    ),
  );
}
