import { Check, CheckCircle2, Lightbulb } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Question } from "../engine";
function DataView({ q }: { q: Question }) {
  if (!q.data) return null;
  return (
    <div className="data-view">
      <p className="eyebrow">BAYANI TRADING · ANNUAL SALES (₱ THOUSANDS)</p>
      {q.display === "table" ? (
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Sales (₱ thousands)</th>
            </tr>
          </thead>
          <tbody>
            {q.data.map((x) => (
              <tr key={x.year}>
                <td>{x.year}</td>
                <td>{x.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="chart-box">
          <table className="sr-only">
            <caption>Annual sales in thousands of pesos</caption>
            <thead>
              <tr>
                <th>Year</th>
                <th>Sales</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((x) => (
                <tr key={x.year}>
                  <td>{x.year}</td>
                  <td>{x.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={q.data}
              margin={{ left: 0, right: 10, top: 15, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="4 4"
                stroke="#cbd5e1"
              />
              <XAxis dataKey="year" tick={{ fill: "var(--muted)" }} />
              <YAxis width={48} tick={{ fill: "var(--muted)" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  borderColor: "var(--line)",
                  color: "var(--text)",
                }}
                labelStyle={{ color: "var(--text)" }}
                itemStyle={{ color: "var(--text)" }}
              />
              <Bar
                dataKey="value"
                name="Sales (₱ thousands)"
                fill="#7364eb"
                radius={[5, 5, 0, 0]}
                maxBarSize={42}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
export function QuestionCard({
  q,
  selected,
  onAnswer,
  reveal = false,
}: {
  q: Question;
  selected?: string;
  onAnswer?: (s: string) => void;
  reveal?: boolean;
}) {
  return (
    <>
      <div className="question-tags">
        <span className="pill">{q.topic}</span>
        <span className="muted">
          {q.difficulty} · {q.subtopic}
        </span>
      </div>
      <h2 className="question-text">{q.text}</h2>
      <DataView q={q} />
      <div className="answers">
        {q.choices.map((c, i) => (
          <button
            key={c}
            disabled={reveal || !onAnswer}
            aria-pressed={selected === c}
            onClick={() => onAnswer?.(c)}
            className={`answer ${selected === c ? "selected" : ""} ${reveal && c === q.answer ? "correct" : ""} ${reveal && selected === c && c !== q.answer ? "incorrect" : ""}`}
          >
            <span className="answer-letter">{"ABCD"[i]}</span>
            <span>{c}</span>
            {reveal && c === q.answer && <Check size={20} />}
          </button>
        ))}
      </div>
      {reveal && (
        <div
          className={`explanation ${selected === q.answer ? "success" : ""}`}
          role="status"
        >
          <h3>
            {selected === q.answer ? (
              <CheckCircle2 size={20} />
            ) : (
              <Lightbulb size={20} />
            )}{" "}
            {selected === q.answer
              ? "You’ve got it!"
              : "Let’s work through it."}
          </h3>
          {selected !== q.answer && (
            <p>
              {selected ? `Your answer: ${selected}. ` : "Skipped. "}Correct
              answer: <strong>{q.answer}</strong>
            </p>
          )}
          <ol>
            {q.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}
