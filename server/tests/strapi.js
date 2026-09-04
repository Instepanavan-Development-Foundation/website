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
  // Unregister the Hatchet worker before tearing down the DB connection — otherwise
  // a leftover worker from this file keeps processing events against an already-
  // destroyed pool once the next test file starts its own Strapi instance.
  await stopRecurringPaymentSystem();
  // Don't call instance.stop() — it calls process.exit() internally, which Jest treats as a failure.
  // --forceExit in the test script handles process termination after all tests complete.
  await instance.db.connection.destroy();
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
