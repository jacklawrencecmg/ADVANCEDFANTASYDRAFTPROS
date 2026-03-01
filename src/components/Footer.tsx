import { Facebook, Instagram } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: 'home' | 'faq' | 'help' | 'contact') => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-fdp-border-1/60 bg-fdp-bg-0 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Branding */}
          <div className="flex items-center gap-2.5">
            <img
              src="/FDP2.png"
              alt="Fantasy Draft Pros"
              className="h-6 w-auto object-contain opacity-70"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-xs text-fdp-text-3">
              © {currentYear} Fantasy Draft Pros · All rights reserved
            </span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-0.5 flex-wrap justify-center">
            {(['contact', 'faq', 'help'] as const).map((page) => (
              <button
                key={page}
                onClick={() => onNavigate?.(page)}
                className="px-3 py-1.5 text-xs text-fdp-text-3 hover:text-fdp-accent-2 transition-colors rounded-lg hover:bg-fdp-surface-2 capitalize"
              >
                {page === 'faq' ? 'FAQ' : page.charAt(0).toUpperCase() + page.slice(1)}
              </button>
            ))}
          </div>

          {/* Socials */}
          <div className="flex items-center gap-1">
            <a
              href="https://www.facebook.com/FantasyDraftPros"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-fdp-text-3 hover:text-fdp-accent-2 transition-colors rounded-lg hover:bg-fdp-surface-2"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://www.instagram.com/fantasydraftpros"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-fdp-text-3 hover:text-fdp-accent-2 transition-colors rounded-lg hover:bg-fdp-surface-2"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.tiktok.com/@fantasydraftpros"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-fdp-text-3 hover:text-fdp-accent-2 transition-colors rounded-lg hover:bg-fdp-surface-2"
              aria-label="TikTok"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Fine print */}
        <p className="mt-4 text-center text-xs text-fdp-text-3/50">
          Player values powered by Fantasy Draft Pros. Not affiliated with Sleeper, ESPN, or Yahoo. For entertainment only.
        </p>
      </div>
    </footer>
  );
}
