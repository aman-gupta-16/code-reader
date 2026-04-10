import { useEffect, useMemo, useRef } from 'react';
import Prism from 'prismjs';

const PRISM_LANGUAGE_MAP = {
  javascript: 'javascript',
  json: 'json',
  css: 'css',
  html: 'markup',
  yaml: 'yaml',
  markdown: 'markdown',
  java: 'java',
  ruby: 'ruby',
  bash: 'bash',
  swift: 'swift',
  properties: 'properties',
};

export default function CodeViewer({ file, isLoading, loadError }) {
  const codeRef = useRef(null);
  const prismLanguage = PRISM_LANGUAGE_MAP[file.language] ?? 'javascript';
  const codeContent = file.content ?? '';
  const lineCount = useMemo(() => codeContent.split('\n').length, [codeContent]);
  const shouldFade = lineCount > 90;

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [file]);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Current file</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">
            {file.name}
          </h2>
          <p className="mt-1 truncate text-xs text-slate-500">{file.path}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium uppercase tracking-[0.24em] text-slate-200">
            {file.language}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {lineCount} lines
          </span>
          {file.isTruncated ? (
            <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-amber-100">preview truncated</span>
          ) : null}
        </div>
      </div>

      <div className="code-surface panel-glow relative min-h-0 flex-1 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[rgba(2,6,23,0.72)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(244,114,182,0.08),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-slate-950/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/70 to-transparent" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center">
          {/* <div className="rounded-full border border-amber-400/20 bg-slate-950/55 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-100/90 backdrop-blur-md">
            Code is protected. Unauthorized use is prohibited.
          </div> */}
        </div>
        {loadError ? (
          <div className="relative flex h-full items-center justify-center p-8 text-center text-rose-200">
            {loadError}
          </div>
        ) : null}
        {isLoading ? (
          <div className="relative flex h-full items-center justify-center p-8 text-center text-slate-300">
            Loading file content...
          </div>
        ) : null}
        {!isLoading && !loadError ? (
          <div className="relative h-full overflow-auto">
            <pre
              className={`line-numbers m-0 min-h-full overflow-visible bg-transparent p-0 text-sm leading-6 text-slate-100 ${
                shouldFade ? 'relative after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-28 after:bg-gradient-to-b after:from-transparent after:to-slate-950' : ''
              }`}
            >
              <code ref={codeRef} className={`language-${prismLanguage} block whitespace-pre bg-transparent px-6 py-6 font-mono`}>
                {codeContent}
              </code>
            </pre>
          </div>
        ) : null}
      </div>
    </section>
  );
}
