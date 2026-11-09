import { useState } from 'react';
import { ArrowUpRight, Menu, Search, X } from 'lucide-react';

function Brand() {
  return (
    <a href="index.html" className="group flex min-w-0 items-center gap-2.5" aria-label="arkai — Direktori Studio Desain Surabaya">
      <img
        src="media/logo-arkai.png"
        alt="arkai"
        className="h-[26px] w-auto"
        width="104"
        height="26"
      />
      <span className="v2-mono hidden border-l border-[var(--v2-line-soft)] pl-2.5 text-[9px] font-medium leading-none tracking-[0.13em] text-[var(--v2-muted)] sm:inline">
        STUDIO DESAIN SURABAYA
      </span>
    </a>
  );
}

export function V2Header({ active, search, onSearchChange, searchPlaceholder = 'Cari nama studio…' }) {
  const [open, setOpen] = useState(false);
  const links = [
    { key: 'map', label: 'JELAJAHI', href: 'jelajahi.html' },
    { key: 'about', label: 'TENTANG', href: 'index.html' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--v2-line)] bg-[var(--v2-paper)]">
      <div className="mx-auto flex h-[68px] w-full max-w-[1440px] items-center gap-4 px-4 sm:px-6">
        <Brand />

        {search !== undefined ? (
          <label className="relative ml-auto hidden w-full max-w-[440px] items-center md:flex">
            <Search className="pointer-events-none absolute left-3 h-4 w-4" strokeWidth={1.8} />
            <input
              value={search}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={searchPlaceholder}
              className="v2-input h-[38px] pl-9 pr-3 text-[13px]"
              style={{ paddingLeft: 36 }}
              aria-label="Cari studio"
            />
          </label>
        ) : (
          <div className="ml-auto" />
        )}

        <nav className="ml-auto hidden items-center gap-5 lg:flex" aria-label="Navigasi utama">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className={`v2-mono relative py-2 text-[10px] font-semibold tracking-[0.12em] ${
                active === link.key ? 'text-[var(--v2-ink)]' : 'text-[var(--v2-muted)] hover:text-[var(--v2-ink)]'
              }`}
            >
              {link.label}
              {active === link.key ? (
                <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-[var(--v2-ink)]" />
              ) : null}
            </a>
          ))}
          <a href="daftar.html" className="v2-btn h-[40px] px-4 text-[10px]">
            DAFTARKAN STUDIO <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </nav>

        <button
          type="button"
          className="ml-auto grid h-9 w-9 place-items-center border border-[var(--v2-line)] lg:hidden"
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[var(--v2-line)] bg-[var(--v2-paper-soft)] px-4 py-4 lg:hidden">
          {search !== undefined ? (
            <label className="relative mb-4 flex items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4" strokeWidth={1.8} />
              <input
                value={search}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder={searchPlaceholder}
                className="v2-input h-[40px] pl-9 text-[13px]"
                style={{ paddingLeft: 36 }}
                aria-label="Cari studio"
              />
            </label>
          ) : null}
          <nav className="grid gap-2" aria-label="Navigasi seluler">
            {[...links, { key: 'register', label: 'DAFTARKAN STUDIO', href: 'daftar.html' }].map((link) => (
              <a
                key={link.key}
                href={link.href}
                className={`v2-mono flex items-center justify-between border border-[var(--v2-line)] px-3 py-3 text-[11px] font-semibold tracking-[0.1em] ${
                  active === link.key ? 'bg-[var(--v2-ink)] text-[var(--v2-paper)]' : 'bg-[var(--v2-paper)]'
                }`}
              >
                {link.label} <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function V2Footer({ content }) {
  const footer = content?.v2?.about || {};
  return (
    <footer className="mt-auto border-t border-[var(--v2-line)] bg-[var(--v2-paper)]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="v2-mono text-[9px] tracking-[0.08em] text-[var(--v2-muted)]">
          {footer.footerLeft || 'Direktori Studio Desain Surabaya · Arsip 2026–2027'}
        </p>
        <p className="v2-mono text-[9px] tracking-[0.08em] text-[var(--v2-muted)]">
          {footer.footerRight || 'Data dikelola oleh [NAMA PENGELOLA DATA]'}
        </p>
      </div>
    </footer>
  );
}
