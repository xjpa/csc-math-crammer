import type { Topic } from "./engine";
export interface Formula {
  topic: Topic;
  title: string;
  formula: string;
  when: string;
  example: string;
  mistake: string;
  shortcut: string;
}
export const formulas: Formula[] = [
  {
    topic: "Sequences",
    title: "Find the rule",
    formula: "Differences → ratios → alternating terms",
    when: "Look for a repeated change between terms. Check odd and even positions separately if needed.",
    example: "4, 9, 14, 19: the difference is +5, so the next term is 24.",
    mistake:
      "A repeated decimal point may separate two patterns; inspect both parts.",
    shortcut: "For squares, consecutive differences are odd numbers: 3, 5, 7…",
  },
  {
    topic: "Percentages",
    title: "Percent of a quantity",
    formula: "Part = whole × rate / 100",
    when: "Find a discount, commission, or percentage of a total.",
    example: "15% of ₱800 = 800 × 0.15 = ₱120.",
    mistake: "Convert 15% to 0.15, not 15.",
    shortcut: "Find 10%, halve it for 5%, then add for 15%.",
  },
  {
    topic: "Percentages",
    title: "Changes & original values",
    formula: "New = original × (1 ± r)",
    when: "Use r as a decimal. Divide the new value by the multiplier to find the original.",
    example: "₱900 after a 10% discount: 900 ÷ 0.90 = ₱1,000.",
    mistake:
      "Consecutive changes multiply: a 20% rise then 20% fall leaves 96%.",
    shortcut: "A 25% discount leaves 3/4 of the price.",
  },
  {
    topic: "Charts & tables",
    title: "Read, compare, calculate",
    formula: "Growth % = (new − old) / old × 100",
    when: "Compare sales or populations across years. Read the units before calculating.",
    example: "Sales from 200 to 250: 50 ÷ 200 × 100 = 25% growth.",
    mistake: "Divide by the original value, not the new value.",
    shortcut: "Mean = total ÷ number of entries. Count entries first.",
  },
  {
    topic: "Ratios",
    title: "Share by ratio",
    formula: "One part = total / sum of ratio parts",
    when: "Divide a quantity into proportional shares.",
    example:
      "₱600 in ratio 2:3: one part is 600/5 = ₱120; shares are ₱240 and ₱360.",
    mistake: "The first share is 2/5 of the total, not 2/3.",
    shortcut: "For direct proportion, calculate a unit value, then scale.",
  },
  {
    topic: "Fractions & decimals",
    title: "Exact fractions",
    formula: "a/b + c/d = (ad + bc) / bd",
    when: "Use common denominators for addition and subtraction. Multiply across for multiplication.",
    example:
      "1/3 + 1/4 = (4 + 3)/12 = 7/12. Divide by 2/3 by multiplying by 3/2.",
    mistake:
      "Do not add denominators. Invert the second fraction only when dividing.",
    shortcut: "Cancel common factors before multiplication.",
  },
  {
    topic: "Fractions & decimals",
    title: "Order of operations",
    formula: "Parentheses → exponents → × ÷ → + −",
    when: "Evaluate mixed operations. Work left to right within the same priority.",
    example: "3 + 4 × (2 + 5) = 3 + 28 = 31.",
    mistake: "Multiplication and division have equal priority.",
    shortcut: "Use 0.25 = 1/4, 0.5 = 1/2, and 0.75 = 3/4.",
  },
  {
    topic: "Number theory",
    title: "Factors & multiples",
    formula: "GCF(a,b) × LCM(a,b) = a × b",
    when: "GCF divides quantities into largest equal groups. LCM finds when cycles meet.",
    example: "GCF(12,18) = 6; LCM = 12 × 18 / 6 = 36.",
    mistake: "1 is not prime; 2 is the only even prime.",
    shortcut:
      "Divisible by 3 or 9? Test the digit sum. By 5? Last digit is 0 or 5.",
  },
  {
    topic: "Algebra",
    title: "Turn words into equations",
    formula: "ax + b = c → x = (c − b) / a",
    when: "Choose an unknown, translate each condition, then undo operations in reverse order.",
    example: "Three times a number plus 4 is 25: 3x + 4 = 25, so x = 7.",
    mistake:
      "“5 less than x” means x − 5. Consecutive odd/even integers differ by 2.",
    shortcut: "The middle of three consecutive integers is their average.",
  },
  {
    topic: "Applied math",
    title: "Travel & combined work",
    formula: "d = vt   •   combined rate = 1/a + 1/b",
    when: "For objects moving toward each other, add speeds. For work, add rates, not times.",
    example:
      "A 4-hour worker and 6-hour worker finish together in 1/(1/4 + 1/6) = 12/5 hours.",
    mistake: "Keep time and speed units consistent.",
    shortcut: "Two workers: time = ab/(a+b). Meeting time = distance/(v₁+v₂).",
  },
  {
    topic: "Applied math",
    title: "Money, averages & geometry",
    formula: "I = Prt   •   mean = Σx/n   •   area = lw",
    when: "Simple interest uses rate per year and time in years. Rectangle perimeter = 2(l+w).",
    example:
      "₱2,000 at 5% for 3 years earns ₱300. A 4 m × 7 m rectangle has area 28 m².",
    mistake:
      "Interest is separate from the final balance. Half the remaining money is not half the original.",
    shortcut: "Reverse spending by undoing the last expense first.",
  },
];
