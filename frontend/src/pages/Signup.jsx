import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../lib/api";
import DragonLogo from "../components/DragonLogo";
import { toast } from "sonner";

export default function Signup() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await register(email, password, name);
      toast.success("Welcome to Dragon Ask!");
      nav("/chat");
    } catch (e) {
      setErr(formatApiError(e));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-black">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><DragonLogo size={56} /></div>
        <div className="tracing-beam p-8">
          <h1 className="font-heading text-3xl font-bold mb-1 tracking-tighter">Create your lair</h1>
          <p className="text-sm text-zinc-500 mb-6">Join Dragon Ask to save your progress.</p>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Name" type="text" value={name} onChange={setName} testid="signup-name" />
            <Field label="Email" type="email" value={email} onChange={setEmail} testid="signup-email" />
            <Field label="Password" type="password" value={password} onChange={setPassword} testid="signup-password" />
            {err && <div data-testid="signup-error" className="text-sm text-red-400 bg-red-950/30 border border-red-900/40 p-2 rounded">{err}</div>}
            <button
              type="submit"
              disabled={loading}
              data-testid="signup-submit"
              className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium transition-all"
            >
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>
          <p className="text-sm text-zinc-500 mt-6 text-center">
            Have an account?{" "}
            <Link to="/login" data-testid="signup-to-login" className="text-red-400 hover:text-red-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, testid }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-zinc-500 mb-1.5 block">{label}</span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testid}
        className="w-full bg-[#0A0A0A] border border-[#27272A] focus:border-red-600 rounded-lg px-4 py-2.5 text-white outline-none transition-colors"
      />
    </label>
  );
}