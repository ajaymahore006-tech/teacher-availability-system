// PLACE AT: src/components/AuthShell.jsx  (NEW FILE)

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// color: "sky" | "rust" — determines the accent panel color
const COLOR_MAP = {
  sky: { bg: "#6BCFE0", text: "#0E1B1E", subtext: "#0E1B1E99" },
  rust: { bg: "#A05341", text: "#FFFFFF", subtext: "#FFFFFFCC" },
};

const AuthShell = ({ color = "sky", eyebrow, title, subtitle, backTo = "/", backLabel = "Back to Gateway", children }) => {
  const navigate = useNavigate();
  const c = COLOR_MAP[color];

  return (
    <div className="min-h-screen bg-[#F9FFFD] text-[#0E1B1E] md:grid md:grid-cols-2">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
        .font-display { font-family: 'Archivo Black', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'Space Mono', monospace; }
      `}</style>

      {/* LEFT / TOP — color panel */}
      <div
        className="flex flex-col justify-between px-6 sm:px-10 py-8 md:py-12 md:min-h-screen"
        style={{ backgroundColor: c.bg, color: c.text }}
      >
        <button
          onClick={() => navigate(backTo)}
          className="flex items-center gap-2 font-mono text-xs tracking-widest opacity-80 hover:opacity-100 transition-opacity w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel.toUpperCase()}
        </button>

        <div className="mt-10 md:mt-0">
          {eyebrow && (
            <p className="font-mono text-xs tracking-widest mb-4" style={{ color: c.subtext }}>
              {eyebrow}
            </p>
          )}
          <h1 className="font-display uppercase text-[11vw] sm:text-[5vw] md:text-[3.2vw] leading-[0.95] mb-4">
            {title}
          </h1>
          {subtitle && (
            <p className="font-body text-sm sm:text-base max-w-sm" style={{ color: c.subtext }}>
              {subtitle}
            </p>
          )}
        </div>

        <div className="hidden md:block h-4" />
      </div>

      {/* RIGHT / BOTTOM — form panel */}
      <div className="flex items-center justify-center px-6 sm:px-10 py-12 md:py-0 border-t md:border-t-0 md:border-l border-[#0E1B1E]/10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
};

export default AuthShell;