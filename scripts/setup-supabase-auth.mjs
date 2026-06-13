const PROJECT_REF = "vthefxwlwecyjsrznchr";
const SITE_URL = "https://chrono-share.vercel.app";
const REDIRECTS = [
  "http://localhost:5173/reset-password",
  "http://localhost:5173/**",
  "https://chrono-share.vercel.app/reset-password",
  "https://chrono-share.vercel.app/**",
  "https://*.vercel.app/**",
];

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error(
      "Missing SUPABASE_ACCESS_TOKEN.\n" +
        "Create one at https://supabase.com/dashboard/account/tokens then run:\n" +
        "  $env:SUPABASE_ACCESS_TOKEN=\"your-token\"; npm run setup:supabase-auth",
    );
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const getRes = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    { headers },
  );

  if (!getRes.ok) {
    const text = await getRes.text();
    throw new Error(`Failed to read auth config (${getRes.status}): ${text}`);
  }

  const current = await getRes.json();
  const existing = (current.uri_allow_list ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const merged = [...new Set([...existing, ...REDIRECTS])];

  const patchRes = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        site_url: SITE_URL,
        uri_allow_list: merged.join(","),
        mailer_autoconfirm: true,
      }),
    },
  );

  if (!patchRes.ok) {
    const text = await patchRes.text();
    throw new Error(`Failed to update auth config (${patchRes.status}): ${text}`);
  }

  const updated = await patchRes.json();
  console.log("Supabase auth configured successfully.");
  console.log("Site URL:", updated.site_url ?? SITE_URL);
  console.log("Redirect URLs:", updated.uri_allow_list ?? merged.join(","));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
