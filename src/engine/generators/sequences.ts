import { type Generator } from "../core";
export const sequences: Generator = (r, d, v) => {
  const k = v ?? r.int(0, 8),
    a = r.int(2, d === "Hard" ? 15 : 7),
    b = r.int(2, 4);
  let values: (number | string)[] = [],
    answer: number | string = 0,
    rule = "";
  if (k === 0) {
    values = Array.from({ length: 5 }, (_, i) => a + i * b);
    answer = a + 5 * b;
    rule = `Add ${b} each time.`;
  }
  if (k === 1) {
    values = Array.from({ length: 5 }, (_, i) => a + 5 * b - i * b);
    answer = a;
    rule = `Subtract ${b} each time.`;
  }
  if (k === 2) {
    values = Array.from({ length: 5 }, (_, i) => a * b ** i);
    answer = a * b ** 5;
    rule = `Multiply by ${b} each time.`;
  }
  if (k === 3) {
    values = Array.from({ length: 5 }, (_, i) => a * b ** (5 - i));
    answer = a;
    rule = `Divide by ${b} each time.`;
  }
  if (k === 4) {
    let x = a;
    for (let i = 0; i < 5; i++) {
      values.push(x);
      x = i % 2 === 0 ? x + b : x * 2;
    }
    answer = x;
    rule = `Alternate adding ${b} and multiplying by 2, starting with addition.`;
  }
  if (k === 5) {
    values = Array.from({ length: 5 }, (_, i) => a + (i * (i + 1)) / 2);
    answer = a + 15;
    rule = "The differences are +1, +2, +3, +4, then +5.";
  }
  if (k === 6) {
    const power = d === "Easy" ? 2 : 3;
    values = Array.from({ length: 5 }, (_, i) => (a + i) ** power);
    answer = (a + 5) ** power;
    rule = `Consecutive integers raised to power ${power}: the next base is ${a + 5}.`;
  }
  if (k === 7) {
    const start = r.int(0, 4),
      step = r.int(1, 3),
      repeat = d === "Easy" ? 2 : 1;
    values = Array.from({ length: 6 }, (_, i) =>
      String.fromCharCode(65 + start + Math.floor(i / repeat) * step),
    );
    answer = String.fromCharCode(65 + start + Math.floor(6 / repeat) * step);
    rule = `Repeat each letter ${repeat} time(s), advancing ${step} alphabet position(s) between groups.`;
  }
  if (k === 8) {
    const start = r.int(0, 3);
    values = Array.from(
      { length: 4 },
      (_, i) => `${String.fromCharCode(65 + start + i * 2)}${a * 2 ** i}`,
    );
    answer = `${String.fromCharCode(65 + start + 8)}${a * 16}`;
    rule = "Advance letters by 2 positions and double the numerical part.";
  }
  const wrong =
    typeof answer === "number"
      ? [answer + b, answer - b, answer * 2]
      : k === 8
        ? [
            `${String.fromCharCode(65 + 8)}${a * 8}`,
            `${String.fromCharCode(65 + 9)}${a * 16}`,
            `${String.fromCharCode(65 + 10)}${a * 32}`,
          ]
        : [1, 2, 3].map((n) =>
            String.fromCharCode(
              65 + ((String(answer).charCodeAt(0) - 65 + n) % 26),
            ),
          );
  return {
    subtopic: [
      "Addition",
      "Subtraction",
      "Multiplication",
      "Division",
      "Alternating operations",
      "Increasing differences",
      "Powers",
      "Letter patterns",
      "Letter-number patterns",
    ][k],
    text: `Find the next term: ${values.join("  ·  ")}  ·  ?`,
    answer,
    wrong,
    steps: [rule, `The next term is ${answer}.`],
  };
};
