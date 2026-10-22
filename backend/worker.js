
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

function unauthorized() {
  return jsonResponse({
    success: false,
    message: "Unauthorized. Please log in again."
  }, 401);
}

async function verifyToken(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !env.ADMIN_PASSWORD) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.ADMIN_PASSWORD),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode("aasra-admin-session"))
  );

  let supplied;
  try {
    supplied = Uint8Array.from(
      atob(token.replace(/-/g, "+").replace(/_/g, "/")),
      c => c.charCodeAt(0)
    );
  } catch {
    return false;
  }

  if (supplied.length !== expected.length) return false;

  let difference = 0;
  for (let i = 0; i < expected.length; i++) {
    difference |= expected[i] ^ supplied[i];
  }
  return difference === 0;
}

async function createToken(env) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.ADMIN_PASSWORD),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode("aasra-admin-session")
    )
  );
  return btoa(String.fromCharCode(...signature))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === "GET" &&
        (path === "/" || path === "/api/health")) {
      return jsonResponse({
        success: true,
        status: "healthy",
        project: "AASRA Foundation"
      });
    }

    if (path === "/api/contact" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ success: false, message: "Invalid JSON." }, 400);
      }

      const name = typeof body.name === "string" ? body.name.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim() : "";
      const message = typeof body.message === "string" ? body.message.trim() : "";

      if (!name || !email || !message) {
        return jsonResponse({
          success: false,
          message: "Name, email, and message are required."
        }, 400);
      }

      if (name.length > 100 || email.length > 254 || message.length > 3000 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse({
          success: false,
          message: "Please check your details and try again."
        }, 400);
      }

      try {
        await env.DB.prepare(
          `INSERT INTO contacts (name, email, message, created_at)
           VALUES (?, ?, ?, ?)`
        ).bind(name, email, message, new Date().toISOString()).run();

        return jsonResponse({
          success: true,
          message: "Thank you! Your message has been submitted successfully."
        }, 201);
      } catch (error) {
        console.error("Contact submission failed:", error);
        return jsonResponse({
          success: false,
          message: "Unable to save your message. Please try again later."
        }, 500);
      }
    }

    if (path === "/api/admin/login" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ success: false, message: "Invalid request." }, 400);
      }

      if (!env.ADMIN_PASSWORD || typeof body.password !== "string") {
        return unauthorized();
      }

      const a = new TextEncoder().encode(body.password);
      const b = new TextEncoder().encode(env.ADMIN_PASSWORD);
      if (a.length !== b.length) return unauthorized();

      let difference = 0;
      for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
      if (difference !== 0) return unauthorized();

      return jsonResponse({
        success: true,
        token: await createToken(env)
      });
    }

    if (path.startsWith("/api/admin/")) {
      if (!(await verifyToken(request, env))) return unauthorized();

      if (path === "/api/admin/messages" && request.method === "GET") {
        try {
          const result = await env.DB.prepare(
            `SELECT id, name, email, message, created_at
             FROM contacts ORDER BY id DESC LIMIT 200`
          ).all();

          return jsonResponse({
            success: true,
            messages: result.results || []
          });
        } catch (error) {
          console.error("Admin messages read failed:", error);
          return jsonResponse({
            success: false,
            message: "Could not load messages."
          }, 500);
        }
      }

      const match = path.match(/^\/api\/admin\/messages\/(\d+)$/);
      if (match && request.method === "DELETE") {
        try {
          const result = await env.DB.prepare(
            "DELETE FROM contacts WHERE id = ?"
          ).bind(Number(match[1])).run();

          if (!result.meta?.changes) {
            return jsonResponse({
              success: false,
              message: "Message not found."
            }, 404);
          }

          return jsonResponse({ success: true, message: "Message deleted." });
        } catch (error) {
          console.error("Admin message delete failed:", error);
          return jsonResponse({
            success: false,
            message: "Could not delete message."
          }, 500);
        }
      }
    }

    return jsonResponse({
      success: false,
      message: "API endpoint not found."
    }, 404);
  }
};
