# Verdant & Co — AI-Assisted Customer Support Platform

> A production-grade MVP built for **Datastraw Technologies' Take-Home Assessment (Software Engineer, AI & Product Engineering)**.

Verdant & Co is an online vegan skincare brand in India. This platform receives incoming customer messages via an HMAC-SHA256 verified webhook, generates draft replies using LLM grounded in the brand's policy knowledge base, and empowers human support agents to review, edit, and approve replies.

---

## Architecture Overview

- **Frontend (`Datastraw-fe`)**: React 19, Vite, Tailwind CSS 4, Lucide Icons. Features an instant toggle between **Customer View** (WhatsApp chat simulator with sample query chips) and **Agent View** (authenticated dashboard with conversation list, message history, and editable AI draft card).
- **Backend (`Datastraw-se`)**: Node.js, Express, MongoDB (Mongoose ORM with relational schema referencing: Customer, Conversation, Message, AIDraft).
- **AI Engine**: Google Gemini API (`gemini-3.8-flash`) with strict system instructions grounded in the official Verdant & Co Knowledge Base, coupled with deterministic policy fallbacks.
- **Webhook Security**: Raw-body HMAC-SHA256 signature verification matching `X-Signature: sha256=<hex>` against secret `verdant-demo-secret-2026`.

---

## How to Run Locally

### Prerequisites
- Node.js v18+ (tested on Node v24)
- MongoDB instance (Local `mongodb://127.0.0.1:27017` or MongoDB Atlas)

### 1. Backend Setup
```bash
cd Datastraw-se
npm install

# Copy environment variables
cp .env.example .env
# Ensure GEMINI_API_KEY and MONGODB_URI are configured in .env

# Seed sample customers and initial conversation
npm run seed

# Start server (runs on port 5000)
npm start
# or development watch mode:
npm run dev
```

### 2. Frontend Setup
```bash
cd Datastraw-fe
npm install

# Copy environment variables
cp .env.example .env
# VITE_API_URL=http://localhost:5000

# Start frontend (runs on http://localhost:5173)
npm run dev
```

### 3. Test Webhook (Automated Verification)
In `Datastraw-se`, run our automated test suite that tests valid HMAC signatures, invalid signatures (401), and missing signatures (401):
```bash
npm run test:webhook
```

---

## Agent Credentials (For Testing)
- **Portal URL**: Switch toggle to **Agent View** at the top of the app
- **Email**: `agent@verdant.co`
- **Password**: `verdant-agent-2026`

---

## Main Decisions & What Was Left Out

### Key Decisions Made:
1. **Schema Design**: Modeled relationships using explicit references between `Customer` (1:1 with open `Conversation`), `Conversation` (1:N with `Message`), and `Message` (1:1 with `AIDraft`). Ensures clean relational integrity and prevents duplicate open conversations per customer.
2. **Dual-View Toggle with Live Ingestion**: Built a Customer View that triggers the exact same message-processing pipeline as the webhook. Added quick-click chips for all 5 sample queries from the prompt for instant evaluation.
3. **Resilient AI Pipeline**: LLM calls are wrapped with a 5-second timeout and grounded fallback. If the external LLM provider experiences network latency or rate-limiting, the system automatically uses a policy-grounded draft rather than failing the webhook.
4. **Security**: Webhook HMAC-SHA256 verification utilizes constant-time comparison (`crypto.timingSafeEqual`) on the raw unparsed body to prevent timing attacks.

### What Was Left Out Due to Time Limits:
1. **WebSockets / Server-Sent Events**: Used lightweight 3-second polling instead of full Socket.io infrastructure to ensure zero-dependency deployment simplicity within the 4-5 hour budget.
2. **Multi-Agent Collision Locking**: Concurrent editing locks (preventing two agents from drafting an answer to the same customer simultaneously) were omitted.
3. **Vector Database / Embedding Pipeline**: Given the small, structured size of Verdant & Co's policy document (7 rules), injecting the complete knowledge base into the prompt context provided 100% precision with zero retrieval latency.

---

## AI Reflection: Where It Helped & Where It Got Something Wrong

- **Where AI Helped**: Accelerating boilerplate schema modeling, writing mock HMAC test scripts, and formulating empathetic, policy-compliant customer service reply prompts.
- **Where AI Got Something Wrong**: In initial test prompts regarding customer allergic reactions, standard LLMs tend to over-prescribe medical advice (e.g., suggesting antihistamines or topical hydrocortisone). We explicitly constrained the system prompt to forbid medical advice, prioritize customer safety (stop usage immediately, consult a doctor), and direct them to return/refund assistance.

---

## Answers to the Two Mandatory Questions

### Question 1: A customer message arrives at 2 a.m. and something in your system fails. What does the agent see the next morning, and how would you find out what went wrong?

**What the agent sees**:
The agent opens the dashboard and sees the customer's conversation prioritized at the top of the list with a distinct alert badge: `[Manual Review Required: AI Draft Pending]`. The customer's message is preserved with full fidelity in the chat history, but the draft input box shows the raw customer query and an actionable notice rather than a blank or crashing screen. The customer view never sees any internal failure.

**How to find out what went wrong**:
Every webhook event logs a structured JSON entry containing `timestamp`, `event_id`, `customer_id`, and `error_code` to server logs (CloudWatch/Render logs). We inspect the `failureReason` field recorded on the `AIDraft` collection and correlate the `event_id` in our error monitoring service (e.g. Sentry) to trace whether the issue was an expired LLM token, network timeout, database lock, or malformed payload.

---

### Question 2: This now has to serve 20 brands, each with its own knowledge base and agents. What would you change first, and why?

**What would change first**:
First, **introduce multi-tenant tenant isolation with `brand_id` partitioning across all collections (`brands`, `brand_policies`, `agents`, `conversations`) and route requests dynamically**. 

**Why**:
Currently, the knowledge base and agent authentication assume a single brand (`verdant-co`). Introducing `brand_id` enables tenant-level security so agents of Brand A can never read or respond to Brand B's customer tickets. Furthermore, migrating the static policy file to a indexed `brand_policies` collection (or tenant-partitioned vector store) allows each brand to independently upload, version, and update their policies without requiring code deployments.
