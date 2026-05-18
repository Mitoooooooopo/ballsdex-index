import { useState } from 'react';
import type { Cog } from '../types';

function buildInstallSnippet(cog: Cog): string {
  const name = cog.name ?? cog.id;
  const branch = cog.branch ? `#${cog.branch}` : '';
  const location = cog.install_url ?? `git+${cog.repo}.git${branch}`;
  return `[[ballsdex.packages]]\nlocation = "${location}"\npath = "${name}"\nenabled = true`;
}

function getLicenseText(license: Cog['license']): string {
  if (!license) return '';
  if (typeof license === 'string') return license;
  return license.text ?? '';
}

function getAuthorNames(authors: Cog['authors']): string[] {
  if (!authors) return [];
  return authors
    .map(a => (typeof a === 'string' ? a : a.name))
    .filter(Boolean) as string[];
}

// ── URL categorisation ───────────────────────────────────────────────────────

type UrlKind = 'wiki' | 'changelog' | 'funding';

const URL_MATCHERS: { kind: UrlKind; pattern: RegExp }[] = [
  { kind: 'wiki',      pattern: /wiki|doc|documentation|guide|manual/i },
  { kind: 'changelog', pattern: /patch.?note|changelog|change.?log|release|history/i },
  { kind: 'funding',   pattern: /fund|sponsor|donate|donation|patreon|ko.?fi|open.?collective/i },
];

function categoriseUrls(urls: Record<string, string>): Partial<Record<UrlKind, string>> {
  const result: Partial<Record<UrlKind, string>> = {};
  for (const [key, href] of Object.entries(urls)) {
    for (const { kind, pattern } of URL_MATCHERS) {
      if (!result[kind] && pattern.test(key)) {
        result[kind] = href;
      }
    }
  }
  return result;
}

// ── Icons ────────────────────────────────────────────────────────────────────

function IconLink({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="shrink-0 text-zinc-500 transition-colors hover:text-white group-hover:text-zinc-300"
    >
      {children}
    </a>
  );
}

function WikiIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ChangelogIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function FundingIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function RepoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

export function PackageCard({ cog }: { cog: Cog }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const snippet = buildInstallSnippet(cog);
  const authors = getAuthorNames(cog.authors);
  const license = getLicenseText(cog.license);
  const extraUrls = categoriseUrls(cog.urls ?? {});

  function handleCopy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <article className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-zinc-800 bg-[#1a1a1a] p-5 shadow-md transition-all duration-200 hover:border-zinc-600 hover:bg-[#1f1f1f] hover:shadow-xl">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-500 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white">
            {cog.name ?? cog.id}
          </h3>
          {cog.version && (
            <span className="mt-0.5 inline-block rounded-full border border-emerald-800/60 bg-emerald-950/60 px-2 font-mono text-xs text-emerald-400">
              v{cog.version}
            </span>
          )}
        </div>

        {/* Icon links */}
        <div className="mt-0.5 flex items-center gap-2">
          {extraUrls.wiki && (
            <IconLink href={extraUrls.wiki} title="Documentation / Wiki">
              <WikiIcon />
            </IconLink>
          )}
          {extraUrls.changelog && (
            <IconLink href={extraUrls.changelog} title="Patch notes / Changelog">
              <ChangelogIcon />
            </IconLink>
          )}
          {extraUrls.funding && (
            <IconLink href={extraUrls.funding} title="Support / Funding">
              <FundingIcon />
            </IconLink>
          )}
          {cog.repo && (
            <IconLink href={cog.repo} title="View repository">
              <RepoIcon />
            </IconLink>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="flex-1 text-sm leading-relaxed text-zinc-400">
        {cog.description ?? 'No description provided.'}
      </p>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        {authors.length > 0 && <span>{authors.join(', ')}</span>}
        {license && (
          <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-zinc-400">
            {license}
          </span>
        )}
      </div>

      {/* Install */}
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Installation
        </button>

        {open && (
          <div className="relative mt-2">
            <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-[#0d0d0d] px-4 py-3 font-mono text-xs leading-relaxed text-zinc-300">
              {snippet}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute right-2 top-2 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
