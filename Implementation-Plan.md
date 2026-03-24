# Efficient Build Plan for DebtZeroCentral DMS MVP with Claude Code

## Objective
Use Claude Code as the execution engine to build a standalone Node.js + MySQL internal web app for DebtZeroCentral Management System (DMS), deployable on Hostinger, while keeping HubSpot separate for lead capture and sales operations.

## Why this approach
Claude Code works best when:
- the project goal is well-scoped
- the architecture is decided early
- tasks are broken into vertical slices
- prompts are specific and sequential
- the repository has a strong `CLAUDE.md` file to keep the agent from wandering

Claude Code can read, edit, run commands, and iterate across your codebase, but it performs best when the guardrails and workflow are explicit. Anthropic documents Claude Code as an agentic coding tool that can read and edit files, run commands, and work across a codebase, and their docs support using a repository-level `CLAUDE.md` plus CLI/system prompt controls to shape behavior. citeturn678500search0turn678500search3turn678500search8

## Recommended stack
Use:
- Next.js + TypeScript
- Prisma ORM
- MySQL
- Tailwind CSS
- shadcn/ui
- Auth.js / NextAuth for internal-only credentials auth

This is a pragmatic fit for Hostinger’s Node.js web app hosting and MySQL support. Hostinger documents support for deploying Node.js web apps on Business and Cloud hosting and separately documents connecting a Node.js app to a Hostinger MySQL database through hPanel. citeturn678500search1turn678500search2turn678500search10

## Best execution method
### 1. Start locally, not directly on production
Build and test locally first.
Use GitHub as the source of truth.
Deploy only after each major slice is stable.

### 2. Use one repo, one app
Keep MVP in a single codebase:
- web app
- server logic
- Prisma schema
- docs

Do not split frontend and backend yet.
That just creates extra moving parts and future-you will send present-you a strongly worded memo.

### 3. Feed Claude Code one vertical slice at a time
Do not ask it to “build the whole app.”
That is how you get impressive chaos.

Use the prompt pack in this order:
1. bootstrap
2. schema
3. auth
4. shell/dashboard
5. clients
6. debt accounts
7. activity log
8. offers
9. tasks
10. creditors
11. documents
12. reports
13. audit hardening
14. deployment prep
15. cleanup
16. future HubSpot plan

### 4. Commit after every successful slice
Recommended commit rhythm:
- `chore: bootstrap nextjs prisma dms app`
- `feat: add prisma schema and seed data`
- `feat: add internal auth and route protection`
- `feat: add client management module`
- etc.

This makes rollbacks and debugging much easier.

## Suggested repo setup
Initialize repo locally, then place `CLAUDE.md` at the root.
Also add:
- `README.md`
- `.env.example`
- `/docs`

Suggested docs:
- `docs/product-scope.md`
- `docs/deploy_hostinger.md`
- `docs/hubspot-integration-plan.md`

## How to work with Claude Code efficiently
### Golden rules
- Always tell Claude Code to read `CLAUDE.md` first.
- Ask for one module at a time.
- Ask it to explain architecture choices after each step.
- Ask it to list commands you need to run.
- Ask it to update README when setup changes.
- Ask it not to overengineer.

### Good session pattern
1. open the repo
2. run Claude Code
3. paste one prompt from the prompt pack
4. review changes
5. run app/tests locally
6. commit
7. move to next prompt

### What not to do
- do not ask for full MVP in one shot
- do not leave stack decisions ambiguous
- do not let it invent new product scope every session
- do not skip database design early
- do not start Hostinger deployment before local stability

## Local-first workflow
### Environment setup
You will likely need:
- Node.js LTS
- npm or pnpm
- MySQL local instance or remote dev DB
- GitHub repo
- Claude Code installed

### Typical local sequence
1. create repo
2. put `CLAUDE.md` in root
3. run Claude Code Prompt 1
4. install dependencies
5. create `.env`
6. run Prisma migration
7. seed database
8. run local dev server
9. continue module-by-module

## Hostinger deployment strategy
Hostinger’s docs say Node.js web apps are supported on Business and Cloud hosting, with deployment steps managed through hPanel or connected workflows, and MySQL databases are created and managed in hPanel. Their support docs also note the DB host is usually localhost for Hostinger MySQL and show the create/manage workflow in hPanel. citeturn678500search1turn678500search2turn678500search9turn678500search10

### Production deployment sequence
1. confirm your Hostinger plan supports Node.js web apps
2. create MySQL DB in hPanel
3. note DB name, DB user, password, and host
4. add production env vars in Hostinger
5. deploy app
6. run Prisma production migration process
7. verify uploads path and permissions
8. test login, CRUD flows, and reports

### Deployment caveats
- file uploads on shared/managed hosting can be the first annoying surprise
- make upload paths configurable
- avoid assumptions about writable directories
- use environment variables for all secrets
- verify build and start commands match Hostinger expectations

## Recommended deliverables you should ask Claude Code to create
At minimum:
- production-ready app scaffold
- Prisma schema and migrations
- seed script
- internal auth
- app shell
- client, debt, tasks, offers, activities, documents modules
- audit logging utility
- README
- `.env.example`
- `DEPLOY_HOSTINGER.md`
- `docs/hubspot-integration-plan.md`

## Suggested operating cadence
### Day 1
- bootstrap
- schema
- auth

### Day 2
- dashboard
- clients
- debt accounts

### Day 3
- activities
- offers
- tasks

### Day 4
- creditors
- documents
- reports

### Day 5
- audit hardening
- deployment prep
- cleanup

That is aggressive but realistic for an MVP if you keep scope tight and review each slice carefully.

## Extra prompt for bug fixing
Use this when Claude gets a little too creative:

Read `CLAUDE.md` first.
Inspect the current codebase and do not rewrite architecture.
Fix only the reported issue with the smallest clean change.
Preserve existing patterns unless clearly broken.
After changes, explain root cause, files changed, and any follow-up risk.

## Extra prompt for refactoring
Read `CLAUDE.md` first.
Refactor the targeted module for readability and maintainability without changing business behavior.
Keep public interfaces stable unless necessary.
Update tests and docs if needed.
After changes, summarize what improved and any remaining debt.

## Final recommendation
Your fastest path is:
- define the rails once in `CLAUDE.md`
- force sequential module delivery with the prompt pack
- build locally
- deploy to Hostinger only after stable slices
- keep HubSpot out of the app for MVP except future-proof schema hooks

That gives you a real operating system for DZC instead of a Frankenstack stitched together by optimism and caffeine.
