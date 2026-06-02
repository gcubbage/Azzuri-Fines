"use client";

import { useState } from "react";

export default function Header() {
  const [logoOk, setLogoOk] = useState(true);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center gap-2.5 px-4 py-2.5">
        {logoOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/psc-logo.png"
            alt="Perth Soccer Club crest"
            className="h-9 w-9 object-contain"
            onError={() => setLogoOk(false)}
          />
        ) : (
          // Clean monogram fallback until public/psc-logo.png is added.
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-xs font-bold tracking-tight text-white">
            PSC
          </span>
        )}
        <div className="leading-tight">
          <h1 className="text-lg font-bold tracking-tight text-ink">
            Azzuri Fines
          </h1>
          <p className="text-[11px] font-medium text-brand-700">
            Perth Soccer Club
          </p>
        </div>
      </div>
    </header>
  );
}
