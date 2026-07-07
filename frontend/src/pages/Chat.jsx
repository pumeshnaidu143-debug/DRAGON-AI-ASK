import { useState, useRef, useEffect } from "react";
import Layout from "../components/Layout";
import Markdown from "../components/Markdown";
import { Send, Sparkles, Flame } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API } from "../lib/api";
import { Link } from "react-router-dom";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function Chat() {
  const { user } = useAuth();
  const [sessionId] = useState(() => uid());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streaming]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    if (!user || typeof user !== "object") {
      setMessages((m) => [...m, { role: "assistant", content: "Please **sign in** to chat with Dragon AI.", id: uid() }]);
      return;
    }
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg, id: uid() }]);
    const aiId = uid();
    setMessages((m) => [...m, { role: "assistant", content: "", id: aiId }]);
    setStreaming(true);

    try {
      const token = localStorage.getItem("dragon_token");
      const res = await fetch(`${API}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ session_id: sessionId, message: msg }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const p of parts) {
          const line = p.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const data = JSON.parse(line.slice(5).trim());
            if (data.delta) {
              setMessages((prev) => prev.map((m) => m.id === aiId ? { ...m, content: m.content + data.delta } : m));
            } else if (data.error) {
              setMessages((prev) => prev.map((m) => m.id === aiId ? { ...m, content: `⚠️ ${data.error}` } : m));
            }
          } catch {}
        }
      }
    } catch (e) {
      setMessages((prev) => prev.map((m) => m.id === aiId ? { ...m, content: `⚠️ ${e.message}` } : m));
    } finally {
      setStreaming(false);
    }
  };

  const suggestions = [
    "Explain CSS flexbox with a simple example",
    "Give me a beginner JavaScript task about arrays",
    "How does event bubbling work in JS?",
    "Build a responsive navbar in HTML & CSS",
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 pb-40 pt-8 min-h-screen">
        {messages.length === 0 && (
          <div className="text-center mt-16 fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/30 border border-red-900/40 text-xs text-red-400 uppercase tracking-widest mb-6">
              <Flame size={12}/> Dragon AI · Gemini 3
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tighter mb-4">
              Hello{user?.name ? `, ${user.name}` : ""}. Ready to breathe some code?
            </h1>
            <p className="text-zinc-500 mb-10">Ask anything about HTML, CSS, or JavaScript.</p>

            {!user || typeof user !== "object" ? (
              <div className="max-w-md mx-auto p-5 rounded-xl border border-red-900/40 bg-red-950/10 text-sm text-zinc-300">
                Please <Link to="/login" className="text-red-400 underline">sign in</Link> or{" "}
                <Link to="/signup" className="text-red-400 underline">create an account</Link> to chat.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    data-testid={`chat-suggestion-${i}`}
                    className="text-left p-4 border border-[#151515] bg-[#0A0A0A] rounded-xl hover:border-red-600/40 hover:-translate-y-0.5 transition-all"
                  >
                    <Sparkles size={14} className="text-red-500 mb-2" />
                    <div className="text-sm text-zinc-300">{s}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} content={m.content} />
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <div className="fixed bottom-0 md:left-64 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent pt-6 pb-5 px-4">
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="tracing-beam max-w-3xl mx-auto flex items-center gap-2 pl-5 pr-2 py-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={streaming}
            placeholder="Ask Dragon AI anything about HTML, CSS, JS..."
            data-testid="chat-input"
            className="flex-1 bg-transparent outline-none text-white placeholder-zinc-600 py-3"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            data-testid="chat-send"
            className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-40 flex items-center justify-center transition-all"
          >
            <Send size={16} />
          </button>
        </form>
        <div className="text-center text-[10px] uppercase tracking-widest text-zinc-700 mt-2">Dragon AI can make mistakes. Verify code before using.</div>
      </div>
    </Layout>
  );
}

function MessageBubble({ role, content }) {
  if (role === "user") {
    return (
      <div className="flex justify-end fade-up">
        <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-[#141414] border border-[#1f1f1f] text-white">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 fade-up">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center shrink-0">
        <Flame size={14} />
      </div>
      <div className="flex-1 min-w-0">
        {content ? <Markdown text={content} /> : <div className="text-zinc-500 text-sm animate-pulse">Dragon is thinking...</div>}
      </div>
    </div>
  );
}