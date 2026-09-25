/**
 * Cloudflare Pages Function — handles POST /feedback
 *
 * Place this file at:  functions/feedback.js  (repo root, next to
 * wherever your build outputs index.html — NOT inside the build
 * output folder itself). Pages picks up the `functions` directory
 * automatically on every deploy; no separate Worker or URL needed.
 *
 * Because this runs on the same domain as your site, the front end
 * can just POST to "/feedback" — no CORS setup required.
 *
 * Set the secret in: Pages project → Settings → Environment variables
 * → Add variable → name it DISCORD_WEBHOOK_URL → type "Secret" →
 * paste your Discord webhook URL → Save (redeploy if prompted).
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const rating = Number(body.rating);
  const thoughts = typeof body.thoughts === "string" ? body.thoughts.slice(0, 1000) : "";

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return new Response("Invalid rating", { status: 400 });
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
    return new Response("Failed to deliver feedback", { status: 502 });
  }

  return new Response("OK", { status: 200 });
}
