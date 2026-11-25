import { Moon, ShieldCheck, Sun } from 'lucide-react';
import type { Target } from '../engine';

const TARGETS: { id: Target; label: string; title: string }[] = [
  { id: 'antigravity', label: 'Antigravity', title: 'Antigravity with installed skills, MCP servers, and tools' },
  { id: 'ide', label: 'IDE', title: 'Coding IDE or CLI (Cursor, Claude Code, Codex, Windsurf)' },
  { id: 'chat', label: 'Chat', title: 'Web chat (Claude.ai, ChatGPT, Gemini web)' },
  { id: 'api', label: 'API', title: 'Reusable system prompt for apps, agents, or API calls' },
];

interface TopBarProps {
  target: Target;
  onTargetChange: (target: Target) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function TopBar({ target, onTargetChange, theme, onToggleTheme }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 128 128" fill="none" aria-hidden="true">
            <rect
              x="10"
              y="10"
              width="108"
              height="108"
              rx="24"
              fill="#18181B"
              stroke="var(--accent)"
              strokeWidth="6"
            />
            <path
              d="M38 44L58 64L38 84"
              stroke="#F4F4F5"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M66 84H90" stroke="var(--accent)" strokeWidth="9" strokeLinecap="round" />
          </svg>
          <span className="brand-name">
            Prompt <span className="brand-accent">Forge</span>
          </span>
          <span className="brand-sep" aria-hidden="true">
            /
          </span>
          <span className="brand-note">Offline prompt compiler for Claude, Gemini, and GPT</span>
        </div>

        <div className="topbar-controls">
          <div className="segmented topbar-targets" role="group" aria-label="Target workspace">
            {TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                className="seg-btn"
                title={t.title}
                aria-pressed={target === t.id}
                onClick={() => onTargetChange(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="topbar-utility">
            <span
              className="offline-pill"
              title="100% client-side. Zero external APIs, tracking, or data collection."
            >
              <ShieldCheck size={14} strokeWidth={1.5} aria-hidden="true" />
              <span>Offline</span>
            </span>

            <button
              type="button"
              className="btn btn-sm btn-icon"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? (
                <Sun size={16} strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Moon size={16} strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
