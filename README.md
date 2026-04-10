# Client Review Panel

A React + Tailwind CSS read-only code viewer with a Node.js + Express + MongoDB backend.

## What You Get

- Admin dashboard at `/admin`
- Admin can create projects
- Admin can upload full project folders/files
- Admin can generate share links for specific clients
- Client read-only viewer at `/client/:token`
- Token links expire based on admin-chosen date

## Scripts

- `npm run dev` - start the local dev server
- `npm run build` - create a production build
- `npm run preview` - preview the build locally
- `npm run server:dev` - start backend server in watch mode
- `npm run server:start` - start backend server in production mode

## Backend Setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `MONGODB_URI` and `ADMIN_API_KEY`.
3. Optionally set `CLIENT_APP_URL` (defaults to `http://localhost:5173`).
4. Run backend: `npm run server:dev`.

## Frontend Setup

1. Copy `.env.example` to `.env`.
2. Set `VITE_API_BASE_URL` (defaults to `http://localhost:5000`).
3. Run frontend: `npm run dev`.

## API Summary

- `POST /api/admin/projects` create project
- `POST /api/admin/projects/:projectId/files` upload files (multipart)
- `POST /api/admin/projects/:projectId/share` generate client share token
- `GET /api/client/project/:token` fetch shared project metadata
- `GET /api/client/project/:token/file/:fileId` fetch read-only file content

## Notes

- All admin endpoints require `x-admin-key` header.
- Uploaded files are stored under `backend/uploads/<projectId>/`.
- Viewer blocks copy/save/context menu/select to enforce controlled preview.
