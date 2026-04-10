import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getAdminProjects, shareAdminProject, uploadAdminProjectFiles } from '../lib/api';

const ADMIN_KEY_STORAGE = 'code_reader_admin_key';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback ignored */
    }
  };

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : `Copy ${label}`}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
        copied
          ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
          : 'border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-slate-200'
      }`}
    >
      {copied ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const adminKey = localStorage.getItem(ADMIN_KEY_STORAGE) ?? '';

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('files');

  // Upload state
  const [pickedFiles, setPickedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Share state
  const [shareClientName, setShareClientName] = useState('');
  const [shareClientEmail, setShareClientEmail] = useState('');
  const [shareExpiresAt, setShareExpiresAt] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const [newShareLink, setNewShareLink] = useState('');

  const refreshProject = async () => {
    const payload = await getAdminProjects(adminKey);
    const found = (payload.projects ?? []).find((p) => p.id === projectId);
    if (found) setProject(found);
  };

  useEffect(() => {
    if (!adminKey) {
      navigate('/admin');
      return;
    }

    setIsLoading(true);
    getAdminProjects(adminKey)
      .then((payload) => {
        const found = (payload.projects ?? []).find((p) => p.id === projectId);
        if (!found) {
          setError('Project not found.');
        } else {
          setProject(found);
        }
      })
      .catch((err) => {
        if (err.message.includes('Unauthorized')) {
          localStorage.removeItem(ADMIN_KEY_STORAGE);
          navigate('/admin');
        } else {
          setError(err.message);
        }
      })
      .finally(() => setIsLoading(false));
  }, [adminKey, projectId, navigate]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!pickedFiles.length) {
      setUploadError('Pick at least one file or folder to upload.');
      return;
    }
    setUploading(true);
    setUploadError('');
    setUploadMsg('');
    try {
      const payload = await uploadAdminProjectFiles(adminKey, projectId, pickedFiles);
      setUploadMsg(payload.message ?? 'Files uploaded successfully.');
      setPickedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refreshProject();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!shareClientName.trim() || !shareClientEmail.trim() || !shareExpiresAt) {
      setShareError('All fields are required.');
      return;
    }
    setSharing(true);
    setShareError('');
    setNewShareLink('');
    try {
      const payload = await shareAdminProject(adminKey, projectId, {
        clientName: shareClientName.trim(),
        clientEmail: shareClientEmail.trim(),
        expiresAt: shareExpiresAt,
      });
      setNewShareLink(payload.shareLink);
      setShareClientName('');
      setShareClientEmail('');
      setShareExpiresAt('');
      await refreshProject();
    } catch (err) {
      setShareError(err.message);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="relative flex min-h-full flex-col">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-violet-500/8 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/80 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Link to="/admin/dashboard" className="flex items-center gap-1.5 text-slate-400 transition hover:text-slate-200 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Dashboard
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-white font-medium truncate">{project?.name ?? 'Loading…'}</span>
          </div>
          <button
            onClick={() => { localStorage.removeItem(ADMIN_KEY_STORAGE); navigate('/admin'); }}
            className="shrink-0 flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="h-6 w-6 animate-spin text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-6 text-sm text-rose-300">{error}</div>
        ) : project ? (
          <>
            {/* Project header */}
            <div className="mb-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                  {project.description ? (
                    <p className="mt-1 text-sm text-slate-400">{project.description}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      {project.filesCount} files
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                      </svg>
                      {project.sharesCount} share links
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-1 rounded-2xl border border-white/8 bg-white/[0.025] p-1">
              {[
                { id: 'files', label: 'Upload Files', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                )},
                { id: 'share', label: 'Share Links', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                )},
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.id === 'share' && project.sharesCount > 0 ? (
                    <span className="rounded-full bg-cyan-400/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">{project.sharesCount}</span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            {activeTab === 'files' ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-6">
                  <h2 className="mb-1 font-semibold text-white">Upload Source Files</h2>
                  <p className="mb-5 text-sm text-slate-400">Upload your code files or an entire folder. Existing files will not be replaced.</p>
                  <form onSubmit={handleUpload} className="flex flex-col gap-4">
                    <label className="group cursor-pointer rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center transition hover:border-cyan-400/30 hover:bg-cyan-400/5">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        webkitdirectory="true"
                        directory=""
                        onChange={(e) => setPickedFiles(Array.from(e.target.files ?? []))}
                        className="sr-only"
                      />
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400 transition group-hover:border-cyan-400/20 group-hover:bg-cyan-400/10 group-hover:text-cyan-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-slate-200 group-hover:text-white">
                            {pickedFiles.length > 0 ? `${pickedFiles.length} file${pickedFiles.length !== 1 ? 's' : ''} selected` : 'Click to select files or folder'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {pickedFiles.length > 0 ? 'Click to change selection' : 'Supports entire project directories'}
                          </p>
                        </div>
                      </div>
                    </label>

                    {uploadMsg ? (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {uploadMsg}
                      </div>
                    ) : null}
                    {uploadError ? (
                      <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">{uploadError}</div>
                    ) : null}

                    <button
                      id="upload-files-btn"
                      type="submit"
                      disabled={uploading || pickedFiles.length === 0}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 active:scale-[0.98] disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Uploading…
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          Upload {pickedFiles.length > 0 ? `${pickedFiles.length} File${pickedFiles.length !== 1 ? 's' : ''}` : 'Files'}
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {project.filesCount > 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.025] px-5 py-4">
                    <p className="text-sm font-medium text-slate-300">
                      {project.filesCount} file{project.filesCount !== 1 ? 's' : ''} currently in this project
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Go to the Share Links tab to share this project with clients.</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === 'share' ? (
              <div className="space-y-5">
                {/* New share form */}
                <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-6">
                  <h2 className="mb-1 font-semibold text-white">Create Share Link</h2>
                  <p className="mb-5 text-sm text-slate-400">Generate a read-only link for a client. They can view but not copy or download code.</p>

                  {newShareLink ? (
                    <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-300">Share link created!</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 truncate rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-cyan-200">
                          {newShareLink}
                        </code>
                        <CopyButton text={newShareLink} label="link" />
                      </div>
                    </div>
                  ) : null}

                  <form onSubmit={handleShare} className="flex flex-col gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-400">Client Name</label>
                        <input
                          id="share-client-name"
                          value={shareClientName}
                          onChange={(e) => setShareClientName(e.target.value)}
                          placeholder="e.g. John Smith"
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 transition focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-400">Client Email</label>
                        <input
                          id="share-client-email"
                          type="email"
                          value={shareClientEmail}
                          onChange={(e) => setShareClientEmail(e.target.value)}
                          placeholder="e.g. john@example.com"
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 transition focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-400">Access Expires At</label>
                      <input
                        id="share-expires-at"
                        type="datetime-local"
                        value={shareExpiresAt}
                        onChange={(e) => setShareExpiresAt(e.target.value)}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20"
                      />
                    </div>

                    {shareError ? (
                      <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">{shareError}</div>
                    ) : null}

                    <button
                      id="create-share-btn"
                      type="submit"
                      disabled={sharing}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 active:scale-[0.98] disabled:opacity-60"
                    >
                      {sharing ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Generating…
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                          </svg>
                          Generate Share Link
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Existing shares */}
                {project.shares?.length > 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-6">
                    <h3 className="mb-4 font-semibold text-white">Active Share Links</h3>
                    <div className="space-y-3">
                      {project.shares.map((share) => {
                        const projectSlug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                        const shareUrl = `${window.location.origin}/view/${projectSlug}/${share.token}`;
                        const isExpired = new Date(share.expiresAt).getTime() < Date.now();

                        return (
                          <div key={share.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-slate-200 text-sm">{share.clientName}</p>
                                  <span className="text-slate-600 text-xs">·</span>
                                  <p className="text-xs text-slate-500">{share.clientEmail}</p>
                                  {isExpired ? (
                                    <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300">Expired</span>
                                  ) : (
                                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Active</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500">Expires: {formatDate(share.expiresAt)}</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <code className="flex-1 truncate rounded-lg border border-white/8 bg-slate-950/40 px-2.5 py-1.5 text-xs text-cyan-200/80">
                                    {shareUrl}
                                  </code>
                                  <CopyButton text={shareUrl} label="link" />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.015] px-6 py-8 text-center">
                    <p className="text-sm text-slate-400">No share links yet. Create one above.</p>
                  </div>
                )}
              </div>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
