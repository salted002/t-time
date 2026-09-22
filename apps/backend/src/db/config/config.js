require('dotenv').config()

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    define: {
      underscored: true,
    },
    dialectOptions:
      process.env.DB_HOST && process.env.DB_HOST.includes('azure')
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    define: {
      underscored: true,
    },
    dialectOptions:
      process.env.DB_HOST && process.env.DB_HOST.includes('azure')
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    define: {
      underscored: true,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
}
