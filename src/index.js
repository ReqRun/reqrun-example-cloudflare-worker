const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

function getReqRunBaseUrl(env) {
  return (env.REQRUN_BASE_URL || "https://api.reqrun.com").trim();
}

function getReqRunApiKey(env) {
  const apiKey = (env.REQRUN_API_KEY || "").trim();

  if (!apiKey) {
    throw new Error("Missing REQRUN_API_KEY. Copy .dev.vars.example to .dev.vars and add your project key.");
  }

  return apiKey;
}

async function forwardToReqRun(env, payload) {
  return fetch(`${getReqRunBaseUrl(env)}/v1/chat/completions`, {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      authorization: `Bearer ${getReqRunApiKey(env)}`,
    },
    body: JSON.stringify(payload),
  });
}

async function getReqRunStatus(env, requestId) {
  return fetch(`${getReqRunBaseUrl(env)}/v1/requests/${requestId}`, {
    headers: {
      authorization: `Bearer ${getReqRunApiKey(env)}`,
    },
  });
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value, null, 2), {
    status,
    headers: JSON_HEADERS,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/") {
        return json({
          name: "reqrun-example-cloudflare-worker",
          message: "POST /run to submit work through ReqRun. GET /requests/:id to check durable status.",
        });
      }

      if (request.method === "POST" && url.pathname === "/run") {
        const body = await request.json();
        const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

        if (!prompt) {
          return json(
            {
              error: {
                message: "prompt is required",
                type: "invalid_request",
                code: "missing_prompt",
              },
            },
            400,
          );
        }

        const response = await forwardToReqRun(env, {
          model: body.model || "gpt-5-nano",
          messages: [{ role: "user", content: prompt }],
          wait: body.wait === true,
          idempotency_key: body.idempotencyKey || crypto.randomUUID(),
        });

        return new Response(await response.text(), {
          status: response.status,
          headers: JSON_HEADERS,
        });
      }

      if (request.method === "GET" && url.pathname.startsWith("/requests/")) {
        const requestId = url.pathname.replace("/requests/", "").trim();

        if (!requestId) {
          return json(
            {
              error: {
                message: "request id is required",
                type: "invalid_request",
                code: "missing_request_id",
              },
            },
            400,
          );
        }

        const response = await getReqRunStatus(env, requestId);
        return new Response(await response.text(), {
          status: response.status,
          headers: JSON_HEADERS,
        });
      }

      return json(
        {
          error: {
            message: "Not found",
            type: "invalid_request",
            code: "not_found",
          },
        },
        404,
      );
    } catch (error) {
      return json(
        {
          error: {
            message: error instanceof Error ? error.message : "Unknown error",
            type: "server_error",
            code: "worker_failed",
          },
        },
        500,
      );
    }
  },
};
