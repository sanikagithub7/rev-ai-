# REV AI — AI Sales Autopilot & B2B Communication Platform

> **Your Production-Grade AI-Powered Sales & Automation Team**

REV AI is a production-oriented, multi-tenant B2B SaaS platform designed to capture leads, score intent using local/cloud LLM intelligence, automate personalized follow-ups, orchestrate multi-channel customer conversations, schedule Google Meet calls, and operate an autonomous sales pipeline with strict Supabase Row-Level Security (RLS).

---

## 📋 Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Production Feature Modules](#2-production-feature-modules)
  - [Leads Management](#leads-management)
  - [Conversations 2.0](#conversations-20)
  - [Ollama Qwen Lead Intelligence](#ollama-qwen-lead-intelligence)
  - [Google Calendar & Meet Engine](#google-calendar--meet-engine)
  - [Admin Security & RLS Isolation](#admin-security--rls-isolation)
- [3. Technology Stack](#3-technology-stack)
- [4. Database & Migration Schema](#4-database--migration-schema)
- [5. Environment Variables](#5-environment-variables)
- [6. Setup & Running Locally](#6-setup--running-locally)
- [7. Repository & Deployment](#7-repository--deployment)
- [8. Contributors](#8-contributors)

---

## 1. Project Overview

**REV AI** operates as an autonomous sales team for modern B2B businesses. Grounded in business-specific domain knowledge and orchestrated by an event-driven automation framework, REV AI captures incoming opportunities, qualifies prospects with AI scoring, conducts multi-party conversation threads, and arranges calendar meetings with full tenant data isolation.

---

## 2. Production Feature Modules

### 👤 Leads Management
- **Full CRM Lifecycle**: Complete Create, Read, Update, Delete (CRUD) operations linked to real Supabase tables.
- **Search & Advanced Filtering**: Filter workspace leads by Status (`NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `LOST`), Priority (`LOW`, `NORMAL`, `HIGH`, `URGENT`), AI Classification Heat Level (`HOT`, `WARM`, `COLD`, `NOT ANALYZED`), and Sort Orders.
- **Dynamic Metrics**: Header and dashboard counters update in real time based on actual database state.
- **Bi-Directional Links**: Direct action button to jump straight into active conversation threads for any lead.

### 💬 Conversations 2.0
- **Centralized Communication Pipeline**: 3-Pane Swiss SaaS design layout linking Leads to Conversation Threads and Messages.
- **Real Message Streams**: Message composer and thread view writing directly to Supabase `messages` and `conversations`.
- **Workflow Event Bus**: Emits `NEW_CONVERSATION`, `NEW_MESSAGE`, and `CONVERSATION_CLOSED` events into `public.conversation_events` for workflow triggers.
- **Zero Dummy Data**: Clean empty states (`No conversations yet`) with quick-action modals.

### 🧠 Ollama Qwen Lead Intelligence
- **SSRF-Safe Web Scraper**: Server-side URL scraper blocking private/internal IP ranges (`127.0.0.1`, `localhost`, `10.x.x.x`, etc.).
- **3-Point AI Classification**:
  1. **Hot Lead Detection**: Calculates score (0–100) and heat level (`HOT`, `WARM`, `COLD`).
  2. **Spam Detection**: Validates inquiry validity and calculates confidence.
  3. **Lead Qualification**: Generates actionable fit status and recommended next step.
- **Persisted AI Runs**: Execution tokens, latency, and model outputs logged in `public.ai_runs`.

### 📅 Google Calendar & Meet Engine
- **OAuth Integration**: Secure server-side code exchange and token management for Google Calendar API.
- **Google Meet Generation**: Automatically creates Calendar events with `conferenceData` Google Meet links.
- **Attendee Invitations**: Sends automatic meeting invites to prospect emails.

### 🛡️ Admin Security & RLS Isolation
- **Admin Email Whitelist**: Strictly enforced server-side guard restricting administrative actions to approved accounts (`sufiyanshah4545@gmail.com` and `wazarkarsanika20@gmail.com`).
- **Multi-Tenant RLS**: Every query enforces `public.is_org_member(organization_id)` via Supabase RLS policies. Client-supplied organization IDs are never trusted.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend & Server** | Next.js (App Router) + Node.js | React application framework with server API routes |
| **Database & Auth** | Supabase PostgreSQL + Supabase Auth | Relational database engine with Row-Level Security (RLS) |
| **Language & Styling** | TypeScript + Tailwind CSS | Type-safe code with sharp B2B SaaS design system |
| **AI LLM Inference** | Ollama + Qwen 2.5 | Local/remote LLM model engine for lead scoring & dialog |
| **Integrations** | Google OAuth & Calendar API v3 | Automatic Google Meet booking & attendee calendar invites |
| **Source Control** | GitHub | Main repository branch management |

---

## 4. Database & Migration Schema

Migrations are located in `supabase/migrations/`:
- `20260814_complete_schema.sql` — Core database tables (`users`, `organizations`, `leads`, `conversations`, `messages`, `meetings`, `workflows`, `ai_runs`, `activities`).
- `20260814_leads_conversations_v2.sql` — Schema enhancement adding `industry`, `budget`, `stated_requirement`, `inbound_notes`, `heat_level`, and `conversation_events`.

---

## 5. Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Database & Auth Credentials
NEXT_PUBLIC_SUPABASE_URL=https://xlyzfjphqzhfpzeqcvru.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_QOa-_HaTG8SVUjeg6VAG3A__QL1jXHx

# Ollama AI Engine Configuration
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5

# Google Calendar & Meet Integration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 6. Setup & Running Locally

1. **Clone the Repository**
   ```bash
   git clone https://github.com/sanikagithub7/rev-ai-.git
   cd rev-ai-
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Apply Database Migrations**
   Run the SQL scripts in `supabase/migrations/` inside your Supabase SQL Query Editor.

4. **Start Development Server**
   ```bash
   node server.js
   ```
   Or using Next.js dev server:
   ```bash
   npm run dev
   ```
   Access the dashboard at [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

---

## 7. Repository & Deployment

- **GitHub Repository**: [https://github.com/sanikagithub7/rev-ai-](https://github.com/sanikagithub7/rev-ai-)
- **Branch**: `main`

---

## 8. Contributors

- **Sanika Wazarkar** ([@sanikagithub7](https://github.com/sanikagithub7)) — AI Automation / Full-Stack Architecture
- **Sufiyan Shah** — AI Sales Engineering / Full-Stack Development