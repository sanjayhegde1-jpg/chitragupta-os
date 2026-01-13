const admin = require("firebase-admin");

const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
};

const email = getArg("--email");
const uid = getArg("--uid");
const valueRaw = getArg("--value") || "true";
const value = valueRaw === "true";

if (!email && !uid) {
  console.error("Usage: node scripts/set-director-claim.cjs --email user@example.com [--value true|false]");
  console.error("   or: node scripts/set-director-claim.cjs --uid <uid> [--value true|false]");
  process.exit(1);
}

admin.initializeApp();

const run = async () => {
  let user;
  if (uid) {
    user = await admin.auth().getUser(uid);
  } else {
    user = await admin.auth().getUserByEmail(email);
  }

  await admin.auth().setCustomUserClaims(user.uid, { director: value });
  console.log(`Set director=${value} for uid=${user.uid}`);
};

run().catch((error) => {
  console.error("Failed to set custom claims:", error);
  process.exit(1);
});
