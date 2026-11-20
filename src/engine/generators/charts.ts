import { type Generator, num } from "../core";
export const charts: Generator = (r, d, v) => {
  const k = v ?? r.int(0, 5),
    data = Array.from({ length: 5 }, (_, i) => ({
      year: String(2020 + i),
      value: r.int(2, 18) * 50 + i * 10,
    }));
  if (
    (k === 4 && data[1].value < data[0].value) ||
    (k === 5 && data[1].value > data[0].value)
  ) {
    const x = data[0].value;
    data[0].value = data[1].value;
    data[1].value = x;
  }
  const vals = data.map((x) => x.value),
    total = vals.reduce((a, b) => a + b, 0);
  let text = "",
    answer: string | number = 0,
    steps: string[] = [];
  if (k === 0) {
    text =
      "What is the total annual sales across all five years, in thousands of pesos?";
    answer = total;
    steps = [`Add the five values: ${vals.join(" + ")} = ${total}.`];
  }
  if (k === 1) {
    const high = r.pick([true, false]);
    text = `Which year had the ${high ? "highest" : "lowest"} sales?`;
    answer =
      data[vals.indexOf(high ? Math.max(...vals) : Math.min(...vals))].year;
    steps = [
      `Compare all five values. The ${high ? "maximum" : "minimum"} is ${high ? Math.max(...vals) : Math.min(...vals)}, in ${answer}.`,
    ];
  }
  if (k === 2) {
    text = "What is the average annual sales, in thousands of pesos?";
    answer = total / 5;
    steps = [`Total = ${total}.`, `Average = ${total} ÷ 5 = ${answer}.`];
  }
  if (k === 3) {
    text =
      "How much greater are the higher sales of 2020 and 2021 than the lower sales (in thousands of pesos)?";
    answer = Math.abs(vals[0] - vals[1]);
    steps = [
      `Subtract the smaller value from the larger: |${vals[1]} − ${vals[0]}| = ${answer}.`,
    ];
  }
  if (k === 4 || k === 5) {
    text = `What is the percentage ${vals[1] > vals[0] ? "growth" : "decline"} from 2020 to 2021? Round to two decimal places.`;
    answer = `${((Math.abs(vals[1] - vals[0]) / vals[0]) * 100).toFixed(2)}%`;
    steps = [
      `Change = |${vals[1]} − ${vals[0]}| = ${Math.abs(vals[1] - vals[0])}.`,
      `Divide by the original (${vals[0]}), then multiply by 100: ${answer}.`,
    ];
  }
  return {
    subtopic: [
      "Chart totals",
      "Highest and lowest",
      "Table averages",
      "Year comparisons",
      "Percentage growth",
      "Percentage decline",
    ][k],
    text,
    answer: typeof answer === "number" ? num(answer) : answer,
    wrong:
      k === 1
        ? data.map((x) => x.year)
        : k >= 4
          ? [
              `${((Math.abs(vals[1] - vals[0]) / vals[1]) * 100).toFixed(2)}%`,
              "10.00%",
              "50.00%",
              "25.00%",
            ]
          : [
              num(total),
              num(total / 4),
              num(Number(answer) + 50),
              num(Number(answer) - 50),
            ],
    steps,
    data,
    display: d === "Easy" ? "bar" : r.pick(["bar", "table"]),
  };
};
