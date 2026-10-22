
import { MongoClient } from "mongodb";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (request.method === "GET" &&
        (url.pathname === "/" || url.pathname === "/api/health")) {
      return jsonResponse({
        success: true,
        status: "healthy",
        project: "AASRA Foundation"
      });
    }

    if (url.pathname !== "/api/contact" ||
        request.method !== "POST") {
      return jsonResponse({
        success: false,
        message: "API endpoint not found."
      }, 404);
    }

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

    if (!env.MONGODB_URI) {
      return jsonResponse({
        success: false,
        message: "Database configuration is missing."
      }, 500);
    }

    let client;

    try {
      client = new MongoClient(env.MONGODB_URI);
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
        message: "Thank you! Your message has been submitted successfully."
      }, 201);
    } catch (error) {
      console.error("Contact submission failed:", error);

      return jsonResponse({
        success: false,
        message: "Unable to save your message. Please try again later."
      }, 500);
    } finally {
      if (client) {
        try {
          await client.close();
        } catch (error) {
          console.error("Database connection close failed:", error);
        }
      }
    }
  }
};
