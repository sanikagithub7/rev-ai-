# 🛡️ Rev AI Development Rules & Quality Standards

---

## 1. Core Engineering Principles

1. **Phase-by-Phase Execution:** Never skip steps or attempt to build future phase requirements out of order.
2. **Zero Warning / Zero Lint Error Policy:** Never suppress TypeScript checks or disable ESLint rules to bypass build errors. Fix the root cause.
3. **No Fake / Hard-Coded Data in Production Views:** Dashboard metrics and UI tables must reflect actual database records or clean empty states.
4. **Strict Tenant Isolation:** Always enforce Row-Level Security (RLS) and server-side user organization membership checks.

---

## 2. Security Constraints

### NEVER:
- Commit `.env.local` or hard-code secrets/API keys.
- Expose `SUPABASE_SERVICE_ROLE_KEY` or LLM Provider API keys to client-side code.
- Accept or trust client-supplied `organization_id` values without server-side validation against `organization_members`.
- Disable Supabase RLS or create un-scoped query functions.
- Use unsafe dynamic SQL strings.

### ALWAYS:
- Validate API input payloads using Zod or strict TypeScript interfaces.
- Perform authorization checks inside Next.js Server Actions and Route Handlers.
- Store sensitive environment variables securely in Vercel / local `.env.local`.
- Verify signature integrity on inbound external webhooks (e.g., n8n).

---

## 3. Code Style & Quality Requirements

- **Type Safety:** TypeScript strict mode enabled (`strict: true`). Avoid `any` types.
- **Component Architecture:** Use modular, functional components inside `src/components/`. Keep server components server-rendered where possible.
- **Design & Styling:** Utilize Tailwind CSS design tokens and shadcn/ui primitives. Maintain sleek dark mode / modern B2B SaaS design standards.
- **Error Auditability:** Log errors with context without revealing sensitive authorization details or internal tracebacks to the client.

---

## 4. Git Workflow

- **Branching Strategy:** Direct commits on `main` for single-operator phase tasks or feature branches for Person 1 / Person 2 isolation.
- **Commit Format:** Conventional Commits (`feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`, `test: ...`).
- **Forbidden Actions:** No force pushes (`git push --force`) to shared branches. No committing `.env` files.
