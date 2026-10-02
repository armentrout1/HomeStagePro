# AGENTS.md — HomeStagePro

This file defines how Codex and other coding agents should work in this repository.


## Aaron Development Workflow (ADW) v1.0

This repository uses the Aaron Development Workflow by default. It supplements, and does not replace, stricter repository-specific safety, security, branching, migration, deployment, financial, or product rules elsewhere in this file or repository.

### Roles and handoff

- **ChatGPT is the architect/reviewer.** It should do the initial repository inspection, architecture reasoning, task decomposition, risk analysis, acceptance criteria, and pushed-code review whenever practical.
- **Codex is primarily the local implementation worker.** Use it when local multi-file implementation, test execution, or repo-local tooling is more efficient than direct GitHub edits.
- **GitHub is the handoff point.** Codex works on local files that ChatGPT cannot see through GitHub until they are committed and pushed.
- When ChatGPT can safely make a small, targeted GitHub change directly, prefer that over spending Codex credits unnecessarily.

### Before sending work to Codex

ChatGPT should narrow the task first and provide a bounded implementation packet containing, when known:

1. exact goal and out-of-scope items;
2. target repository and branch strategy;
3. likely files/components involved;
4. invariants and safety constraints;
5. acceptance criteria;
6. exact validation commands/checks;
7. whether commit/push is authorized for the task;
8. the recommended Codex model and effort level.

Avoid broad prompts such as "audit and fix everything" when the work can be decomposed into smaller verified tasks.

### Codex effort policy

Use the lowest effort that is appropriate for the work:

- **Low / fast:** mechanical edits, renames, isolated documentation, simple test updates, narrow UI changes.
- **Medium:** default for ordinary multi-file feature work, straightforward bugs, bounded refactors, and test implementation.
- **High:** only when needed for migrations, security-sensitive work, difficult state/concurrency bugs, architectural refactors, or changes spanning several tightly coupled subsystems.
- **Extra High:** exceptional use only when lower effort has failed or the problem is genuinely unusually difficult.

Do not spend higher effort merely because a task is large; first make the task smaller and more explicit.

### Codex local execution contract

For an authorized implementation task, Codex should:

1. verify local repository root, remote, branch, HEAD, and working tree before editing;
2. read all applicable repository instructions before changing code;
3. preserve unrelated local work;
4. implement only the authorized scope;
5. run the required validation and fix in-scope failures;
6. inspect the final diff for unintended changes;
7. create a coherent commit;
8. push the branch when the task authorizes push;
9. report branch, commit SHA, files changed, checks run, and any remaining blocker or risk.

A local-only Codex change is **not reviewable by ChatGPT through GitHub**. When ChatGPT review is the next step, Codex must commit and push first.

### GitHub review gate

After Codex pushes, ChatGPT should review the actual GitHub branch/commit/diff and available CI evidence rather than relying only on Codex's completion summary. The next action should be one of:

- accept and advance to the next bounded task;
- make or request a small corrective patch;
- send a narrowly scoped follow-up task to Codex;
- stop for a genuine owner decision, missing credential, safety gate, or external dependency.

### Consequential actions

Unless explicitly authorized in the current task and permitted by stricter repository rules, do not:

- merge or deploy;
- run production migrations or destructive database operations;
- move live money or alter billing;
- expose, rotate, or commit secrets;
- force-push, rewrite history, or discard unrelated work;
- claim real-world, production, Windows/hardware, or integration verification that was not actually performed.

### Completion standard

A coding task is complete only when implementation evidence matches the requested scope and acceptance criteria. Distinguish clearly between:

- planned;
- implemented locally;
- committed;
- pushed;
- reviewed;
- merged;
- deployed;
- production/integration verified.

Do not collapse those states into a single "done."


## Repository-specific operating rules

- Read the repository README, package scripts, roadmap/status documents, and any security or architecture documentation relevant to the task before implementation.
- Use a dedicated feature branch for implementation unless the user explicitly authorizes another approach.
- Preserve unrelated changes and avoid destructive Git operations.
- Do not introduce paid services, production infrastructure, migrations, or external side effects without explicit authorization.
- Primary validation commands: `npm run check`, `npm test`, and `npm run build` when applicable.
- Run `npm run security:probe` for security-sensitive changes.
- Do not run `npm run db:push` against any shared/hosted database without explicit current-task authorization.
