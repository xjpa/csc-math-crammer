import { type Generator, fraction, num } from "../core";
export const applied: Generator = (r, d, v) => {
  const k = v ?? r.int(0, 8),
    a = r.int(2, 8),
    b = r.int(3, d === "Hard" ? 15 : d === "Medium" ? 11 : 8);
  let text = "",
    answer: string | number = 0,
    steps: string[] = [];
  if (k === 0) {
    text = `A bus travels at ${a * 10} km/h for ${b} hours. How far does it travel?`;
    answer = a * 10 * b;
    steps = [`Distance = speed × time.`, `${a * 10} × ${b} = ${answer} km.`];
  }
  if (k === 1) {
    const speed = b * 10;
    answer = a;
    text = `Two cyclists start ${a * (speed + 20)} km apart and ride toward each other at ${speed} km/h and 20 km/h. After how many hours will they meet?`;
    steps = [
      `Closing speed = ${speed} + 20 = ${speed + 20} km/h.`,
      `Time = ${a * (speed + 20)} ÷ ${speed + 20} = ${a} hours.`,
    ];
  }
  if (k === 2) {
    text = `Ana can complete a task in ${a} hours and Ben in ${b} hours. How many hours do they need working together? Express as a fraction or integer.`;
    answer = fraction(a * b, a + b);
    steps = [
      `Combined rate = 1/${a} + 1/${b} = ${a + b}/${a * b} task per hour.`,
      `Time is the reciprocal: ${answer} hours.`,
    ];
  }
  if (k === 3) {
    text = `Find the simple interest on ₱${num(a * 1000)} at ${b}% per year for 2 years.`;
    answer = (a * 1000 * b * 2) / 100;
    steps = [
      `Simple interest I = principal × rate × time.`,
      `${a * 1000} × ${b / 100} × 2 = ₱${num(Number(answer))}.`,
    ];
  }
  if (k === 4) {
    text = `A salesperson earns ${a}% commission on ₱${num(b * 10000)} in sales. What is the commission?`;
    answer = a * b * 100;
    steps = [
      `Commission = sales × commission rate.`,
      `${b * 10000} × ${a / 100} = ₱${num(Number(answer))}.`,
    ];
  }
  if (k === 5) {
    const vals = [a * 5, b * 5, (a + b) * 5];
    text = `What is the mean of ${vals.join(", ")}? Round to two decimal places.`;
    answer = (vals.reduce((s, n) => s + n) / 3).toFixed(2);
    steps = [
      `Total = ${vals.reduce((s, n) => s + n)}.`,
      `Divide by 3: ${answer}.`,
    ];
  }
  if (k === 6) {
    text = `A rectangle has perimeter ${2 * (a + b + a)} m. Its length is ${b} m more than its width. Find its area in square meters.`;
    answer = a * (a + b);
    steps = [
      `Length + width = ${2 * a + b}.`,
      `2 × width + ${b} = ${2 * a + b}, so width = ${a} and length = ${a + b}.`,
      `Area = ${a} × ${a + b} = ${answer} m².`,
    ];
  }
  if (k === 7) {
    const salary = a * 1600 + b * 400,
      left = salary / 4 - b * 100;
    text = `You spend half your salary on bills, then half the remaining money on food, then ₱${b * 100} on transport. You have ₱${num(left)} left. What was your salary?`;
    answer = salary;
    steps = [
      `Before transport: ${left} + ${b * 100} = ${salary / 4}.`,
      `After two halvings, this is one quarter of the salary.`,
      `Salary = ${salary / 4} × 4 = ₱${num(salary)}.`,
    ];
  }
  if (k === 8) {
    text = `A motorcycle travels ${a * b * 10} km at ${b * 10} km/h. How many hours does the trip take?`;
    answer = a;
    steps = [
      `Time = distance ÷ speed.`,
      `${a * b * 10} ÷ ${b * 10} = ${a} hours.`,
    ];
  }
  return {
    subtopic: [
      "Speed and distance",
      "Meeting objects",
      "Combined work",
      "Simple interest",
      "Sales commission",
      "Averages",
      "Area and perimeter",
      "Multi-step spending",
      "Travel time",
    ][k],
    text,
    answer: typeof answer === "number" ? num(answer) : answer,
    wrong:
      typeof answer === "number"
        ? [num(answer * 2), num(answer / 2), num(answer + a), num(answer + b)]
        : k === 2
          ? [fraction(a + b, a * b), fraction(a * b, a), fraction(a * b, b)]
          : [String(a * 5), String(b * 5), String((a + b) * 5)],
    steps,
  };
};
