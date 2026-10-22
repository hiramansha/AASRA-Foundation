
import { MongoClient } from "mongodb";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    const jsonResponse = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (
      url.pathname === "/" ||
      url.pathname === "/api/health"
    ) {
      return jsonResponse({
        success: true,
        status: "healthy",
        project: "AASRA Foundation",
        message: "AASRA Foundation API is running."
      });
    }

    if (
      url.pathname === "/api/contact" &&
      request.method === "POST"
    ) {
      let body;

      try {
        body = await request.json();
      } catch {
        return jsonResponse({
          success: false,
          message: "Please send valid JSON data."
        }, 400);
      }

      const name = typeof body.name === "string"
        ? body.name.trim()
        : "";

      const email = typeof body.email === "string"
        ? body.email.trim()
        : "";

      const message = typeof body.message === "string"
        ? body.message.trim()
        : "";

      if (!name || !email || !message) {
        return jsonResponse({
          success: false,
          message: "Name, email, and message are required."
        }, 400);
      }

      if (
        name.length > 100 ||
        email.length > 254 ||
        message.length > 3000
      ) {
        return jsonResponse({
          success: false,
          message: "One or more fields are too long."
        }, 400);
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse({
          success: false,
          message: "Please enter a valid email address."
        }, 400);
      }

      let client;

      try {
        client = new MongoClient(env.MONGODB_URI, {
          serverSelectionTimeoutMS: 5000
        });

        await client.connect();

        await client
          .db("aasra")
          .collection("contacts")
          .insertOne({
            name,
            email,
            message,
            createdAt: new Date()
          });

        return jsonResponse({
          success: true,
          message: "Thank you! Your message has been saved successfully."
        }, 201);
      } catch (error) {
        console.error("Contact database operation failed.");

        return jsonResponse({
          success: false,
          message: "We could not save your message. Please try again later."
        }, 500);
      } finally {
        if (client) {
          await client.close().catch(() => {});
        }
      }
    }

    return jsonResponse({
      success: false,
      message: "API endpoint not found."
    }, 404);
  }
};
