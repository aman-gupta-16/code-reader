import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createAdminProject,
  getAdminProjects,
  shareAdminProject,
  uploadAdminProjectFiles,
} from '../lib/api';

const ADMIN_KEY_STORAGE = 'code_reader_admin_key';

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString();
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem(ADMIN_KEY_STORAGE) ?? '');
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [shareClientName, setShareClientName] = useState('');
  const [shareClientEmail, setShareClientEmail] = useState('');
  const [shareExpiresAt, setShareExpiresAt] = useState('');
  const [pickedFiles, setPickedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null,
    [projects, selectedProjectId],
  );

  async function refreshProjects() {
    if (!adminKey.trim()) {
      return;
    }

    const payload = await getAdminProjects(adminKey.trim());
    setProjects(payload.projects ?? []);

    if (!selectedProjectId && payload.projects?.length) {
      setSelectedProjectId(payload.projects[0].id);
    }
  }

  useEffect(() => {
    if (!adminKey.trim()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    refreshProjects()
      .catch((error) => {
        setErrorMessage(error.message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveAdminKey = async (event) => {
    event.preventDefault();
    const trimmed = adminKey.trim();

    if (!trimmed) {
      setErrorMessage('Admin API key is required.');
      return;
    }

    localStorage.setItem(ADMIN_KEY_STORAGE, trimmed);
    setErrorMessage('');
    setStatusMessage('Admin key saved.');

    try {
      setIsLoading(true);
      await refreshProjects();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();

    if (!newProjectName.trim()) {
      setErrorMessage('Project name is required.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      const payload = await createAdminProject(adminKey.trim(), {
        name: newProjectName.trim(),
        description: newProjectDescription.trim(),
      });

      setStatusMessage(`Project created: ${payload.project.name}`);
      setNewProjectName('');
      setNewProjectDescription('');
      await refreshProjects();
      setSelectedProjectId(payload.project.id);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFiles = async (event) => {
    event.preventDefault();

    if (!selectedProject) {
      setErrorMessage('Select a project first.');
      return;
    }

    if (!pickedFiles.length) {
      setErrorMessage('Pick at least one file to upload.');
      return;
    }

    try {
      setIsLoading(true);
      setUploadProgress(null);
      setErrorMessage('');
      const payload = await uploadAdminProjectFiles(
        adminKey.trim(),
        selectedProject.id,
        pickedFiles,
        setUploadProgress,
      );
      setStatusMessage(payload.message ?? 'Files uploaded.');
      setPickedFiles([]);
      await refreshProjects();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (event) => {
    event.preventDefault();

    if (!selectedProject) {
      setErrorMessage('Select a project first.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      const payload = await shareAdminProject(adminKey.trim(), selectedProject.id, {
        clientName: shareClientName.trim(),
        clientEmail: shareClientEmail.trim(),
        expiresAt: shareExpiresAt,
      });

      setStatusMessage(`Share link created: ${payload.shareLink}`);
      await refreshProjects();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-6 px-4 py-6 text-slate-100 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-white">Admin Panel</h1>
        <Link className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300" to="/">
          Back Home
        </Link>
      </div>

      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl">
        <form className="flex flex-col gap-3 md:flex-row" onSubmit={handleSaveAdminKey}>
          <input
            type="password"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="Enter admin API key"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400/40"
          />
          <button
            type="submit"
            className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Save Key
          </button>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Create Project</h2>
          <form className="mt-4 space-y-3" onSubmit={handleCreateProject}>
            <input
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              placeholder="Project name"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none"
            />
            <textarea
              value={newProjectDescription}
              onChange={(event) => setNewProjectDescription(event.target.value)}
              rows={4}
              placeholder="Description (optional)"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none"
            />
            <button type="submit" className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950">
              Create
            </button>
          </form>
        </article>

        <article className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Upload Project Files</h2>
          <form className="mt-4 space-y-3" onSubmit={handleUploadFiles}>
            <select
              value={selectedProject?.id ?? ''}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none"
            >
              {projects.length ? null : <option value="">No projects yet</option>}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <input
              type="file"
              multiple
              webkitdirectory="true"
              directory=""
              onClick={(event) => {
                event.currentTarget.value = '';
              }}
              onChange={(event) => setPickedFiles(Array.from(event.target.files ?? []))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"
            />
            <p className="text-xs text-slate-500">Selected files: {pickedFiles.length}</p>
            {uploadProgress ? (
              <p className="text-xs text-cyan-200">
                Uploading batch {uploadProgress.batchIndex} of {uploadProgress.batchCount} • {uploadProgress.uploadedCount}/{uploadProgress.totalCount} files sent
              </p>
            ) : null}
            <button type="submit" className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950">
              Upload
            </button>
          </form>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Share With Client</h2>
          <form className="mt-4 space-y-3" onSubmit={handleShare}>
            <input
              value={shareClientName}
              onChange={(event) => setShareClientName(event.target.value)}
              placeholder="Client name"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none"
            />
            <input
              value={shareClientEmail}
              onChange={(event) => setShareClientEmail(event.target.value)}
              placeholder="Client email"
              type="email"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none"
            />
            <input
              value={shareExpiresAt}
              onChange={(event) => setShareExpiresAt(event.target.value)}
              type="datetime-local"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none"
            />
            <button type="submit" className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950">
              Create Share Link
            </button>
          </form>
        </article>

        <article className="rounded-3xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Projects</h2>
          <div className="mt-4 max-h-80 space-y-3 overflow-auto pr-2">
            {projects.map((project) => (
              <div key={project.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="font-medium text-white">{project.name}</p>
                <p className="text-xs text-slate-400">{project.filesCount} files • {project.sharesCount} shares</p>
                <p className="mt-1 text-xs text-slate-500">Updated {formatDate(project.updatedAt)}</p>
                {project.shares.map((share) => (
                  <p key={share.id} className="mt-1 truncate text-xs text-cyan-200">
                    /client/{share.token}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </article>
      </section>

      {statusMessage ? <p className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">{statusMessage}</p> : null}
      {errorMessage ? <p className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{errorMessage}</p> : null}
      {isLoading ? <p className="text-sm text-slate-400">Loading...</p> : null}
    </main>
  );
}
