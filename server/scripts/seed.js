/**
 * Seeds realistic bugs into MongoDB for AI duplicate-detection testing.
 *
 *   node scripts/seed.js          # remove previously seeded bugs, insert fresh
 *   node scripts/seed.js --reset  # only remove previously seeded bugs
 *
 * Reads real company_id and employee_ids from Mongo, so seeded bugs are
 * indistinguishable from bugs created through the UI.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");

const SEEDLOG = "seedlog";

const BUGS = [
  {
    name: "Password reset email never arrives",
    desc: "Users report that the password reset email does not arrive in their inbox even though the request returns success. We confirmed the mail queue accepts the message but it is never delivered.",
    status: "Open",
    priority: 2,
  },
  {
    name: "Forgot password link does not reach the user",
    desc: "The forgot password flow reports success but the reset link never lands in the user's inbox. Support has received the same complaint from several customers this week.",
    status: "Open",
    priority: 2,
  },
  {
    name: "Payment fails with a valid card on the checkout page",
    desc: "Customers enter valid card details but the payment fails at the final step with a generic error. Reproduced on both desktop and mobile browsers.",
    status: "Under Review",
    priority: 1,
  },
  {
    name: "Card payment is declined on checkout despite valid details",
    desc: "Checkout declines valid cards at the payment step. The card issuer confirms the details are correct so this looks like a payment gateway integration problem.",
    status: "Open",
    priority: 1,
  },
  {
    name: "Session expires unexpectedly after a page refresh",
    desc: "Users are logged out every time they refresh the page. The session cookie appears to be cleared on reload.",
    status: "Open",
    priority: 2,
  },
  {
    name: "Users get signed out automatically when reloading",
    desc: "Reloading any authenticated page signs the user out. Happens consistently in both Chrome and Firefox across all environments.",
    status: "Open",
    priority: 2,
  },
  {
    name: "Dashboard charts are blank on first load",
    desc: "The analytics dashboard renders empty chart areas until the user manually refreshes. Charts populate correctly on the second load.",
    status: "Open",
    priority: 3,
  },
  {
    name: "Notification badge count does not update",
    desc: "The bell icon keeps showing a stale count. New notifications arrive but the badge does not increment until a hard refresh.",
    status: "Open",
    priority: 3,
  },
  {
    name: "Filtering the project list is very slow",
    desc: "Filtering bugs by project takes over ten seconds once a project has more than a thousand bugs. The whole page appears to freeze while waiting.",
    status: "Under Review",
    priority: 2,
  },
  {
    name: "Search returns nothing for an exact bug title",
    desc: "Searching for a full bug title returns zero results but searching for a single keyword from that same title works fine.",
    status: "Open",
    priority: 3,
  },
  {
    name: "Avatar upload fails without any error message",
    desc: "Uploading a profile picture silently fails. No error is shown to the user and the avatar stays unchanged after the upload completes.",
    status: "Open",
    priority: 4,
  },
  {
    name: "CSV export truncates long bug descriptions",
    desc: "Descriptions longer than roughly 200 characters are cut off mid-word in the exported CSV file.",
    status: "Open",
    priority: 3,
  },
  {
    name: "Viewer role can open the admin settings page",
    desc: "A user with the viewer role can navigate directly to the admin settings URL even though the link is hidden in the UI.",
    status: "Open",
    priority: 1,
  },
  {
    name: "Sidebar overlaps content on small screens",
    desc: "Below roughly 800px width the fixed sidebar sits on top of the main content and blocks the close button.",
    status: "Open",
    priority: 3,
  },
  {
    name: "Activity log shows wrong timestamps for UTC users",
    desc: "Timestamps in the activity log render in the server timezone instead of the user's timezone so they appear several hours off.",
    status: "Closed",
    priority: 4,
  },
  {
    name: "Unhandled rate limit error crashes the reports page",
    desc: "When the API returns a 429 the reports page throws an unhandled exception and renders a blank screen instead of a retry message.",
    status: "Under Review",
    priority: 2,
  },
];

function generateBugId() {
  let out = "";
  for (let i = 0; i < 10; i += 1) {
    out += crypto.randomInt(0, 10);
  }
  return `B-${out}`;
}

async function removeSeeded(db) {
  const seeded = await db.collection(SEEDLOG).find({}).toArray();
  const ids = seeded.map((entry) => entry.bug_id).filter(Boolean);
  if (ids.length === 0) return 0;

  const result = await db.collection("bugs").deleteMany({ bug_id: { $in: ids } });
  await db.collection(SEEDLOG).deleteMany({});
  return result.deletedCount;
}

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set. Is server/.env present?");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  console.log("Connected to MongoDB\n");

  const removed = await removeSeeded(db);
  console.log(`Removed ${removed} previously seeded bug(s).`);

  if (process.argv.includes("--reset")) {
    console.log("Reset only. Done.");
    await mongoose.disconnect();
    return;
  }

  const company = await db.collection("companies").findOne({});
  if (!company) {
    console.error("No company found. Create a company first.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const employees = await db
    .collection("employees")
    .find({ company_id: company.company_id })
    .toArray();

  if (employees.length === 0) {
    console.error(`No employees found for ${company.company_name}.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const now = new Date();
  const docs = BUGS.map((bug, index) => {
    const reporter = employees[index % employees.length];
    const assignee = employees[(index + 1) % employees.length];
    return {
      bug_id: generateBugId(),
      bug_name: bug.name,
      bug_description: bug.desc,
      bug_status: bug.status,
      bug_priority: bug.priority,
      company_id: company.company_id,
      reported_by: reporter.employee_id,
      assigned_to: assignee.employee_id,
      notify_users: [],
      comments: [],
      createdAt: now,
      updatedAt: now,
    };
  });

  await db.collection("bugs").insertMany(docs);
  await db
    .collection(SEEDLOG)
    .insertMany(docs.map((doc) => ({ bug_id: doc.bug_id, seeded_at: now })));

  const total = await db.collection("bugs").countDocuments({});
  console.log(`\nSeeded ${docs.length} bugs into ${company.company_name}`);
  console.log(`  company_id : ${company.company_id}`);
  console.log(`  reporters  : ${employees.length} real employees`);
  console.log(`  total bugs : ${total}\n`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
