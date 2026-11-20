import { type Generator, num } from "../core";
export const percentages: Generator = (r, d, v) => {
  const k = v ?? r.int(0, 4),
    base = r.int(4, d === "Hard" ? 60 : d === "Medium" ? 35 : 20) * 100,
    p = r.pick([10, 15, 20, 25, 30]),
    q = r.pick([10, 20, 25]);
  let text = "",
    answer = 0,
    steps: string[] = [];
  if (k === 0) {
    text = `What is ${p}% of ${num(base)}?`;
    answer = (base * p) / 100;
    steps = [`${p}% = ${p}/100.`, `${base} × ${p}/100 = ${num(answer)}.`];
  }
  if (k === 1) {
    const up = r.pick([true, false]);
    text = `A club has ${base} members. Membership ${up ? "increases" : "decreases"} by ${p}%. What is the new membership?`;
    answer = (base * (100 + (up ? p : -p))) / 100;
    steps = [
      `Change = ${base} × ${p}% = ${(base * p) / 100}.`,
      `${up ? "Add" : "Subtract"} the change: ${num(answer)} members.`,
    ];
  }
  if (k === 2) {
    const up = r.pick([true, false]),
      multiplier = 100 + (up ? p : -p),
      sale = (base * multiplier) / 100;
    text = `After a ${p}% ${up ? "increase" : "decrease"}, a price is ₱${num(sale)}. What was the original price?`;
    answer = base;
    steps = [
      `The new price is ${multiplier}% of the original.`,
      `Original = ${sale} ÷ ${multiplier / 100} = ₱${num(base)}.`,
    ];
  }
  if (k === 3) {
    text = `A bag costs ₱${num(base)} before a ${p}% discount. What is its sale price?`;
    answer = (base * (100 - p)) / 100;
    steps = [
      `Discount = ${base} × ${p}% = ${(base * p) / 100}.`,
      `Sale price = ${base} − ${(base * p) / 100} = ₱${num(answer)}.`,
    ];
  }
  if (k === 4) {
    text = `A price of ₱${num(base)} increases by ${p}% and then decreases by ${q}%. Find the final price.`;
    answer = (base * (100 + p) * (100 - q)) / 10000;
    steps = [
      `After increase: ${base} × ${1 + p / 100} = ${base * (1 + p / 100)}.`,
      `Apply the decrease to the new price: × ${1 - q / 100} = ₱${num(answer)}.`,
    ];
  }
  return {
    subtopic: [
      "Percentage of a number",
      "Percentage change",
      "Original value",
      "Discounts",
      "Consecutive changes",
    ][k],
    text,
    answer: num(answer),
    wrong: [
      (base * p) / 100,
      base,
      (base * (100 + p - q)) / 100,
      answer + base * 0.1,
    ].map(num),
    steps,
  };
};
