# CLAUDE.md Addendum — In-App Help Center for DMS

Add the following guidance to the main `CLAUDE.md` for the DMS project.

## New Module: In-App Help Center
The DMS must include an internal Help Center that gives users clear how-to guidance, feature explanations, and troubleshooting steps.

The MVP Help Center must:
- live inside the DMS application
- use Next.js App Router pages
- store article content as local MDX files inside the repo
- use frontmatter metadata for article organization
- support contextual help links from major screens
- be easy to migrate later to a CMS or remote content source without rebuilding the UI shell

## Why This Approach
Choose repo-managed MDX for MVP because it is:
- fast to ship
- version-controlled with product changes
- low cost
- easy for Claude Code to maintain
- flexible enough to support screenshots, callouts, steps, and related links

Do not introduce a separate helpdesk SaaS, chatbot-only help, or heavy CMS in MVP.

## Help Center Scope for MVP
Build these capabilities:
1. Help Center home page
2. Category pages
3. Article detail pages
4. Contextual help entry points on major screens
5. Reusable article components such as callout, tip, warning, steps, and related articles
6. Basic article metadata and optional lightweight search/filter if practical

## Initial Help Categories
Create these categories:
- Getting Started
- Dashboard
- Clients
- Debt Accounts
- Negotiation Activities
- Offers
- Tasks and Follow-Ups
- Documents
- Reporting
- Troubleshooting / FAQ

## Initial Help Articles
Create at least these starter articles:
- Welcome to DMS
- How to use the Dashboard
- How to create a client
- How to add a debt account
- How to log a negotiation activity
- How to record an offer or counteroffer
- How to create and manage follow-up tasks
- How to upload and organize documents
- How reports work
- Common mistakes and troubleshooting

## Help Article Template
Each article should support:
- title
- slug
- summary
- category
- order
- audience or roles if helpful
- lastUpdated
- estimated reading time optional
- relatedArticles optional

Article body should typically include:
- what this feature is
- when to use it
- step-by-step instructions
- tips / warnings
- common mistakes
- related articles

## UX Rules for Help
- Every major module page should include a visible help entry point such as a "Help" link or icon.
- Empty states should guide the user toward the next action.
- Help should be task-oriented, not legalistic or overly technical.
- Contextual help links should deep-link to the relevant article, not just the Help home page.
- The Help Center must match the app shell and visual style of the DMS.

## Suggested File Structure
Prefer a structure similar to:
- `app/help/page.tsx`
- `app/help/[category]/page.tsx`
- `app/help/[category]/[slug]/page.tsx`
- `content/help/<category>/<article>.mdx`
- `lib/help/*.ts`
- `components/help/*`

## Technical Guidance
- Use local MDX files in the repo for MVP.
- Parse frontmatter and expose typed article metadata.
- Keep the content loading abstraction separate so it can later switch to a CMS.
- Reuse app layout and auth protection for help pages.
- Add a simple article index and category navigation.
- If search is added, keep it lightweight and local for MVP.

## Non-Goals for MVP Help
Do not build these yet unless explicitly requested:
- public docs site
- customer-facing help portal
- AI chat assistant for help
- rich analytics on help usage
- full CMS editing workflow
- article comments or feedback workflow

## Quality Bar
Help content should be concise, operational, and written for real internal users. Avoid filler. The goal is to reduce training burden, answer common questions quickly, and improve consistency in how the team uses DMS.
