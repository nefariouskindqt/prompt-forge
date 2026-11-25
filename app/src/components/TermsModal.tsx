import { X } from 'lucide-react';
import { useEffect } from 'react';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

export function TermsModal({ open, onClose }: TermsModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tos-modal-title"
      >
        <div className="modal-header">
          <h2 id="tos-modal-title" className="modal-title">
            Terms of Service and Privacy
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close Terms of Service"
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="tos-list">
          <section className="tos-item">
            <h3 className="tos-heading">1. Ownership and rights</h3>
            <p className="tos-body">
              Prompt Forge is © 2026 JRB. All rights reserved. You keep full ownership and rights to
              every goal, input, and prompt you create using this tool.
            </p>
          </section>

          <section className="tos-item">
            <h3 className="tos-heading">2. Zero APIs, zero tracking, zero data collection</h3>
            <p className="tos-body">
              Prompt Forge runs 100% locally in your browser with a strict Content Security Policy
              (connect-src none). It uses no external APIs, requires no API keys or accounts, sets
              no tracking cookies, collects no analytics, and never accesses your location or
              personal data. Only your light/dark theme choice is stored locally in your browser.
            </p>
          </section>

          <section className="tos-item">
            <h3 className="tos-heading">3. Acceptable use and warranty</h3>
            <p className="tos-body">
              This tool is provided as is, without warranty of any kind. You are solely responsible
              for reviewing generated prompts and verifying any code, security advice, or third-party
              sources produced by external AI systems. Do not use this tool for unlawful or harmful
              activities.
            </p>
          </section>

          <section className="tos-item">
            <h3 className="tos-heading">4. Trademarks</h3>
            <p className="tos-body">
              Claude (Anthropic), Gemini (Google), and GPT / OpenAI are trademarks of their
              respective owners. Prompt Forge is an independent project by JRB and is not affiliated
              with or endorsed by those companies.
            </p>
          </section>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-sm btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
