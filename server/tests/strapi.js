const { createStrapi, compileStrapi } = require("@strapi/strapi");
const { stopRecurringPaymentSystem } = require("../dist/queue/workflow");

let instance;

async function setupStrapi() {
  if (instance) return instance;

  const strapi = createStrapi({
    autoStart: false,
    distDir: "dist", // Use compiled JS config files
  });

  await compileStrapi(strapi);
  await strapi.load();
  await strapi.start();
  instance = strapi;

  return instance;
}

async function cleanupStrapi() {
  if (!instance) return;
  // Stop any in-flight recurring-payments run first. It waits for the current payment
  // to finish — payments call back into this Strapi instance over HTTP, so the server
  // and DB must still be up while it drains. Otherwise a leftover run keeps processing
  // payments against an already-torn-down instance once the next test file starts.
  await stopRecurringPaymentSystem();

  // Don't call instance.stop() — it calls process.exit() internally, which Jest treats
  // as a failure. instance.destroy() is also avoided: it ends with
  // process.removeAllListeners(), which would strip Jest's own process handlers.
  // Instead, replicate the relevant parts of Strapi.destroy() manually:
  // close the HTTP server (frees port 1337 for the next suite), stop Strapi's cron
  // and event hub, then destroy the DB pool.
  await instance.server.destroy();
  instance.cron?.destroy();
  instance.eventHub?.destroy();
  await instance.db.destroy();
  delete global.strapi;
  instance = null;
}

function getStrapi() {
  return instance;
}

module.exports = {
  setupStrapi,
  cleanupStrapi,
  getStrapi,
};
