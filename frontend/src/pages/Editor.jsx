import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Play, RotateCcw } from "lucide-react";

const DEFAULT_HTML = `<!-- Dragon Ask Playground -->
<div class="card">
  <h1>Hello, Dragon 🐉</h1>
  <p>Edit HTML, CSS, and JS on the left. See magic on the right.</p>
  <button id="btn">Roar</button>
</div>`;

const DEFAULT_CSS = `body {
  font-family: system-ui, sans-serif;
  background: #0A0A0A;
  color: #fff;
  display: grid;
  place-items: center;
  min-height: 100vh;
  margin: 0;
}
.card {
  border: 1px solid #27272A;
  padding: 32px;
  border-radius: 16px;
  background: #141414;
  text-align: center;
}
h1 { color: #DC2626; }
button {
  background: #DC2626;
  color: white;
  border: 0;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
}
button:hover { background: #B91C1C; }`;

const DEFAULT_JS = `document.getElementById('btn').addEventListener('click', () => {
  alert('🔥 ROAR!');
});`;

export default function Editor() {
  const [html, setHtml] = useState(() => localStorage.getItem("dragon_html") ?? DEFAULT_HTML);
  const [css, setCss] = useState(() => localStorage.getItem("dragon_css") ?? DEFAULT_CSS);
  const [js, setJs] = useState(() => localStorage.getItem("dragon_js") ?? DEFAULT_JS);
  const [srcDoc, setSrcDoc] = useState("");
  const [autoRun, setAutoRun] = useState(true);

  const compile = (h, c, j) => `<!DOCTYPE html><html><head><style>${c}</style></head><body>${h}<script>try{${j}}catch(e){document.body.innerHTML+='<pre style="color:#f87171;background:#0A0A0A;padding:8px;border:1px solid #27272A">'+e.message+'</pre>'}</script></body></html>`;

  useEffect(() => {
    localStorage.setItem("dragon_html", html);
    localStorage.setItem("dragon_css", css);
    localStorage.setItem("dragon_js", js);
    if (!autoRun) return;
    const t = setTimeout(() => setSrcDoc(compile(html, css, js)), 400);
    return () => clearTimeout(t);
  }, [html, css, js, autoRun]);

  const run = () => setSrcDoc(compile(html, css, js));
  const reset = () => { setHtml(DEFAULT_HTML); setCss(DEFAULT_CSS); setJs(DEFAULT_JS); };

  return (
    <Layout>
      <div className="h-[calc(100vh-0px)] md:h-screen flex flex-col">
        <div className="border-b border-[#151515] px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-lg font-semibold tracking-tighter">Live Editor</h1>
            <p className="text-xs text-zinc-500">HTML · CSS · JS with instant preview</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} data-testid="editor-autorun" />
              Auto-run
            </label>
            <button onClick={reset} data-testid="editor-reset" className="text-xs px-3 py-1.5 rounded border border-[#27272A] hover:border-red-600 flex items-center gap-1.5">
              <RotateCcw size={12}/> Reset
            </button>
            <button onClick={run} data-testid="editor-run" className="text-xs px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 flex items-center gap-1.5">
              <Play size={12}/> Run
            </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
          <div className="grid grid-rows-3 border-b lg:border-b-0 lg:border-r border-[#151515] min-h-[60vh] lg:min-h-0">
            <Pane label="HTML" color="#DC2626" value={html} onChange={setHtml} testid="editor-html" />
            <Pane label="CSS"  color="#EA580C" value={css}  onChange={setCss}  testid="editor-css" />
            <Pane label="JS"   color="#FCD34D" value={js}   onChange={setJs}   testid="editor-js" />
          </div>
          <div className="bg-white min-h-[50vh] lg:min-h-0">
            <iframe
              title="preview"
              srcDoc={srcDoc}
              sandbox="allow-scripts allow-modals"
              className="w-full h-full border-0"
              data-testid="editor-preview"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Pane({ label, color, value, onChange, testid }) {
  return (
    <div className="flex flex-col border-b border-[#151515] last:border-b-0 min-h-0">
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium flex items-center gap-2 border-b border-[#151515] bg-[#050505]">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        <span style={{ color }}>{label}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        data-testid={testid}
        className="flex-1 w-full bg-[#0A0A0A] text-zinc-200 font-code text-sm p-3 outline-none resize-none leading-relaxed"
      />
    </div>
  );
}