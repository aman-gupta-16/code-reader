import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-8 text-slate-100">
      <section className="panel-glow w-full max-w-3xl rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 backdrop-blur-2xl">
        <p className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">
          Client Review Platform
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-white">Secure Code Sharing Workspace</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
          Admins can create projects, upload source files, and share read-only links with specific clients.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/admin"
            className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Open Admin Panel
          </Link>
          <span className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            Client links look like /client/:token
          </span>
        </div>
      </section>
    </main>
  );
}
