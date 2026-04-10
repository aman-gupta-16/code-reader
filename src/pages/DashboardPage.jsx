import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createAdminProject, deleteAdminProject, getAdminProjects } from '../lib/api';

const ADMIN_KEY_STORAGE = 'code_reader_admin_key';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function ProjectCard({ project, adminKey, onDeleted, onSelect }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteAdminProject(adminKey, project.id);
      onDeleted(project.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={() => onSelect(project.id)}
      className="group relative cursor-pointer rounded-2xl border border-white/8 bg-white/[0.025] p-5 transition-all hover:border-cyan-400/20 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-cyan-500/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white truncate">{project.name}</h3>
          </div>
          {project.description ? (
            <p className="text-xs text-slate-500 line-clamp-2 mb-3">{project.description}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              {project.filesCount} files
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              {project.sharesCount} links
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-slate-500">
              Updated {formatDate(project.updatedAt)}
            </span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete project"
          className="shrink-0 rounded-xl border border-rose-400/0 bg-rose-400/0 p-1.5 text-slate-600 opacity-0 transition-all group-hover:opacity-100 hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-rose-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const adminKey = localStorage.getItem(ADMIN_KEY_STORAGE) ?? '';

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!adminKey) {
      navigate('/admin');
      return;
    }

    setIsLoading(true);
    getAdminProjects(adminKey)
      .then((payload) => setProjects(payload.projects ?? []))
      .catch((err) => {
        if (err.message.includes('Unauthorized')) {
          localStorage.removeItem(ADMIN_KEY_STORAGE);
          navigate('/admin');
        } else {
          setError(err.message);
        }
      })
      .finally(() => setIsLoading(false));
  }, [adminKey, navigate]);

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
    navigate('/admin');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError('Project name is required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const payload = await createAdminProject(adminKey, {
        name: newName.trim(),
        description: newDesc.trim(),
      });
      setProjects((prev) => [payload.project, ...prev]);
      setNewName('');
      setNewDesc('');
      setShowNewProject(false);
      navigate(`/admin/project/${payload.project.id}`);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative flex min-h-full flex-col">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-violet-500/8 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/80 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
            </div>
            <span className="font-semibold text-white">CodeShare</span>
            <span className="hidden text-slate-600 sm:inline">/</span>
            <span className="hidden text-sm text-slate-400 sm:inline">Dashboard</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/15 hover:bg-white/10 hover:text-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {/* Page title */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="mt-1 text-sm text-slate-400">Manage your code sharing projects.</p>
          </div>
          <button
            id="new-project-btn"
            onClick={() => setShowNewProject((v) => !v)}
            className="flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Project
          </button>
        </div>

        {/* New project form */}
        {showNewProject ? (
          <div className="mb-6 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-5">
            <h2 className="mb-4 text-sm font-semibold text-cyan-200">Create New Project</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-2">
                <input
                  id="new-project-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Project name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 transition focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20"
                />
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 transition focus:border-cyan-400/40"
                />
                {createError ? <p className="text-xs text-rose-300">{createError}</p> : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowNewProject(false); setCreateError(''); setNewName(''); setNewDesc(''); }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-400 transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  id="create-project-submit"
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <svg className="h-6 w-6 animate-spin text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Loading projects…</span>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-6 text-sm text-rose-300">{error}</div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <p className="text-slate-300 font-medium">No projects yet</p>
            <p className="mt-2 text-sm text-slate-500">Create your first project to get started.</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="mt-4 flex items-center gap-2 rounded-xl bg-cyan-400/10 border border-cyan-400/20 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                adminKey={adminKey}
                onDeleted={(id) => setProjects((prev) => prev.filter((p) => p.id !== id))}
                onSelect={(id) => navigate(`/admin/project/${id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
