# Claude Session Guide

## How to Start a New Session

Tell Claude:
> "Read docs/PROJECT_PLAN.md and docs/PROGRESS.md from https://github.com/rrstar2345/kp-trade-platform, then continue with the next pending tasks."

## Session Workflow
1. Claude clones the repo and reads PROJECT_PLAN.md + PROGRESS.md
2. Claude identifies the next ⬜ tasks in the current phase
3. Claude implements the tasks, commits code
4. Claude updates PROGRESS.md with ✅ for completed tasks
5. Claude pushes to GitHub

## Commit Convention
```
[P0-01] Backend scaffold - FastAPI app + health endpoint
[P1-05] Accounts widget - add/edit/delete form
```

## Branch Strategy
- `main` — stable, phase-complete code only
- `phase/0-setup`, `phase/1-mvp`, etc. — active development branches

## Important Rules for Claude
1. Always update PROGRESS.md after completing tasks
2. Never store plaintext credentials anywhere in code or logs
3. Keep broker logic inside `broker/` only — never directly in API routes
4. Test that the app starts (`uvicorn` + `npm run dev`) before committing a phase
5. Add a session entry in PROGRESS.md Session Log on every commit
