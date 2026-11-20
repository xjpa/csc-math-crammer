import { type Generator, gcd } from "../core";
export const ratios: Generator = (r, d, v) => {
  const k = v ?? r.int(0, 5),
    a = r.int(2, 6),
    b = r.int(3, 8),
    scale = r.int(3, d === "Hard" ? 30 : d === "Medium" ? 20 : 12);
  let text = "",
    answer: string | number = 0,
    steps: string[] = [];
  if (k === 0) {
    text = `Simplify the ratio ${a * scale}:${b * scale}.`;
    const g = gcd(a, b);
    answer = `${a / g}:${b / g}`;
    steps = [
      `The GCF of both quantities is ${g * scale}.`,
      `Divide both by it: ${answer}.`,
    ];
  }
  if (k === 1) {
    text = `${a} notebooks cost ₱${a * scale}. At the same price each, how much do ${b} notebooks cost?`;
    answer = b * scale;
    steps = [
      `Unit price = ${a * scale} ÷ ${a} = ₱${scale}.`,
      `${b} × ${scale} = ₱${answer}.`,
    ];
  }
  if (k === 2) {
    text = `Two siblings share ₱${(a + b) * scale} in the ratio ${a}:${b}. How much does the first receive?`;
    answer = a * scale;
    steps = [
      `Total parts = ${a} + ${b} = ${a + b}.`,
      `Each part = ${(a + b) * scale} ÷ ${a + b} = ${scale}.`,
      `First share = ${a} × ${scale} = ₱${answer}.`,
    ];
  }
  if (k === 3) {
    text = `A recipe uses ${a} cups of flour for ${b} servings. How many cups are needed for ${b * scale} servings?`;
    answer = a * scale;
    steps = [
      `Scale factor = ${b * scale} ÷ ${b} = ${scale}.`,
      `Flour = ${a} × ${scale} = ${answer} cups.`,
    ];
  }
  if (k === 4) {
    text = `The ratio of regular to temporary employees is ${a}:${b}. There are ${b * scale} temporary employees. How many regular employees are there?`;
    answer = a * scale;
    steps = [
      `One ratio part = ${b * scale} ÷ ${b} = ${scale}.`,
      `Regular employees = ${a} × ${scale} = ${answer}.`,
    ];
  }
  if (k === 5) {
    text = `A community has adults and children in the ratio ${a}:${b}. Its total population is ${(a + b) * scale}. How many children live there?`;
    answer = b * scale;
    steps = [
      `Total ratio parts = ${a + b}.`,
      `One part = ${(a + b) * scale} ÷ ${a + b} = ${scale}.`,
      `Children = ${b} × ${scale} = ${answer}.`,
    ];
  }
  return {
    subtopic: [
      "Simple ratios",
      "Direct proportion",
      "Sharing quantities",
      "Recipe proportions",
      "Employee ratios",
      "Population ratios",
    ][k],
    text,
    answer,
    wrong:
      k === 0
        ? [`${a}:${b + 1}`, `${b}:${a + 1}`, `${a + 1}:${b}`]
        : [
            a + b * scale,
            (a + b) * scale,
            Number(answer) + scale,
            Number(answer) - scale,
          ],
    steps,
  };
};
