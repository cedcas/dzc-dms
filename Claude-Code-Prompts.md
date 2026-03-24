# Claude Code Prompt Pack for DebtZeroCentral DMS MVP

Use these prompts in sequence. Each prompt is designed to keep Claude Code focused and reduce thrashing.

---

## Prompt 1 — Project bootstrap
You are building DebtZeroCentral Management System (DMS), an internal case-management web app for debt negotiation lifecycle management.

Read `CLAUDE.md` first and follow it strictly.

Goal for this step:
- initialize a production-oriented project using Next.js + TypeScript + Tailwind + Prisma + MySQL
- add auth suitable for internal users only
- create a clean folder structure
- create `.env.example`
- create a `README.md` with local setup and deployment notes for Hostinger

Important constraints:
- optimize for Hostinger Node.js deployment and MySQL
- keep the MVP internal-only
- use Prisma for all DB access
- use shadcn/ui for basic UI building blocks where helpful
- do not build features yet beyond project setup and minimal login shell

After changes:
- explain the architecture choices
- list any commands I need to run locally
- list any environment variables required

---

## Prompt 2 — Prisma schema and seed data
Read `CLAUDE.md` and design the initial Prisma schema for the DMS MVP.

Create models, enums, and relationships for:
- User
- Client
- DebtAccount
- Creditor
- NegotiationActivity
- Offer
- Task
- Document
- AuditLog

Requirements:
- use clear enums for statuses and roles
- include timestamps
- include indexes for common filters
- support role-based usage and auditability
- keep schema practical for MySQL

Also:
- create a seed script with sample users, creditors, clients, debt accounts, tasks, and offers
- update README with migration and seed commands

After changes:
- summarize the entity relationships in plain English
- point out any schema decisions I should review

---

## Prompt 3 — Authentication and route protection
Read `CLAUDE.md` first.

Implement internal-user authentication and authorization.

Requirements:
- credentials-based login only for MVP
- secure password hashing
- role-based guards for Admin, Negotiator, Intake, and ReadOnlyManager
- protect app routes on the server side
- add a basic login page and logout flow
- add sample middleware or helper utilities for authorization checks
- no public sign-up page

Also:
- create one seeded admin login and document how to change it

After changes:
- tell me exactly how to log in locally
- explain where role checks are enforced

---

## Prompt 4 — App shell and dashboard
Read `CLAUDE.md` and inspect the current codebase.

Build the application shell and dashboard.

Requirements:
- sidebar navigation
- top header
- dashboard cards for key counts
- sections for follow-ups due today, overdue tasks, active accounts by status, and recent activity
- responsive internal admin layout
- use server-side data fetching where practical

Keep the design clean, fast, and readable. Do not overdesign.

After changes:
- summarize what dashboard metrics are live vs placeholder

---

## Prompt 5 — Client management module
Read `CLAUDE.md` and continue implementation.

Build the Client Management module.

Requirements:
- clients list page with search, filters, and pagination
- create client form
- edit client form
- client detail page with summary, hardship notes, assigned owner, linked debt accounts, tasks, documents, and timeline
- validation with Zod
- audit logging for create and update

Keep forms practical for operations users.

After changes:
- tell me what fields are required
- identify any follow-up improvements you recommend

---

## Prompt 6 — Debt account management module
Read `CLAUDE.md` and continue implementation.

Build Debt Account management.

Requirements:
- add debt account to a client
- edit debt account
- debt account detail page
- status badges and next follow-up date
- ability to link to a Creditor record or enter original creditor name
- last contact date and delinquency stage support
- validation and audit logging

Also:
- surface debt accounts inside the client detail page
- make it easy to create an account from a client record

After changes:
- summarize the workflow for adding and managing an account

---

## Prompt 7 — Negotiation activity log
Read `CLAUDE.md` and continue.

Build the Negotiation Activity module.

Requirements:
- add activity entries to a debt account
- support activity types like phone call, voicemail, email, mailed letter, internal note, client update, and settlement discussion
- show activities in reverse chronological timeline
- allow next action date to be set from an activity
- optionally auto-create a follow-up task when next action date is entered
- audit important writes

After changes:
- explain how stale accounts could later be reported using this data

---

## Prompt 8 — Offer tracking
Read `CLAUDE.md` and continue.

Build Offer tracking.

Requirements:
- record multiple offers and counteroffers per debt account
- capture amount, percent of balance, source, payment type, installment terms, expiration, and status
- show offer history in the debt account detail page
- allow accepted offer designation
- prevent multiple accepted offers at once unless explicitly replaced

After changes:
- explain how final settlement amount should be derived in the MVP

---

## Prompt 9 — Task and follow-up system
Read `CLAUDE.md` and continue.

Build Tasks and Follow-Ups.

Requirements:
- task list with filters by assignee, due date, status, and priority
- create/edit/complete task flow
- tasks can belong to a client and/or debt account
- debt account page should show related tasks
- dashboard should show due today and overdue tasks
- support automatic task creation from negotiation activity where applicable

After changes:
- describe the minimum operational discipline this creates for the team

---

## Prompt 10 — Creditor directory
Read `CLAUDE.md` and continue.

Build the Creditor module.

Requirements:
- list creditors/collectors
- create/edit creditor records
- store contact info, preferred channel, type, and internal notes
- enable linking debt accounts to creditor records
- simple search and filter support

After changes:
- explain how this module helps standardize negotiations

---

## Prompt 11 — Document metadata and file uploads
Read `CLAUDE.md` and continue.

Build simple document handling for MVP.

Requirements:
- upload documents tied to a client and/or debt account
- store metadata in MySQL
- store file path safely on disk or configured storage path suitable for Hostinger
- validate mime type and file size
- list documents on client and debt account pages
- support categories such as intake, statement, hardship, settlement agreement, proof of payment, and misc

Do not overengineer object storage unless necessary. Keep MVP practical.

After changes:
- tell me where files are stored
- tell me what production caveats I should know on Hostinger

---

## Prompt 12 — Reports and stale account views
Read `CLAUDE.md` and continue.

Build basic reporting.

Requirements:
- active clients count
- active debt accounts count
- accounts by status
- follow-ups due today
- overdue tasks
- settlement totals
- average settlement percentage
- accounts with no activity in the last X days

Add one reports page and ensure dashboard uses real data.

After changes:
- explain any heavy queries and optimization opportunities

---

## Prompt 13 — Audit logging hardening
Read `CLAUDE.md` and inspect current write actions.

Harden audit logging.

Requirements:
- ensure important create/update/delete/status-change actions write to AuditLog
- capture actor, entity type, entity id, action, and before/after JSON where practical
- avoid logging secrets or raw passwords
- create helper utilities to reduce duplicate audit code

After changes:
- show me which operations are audited now

---

## Prompt 14 — Hostinger deployment readiness
Read `CLAUDE.md`, `README.md`, and current project files.

Prepare the application for Hostinger deployment.

Requirements:
- confirm build and start scripts
- verify environment variable handling
- verify Prisma migration/deploy commands for production
- document Node.js version assumptions
- document MySQL setup steps for Hostinger
- document file upload path expectations
- create a concise `DEPLOY_HOSTINGER.md`

After changes:
- give me a step-by-step deployment checklist
- call out any Hostinger-specific risks or caveats

---

## Prompt 15 — Codebase review and cleanup
Read `CLAUDE.md` and inspect the whole repo.

Perform a cleanup pass.

Requirements:
- remove obvious duplication
- improve naming consistency
- tighten types
- improve error handling
- add loading and empty states where missing
- verify route protection and auth checks
- verify forms and validation consistency
- improve README where needed

Do not rewrite the app from scratch. Focus on reliability and maintainability.

After changes:
- summarize the top technical debt items that remain
- recommend the best next three features after MVP

---

## Prompt 16 — Future HubSpot integration planning
Read `CLAUDE.md` and current schema.

Do not build the integration yet.
Instead, prepare the codebase for future HubSpot lead-to-client sync.

Requirements:
- propose the schema fields needed for external IDs and sync metadata
- suggest where sync services should live in the architecture
- create a short `docs/hubspot-integration-plan.md`
- keep all changes non-breaking and minimal

After changes:
- explain the cleanest future lead conversion workflow from HubSpot into DMS
