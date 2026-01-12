---
description: Autonomous Git Save & Sync Protocol
---
# /save Protocol

This workflow handles the "Commit-and-Forget" logic.

## 1. Stage Changes
```bash
git add .
```

## 2. Analyze & Commit
1.  Run `git diff --staged --name-status` to see what changed.
2.  Based on the file paths, generate a Conventional Commit message:
    *   `apps/web/**` -> `feat(ui): ...` or `fix(ui): ...`
    *   `packages/functions/**` -> `feat(backend): ...` or `fix(backend): ...`
    *   `packages/shared/**` -> `feat(shared): ...`
    *   `.github/**` -> `ci: ...`
    *   Specific modules like `crm.ts` -> `feat(crm): ...`
3.  Commit the changes:
    ```bash
    git commit -m "<GENERATED_MESSAGE>"
    ```

## 3. Defensive Sync (Self-Healing)
1.  Pull changes from remote (rebase):
    ```bash
    git pull --rebase origin main
    ```
2.  Push to remote:
    ```bash
    git push origin main
    ```

## 4. Error Handling
*   **Conflict**: If rebase fails `CONFLICT`, try to auto-resolve if simple, or `git rebase --abort` and notify user.
*   **Non-Fast-Forward**: If push fails, repeat Step 3 (Pull Rebase -> Push).
