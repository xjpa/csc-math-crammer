import {
  topics,
  type Question,
  type Topic,
  type Difficulty,
  Random,
} from "./engine";
export interface Attempt {
  id: string;
  question: Question;
  selected: string;
  correct: boolean;
  seconds: number;
  at: number;
  mode: string;
}
export interface Exam {
  id: string;
  questions: Question[];
  answers: Record<number, string>;
  times: Record<number, number>;
  flags: number[];
  index: number;
  deadline: number;
  duration: number;
  submitted?: boolean;
}
export interface ExamResult {
  id: string;
  date: number;
  questions: Question[];
  answers: Record<number, string>;
  times: Record<number, number>;
  score: number;
  duration: number;
}
export interface Progress {
  version: 1;
  attempts: Attempt[];
  exams: ExamResult[];
}
export const emptyProgress: Progress = { version: 1, attempts: [], exams: [] };
export function readSaved<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}
export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function loadProgress(): Progress {
  const p = readSaved<Progress>("csc-progress-v1", emptyProgress);
  return p?.version === 1 && Array.isArray(p.attempts) && Array.isArray(p.exams)
    ? p
    : emptyProgress;
}
export function validateAnswer(q: Question, choice: string) {
  return q.choices.includes(choice) && choice === q.answer;
}
export function scoreExam(
  questions: Question[],
  answers: Record<number, string>,
) {
  return questions.reduce(
    (sum, q, i) => sum + Number(validateAnswer(q, answers[i])),
    0,
  );
}
export function stats(attempts: Attempt[]) {
  const correct = attempts.filter((a) => a.correct).length;
  let streak = 0,
    longest = 0;
  for (const a of attempts) {
    streak = a.correct ? streak + 1 : 0;
    longest = Math.max(longest, streak);
  }
  return {
    total: attempts.length,
    correct,
    accuracy: attempts.length
      ? Math.round((correct / attempts.length) * 100)
      : 0,
    streak,
    longest,
    average: attempts.length
      ? Math.round(
          attempts.reduce((s, a) => s + a.seconds, 0) / attempts.length,
        )
      : 0,
  };
}
export function topicStats(attempts: Attempt[], topic: Topic) {
  return stats(attempts.filter((a) => a.question.topic === topic));
}
export function mastery(attempts: Attempt[], topic: Topic) {
  const recent = attempts.filter((a) => a.question.topic === topic).slice(-20);
  return Math.round(
    (recent.filter((a) => a.correct).length / Math.max(10, recent.length)) *
      100,
  );
}
export function adaptiveDifficulty(
  attempts: Attempt[],
  topic: Topic,
): Difficulty {
  const recent = attempts.filter((a) => a.question.topic === topic).slice(-10);
  if (recent.length < 5) return "Easy";
  const s = stats(recent);
  if (s.accuracy < 60) return "Easy";
  if (recent.length === 10 && s.accuracy >= 85 && s.average <= 75)
    return "Hard";
  return "Medium";
}
export function adaptiveTopic(attempts: Attempt[], seed: number): Topic {
  const r = new Random(seed);
  const weights = topics.map((t) => {
    const s = topicStats(attempts, t);
    return 1 + (100 - mastery(attempts, t)) / 20 + (s.average > 90 ? 2 : 0);
  });
  let n = r.next() * weights.reduce((s, v) => s + v, 0);
  return topics[weights.findIndex((w) => (n -= w) < 0)] ?? topics[0];
}
export function recordAttempt(
  q: Question,
  selected: string,
  seconds: number,
  mode: string,
): Attempt {
  return {
    id: `${q.id}-${Date.now()}`,
    question: q,
    selected,
    correct: validateAnswer(q, selected),
    seconds: Math.max(0, Math.round(seconds)),
    at: Date.now(),
    mode,
  };
}

/** Unanswered items affect exam scores, but do not inflate practice totals or daily goals. */
export function examAttempts(
  questions: Question[],
  answers: Record<number, string>,
  times: Record<number, number>,
): Attempt[] {
  return questions.flatMap((q, i) =>
    q.choices.includes(answers[i])
      ? [recordAttempt(q, answers[i], times[i] ?? 0, "Mock exam")]
      : [],
  );
}
