import {
  defineRailway,
  github,
  postgres,
  preserve,
  project,
  service,
} from "railway/iac";

// Infrastructure as Code for diaspora-direct-pay. Railway does not read this file while
// deploying: apply it with `railway config apply`. It replaces an auto-detected
// setup with an explicit builder, pre-deploy migration and health check.
//
// Secrets are deliberately absent. Set them on Railway with
// `railway variables --set ...` and keep them in preserve() so an apply does
// not delete or overwrite the stored values.
export default defineRailway(() => {
  const db = postgres("Postgres");

  const app = service("diaspora-direct-pay", {
    source: github("keanehatescoding/diaspora-direct-pay", { branch: "master" }),
    build: { builder: "RAILPACK" },
    start: "npm start",
    // Apply the checked-in Drizzle migrations before the new version serves traffic.
    preDeploy: "npm run db:migrate",
    // Checks the database, not just that the process is listening.
    healthcheck: "/api/health",
    variables: {
      // Injected from the Postgres service on Railway's private network.
      DATABASE_URL: db.env.DATABASE_URL,
      // Public base URL, set on Railway; used by links in generated emails.
      APP_URL: preserve(),
    },
  });

  return project("diaspora-direct-pay", { resources: [app, db] });
});
