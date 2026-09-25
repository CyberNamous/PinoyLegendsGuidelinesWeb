/**
 * Pinoy Legends — feedback proxy Worker.
 *
 * Receives { rating, thoughts } from the rules page, builds a Discord
 * embed, and forwards it to a Discord webhook. The webhook URL itself
 * lives only in this Worker's secret (env.DISCORD_WEBHOOK_URL) — it is
 * never sent to or visible from the browser.
 *
 * Deploy:
 *   1. wrangler deploy
 *   2. wrangler secret put DISCORD_WEBHOOK_URL
 *      (paste your Discord webhook URL when prompted)
 *   3. Copy the resulting *.workers.dev URL into FEEDBACK_ENDPOINT_URL
 *      in pinoy-legends-rules.html.
 *
 * Before going live, change ALLOWED_ORIGIN below from "*" to your
 * actual site origin so only your page can call this Worker.
 */

const ALLOWED_ORIGIN = "guidelines-pinoylegends.pages.dev"; // e.g. "https://your-domain.com"

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders() });
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return new Response("Invalid JSON", { status: 400, headers: corsHeaders() });
    }

    const rating = Number(body.rating);
    const thoughts = typeof body.thoughts === "string" ? body.thoughts.slice(0, 1000) : "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return new Response("Invalid rating", { status: 400, headers: corsHeaders() });
    }

    const discordPayload = {
      embeds: [
        {
          title: "Pinoy Legends — Anonymous Feedback",
          color: 0xc9a463,
          fields: [
            { name: "Rating", value: `${rating} / 5`, inline: true },
            { name: "Thoughts", value: thoughts || "No additional comments provided." },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const discordRes = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    });

    if (!discordRes.ok) {
      return new Response("Failed to deliver feedback", { status: 502, headers: corsHeaders() });
    }

    return new Response("OK", { status: 200, headers: corsHeaders() });
  },
};
