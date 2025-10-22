# Seko Sa

Local sample-instrument playground with backend export to JUCE-ready scaffold and optional Electron standalone.

Quick start:

- Backend
  - Copy `.env.example` to `.env` and adjust if needed.
  - From `backend/`:
    - PowerShell
      - `cd backend`
      - `npm install`
      - `npm start`
- Frontend
  - From `frontend/`:
    - PowerShell
      - `cd frontend`
      - `npm install`
      - `npm run dev`

Testing export:

- Use `test_design_export.js` at the repo root to simulate a Design export.
- Ensure backend is running on the configured PORT/HOST.

Generated files live under `backend/export/`.

Notes

- Run dev commands from their respective folders. Running `npm run dev` at the repository root will fail because there is no root `package.json`.
- If the Design page shows an old layout, click the trash icon (🗑) in the Design toolbar or use the Reset Canvas button to clear saved state.