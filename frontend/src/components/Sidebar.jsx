import { NavLink } from "react-router-dom";
import { MessageSquare, Code2, Sparkles, BookOpen, LogOut, LogIn, User } from "lucide-react";
import DragonLogo from "./DragonLogo";
import { useAuth } from "../context/AuthContext";

const items = [
  { to: "/chat", label: "Dragon Chat", icon: MessageSquare, testid: "nav-chat" },
  { to: "/editor", label: "Code Editor", icon: Code2, testid: "nav-editor" },
  { to: "/challenges", label: "AI Challenges", icon: Sparkles, testid: "nav-challenges" },
  { to: "/lessons", label: "Lessons", icon: BookOpen, testid: "nav-lessons" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside className="hidden md:flex fixed top-0 left-0 h-screen w-64 bg-[#050505] border-r border-[#151515] flex-col z-40">
      <div className="p-5 border-b border-[#151515]">
        <DragonLogo size={44} />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon, testid }) => (
          <NavLink
            key={to}
            to={to}
            data-testid={testid}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-[#141414] text-white border border-red-600/40"
                  : "text-zinc-400 hover:text-white hover:bg-[#0f0f0f] border border-transparent"
              }`
            }
          >
            <Icon size={17} />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-[#151515]">
        {user && typeof user === "object" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-xs font-bold">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="truncate" data-testid="sidebar-user-name">{user.name}</span>
            </div>
            <button
              onClick={logout}
              data-testid="logout-btn"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-[#0f0f0f] rounded-lg transition-all"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <NavLink
              to="/login"
              data-testid="sidebar-login"
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-[#0f0f0f] rounded-lg"
            >
              <LogIn size={16} /> Sign in
            </NavLink>
            <NavLink
              to="/signup"
              data-testid="sidebar-signup"
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg"
            >
              <User size={16} /> Create account
            </NavLink>
          </div>
        )}
      </div>
    </aside>w
  );
}