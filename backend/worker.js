
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.ADMIN_PASSWORD),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const expected = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode("aasra-admin-session")
    )
  );

  let supplied;

  try {
    const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
    supplied = Uint8Array.from(
      atob(normalized),
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

async function readJson(request) {
  try {
    return { body: await request.json(), error: null };
  } catch {
    return { body: null, error: "Invalid JSON request." };
  }
}

function cleanString(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function validateProgram(body, partial = false) {
  const fields = {};

  if (!partial || body.title !== undefined) {
    fields.title = cleanString(body.title, 150);
    if (!fields.title) return { error: "Program title is required." };
  }

  if (!partial || body.description !== undefined) {
    fields.description = cleanString(body.description, 3000);
    if (!fields.description) {
      return { error: "Program description is required." };
    }
  }

  if (!partial || body.category !== undefined) {
    fields.category = cleanString(body.category, 100) || "Community";
  }

  if (!partial || body.image_url !== undefined) {
    fields.image_url = cleanString(body.image_url, 1000);

    if (fields.image_url) {
      try {
        const imageUrl = new URL(fields.image_url);
        if (!["https:", "http:"].includes(imageUrl.protocol)) {
          return { error: "Image URL must use HTTP or HTTPS." };
        }
      } catch {
        return { error: "Please enter a valid image URL." };
      }
    }
  }

  if (!partial || body.status !== undefined) {
    fields.status = cleanString(body.status, 20) || "active";

    if (!["active", "inactive"].includes(fields.status)) {
      return { error: "Status must be active or inactive." };
    }
  }

  return { fields, error: null };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Health check
    if (
      request.method === "GET" &&
      (path === "/" || path === "/api/health")
    ) {
      return jsonResponse({
        success: true,
        status: "healthy",
        project: "AASRA Foundation"
      });
    }

    // Public programs: only active programs are displayed
    if (path === "/api/programs" && request.method === "GET") {
      try {
        const result = await env.DB.prepare(
          `SELECT id, title, description, category, image_url, status, created_at
           FROM programs
           WHERE status = 'active'
           ORDER BY id ASC`
        ).all();

        return jsonResponse({
          success: true,
          programs: result.results || []
        });
      } catch (error) {
        console.error("Public programs read failed:", error);
        return jsonResponse({
          success: false,
          message: "Could not load programs."
        }, 500);
      }
    }

    // Contact form submission
    if (path === "/api/contact" && request.method === "POST") {
      const { body, error } = await readJson(request);

      if (error) {
        return jsonResponse({ success: false, message: error }, 400);
      }

      const name = cleanString(body?.name, 100);
      const email = cleanString(body?.email, 254);
      const message = cleanString(body?.message, 3000);

      if (
        !name ||
        !email ||
        !message ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        return jsonResponse({
          success: false,
          message: "Please provide a valid name, email, and message."
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

    // Volunteer application submission
    if (path === "/api/volunteer" && request.method === "POST") {
      const { body, error } = await readJson(request);

      if (error) {
        return jsonResponse({ success: false, message: error }, 400);
      }

      const name = cleanString(body?.name, 100);
      const email = cleanString(body?.email, 254);
      const phone = cleanString(body?.phone, 30);
      const skills = cleanString(body?.skills, 500);
      const availability = cleanString(body?.availability, 100);
      const message = cleanString(body?.message, 2000);

      if (
        !name ||
        !email ||
        !skills ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        return jsonResponse({
          success: false,
          message: "Please provide your name, valid email, and skills."
        }, 400);
      }

      try {
        await env.DB.prepare(
          `INSERT INTO volunteers
           (name, email, phone, skills, availability, message, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          name,
          email,
          phone,
          skills,
          availability,
          message,
          new Date().toISOString()
        ).run();

        return jsonResponse({
          success: true,
          message: "Thank you for volunteering! Your application was submitted successfully."
        }, 201);
      } catch (error) {
        console.error("Volunteer submission failed:", error);
        return jsonResponse({
          success: false,
          message: "Unable to submit your application. Please try again later."
        }, 500);
      }
    }

    // Admin login
    if (path === "/api/admin/login" && request.method === "POST") {
      const { body, error } = await readJson(request);

      if (error) {
        return jsonResponse({ success: false, message: error }, 400);
      }

      if (!env.ADMIN_PASSWORD || typeof body?.password !== "string") {
        return unauthorized();
      }

      const supplied = new TextEncoder().encode(body.password);
      const actual = new TextEncoder().encode(env.ADMIN_PASSWORD);

      if (supplied.length !== actual.length) return unauthorized();

      let difference = 0;

      for (let i = 0; i < supplied.length; i++) {
        difference |= supplied[i] ^ actual[i];
      }

      if (difference !== 0) return unauthorized();

      return jsonResponse({
        success: true,
        token: await createToken(env)
      });
    }

    // Protect all remaining admin routes
    if (path.startsWith("/api/admin/")) {
      if (!(await verifyToken(request, env))) {
        return unauthorized();
      }

      // Get contact messages
      if (path === "/api/admin/messages" && request.method === "GET") {
        try {
          const result = await env.DB.prepare(
            `SELECT id, name, email, message, created_at
             FROM contacts
             ORDER BY id DESC
             LIMIT 200`
          ).all();

          return jsonResponse({
            success: true,
            messages: result.results || []
          });
        } catch (error) {
          console.error("Admin messages read failed:", error);
          return jsonResponse({
            success: false,
            message: "Could not load contact messages."
          }, 500);
        }
      }

      // Get volunteer applications
      if (path === "/api/admin/volunteers" && request.method === "GET") {
        try {
          const result = await env.DB.prepare(
            `SELECT id, name, email, phone, skills, availability,
                    message, created_at
             FROM volunteers
             ORDER BY id DESC
             LIMIT 200`
          ).all();

          return jsonResponse({
            success: true,
            volunteers: result.results || []
          });
        } catch (error) {
          console.error("Admin volunteers read failed:", error);
          return jsonResponse({
            success: false,
            message: "Could not load volunteer applications."
          }, 500);
        }
      }

      // Get all programs for admin, including inactive ones
      if (path === "/api/admin/programs" && request.method === "GET") {
        try {
          const result = await env.DB.prepare(
            `SELECT id, title, description, category, image_url, status, created_at
             FROM programs
             ORDER BY id DESC
             LIMIT 500`
          ).all();

          return jsonResponse({
            success: true,
            programs: result.results || []
          });
        } catch (error) {
          console.error("Admin programs read failed:", error);
          return jsonResponse({
            success: false,
            message: "Could not load programs."
          }, 500);
        }
      }

      // Create a program
      if (path === "/api/admin/programs" && request.method === "POST") {
        const { body, error } = await readJson(request);

        if (error) {
          return jsonResponse({ success: false, message: error }, 400);
        }

        const validation = validateProgram(body || {});

        if (validation.error) {
          return jsonResponse({
            success: false,
            message: validation.error
          }, 400);
        }

        const { title, description, category, image_url, status } =
          validation.fields;

        try {
          const result = await env.DB.prepare(
            `INSERT INTO programs
             (title, description, category, image_url, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).bind(
            title,
            description,
            category,
            image_url,
            status,
            new Date().toISOString()
          ).run();

          return jsonResponse({
            success: true,
            message: "Program created successfully.",
            id: result.meta?.last_row_id
          }, 201);
        } catch (error) {
          console.error("Program creation failed:", error);
          return jsonResponse({
            success: false,
            message: "Could not create program."
          }, 500);
        }
      }

      // Update a program
      const programMatch = path.match(/^\/api\/admin\/programs\/(\d+)$/);

      if (programMatch && request.method === "PUT") {
        const id = Number(programMatch[1]);
        const { body, error } = await readJson(request);

        if (error) {
          return jsonResponse({ success: false, message: error }, 400);
        }

        const validation = validateProgram(body || {}, true);

        if (validation.error) {
          return jsonResponse({
            success: false,
            message: validation.error
          }, 400);
        }

        const fields = validation.fields;
        const allowedFields = [
          "title", "description", "category", "image_url", "status"
        ];
        const keys = allowedFields.filter(key => fields[key] !== undefined);

        if (!keys.length) {
          return jsonResponse({
            success: false,
            message: "No program fields were provided."
          }, 400);
        }

        const assignments = keys.map(key => `${key} = ?`).join(", ");
        const values = keys.map(key => fields[key]);

        try {
          const result = await env.DB.prepare(
            `UPDATE programs SET ${assignments} WHERE id = ?`
          ).bind(...values, id).run();

          if (!result.meta?.changes) {
            return jsonResponse({
              success: false,
              message: "Program not found or no changes were made."
            }, 404);
          }

          return jsonResponse({
            success: true,
            message: "Program updated successfully."
          });
        } catch (error) {
          console.error("Program update failed:", error);
          return jsonResponse({
            success: false,
            message: "Could not update program."
          }, 500);
        }
      }

      // Delete a program
      if (programMatch && request.method === "DELETE") {
        try {
          const result = await env.DB.prepare(
            "DELETE FROM programs WHERE id = ?"
          ).bind(Number(programMatch[1])).run();

          if (!result.meta?.changes) {
            return jsonResponse({
              success: false,
              message: "Program not found."
            }, 404);
          }

          return jsonResponse({
            success: true,
            message: "Program deleted successfully."
          });
        } catch (error) {
          console.error("Program deletion failed:", error);
          return jsonResponse({
            success: false,
            message: "Could not delete program."
          }, 500);
        }
      }

      // Delete volunteer application
      const volunteerMatch = path.match(
        /^\/api\/admin\/volunteers\/(\d+)$/
      );

      if (volunteerMatch && request.method === "DELETE") {
        try {
          const result = await env.DB.prepare(
            "DELETE FROM volunteers WHERE id = ?"
          ).bind(Number(volunteerMatch[1])).run();

          if (!result.meta?.changes) {
            return jsonResponse({
              success: false,
              message: "Volunteer application not found."
            }, 404);
          }

          return jsonResponse({
            success: true,
            message: "Volunteer application deleted."
          });
        } catch (error) {
          console.error("Volunteer delete failed:", error);
          return jsonResponse({
            success: false,
            message: "Could not delete volunteer application."
          }, 500);
        }
      }

      // Delete contact message
      const messageMatch = path.match(
        /^\/api\/admin\/messages\/(\d+)$/
      );

      if (messageMatch && request.method === "DELETE") {
        try {
          const result = await env.DB.prepare(
            "DELETE FROM contacts WHERE id = ?"
          ).bind(Number(messageMatch[1])).run();

          if (!result.meta?.changes) {
            return jsonResponse({
              success: false,
              message: "Message not found."
            }, 404);
          }

          return jsonResponse({
            success: true,
            message: "Message deleted."
          });
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
