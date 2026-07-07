import Sidebar from "./Sidebar";
import DragonLogo from "./DragonLogo";
import { NavLink } from "react-router-dom";
import { MessageSquare, Code2, Sparkles, BookOpen } from "lucide-react";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar />
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-black/95 border-b border-[#151515] px-4 py-3 flex items-center justify-between backdrop-blur">
        <DragonLogo size={36} />
        <div className="flex gap-1">
          <MobileTab to="/chat" icon={MessageSquare} testid="m-nav-chat" />
          <MobileTab to="/editor" icon={Code2} testid="m-nav-editor" />
          <MobileTab to="/challenges" icon={Sparkles} testid="m-nav-challenges" />
          <MobileTab to="/lessons" icon={BookOpen} testid="m-nav-lessons" />
        </div>
      </div>
      <main className="md:pl-64 pt-16 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}

function MobileTab({ to, icon: Icon, testid }) {
  return (
    <NavLink
      to={to}
      data-testid={testid}
      className={({ isActive }) =>
        `p-2 rounded-md ${isActive ? "text-red-500 bg-[#141414]" : "text-zinc-400"}`
      }
    >
      <Icon size={18} />
    </NavLink>
  );
}