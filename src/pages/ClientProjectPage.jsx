import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import CodeViewer from '../components/CodeViewer';
import { getSharedFile, getSharedProject } from '../lib/api';
import { flattenFileNodes } from '../lib/projectTree';

const MAX_VISIBLE_CHARS = 150000;

function formatDaysLeft(targetDate) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const remaining = targetDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / millisecondsPerDay));
}

export default function ClientProjectPage() {
  // Supports both /view/:projectSlug/:token (new) and /client/:token (legacy)
  const { token, projectSlug } = useParams();
  const [projectData, setProjectData] = useState(null);
  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [fileCache, setFileCache] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const allFiles = useMemo(() => flattenFileNodes(projectData?.tree ?? null), [projectData]);
  const selectedMeta = useMemo(
    () => allFiles.find((file) => file.path === selectedFilePath) ?? allFiles[0] ?? null,
    [allFiles, selectedFilePath],
  );

  const cachedContent = selectedMeta ? fileCache[selectedMeta.id] ?? '' : '';
  const selectedFile = useMemo(() => {
    if (!selectedMeta) {
      return null;
    }

    const isTruncated = cachedContent.length > MAX_VISIBLE_CHARS;

    return {
      ...selectedMeta,
      content: isTruncated
        ? `${cachedContent.slice(0, MAX_VISIBLE_CHARS)}\n\n/* File preview is truncated for protected viewing. */`
        : cachedContent,
      isTruncated,
    };
  }, [cachedContent, selectedMeta]);

  useEffect(() => {
    setIsLoading(true);
    setLoadError('');

    // Use slug+token if available, otherwise fall back to token-only (legacy)
    const fetchPromise = projectSlug
      ? getSharedProject(projectSlug, token)
      : getSharedProject('legacy', token);

    fetchPromise
      .then((payload) => {
        const project = payload.project;
        setProjectData(project);
        const firstFile = flattenFileNodes(project.tree)[0];
        setSelectedFilePath(firstFile?.path ?? '');
      })
      .catch((error) => {
        setLoadError(error.message);
      })
      .finally(() => setIsLoading(false));
  }, [token, projectSlug]);

  useEffect(() => {
    let active = true;

    if (!selectedMeta || fileCache[selectedMeta.id] !== undefined) {
      return () => {
        active = false;
      };
    }

    setFileLoading(true);
    setLoadError('');

    const fetchFile = projectSlug
      ? getSharedFile(projectSlug, token, selectedMeta.id)
      : getSharedFile('legacy', token, selectedMeta.id);

    fetchFile
      .then((payload) => {
        if (!active) return;
        setFileCache((prev) => ({
          ...prev,
          [selectedMeta.id]: payload.file.content ?? '',
        }));
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(error.message);
      })
      .finally(() => {
        if (active) setFileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fileCache, selectedMeta, token, projectSlug]);

  // Disable copy/save/context menu
  useEffect(() => {
    const handleCopy = (event) => { event.preventDefault(); event.stopPropagation(); };
    const handleContextMenu = (event) => { event.preventDefault(); };
    const handleKeyDown = (event) => {
      const target = event.target;
      const isEditable = target instanceof HTMLElement && target.closest('input, textarea, [contenteditable="true"]');
      if (isEditable) return;
      const shortcut = (event.ctrlKey || event.metaKey) && ['c', 's'].includes(event.key.toLowerCase());
      if (shortcut) { event.preventDefault(); event.stopPropagation(); }
    };
    const handleSelectStart = (event) => {
      const target = event.target;
      const isEditable = target instanceof HTMLElement && target.closest('input, textarea, [contenteditable="true"]');
      if (!isEditable) event.preventDefault();
    };

    window.addEventListener('copy', handleCopy, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('selectstart', handleSelectStart, true);

    return () => {
      window.removeEventListener('copy', handleCopy, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('selectstart', handleSelectStart, true);
    };
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-full flex-col items-center justify-center gap-4 text-slate-300">
        <svg className="h-8 w-8 animate-spin text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm">Loading shared project…</p>
      </main>
    );
  }

  if (loadError && !projectData) {
    return (
      <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Access Unavailable</h1>
          <p className="mt-2 text-sm text-rose-300">{loadError}</p>
        </div>
        <Link to="/admin" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10">
          Go to Admin Login
        </Link>
      </main>
    );
  }

  const daysLeft = formatDaysLeft(new Date(projectData.expiresAt));

  return (
    <div className="app-shell relative flex h-full select-none flex-col overflow-hidden text-slate-100" onContextMenu={(event) => event.preventDefault()}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-6rem] top-[-6rem] h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[-5rem] top-[18rem] h-56 w-56 rounded-full bg-fuchsia-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <Header projectName={projectData.name} clientName={projectData.clientName} daysLeft={daysLeft} />
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <Sidebar
            tree={projectData.tree}
            fileCount={projectData.filesCount}
            selectedFilePath={selectedMeta?.path ?? ''}
            onSelect={setSelectedFilePath}
          />
          {selectedFile ? (
            <CodeViewer file={selectedFile} isLoading={fileLoading} loadError={loadError} />
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-slate-400">No file selected.</div>
          )}
        </div>
      </div>
    </div>
  );
}
