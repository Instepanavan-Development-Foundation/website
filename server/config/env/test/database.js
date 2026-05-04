module.exports = ({ env }) => ({
  connection: {
    client: "postgres",
    connection: {
      host: env("DATABASE_HOST", "localhost"),
      port: env.int("DATABASE_PORT", 5432),
      database: env("DATABASE_NAME", "instepanavan"),
      user: env("DATABASE_USERNAME", "strapi"),
      password: env("DATABASE_PASSWORD", "strapi"),
      schema: env("DATABASE_SCHEMA", "public"),
    },
    pool: {
      min: 10,
      max: 100, // Larger pool for concurrent tests with lock operations
    },
    acquireConnectionTimeout: 10000,
  },
});
