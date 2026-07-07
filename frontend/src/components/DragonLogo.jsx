import { Link } from "react-router-dom";

export default function DragonLogo({ size = 40, showText = true }) {
  return (
    <Link
      to="/"
      data-testid="home-dragon-logo"
      className="flex items-center gap-3 group"
    >
      <div
        className="relative overflow-hidden rounded-lg border border-[#27272A] group-hover:border-red-600 transition-colors"
        style={{ width: size, height: size }}
      >
        <img
          src="https://images.unsplash.com/photo-1601987077677-5346c0c57d3f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwxfHxkcmFnb24lMjBpY29ufGVufDB8fHx8MTc4MzMyOTU4N3ww&ixlib=rb-4.1.0&q=85"
          alt="Dragon"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-red-900/40 to-transparent" />
      </div>
      {showText && (
        <div className="leading-none">
          <div className="font-heading text-[15px] font-bold tracking-tight text-white">Dragon Ask</div>
          <div className="text-[10px] uppercase tracking-widest text-red-500">Dragon AI</div>
        </div>
      )}
    </Link>
  );
}