export default {
  async fetch(request) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    let data;

    if (url.pathname === "/" || url.pathname === "/api/health") {
      data = {
        success: true,
        status: "healthy",
        project: "AASRA Foundation",
        message: "AASRA Foundation API is running."
      };
    } else {
      data = {
        success: false,
        message: "API endpoint not found."
      };
    }

    return new Response(JSON.stringify(data), {
      status: data.success ? 200 : 404,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
};
