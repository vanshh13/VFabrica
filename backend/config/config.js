'use strict';

require('dotenv').config();

const parseDbUrl = (url) => {
  if (!url) return {};
  try {
    const parsed = new URL(url);
    return {
      username: parsed.username,
      password: parsed.password,
      database: parsed.pathname.replace(/^\//, ''),
      host: parsed.hostname,
      port: parsed.port || 5432
    };
  } catch (e) {
    return {};
  }
};

const dbParams = parseDbUrl(process.env.DATABASE_URL);

module.exports = {
  development: {
    use_env_variable: 'DATABASE_URL',
    username: dbParams.username,
    password: dbParams.password,
    database: dbParams.database,
    host: dbParams.host,
    port: dbParams.port || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  test: {
    use_env_variable: 'DATABASE_URL',
    username: dbParams.username,
    password: dbParams.password,
    database: dbParams.database,
    host: dbParams.host,
    port: dbParams.port || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    username: dbParams.username,
    password: dbParams.password,
    database: dbParams.database,
    host: dbParams.host,
    port: dbParams.port || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
