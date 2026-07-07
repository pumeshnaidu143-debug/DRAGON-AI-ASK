import { useState } from "react";
import Layout from "../components/Layout";
import api, { formatApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { Sparkles, Loader2, ChevronRight, Lightbulb } from "lucide-react";
import { toast } from "sonner";

const DIFFS = ["beginner", "intermediate", "advanced"];
const TECHS = ["html", "css", "js"];

export default function Challenges() {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState("beginner");
  const [tech, setTech] = useState("html");
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const generate = async () => {
    if (!user || typeof user !== "object") { setErr("Please sign in to generate challenges."); return; }
    setLoading(true); setErr(""); setTask(null);
    try {
      const { data } = await api.post("/tasks/generate", { difficulty, tech });
      setTask(data);
    } catch (e) {
      setErr(formatApiError(e));
    } finally { setLoading(false); }
  };

  const save = async () => {
    try {
      await api.post("/tasks/save", {
        title: task.title,
        difficulty: task.difficulty,
        tech: task.tech,
        description: task.description,
        starter_code: task.starter_code || "",
      });
      toast.success("Saved to your dragon vault");
    } catch (e) { toast.error(formatApiError(e)); }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-900/40 bg-red-950/20 text-[10px] uppercase tracking-widest text-red-400 mb-4">
            <Sparkles size={12}/> AI Generated
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tighter mb-2">Challenges</h1>
          <p className="text-zinc-500">Generate infinite HTML, CSS & JavaScript tasks with Dragon AI.</p>
        </div>

        <div className="p-6 rounded-2xl border border-[#151515] bg-[#0A0A0A] mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectGroup label="Technology" value={tech} setValue={setTech} options={TECHS} testidPrefix="tech" />
            <SelectGroup label="Difficulty" value={difficulty} setValue={setDifficulty} options={DIFFS} testidPrefix="diff" />
            <button
              onClick={generate}
              disabled={loading}
              data-testid="generate-task-btn"
              className="mt-6 md:mt-6 py-3 px-5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium transition-all flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin"/>Generating...</> : <><Sparkles size={16}/>Generate Task</>}
            </button>
          </div>
        </div>

        {err && <div data-testid="challenges-error" className="text-sm text-red-400 bg-red-950/30 border border-red-900/40 p-3 rounded mb-4">{err}</div>}

        {task && (
          <div className="p-6 rounded-2xl border border-red-900/40 bg-[#0A0A0A] fade-up" data-testid="task-card">
            <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px] uppercase tracking-widest">
              <span className="px-2 py-1 rounded bg-red-950/40 text-red-400 border border-red-900/40">{task.tech}</span>
              <span className="px-2 py-1 rounded bg-orange-950/40 text-orange-400 border border-orange-900/40">{task.difficulty}</span>
            </div>
            <h2 className="font-heading text-2xl font-bold mb-3 tracking-tight" data-testid="task-title">{task.title}</h2>
            <p className="text-zinc-300 leading-relaxed mb-5 whitespace-pre-line">{task.description}</p>
            {task.starter_code && (
              <div className="mb-5">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Starter code</div>
                <pre className="bg-[#050505] border border-[#1f1f1f] rounded-lg p-4 overflow-x-auto text-sm font-code text-zinc-200">{task.starter_code}</pre>
              </div>
            )}
            {Array.isArray(task.hints) && task.hints.length > 0 && (
              <div className="mb-5">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5"><Lightbulb size={12}/> Hints</div>
                <ul className="space-y-1.5">
                  {task.hints.map((h, i) => (
                    <li key={i} className="text-sm text-zinc-400 flex gap-2"><ChevronRight size={14} className="text-red-500 mt-0.5 shrink-0"/><span>{h}</span></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={save} data-testid="save-task-btn" className="px-4 py-2 rounded-lg border border-[#27272A] hover:border-red-600 text-white text-sm">Save challenge</button>
              <Link to="/editor" data-testid="open-editor-btn" className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm">Open editor</Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function SelectGroup({ label, value, setValue, options, testidPrefix }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => setValue(o)}
            data-testid={`${testidPrefix}-${o}`}
            className={`px-3 py-2 rounded-lg text-sm capitalize border transition-all ${
              value === o
                ? "bg-red-600 border-red-600 text-white"
                : "bg-[#050505] border-[#27272A] text-zinc-300 hover:border-red-600/50"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}