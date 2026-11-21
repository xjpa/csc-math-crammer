import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  ClipboardList,
  History,
  GraduationCap,
  Sun,
  Moon,
  Flame,
  Check,
  ChevronRight,
  Clock,
  ChartNoAxesCombined,
  Zap,
  Flag,
  CheckCircle2,
  X,
  RotateCcw,
  Search,
  Menu,
  Lightbulb,
  Trophy,
  Play,
  TrendingUp,
} from "lucide-react";
import { XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import {
  topics,
  generate,
  makeExam,
  variantCounts,
  type Topic,
  type Question,
  type Difficulty,
} from "./engine";
import {
  loadProgress,
  save,
  readSaved,
  stats,
  topicStats,
  mastery,
  adaptiveTopic,
  adaptiveDifficulty,
  recordAttempt,
  examAttempts,
  scoreExam,
  type Exam,
  type ExamResult,
} from "./progress";
import { formulas } from "./formulas";
import {
  generateFreshQuestion,
  rememberQuestion,
  restoreQuestionHistory,
} from "./engine/practice";
import { QuestionCard } from "./components/QuestionCard";
type View =
  | "Dashboard"
  | "Practice"
  | "Adaptive training"
  | "Mock exam"
  | "Mistake review"
  | "Formula library";
const nav = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Practice", icon: BookOpen },
  { name: "Adaptive training", icon: Target },
  { name: "Mock exam", icon: ClipboardList },
  { name: "Mistake review", icon: History },
  { name: "Formula library", icon: GraduationCap },
] as const;
const topicIcons = ["Aa", "%", "▥", "2:3", "½", "÷", "x", "↗"];
const topicDescriptions = [
  "Find the pattern. Think ahead.",
  "Make every percent count.",
  "Turn data into clear answers.",
  "Find balance in every problem.",
  "Build fluency, one part at a time.",
  "Discover how numbers work.",
  "Turn the unknown into an answer.",
  "Bring your math into real life.",
];
const seed = () => Math.floor(Math.random() * 2147483646) + 1;
const clock = (s: number) =>
  `${Math.floor(Math.max(s, 0) / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(Math.max(s, 0) % 60)
    .toString()
    .padStart(2, "0")}`;
export default function App() {
  const [view, setView] = useState<View>("Dashboard"),
    [progress, setProgress] = useState(loadProgress),
    [dark, setDark] = useState(() => readSaved("csc-dark", false)),
    [menu, setMenu] = useState(false),
    [storageError, setStorageError] = useState(false);
  const [topic, setTopic] = useState<Topic>("Sequences"),
    [difficulty, setDifficulty] = useState<Difficulty>("Easy"),
    [question, setQuestion] = useState(() =>
      generate("Sequences", "Easy", seed()),
    ),
    [selected, setSelected] = useState<string>(),
    [elapsed, setElapsed] = useState(0),
    [now, setNow] = useState(Date.now()),
    [goal, setGoal] = useState(() => readSaved("csc-goal", 10));
  const [exam, setExam] = useState<Exam | null>(() =>
      readSaved("csc-active-exam", null),
    ),
    [minutes, setMinutes] = useState(60),
    [review, setReview] = useState<ExamResult | null>(null),
    [reviewIndex, setReviewIndex] = useState(0),
    [confirmSubmit, setConfirmSubmit] = useState(false),
    [libraryFilter, setLibraryFilter] = useState("All topics"),
    [search, setSearch] = useState("");
  const started = useRef(Date.now()),
    recent = useRef<string[] | null>(null),
    variantCursor = useRef<Record<string, number>>({}),
    examTick = useRef(Date.now());
  if (recent.current === null) {
    recent.current = restoreQuestionHistory(
      readSaved<unknown>("csc-recent-questions-v1", []),
      progress.attempts.map((a) => a.question),
    );
  }
  const s = stats(progress.attempts),
    today = progress.attempts.filter(
      (a) => new Date(a.at).toDateString() === new Date().toDateString(),
    ).length;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);
  useEffect(() => {
    if (!save("csc-progress-v1", progress)) setStorageError(true);
  }, [progress]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    save("csc-dark", dark);
  }, [dark]);
  useEffect(() => {
    if (!save("csc-active-exam", exam)) setStorageError(true);
  }, [exam]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if ((view === "Practice" || view === "Adaptive training") && !selected)
      setElapsed(Math.floor((now - started.current) / 1000));
  }, [now, view, selected]);
  useEffect(() => {
    if (!exam || exam.submitted) return;
    const delta = (now - examTick.current) / 1000;
    examTick.current = now;
    if (view === "Mock exam" && delta > 0)
      setExam((e) =>
        e
          ? {
              ...e,
              times: { ...e.times, [e.index]: (e.times[e.index] ?? 0) + delta },
            }
          : e,
      );
  }, [now, view, exam?.submitted]);
  useEffect(() => {
    if (exam && !exam.submitted && now >= exam.deadline) submitExam();
  }, [now, exam?.deadline, exam?.submitted]);
  useEffect(() => {
    if (!confirmSubmit) return;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const buttons = dialog?.querySelectorAll<HTMLButtonElement>("button");
    buttons?.[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmSubmit(false);
      if (e.key === "Tab" && buttons?.length) {
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [confirmSubmit]);
  function navigate(v: View) {
    setView(v);
    setMenu(false);
    if (v === "Practice" || v === "Adaptive training")
      newQuestion(v === "Adaptive training");
  }
  function newQuestion(
    adaptive = false,
    t: Topic = topic,
    d: Difficulty = difficulty,
    subtopic?: string,
  ) {
    const chosen = adaptive ? adaptiveTopic(progress.attempts, seed()) : t;
    const level = adaptive ? adaptiveDifficulty(progress.attempts, chosen) : d;
    const key = `${chosen}-${level}`;
    const variant =
      (variantCursor.current[key] ?? 0) % variantCounts[topics.indexOf(chosen)];
    variantCursor.current[key] = (variantCursor.current[key] ?? 0) + 1;
    const q = generateFreshQuestion(chosen, level, seed(), {
      variant,
      subtopic,
      history: recent.current ?? [],
    });
    recent.current = rememberQuestion(recent.current ?? [], q);
    if (!save("csc-recent-questions-v1", recent.current)) setStorageError(true);
    setQuestion(q);
    setSelected(undefined);
    setElapsed(0);
    started.current = Date.now();
    if (adaptive) {
      setTopic(chosen);
      setDifficulty(level);
    }
  }
  function answer(choice: string) {
    if (selected) return;
    setSelected(choice);
    setProgress((p) => ({
      ...p,
      attempts: [
        ...p.attempts,
        recordAttempt(
          question,
          choice,
          (Date.now() - started.current) / 1000,
          view,
        ),
      ],
    }));
  }
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (confirmSubmit) return;
      if ((e.target as HTMLElement)?.closest("input,select,textarea")) return;
      const index = "abcd".indexOf(e.key.toLowerCase());
      const digit = Number(e.key) - 1;
      const n = index >= 0 ? index : digit;
      if (
        view === "Dashboard" &&
        e.key === "Enter" &&
        !(e.target as HTMLElement)?.closest("button,a")
      )
        navigate("Practice");
      if (view === "Practice" || view === "Adaptive training") {
        if (n >= 0 && n < 4 && !selected) answer(question.choices[n]);
        if (
          e.key === "Enter" &&
          selected &&
          !(e.target as HTMLElement)?.closest("button")
        )
          newQuestion(view === "Adaptive training");
      } else if (
        view === "Mock exam" &&
        exam &&
        !exam.submitted &&
        n >= 0 &&
        n < 4
      )
        setExam((x) =>
          x
            ? {
                ...x,
                answers: {
                  ...x.answers,
                  [x.index]: x.questions[x.index].choices[n],
                },
              }
            : x,
        );
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });
  function startExam() {
    const duration = Math.max(5, Math.min(180, minutes)) * 60;
    setExam({
      id: String(Date.now()),
      questions: makeExam(seed(), difficulty),
      answers: {},
      times: {},
      flags: [],
      index: 0,
      deadline: Date.now() + duration * 1000,
      duration,
    });
    examTick.current = Date.now();
    setReview(null);
    setConfirmSubmit(false);
  }
  function submitExam() {
    if (!exam || exam.submitted) return;
    const result: ExamResult = {
      id: exam.id,
      date: Date.now(),
      questions: exam.questions,
      answers: exam.answers,
      times: exam.times,
      score: scoreExam(exam.questions, exam.answers),
      duration: Math.min(
        exam.duration,
        Math.round(
          (Date.now() - (exam.deadline - exam.duration * 1000)) / 1000,
        ),
      ),
    };
    setProgress((p) =>
      p.exams.some((e) => e.id === result.id)
        ? p
        : {
            ...p,
            exams: [...p.exams, result],
            attempts: [
              ...p.attempts,
              ...examAttempts(exam.questions, exam.answers, exam.times),
            ],
          },
    );
    setExam({ ...exam, submitted: true });
    setReview(result);
    setReviewIndex(0);
    setConfirmSubmit(false);
  }
  function targetMistake(q: Question) {
    setTopic(q.topic);
    setDifficulty(q.difficulty);
    newQuestion(false, q.topic, q.difficulty, q.subtopic);
    setView("Practice");
  }
  const errors = progress.attempts.filter((a) => !a.correct);
  const solved = new Set(
    progress.attempts.filter((a) => a.correct).map((a) => a.question.id),
  );
  function renderDashboard() {
    const practiced = topics.filter(
      (t) => topicStats(progress.attempts, t).total,
    );
    const sorted = [...practiced].sort(
      (a, b) => mastery(progress.attempts, b) - mastery(progress.attempts, a),
    );
    const daily = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 6 + i);
      const attempts = progress.attempts.filter(
        (a) => new Date(a.at).toDateString() === date.toDateString(),
      );
      return {
        day: date.toLocaleDateString("en", { weekday: "short" }),
        accuracy: stats(attempts).accuracy,
        questions: attempts.length,
      };
    });
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              A LITTLE PRACTICE. A LOT OF PROGRESS.
            </span>
            <h1>
              Your next chapter starts here<span className="purple">.</span>
            </h1>
            <p>
              Build your confidence, one problem at a time. You’ve got this.
            </p>
          </div>
          <span className="date-chip">
            {new Date().toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              weekday: "short",
            })}
          </span>
        </div>
        <div className="dashboard-top">
          <section className="hero">
            <div className="hero-content">
              <span className="hero-label">
                <span /> YOUR CIVIL SERVICE JOURNEY
              </span>
              <h2>
                Big goals.
                <br />
                Small daily wins.
              </h2>
              <p>
                Your future is worth practicing for.
                <br />
                Let’s make today’s session count.
              </p>
              <button
                className="lime-button"
                onClick={() => navigate("Practice")}
              >
                <Play size={17} fill="currentColor" /> Start practicing{" "}
                <span className="button-key">↵</span>
              </button>
              <div className="hero-foot">
                <CheckCircle2 size={14} /> Unlimited questions. Real
                understanding.
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="math-float float-one">x²</div>
              <div className="math-float float-two">%</div>
              <div className="math-float float-three">÷</div>
              <div className="art-center">
                <GraduationCap size={66} strokeWidth={1.5} />
                <span>
                  READY FOR
                  <br />
                  <b>WHAT’S NEXT.</b>
                </span>
              </div>
              <span className="spark s-one">✦</span>
              <span className="spark s-two">✧</span>
            </div>
          </section>
          <section className="card daily-card">
            <div className="card-title">
              <h3>Your daily goal</h3>
              <Flame size={19} className="orange" />
            </div>
            <div
              className="goal-ring"
              style={{
                background: `conic-gradient(var(--primary) ${Math.min(today / goal, 1) * 360}deg, var(--line) 0deg)`,
              }}
            >
              <div>
                <strong>
                  {Math.min(today, goal)}
                  <small> / {goal}</small>
                </strong>
                <span>questions today</span>
              </div>
            </div>
            <p>
              {today >= goal
                ? "Goal complete. Keep the momentum!"
                : "A few minutes today. A stronger you tomorrow."}
            </p>
            <label className="goal-setting">
              Daily target{" "}
              <select
                value={goal}
                onChange={(e) => {
                  setGoal(Number(e.target.value));
                  save("csc-goal", Number(e.target.value));
                }}
              >
                {[5, 10, 20, 40].map((n) => (
                  <option key={n} value={n}>
                    {n} questions
                  </option>
                ))}
              </select>
            </label>
          </section>
        </div>
        <div className="stats-grid">
          {[
            {
              name: "Questions answered",
              value: s.total,
              icon: BookOpen,
              color: "purple",
              foot: "Every attempt is a step forward",
            },
            {
              name: "Overall accuracy",
              value: `${s.accuracy}%`,
              icon: Target,
              color: "green",
              foot: s.total
                ? `${s.correct} correct answers`
                : "Your first answer starts it all",
            },
            {
              name: "Current streak",
              value: s.streak,
              icon: Flame,
              color: "orange",
              foot: `Personal best: ${s.longest} in a row`,
            },
            {
              name: "Average solve time",
              value: s.total ? `${s.average}s` : "—",
              icon: Clock,
              color: "blue",
              foot: "Focus on understanding first",
            },
          ].map((x) => (
            <section className="card stat-card" key={x.name}>
              <div className={`stat-icon ${x.color}`}>
                <x.icon size={20} />
              </div>
              <span>{x.name}</span>
              <strong>{x.value}</strong>
              <small>{x.foot}</small>
            </section>
          ))}
        </div>
        <section className="card difficulty-summary">
          <h3>Performance by difficulty</h3>
          <div>
            {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => {
              const ds = stats(
                progress.attempts.filter((a) => a.question.difficulty === d),
              );
              return (
                <span key={d}>
                  <b>{d}</b>
                  <strong>{ds.total ? `${ds.accuracy}%` : "—"}</strong>
                  <small>
                    {ds.total} answered · {ds.average}s avg.
                  </small>
                </span>
              );
            })}
          </div>
        </section>
        <div className="dashboard-bottom">
          <section>
            <div className="section-heading">
              <div>
                <h2>Find your focus</h2>
                <p>Eight topics. Unlimited ways to get better.</p>
              </div>
              <button
                className="text-button"
                onClick={() => navigate("Practice")}
              >
                Explore practice <ChevronRight size={16} />
              </button>
            </div>
            <div className="topic-grid">
              {topics.map((t, i) => (
                <button
                  className="card topic-card"
                  key={t}
                  onClick={() => {
                    setTopic(t);
                    newQuestion(false, t);
                    setView("Practice");
                  }}
                >
                  <div className="topic-top">
                    <span className={`topic-icon color-${i % 4}`}>
                      {topicIcons[i]}
                    </span>
                    <ChevronRight size={17} />
                  </div>
                  <h3>{t}</h3>
                  <p>{topicDescriptions[i]}</p>
                  <div className="mastery-label">
                    <span>
                      {topicStats(progress.attempts, t).total
                        ? "Mastery"
                        : "Ready when you are"}
                    </span>
                    <b>{mastery(progress.attempts, t)}%</b>
                  </div>
                  <div className="progress-track">
                    <span
                      style={{ width: `${mastery(progress.attempts, t)}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </section>
          <aside className="right-column">
            <section className="card activity-card">
              <div className="card-title">
                <h3>Your momentum</h3>
                <TrendingUp size={18} className="purple" />
              </div>
              <p>Questions practiced · last 7 days</p>
              <div className="activity-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={daily}
                    margin={{ top: 15, left: 0, right: 7, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="activityFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#7664ed"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="#7664ed"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        borderColor: "var(--line)",
                        color: "var(--text)",
                      }}
                      labelStyle={{ color: "var(--text)" }}
                      itemStyle={{ color: "var(--text)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="questions"
                      stroke="#7664ed"
                      strokeWidth={2.5}
                      fill="url(#activityFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="activity-footer">
                <span>This week</span>
                <strong>
                  {daily.reduce((n, x) => n + x.questions, 0)} questions
                </strong>
              </div>
            </section>
            <section className="adaptive-card">
              <span className="mini-icon">
                <Zap size={20} />
              </span>
              <h3>Practice with a purpose.</h3>
              <p>
                Let your progress guide you. Adaptive training gives your weaker
                topics a little extra attention.
              </p>
              <button onClick={() => navigate("Adaptive training")}>
                Try adaptive training <ChevronRight size={16} />
              </button>
            </section>
            <section className="card insight-card">
              <div className="card-title">
                <h3>Your learning insights</h3>
                <Lightbulb size={18} />
              </div>
              <p>Strongest topic</p>
              <strong>{sorted[0] ?? "Your story starts here"}</strong>
              <p>Next area to strengthen</p>
              <strong>
                {sorted.length
                  ? sorted[sorted.length - 1]
                  : "Answer a few questions to discover it."}
              </strong>
            </section>
          </aside>
        </div>
        <section className="card history-card">
          <div className="section-heading">
            <div>
              <h2>Mock exam history</h2>
              <p>Your milestones, all in one place.</p>
            </div>
            <button
              className="text-button"
              onClick={() => navigate("Mock exam")}
            >
              Take an exam <ChevronRight size={16} />
            </button>
          </div>
          {progress.exams.length ? (
            <div className="exam-history">
              {progress.exams
                .slice(-5)
                .reverse()
                .map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setReview(e);
                      setReviewIndex(0);
                      setView("Mock exam");
                    }}
                  >
                    <span>
                      <ClipboardList size={20} />{" "}
                      {new Date(e.date).toLocaleDateString()}
                    </span>
                    <strong>
                      {e.score}/40 · {Number(((e.score / 40) * 100).toFixed(1))}
                      %
                    </strong>
                    <span>
                      Review <ChevronRight size={15} />
                    </span>
                  </button>
                ))}
            </div>
          ) : (
            <div className="empty-inline">
              <ClipboardList size={25} />
              <p>
                Your first mock exam is a fresh starting point. See how far you
                can go.
              </p>
            </div>
          )}
        </section>
      </>
    );
  }
  function renderPractice() {
    const adaptive = view === "Adaptive training";
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              {adaptive ? "TRAIN SMARTER" : "ONE QUESTION. ONE STEP FORWARD."}
            </span>
            <h1>
              {adaptive
                ? "A little more focus. A lot more growth."
                : "Let’s put your skills to work."}
            </h1>
            <p>
              {adaptive
                ? "Your recent answers guide the topic and difficulty of every question."
                : "Choose your topic, find your rhythm, and learn as you go."}
            </p>
          </div>
        </div>
        <div className="practice-layout">
          <div>
            <div className="practice-controls card">
              {!adaptive ? (
                <>
                  <label htmlFor="practice-topic">
                    Topic
                    <select
                      id="practice-topic"
                      value={topic}
                      onChange={(e) => {
                        const t = e.target.value as Topic;
                        setTopic(t);
                        newQuestion(false, t);
                      }}
                    >
                      {topics.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label htmlFor="practice-difficulty">
                    Difficulty
                    <select
                      id="practice-difficulty"
                      value={difficulty}
                      onChange={(e) => {
                        const d = e.target.value as Difficulty;
                        setDifficulty(d);
                        newQuestion(false, topic, d);
                      }}
                    >
                      {["Easy", "Medium", "Hard"].map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <div className="adaptive-current">
                  <Zap size={21} />
                  <div>
                    <strong>{question.topic}</strong>
                    <p>{question.difficulty} · Selected for your next step</p>
                  </div>
                </div>
              )}
              <span className="timer">
                <Clock size={17} />
                {clock(elapsed)}
              </span>
            </div>
            <section className="card question-card">
              <div className="question-top">
                <span className="eyebrow">PRACTICE ARENA</span>
                <span className="muted">Take your time. Make it count.</span>
              </div>
              <QuestionCard
                q={question}
                selected={selected}
                onAnswer={answer}
                reveal={!!selected}
              />
              <div className="question-footer">
                <span className="keyboard-tip">
                  Use <kbd>A</kbd>–<kbd>D</kbd> or <kbd>1</kbd>–<kbd>4</kbd> to
                  answer
                </span>
                {selected && (
                  <button
                    className="primary-button"
                    onClick={() => newQuestion(adaptive)}
                  >
                    Next question <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </section>
          </div>
          <aside className="practice-aside">
            <section className="card">
              <h3>Your progress</h3>
              <div className="mini-stats">
                <div>
                  <Flame className="orange" />
                  <strong>{s.streak}</strong>
                  <span>Current streak</span>
                </div>
                <div>
                  <Target className="purple" />
                  <strong>{s.accuracy}%</strong>
                  <span>Accuracy</span>
                </div>
              </div>
              <p className="muted">
                {s.total} questions answered across your learning journey.
              </p>
            </section>
            <section className="tip-card">
              <Lightbulb size={23} />
              <h3>
                {adaptive
                  ? "How your training adapts"
                  : "Understanding beats guessing."}
              </h3>
              <p>
                {adaptive
                  ? "Topics with lower mastery receive more practice. Your last 10 answers in each topic guide difficulty."
                  : "Read each explanation, even when you’re right. Knowing why is what makes the next question easier."}
              </p>
              {adaptive && (
                <ul>
                  <li>Fewer than 5 attempts or under 60%: Easy.</li>
                  <li>At least 5 attempts and 60%: Medium.</li>
                  <li>
                    10 recent attempts, at least 85%, and average ≤75s: Hard.
                  </li>
                </ul>
              )}
            </section>
            <button
              className="card link-card"
              onClick={() => navigate("Formula library")}
            >
              <GraduationCap size={22} />
              <span>
                Need a refresher?<b>Open formula library</b>
              </span>
              <ChevronRight size={16} />
            </button>
          </aside>
        </div>
      </>
    );
  }
  function renderResult(e: ExamResult) {
    const q = e.questions[reviewIndex];
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              YOUR NEXT STEP STARTS WITH WHAT YOU LEARNED
            </span>
            <h1>Every result is a way forward.</h1>
            <p>
              Review your answers and find the topics that deserve a little more
              time.
            </p>
          </div>
          <button
            className="secondary-button"
            onClick={() => {
              setReview(null);
              if (exam?.submitted) setExam(null);
            }}
          >
            Exam setup
          </button>
        </div>
        <div className="result-grid">
          <section className="card result-score">
            <Trophy size={32} />
            <strong>{Number(((e.score / 40) * 100).toFixed(1))}%</strong>
            <h3>{e.score} of 40 correct</h3>
            <p>Completed in {clock(e.duration)}</p>
          </section>
          <section className="card breakdown">
            <h3>Performance by topic</h3>
            {topics.map((t) => {
              const qs = e.questions
                .map((q, i) => ({ q, i }))
                .filter((x) => x.q.topic === t);
              const correct = qs.filter(
                (x) => e.answers[x.i] === x.q.answer,
              ).length;
              return (
                <div key={t}>
                  <span>{t}</span>
                  <div className="progress-track">
                    <span
                      style={{ width: `${(correct / qs.length) * 100}%` }}
                    />
                  </div>
                  <b>
                    {correct}/{qs.length}
                  </b>
                </div>
              );
            })}
          </section>
        </div>
        <div className="section-heading">
          <h2>Full answer review</h2>
          <span className="muted">
            {clock(e.times[reviewIndex] ?? 0)} on this question
          </span>
        </div>
        <div className="question-navigation">
          {e.questions.map((q, i) => (
            <button
              className={`${e.answers[i] === q.answer ? "right" : "wrong"} ${i === reviewIndex ? "active" : ""}`}
              key={q.id}
              onClick={() => setReviewIndex(i)}
              aria-label={`Review question ${i + 1}`}
              aria-current={i === reviewIndex ? "step" : undefined}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <section className="card question-card">
          <p className="eyebrow">QUESTION {reviewIndex + 1} OF 40</p>
          <QuestionCard q={q} selected={e.answers[reviewIndex]} reveal />
          <div className="question-footer">
            <button
              className="secondary-button"
              disabled={reviewIndex === 0}
              onClick={() => setReviewIndex((i) => i - 1)}
            >
              Previous
            </button>
            <button className="primary-button" onClick={() => targetMistake(q)}>
              Practice this concept
            </button>
            <button
              className="secondary-button"
              disabled={reviewIndex === 39}
              onClick={() => setReviewIndex((i) => i + 1)}
            >
              Next
            </button>
          </div>
        </section>
      </>
    );
  }
  function renderExam() {
    if (review) return renderResult(review);
    if (exam?.submitted) {
      const e = progress.exams.find((e) => e.id === exam.id);
      if (e) return renderResult(e);
    }
    if (!exam || exam.submitted)
      return (
        <>
          <div className="page-heading">
            <div>
              <span className="eyebrow">MEET THE CHALLENGE</span>
              <h1>A rehearsal for your next chapter.</h1>
              <p>
                A balanced, 40-question numerical reasoning exam. One focused
                session.
              </p>
            </div>
          </div>
          <section className="card exam-setup">
            <span className="setup-icon">
              <ClipboardList size={36} />
            </span>
            <h2>Step into the exam arena.</h2>
            <p>
              Put your skills together across all eight topics. Skip, flag, and
              revisit questions as you go. Your explanations will be ready when
              you submit.
            </p>
            <div className="exam-features">
              <span>
                <BookOpen />
                40 questions
              </span>
              <span>
                <Target />8 topics
              </span>
              <span>
                <History />
                Saved automatically
              </span>
            </div>
            <div className="setup-controls">
              <label>
                Time limit (5–180 minutes)
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value) || 5)}
                />
              </label>
              <label>
                Difficulty
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                >
                  {["Easy", "Medium", "Hard"].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
            </div>
            <button className="primary-button" onClick={startExam}>
              <Play size={17} /> Begin mock exam
            </button>
            <small>
              The timer continues if you leave or reload. You can return to this
              exam here.
            </small>
          </section>
        </>
      );
    const q = exam.questions[exam.index],
      remaining = Math.max(
        0,
        Math.min(exam.duration, Math.ceil((exam.deadline - now) / 1000)),
      );
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              STAY FOCUSED. YOU’RE MAKING PROGRESS.
            </span>
            <h1>Mock exam</h1>
            <p>
              {Object.keys(exam.answers).length} of 40 answered ·{" "}
              {exam.flags.length} flagged for review
            </p>
          </div>
          <span className={`exam-clock ${remaining < 300 ? "urgent" : ""}`}>
            <Clock size={21} />
            {clock(remaining)}
          </span>
        </div>
        <div className="progress-track exam-progress">
          <span
            style={{
              width: `${(Object.keys(exam.answers).length / 40) * 100}%`,
            }}
          />
        </div>
        <div className="exam-layout">
          <section className="card question-card">
            <div className="question-top">
              <span className="eyebrow">QUESTION {exam.index + 1} OF 40</span>
              <button
                className={`text-button ${exam.flags.includes(exam.index) ? "orange" : ""}`}
                onClick={() =>
                  setExam({
                    ...exam,
                    flags: exam.flags.includes(exam.index)
                      ? exam.flags.filter((i) => i !== exam.index)
                      : [...exam.flags, exam.index],
                  })
                }
              >
                <Flag
                  size={17}
                  fill={
                    exam.flags.includes(exam.index) ? "currentColor" : "none"
                  }
                />
                {exam.flags.includes(exam.index)
                  ? "Flagged"
                  : "Flag for review"}
              </button>
            </div>
            <QuestionCard
              q={q}
              selected={exam.answers[exam.index]}
              onAnswer={(c) =>
                setExam({
                  ...exam,
                  answers: { ...exam.answers, [exam.index]: c },
                })
              }
            />
            <div className="question-footer">
              <button
                className="secondary-button"
                disabled={exam.index === 0}
                onClick={() => setExam({ ...exam, index: exam.index - 1 })}
              >
                Previous
              </button>
              <button
                className="text-button"
                disabled={!exam.answers[exam.index]}
                onClick={() => {
                  const answers = { ...exam.answers };
                  delete answers[exam.index];
                  setExam({ ...exam, answers });
                }}
              >
                Clear answer
              </button>
              <button
                className="primary-button"
                onClick={() =>
                  exam.index < 39
                    ? setExam({ ...exam, index: exam.index + 1 })
                    : setConfirmSubmit(true)
                }
              >
                {exam.index === 39
                  ? "Finish exam"
                  : exam.answers[exam.index]
                    ? "Next question"
                    : "Skip question"}
                <ChevronRight size={16} />
              </button>
            </div>
          </section>
          <aside className="card exam-navigator">
            <h3>Your questions</h3>
            <p className="muted">Jump to any question.</p>
            <div className="question-navigation">
              {exam.questions.map((q, i) => (
                <button
                  key={q.id}
                  className={`${exam.answers[i] ? "answered" : ""} ${exam.flags.includes(i) ? "flagged" : ""} ${exam.index === i ? "active" : ""}`}
                  onClick={() => setExam({ ...exam, index: i })}
                  aria-label={`Question ${i + 1}${exam.answers[i] ? ", answered" : ""}${exam.flags.includes(i) ? ", flagged" : ""}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <p className="navigator-legend">
              Filled: answered · Amber: flagged
            </p>
            <button
              className="primary-button full"
              onClick={() => setConfirmSubmit(true)}
            >
              Submit exam
            </button>
          </aside>
        </div>
        {confirmSubmit && (
          <div className="modal-backdrop">
            <section
              className="card modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="submit-heading"
            >
              <h2 id="submit-heading">Ready to submit?</h2>
              <p>
                You have {40 - Object.keys(exam.answers).length} unanswered
                questions and {exam.flags.length} flagged for review. Unanswered
                questions count as incorrect.
              </p>
              <div className="button-row">
                <button
                  className="secondary-button"
                  onClick={() => setConfirmSubmit(false)}
                >
                  Keep working
                </button>
                <button className="primary-button" onClick={submitExam}>
                  Submit & see results
                </button>
              </div>
            </section>
          </div>
        )}
      </>
    );
  }
  function renderMistakes() {
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">MISTAKES ARE PART OF THE PROCESS</span>
            <h1>Turn “not yet” into “got it.”</h1>
            <p>
              Revisit your answers or try a fresh question using the same
              concept.
            </p>
          </div>
          <span className="pill">{errors.length} learning opportunities</span>
        </div>
        {!errors.length ? (
          <section className="card empty-state">
            <CheckCircle2 size={44} />
            <h2>A fresh page for your progress.</h2>
            <p>
              Any questions you miss will appear here, with a full explanation.
            </p>
            <button
              className="primary-button"
              onClick={() => navigate("Practice")}
            >
              Start practicing
            </button>
          </section>
        ) : (
          <div className="mistake-list">
            {errors
              .slice()
              .reverse()
              .map((a) => (
                <details className="card mistake-card" key={a.id}>
                  <summary>
                    <span className="mistake-icon">
                      {solved.has(a.question.id) ? (
                        <Check size={18} />
                      ) : (
                        <RotateCcw size={18} />
                      )}
                    </span>
                    <span>
                      <b>
                        {a.question.topic} · {a.question.subtopic}
                      </b>
                      <p>{a.question.text}</p>
                      <small>
                        {new Date(a.at).toLocaleDateString()} · {a.seconds}s ·{" "}
                        {solved.has(a.question.id)
                          ? "Revisited successfully"
                          : "Ready to revisit"}
                      </small>
                    </span>
                    <ChevronRight size={19} />
                  </summary>
                  <p className="muted">
                    Your previous answer: {a.selected || "Skipped"}
                  </p>
                  <MistakeRetry
                    q={a.question}
                    onCorrect={(choice, seconds) =>
                      setProgress((p) => ({
                        ...p,
                        attempts: [
                          ...p.attempts,
                          recordAttempt(
                            a.question,
                            choice,
                            seconds,
                            "Mistake review",
                          ),
                        ],
                      }))
                    }
                  />
                  <button
                    className="primary-button"
                    onClick={() => targetMistake(a.question)}
                  >
                    Try a new question on this concept
                  </button>
                </details>
              ))}
          </div>
        )}
      </>
    );
  }
  function renderLibrary() {
    const filtered = formulas.filter(
      (f) =>
        (libraryFilter === "All topics" || f.topic === libraryFilter) &&
        `${f.title} ${f.formula} ${f.when}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">YOUR POCKET MATH COMPANION</span>
            <h1>A little clarity goes a long way.</h1>
            <p>
              Essential formulas, worked examples, and shortcuts worth
              remembering.
            </p>
          </div>
        </div>
        <div className="library-controls">
          <label className="search-box">
            <Search size={18} />
            <input
              placeholder="Search formulas…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search formulas"
            />
          </label>
          <select
            aria-label="Filter formulas by topic"
            value={libraryFilter}
            onChange={(e) => setLibraryFilter(e.target.value)}
          >
            {["All topics", ...topics].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="formula-grid">
          {filtered.map((f) => (
            <article className="card formula-card" key={f.title}>
              <span className="pill">{f.topic}</span>
              <h2>{f.title}</h2>
              <div className="formula-expression">{f.formula}</div>
              <p>{f.when}</p>
              <div className="formula-example">
                <b>SEE IT IN ACTION</b>
                <p>{f.example}</p>
              </div>
              <p>
                <strong>Watch out:</strong> {f.mistake}
              </p>
              <p className="shortcut">
                <Zap size={17} />
                <span>{f.shortcut}</span>
              </p>
              <button
                className="text-button"
                onClick={() => {
                  setTopic(f.topic);
                  newQuestion(false, f.topic);
                  setView("Practice");
                }}
              >
                Put it into practice <ChevronRight size={16} />
              </button>
            </article>
          ))}
        </div>
        {!filtered.length && (
          <div className="card empty-state">
            <Search />
            <h2>No matching formulas</h2>
            <p>Try another search or topic.</p>
          </div>
        )}
      </>
    );
  }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("Dashboard");
          }}
        >
          <span className="brand-mark">
            <ChartNoAxesCombined size={24} />
          </span>
          <span>
            CSC<span className="purple"> Math</span>
            <b>ARENA</b>
          </span>
        </a>
        <div className="sidebar-label">YOUR LEARNING SPACE</div>
        <nav>
          {nav.map((item) => (
            <button
              className={view === item.name ? "active" : ""}
              key={item.name}
              onClick={() => navigate(item.name)}
            >
              <item.icon size={19} />
              <span>{item.name}</span>
              {item.name === "Mistake review" && errors.length > 0 && (
                <small>{errors.length}</small>
              )}
              {view === item.name && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="motivation">
            <span>✦</span>
            <h4>
              You’re building
              <br />
              something great.
            </h4>
            <p>
              Progress happens one
              <br />
              question at a time.
            </p>
          </div>
          <div className="local-badge">
            <span />
            <div>
              <strong>Made for your next chapter</strong>
              <p>Philippine Civil Service Exam</p>
            </div>
          </div>
        </div>
      </aside>
      {menu && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="mobile-menu icon-button"
              onClick={() => setMenu(!menu)}
              aria-label="Toggle navigation"
            >
              {menu ? <X size={21} /> : <Menu size={21} />}
            </button>
            <span className="breadcrumb">
              Your arena <ChevronRight size={14} /> <b>{view}</b>
            </span>
          </div>
          <div className="topbar-actions">
            <span className="streak-chip">
              <Flame size={17} />
              <b>{s.streak}</b>
              <span>answer streak</span>
            </span>
            <span className="topbar-divider" />
            <button
              className="icon-button"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <span className="avatar" aria-label="Local learner profile">
              YOU
            </span>
          </div>
        </header>
        <main>
          {storageError && (
            <div role="alert" className="storage-warning">
              Your browser could not save progress. Free some local storage to
              keep new answers after reload.
            </div>
          )}
          {exam && !exam.submitted && view !== "Mock exam" && (
            <button
              className="resume-banner"
              onClick={() => {
                setReview(null);
                setView("Mock exam");
              }}
            >
              <Clock size={18} />
              <span>
                Your mock exam is in progress.{" "}
                <b>
                  {clock(Math.ceil((exam.deadline - now) / 1000))} remaining
                </b>
              </span>
              <span>
                Resume exam <ChevronRight size={16} />
              </span>
            </button>
          )}
          {view === "Dashboard"
            ? renderDashboard()
            : view === "Practice" || view === "Adaptive training"
              ? renderPractice()
              : view === "Mock exam"
                ? renderExam()
                : view === "Mistake review"
                  ? renderMistakes()
                  : renderLibrary()}
          <footer>
            <span>CSC Math Arena</span>
            <p>A little better, every day.</p>
            <span>
              <span className="footer-dot" /> Your progress stays on this device
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
function MistakeRetry({
  q,
  onCorrect,
}: {
  q: Question;
  onCorrect: (choice: string, seconds: number) => void;
}) {
  const [choice, setChoice] = useState<string>();
  const started = useRef(Date.now());
  return (
    <div className="retry">
      <h3>Give it another try</h3>
      <QuestionCard
        q={q}
        selected={choice}
        reveal={!!choice}
        onAnswer={(c) => {
          if (choice) return;
          setChoice(c);
          onCorrect(c, (Date.now() - started.current) / 1000);
        }}
      />
    </div>
  );
}
