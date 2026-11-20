import { type Generator, gcd, lcm } from "../core";
export const theory: Generator = (r, d, v) => {
  const k = v ?? r.int(0, 4),
    a = r.int(2, d === "Hard" ? 24 : d === "Medium" ? 18 : 12),
    b = r.int(2, 15),
    g = r.int(2, 6);
  let text = "",
    answer: string | number = 0,
    wrong: (string | number)[] = [],
    steps: string[] = [];
  if (k === 0) {
    answer = r.pick([11, 13, 17, 19, 23, 29, 31, 37]);
    text = "Which of the following is a prime number?";
    wrong = r.shuffle([12, 15, 21, 25, 27, 33, 35, 39]).slice(0, 3);
    steps = [
      `${answer} has exactly two positive divisors: 1 and itself.`,
      `The other options have divisors other than 1 and themselves.`,
    ];
  }
  if (k === 1) {
    const p = r.int(1, 4),
      q = r.int(1, 3),
      n = 2 ** p * 3 ** q;
    answer = `2^${p} × 3^${q}`;
    text = `Find the prime factorization of ${n}.`;
    wrong = [
      `2^${p + 1} × 3^${q}`,
      `2^${p} × 3^${q + 1}`,
      `2^${p + 1} × 3^${q + 1}`,
    ];
    steps = [
      `Divide by 2 repeatedly (${p} times), then by 3 (${q} times).`,
      `${n} = ${answer}.`,
    ];
  }
  if (k === 2 || k === 3) {
    const x = a * g,
      y = b * g;
    answer = k === 2 ? gcd(x, y) : lcm(x, y);
    text = `Find the ${k === 2 ? "greatest common factor (GCF)" : "least common multiple (LCM)"} of ${x} and ${y}.`;
    wrong = [x * y, x + y, Number(answer) + g, g];
    steps = [
      `Using Euclid’s algorithm, GCF(${x}, ${y}) = ${gcd(x, y)}.`,
      k === 2
        ? `The GCF is ${answer}.`
        : `LCM = (${x} × ${y}) ÷ ${gcd(x, y)} = ${answer}.`,
    ];
  }
  if (k === 4) {
    const divisor = r.pick([3, 5, 9]),
      n = r.int(10, 80) * divisor;
    text = `Which number is divisible by ${divisor}?`;
    answer = n;
    wrong = [n + 1, n + 2, n + 4].filter((x) => x % divisor !== 0);
    steps = [
      divisor === 5
        ? "Numbers divisible by 5 end in 0 or 5."
        : `The digit sum must be divisible by ${divisor}.`,
      `${n} ÷ ${divisor} = ${n / divisor}, an integer.`,
    ];
  }
  return {
    subtopic: [
      "Prime numbers",
      "Prime factorization",
      "Greatest common factor",
      "Least common multiple",
      "Divisibility",
    ][k],
    text,
    answer,
    wrong,
    steps,
  };
};
