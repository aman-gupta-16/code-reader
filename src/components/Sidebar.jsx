import { useState } from 'react';

const LANGUAGE_LABELS = {
  javascript: 'JS',
  json: 'JSON',
  css: 'CSS',
  html: 'HTML',
  markdown: 'MD',
  yaml: 'YAML',
  java: 'JAVA',
  ruby: 'RB',
  bash: 'SH',
  swift: 'SWIFT',
  properties: 'CFG',
};

function ExplorerNode({ node, depth, selectedFilePath, onSelect }) {
  const [isOpen, setIsOpen] = useState(depth < 2);

  if (node.type === 'folder') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen((state) => !state)}
          className="group flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
        >
          <span className="w-4 text-xs text-slate-500">{isOpen ? '▾' : '▸'}</span>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">dir</span>
          <span className="truncate text-sm font-medium text-slate-200">{node.name}</span>
        </button>
        {isOpen
          ? node.children.map((child) => (
              <ExplorerNode
                key={`${child.type}-${child.path}`}
                node={child}
                depth={depth + 1}
                selectedFilePath={selectedFilePath}
                onSelect={onSelect}
              />
            ))
          : null}
      </div>
    );
  }

  const isActive = node.path === selectedFilePath;

  return (
    <button
      type="button"
      onClick={() => onSelect(node.path)}
      className={`group flex w-full items-center gap-2 rounded-xl border px-2 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${
        isActive
          ? 'border-cyan-400/30 bg-cyan-400/10'
          : 'border-transparent hover:border-white/5 hover:bg-white/[0.03]'
      }`}
      style={{ paddingLeft: `${depth * 14 + 10}px` }}
    >
      <span className="inline-flex min-w-10 items-center justify-center rounded-md bg-slate-900 px-1.5 py-1 text-[10px] font-bold text-slate-400">
        {LANGUAGE_LABELS[node.language] ?? 'FILE'}
      </span>
      <span className={`truncate text-sm ${isActive ? 'text-white' : 'text-slate-300'}`}>{node.name}</span>
    </button>
  );
}

export default function Sidebar({ tree, selectedFilePath, onSelect, fileCount }) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-white/5 bg-slate-950/80 backdrop-blur-xl lg:w-96">
      <div className="border-b border-white/5 px-4 py-4 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Explorer</p>
        <p className="mt-2 text-sm text-slate-400">{fileCount} readable files indexed from the attached folder.</p>
      </div>
      <div className="flex-1 overflow-auto p-3 sm:p-4">
        {tree?.children?.map((node) => (
          <ExplorerNode
            key={`${node.type}-${node.path}`}
            node={node}
            depth={0}
            selectedFilePath={selectedFilePath}
            onSelect={onSelect}
          />
        ))}
      </div>
      <div className="border-t border-white/5 px-4 py-4 text-xs text-slate-500 sm:px-5">
        Protected viewing mode. Copy, save, and context menu are disabled.
      </div>
    </aside>
  );
}
