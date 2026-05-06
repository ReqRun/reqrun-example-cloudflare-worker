# ReqRun with a Cloudflare Worker

Runnable Cloudflare Worker example that accepts edge traffic and hands the actual OpenAI-compatible execution to ReqRun.

## What this repo shows

- `POST /run` submits durable work to ReqRun
- `GET /requests/:id` fetches durable request status later
- the Worker stays thin and fast instead of owning retry logic

## Prerequisites

- Node.js 20+
- a ReqRun project API key and signing secret from [https://app.reqrun.com](https://app.reqrun.com)

## Setup

1. Copy the env template:

```bash
cp .dev.vars.example .dev.vars
```

2. Fill in:

```env
REQRUN_API_KEY=REQRUN_LIVE_YOUR_PROJECT_KEY_HERE
REQRUN_SIGNING_SECRET=REQRUN_SIGNING_SECRET_HERE
REQRUN_BASE_URL=https://api.reqrun.com
```

3. Install dependencies:

```bash
npm install
```

4. Run locally:

```bash
npm run dev
```

## Example request

```bash
curl -X POST http://127.0.0.1:8787/run \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain why edge runtimes still need durable request execution.",
    "idempotencyKey": "worker-demo-001",
    "wait": false
  }'
```

Then fetch status later:

```bash
curl http://127.0.0.1:8787/requests/rr_your_request_id_here
```

Hosted ReqRun keys use signed requests. Copy the signing secret when the key is created because it is only shown once.
