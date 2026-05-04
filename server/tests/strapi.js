const { createStrapi, compileStrapi } = require("@strapi/strapi");

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
