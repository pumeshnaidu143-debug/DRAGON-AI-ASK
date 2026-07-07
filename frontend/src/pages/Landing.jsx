import { Link } from "react-router-dom";
import { Sparkles, Code2, MessageSquare, BookOpen, ArrowRight, Flame } from "lucide-react";
import Layout from "../components/Layout";

export default function Landing() {
  return (
    <Layout>
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1557951959-e3e30ee937e5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZmlyZSUyMHNwYXJrc3xlbnwwfHx8fDE3ODMzMjk1NzN8MA&ixlib=rb-4.1.0&q=85')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-28">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-900/50 bg-red-950/20 text-xs uppercase tracking-widest text-red-400 mb-8">
            <Flame size={12} /> Powered by Dragon AI
          </div>

          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold leading-none tracking-tighter mb-6">
            Learn <span className="text-red-600">HTML</span>,{" "}
            <span className="text-orange-500">CSS</span> &{" "}
            <span className="text-red-500">JavaScript</span>
            <br />with your AI mentor.
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed mb-10">
            Dragon Ask gives you infinite AI-generated challenges, a live code
            editor, curated lessons, and a personal Dragon AI tutor —
            all in one dark, focused workspace.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/chat"
              data-testid="hero-start-chat"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all dragon-glow"
            >
              Ask Dragon AI
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/editor"
              data-testid="hero-open-editor"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-[#27272A] hover:border-red-600 text-white font-medium transition-all"
            >
              Try the code editor
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-10">
          Everything you need to master the web.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard
            icon={MessageSquare}
            title="Dragon AI Chat"
            desc="Ask any HTML, CSS, or JS question. Get instant markdown answers with runnable code."
            testid="feature-chat"
          />
          <FeatureCard
            icon={Sparkles}
            title="AI Challenges"
            desc="Generate infinite tasks by difficulty — beginner, intermediate, advanced."
            testid="feature-challenges"
          />
          <FeatureCard
            icon={Code2}
            title="Live Code Editor"
            desc="Write HTML, CSS, and JS side-by-side with instant live preview."
            testid="feature-editor"
          />
          <FeatureCard
            icon={BookOpen}
            title="Lesson Library"
            desc="Curated bite-sized lessons from selectors to fetch — with copy-ready code."
            testid="feature-lessons"
          />
        </div>
      </section>
    </Layout>
  );
}

function FeatureCard({ icon: Icon, title, desc, testid }) {
  return (
    <div
      data-testid={testid}
      className="group p-6 rounded-xl border border-[#151515] bg-[#0A0A0A] hover:border-red-600/40 hover:-translate-y-1 transition-all"
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center mb-4">
        <Icon size={20} className="text-white" />
      </div>
      <h3 className="font-heading text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  );
}