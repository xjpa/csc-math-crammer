import { type Generator } from "../core";
export const algebra: Generator = (r, d, v) => {
  const k = v ?? r.int(0, 6),
    x = r.int(3, d === "Hard" ? 35 : d === "Medium" ? 25 : 16),
    a = r.int(2, 7),
    b = r.int(2, 12);
  let text = "",
    answer: number | string = x,
    steps: string[] = [];
  if (k === 0) {
    text = `Solve for x: ${a}x + ${b} = ${a * x + b}.`;
    steps = [
      `Subtract ${b} from both sides: ${a}x = ${a * x}.`,
      `Divide by ${a}: x = ${x}.`,
    ];
  }
  if (k === 1) {
    text = `${a} times a number, increased by ${b}, is ${a * x + b}. What is the number?`;
    steps = [
      `Let the number be x. Then ${a}x + ${b} = ${a * x + b}.`,
      `Subtract ${b} and divide by ${a}: x = ${x}.`,
    ];
  }
  if (k === 2) {
    text = `Three consecutive integers have a sum of ${3 * x + 3}. What is the largest?`;
    answer = x + 2;
    steps = [
      `Let them be x, x+1, x+2. Then 3x + 3 = ${3 * x + 3}.`,
      `x = ${x}; largest = ${answer}.`,
    ];
  }
  if (k === 3) {
    const first = 2 * x + r.int(0, 1);
    text = `Three consecutive ${first % 2 ? "odd" : "even"} integers sum to ${3 * first + 6}. Find the smallest.`;
    answer = first;
    steps = [
      `Let the numbers be x, x+2, x+4.`,
      `3x + 6 = ${3 * first + 6}, so x = ${first}.`,
    ];
  }
  if (k === 4) {
    text = `Mara is ${b} years older than Luis. In ${a} years, their ages will add up to ${2 * x + b + 2 * a}. How old is Luis now?`;
    steps = [
      `Let Luis's age now be x; Mara's is x + ${b}.`,
      `(x + ${a}) + (x + ${b} + ${a}) = ${2 * x + b + 2 * a}.`,
      `2x = ${2 * x}, so Luis is ${x} years old.`,
    ];
  }
  if (k === 5) {
    text = `Two numbers add up to ${2 * x + b} and differ by ${b}. Find the smaller number.`;
    steps = [
      `Let the smaller be x; the larger is x + ${b}.`,
      `2x + ${b} = ${2 * x + b}.`,
      `x = ${x}.`,
    ];
  }
  if (k === 6) {
    text = `A number is multiplied by ${a}, then ${b} is subtracted. The result is ${a * x - b}. What was the original number?`;
    steps = [
      `Reverse the subtraction: ${a * x - b} + ${b} = ${a * x}.`,
      `Reverse the multiplication: ${a * x} ÷ ${a} = ${x}.`,
    ];
  }
  return {
    subtopic: [
      "Linear equations",
      "Verbal equations",
      "Consecutive integers",
      "Consecutive odd/even integers",
      "Age problems",
      "Two unknowns",
      "Reverse calculation",
    ][k],
    text,
    answer,
    wrong: [
      Number(answer) + b,
      Number(answer) - a,
      Number(answer) + 1,
      Number(answer) * 2,
    ],
    steps,
  };
};
