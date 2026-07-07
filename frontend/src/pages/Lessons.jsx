import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../lib/api";
import Markdown from "../components/Markdown";
import { BookOpen, X } from "lucide-react";

const TECH_META = {
  html: { color: "#DC2626", label: "HTML" },
  css:  { color: "#EA580C", label: "CSS" },
  js:   { color: "#FCD34D", label: "JS" },
};

export default function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/lessons").then((r) => setLessons(r.data)).catch(() => setLessons([]));
  }, []);

  const filtered = lessons.filter((l) => filter === "all" || l.tech === filter);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-900/40 bg-red-950/20 text-[10px] uppercase tracking-widest text-red-400 mb-4">
            <BookOpen size={12}/> Curated lessons
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tighter mb-2">Lesson Library</h1>
          <p className="text-zinc-500">Hand-picked bite-sized tutorials for HTML, CSS, and JavaScript.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {["all", "html", "css", "js"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              data-testid={`lesson-filter-${t}`}
              className={`px-3 py-1.5 rounded-lg text-sm uppercase tracking-wider border transition-all ${
                filter === t
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-[#050505] border-[#27272A] text-zinc-400 hover:border-red-600/50"
              }`}
            >{t}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => {
            const meta = TECH_META[l.tech] || TECH_META.html;
            return (
              <button
                key={l.id}
                onClick={() => setActive(l)}
                data-testid={`lesson-card-${l.id}`}
                className="text-left p-5 rounded-xl border border-[#151515] bg-[#0A0A0A] hover:border-red-600/40 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full" style={{background: meta.color}} />
                  <span style={{color: meta.color}}>{meta.label}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-500">{l.level}</span>
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2 tracking-tight">{l.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{l.summary}</p>
              </button>
            );
          })}
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setActive(null)}>
          <div
            className="bg-[#0A0A0A] border border-[#27272A] rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            data-testid="lesson-modal"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#151515]">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-red-500">{TECH_META[active.tech]?.label} · {active.level}</div>
                <h2 className="font-heading text-xl font-bold tracking-tight">{active.title}</h2>
              </div>
              <button onClick={() => setActive(null)} data-testid="lesson-modal-close" className="p-2 rounded-lg hover:bg-[#141414]">
                <X size={18}/>
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <Markdown text={active.content} />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}