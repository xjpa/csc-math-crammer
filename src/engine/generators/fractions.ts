import { type Generator, fraction } from "../core";
export const fractions: Generator = (r, d, v) => {
  const k = v ?? r.int(0, 6),
    a = r.int(1, 7),
    b = r.int(2, d === "Hard" ? 15 : d === "Medium" ? 11 : 8),
    c = r.int(1, 5),
    e = r.int(2, 9);
  let text = "",
    answer = "",
    steps: string[] = [],
    wrong: string[] = [];
  if (k <= 3) {
    const op = ["+", "−", "×", "÷"][k];
    text = `Calculate ${a}/${b} ${op} ${c}/${e}. Give the answer in simplest form.`;
    const n = [a * e + c * b, a * e - c * b, a * c, a * e][k],
      den = k === 3 ? b * c : b * e;
    answer = fraction(n, den);
    steps =
      k < 2
        ? [
            `Use common denominator ${b * e}.`,
            `${a * e}/${b * e} ${op} ${c * b}/${b * e} = ${n}/${den}.`,
            `Simplify: ${answer}.`,
          ]
        : [
            k === 3
              ? "Divide by a fraction by multiplying by its reciprocal."
              : "Multiply numerators and multiply denominators.",
            `${n}/${den} simplifies to ${answer}.`,
          ];
    wrong = [
      fraction(a + c, b + e),
      fraction(a * c, b + e),
      fraction(n + den, den),
      fraction(n - den, den),
    ];
  }
  if (k === 4) {
    const whole = r.int(1, 5),
      proper = r.int(1, b - 1);
    text = `Calculate ${whole} ${proper}/${b} + ${c}/${e}. Express as a simplified fraction or integer.`;
    answer = fraction((whole * b + proper) * e + c * b, b * e);
    steps = [
      `Convert the mixed number: (${whole} × ${b} + ${proper})/${b} = ${whole * b + proper}/${b}.`,
      `Use denominator ${b * e}, add numerators, then simplify: ${answer}.`,
    ];
    wrong = [
      fraction(proper * e + c * b, b * e),
      fraction(whole + proper + c, b + e),
      fraction((whole * b + proper) * e - c * b, b * e),
    ];
  }
  if (k === 5) {
    const x = r.int(10, 100),
      y = r.int(10, 100);
    text = `Calculate ${(x / 10).toFixed(1)} + ${(y / 100).toFixed(2)}.`;
    answer = ((x * 10 + y) / 100).toFixed(2);
    steps = [
      `Align the decimal places.`,
      `(${x * 10} + ${y}) hundredths = ${answer}.`,
    ];
    wrong = [
      ((x + y) / 10).toFixed(2),
      ((x * 10 - y) / 100).toFixed(2),
      ((x * 10 + y) / 10).toFixed(2),
    ];
  }
  if (k === 6) {
    text = `Evaluate ${a} + ${b} × (${c} + ${e}).`;
    answer = String(a + b * (c + e));
    steps = [
      `Parentheses first: ${c} + ${e} = ${c + e}.`,
      `Multiply: ${b} × ${c + e} = ${b * (c + e)}.`,
      `Add ${a}: ${answer}.`,
    ];
    wrong = [
      String((a + b) * (c + e)),
      String(a + b * c + e),
      String(a + b + c + e),
    ];
  }
  return {
    subtopic: [
      "Fraction addition",
      "Fraction subtraction",
      "Fraction multiplication",
      "Fraction division",
      "Mixed fractions",
      "Decimal arithmetic",
      "Order of operations",
    ][k],
    text,
    answer,
    wrong,
    steps,
  };
};
