const major = Number(process.versions.node.split(".")[0]);
const isProd = process.env.NODE_ENV === "production" || process.env.DEPLOY_ENV === "production";
const bypassEnabled = process.env.DEV_BYPASS_AUTH === "true";

if (major !== 20) {
  const message =
    `[preflight] Node ${process.version} detected. ` +
    "This repo requires Node 20.x for Firebase Functions.";

  if (isProd) {
    console.error(message);
    process.exit(1);
  }

  console.warn(`${message} Proceeding in non-production.`);
}

if (isProd && bypassEnabled) {
  console.error("[preflight] DEV_BYPASS_AUTH must not be enabled in production.");
  process.exit(1);
}
