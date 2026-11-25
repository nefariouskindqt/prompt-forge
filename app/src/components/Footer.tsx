import { ExternalLink, FileText } from 'lucide-react';

interface FooterProps {
  onOpenTerms: () => void;
}

export function Footer({ onOpenTerms }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-copy">
          <span>© 2026 JRB. All rights reserved.</span>
        </div>

        <nav className="footer-links" aria-label="Legal and links">
          <a
            className="footer-link"
            href="https://github.com/nefariouskindqt"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>GitHub (@nefariouskindqt)</span>
            <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
          </a>

          <a
            className="footer-link"
            href="https://github.com/nefariouskindqt/prompt-forge"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Source</span>
            <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
          </a>

          <button type="button" className="footer-link" onClick={onOpenTerms}>
            <FileText size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>Terms of Service</span>
          </button>
        </nav>
      </div>
    </footer>
  );
}
