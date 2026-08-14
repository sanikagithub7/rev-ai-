# 🤖 Rev AI — AI Agent Architecture & Observability

## Overview

Rev AI abstracts LLM providers (OpenAI, Anthropic, etc.) behind a unified provider interface (`src/lib/ai/client.ts`). The application logic interacts exclusively with provider-agnostic completion interfaces.

---

## Agent Specifications

1. **Lead Intelligence Agent**: Evaluates inbound lead messages against business profile context, calculates lead score (0-100), and assigns heat levels (`COLD`, `WARM`, `HOT`).
2. **Sales Dialog Agent**: Handles inbound multi-channel messages using company FAQs and service parameters.
3. **Follow-Up Agent**: Generates contextually relevant, personalized follow-up sequences.
4. **Sales Analyst Agent**: Synthesizes pipeline performance metrics into actionable business insights.

---

## Observability & Audit Logging (`ai_runs`)

Every AI invocation writes an audit record to `public.ai_runs` with:
- `organization_id`
- `agent_type`
- `model`
- `prompt_tokens` & `completion_tokens`
- `input_payload` & `output_payload`
- `execution_time_ms`
- `status` (`SUCCESS` | `FAILED`)
