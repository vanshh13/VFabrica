'use strict';

require('dotenv').config();
const { validateEnv } = require('./config/envValidation');
validateEnv();

const app = require('./app');
const { sequelize } = require('../models');
const devConfig = require('./config/development');
const { logger } = require('./utils/logger');

const PORT = devConfig.server.port;
const HOST = devConfig.server.host;

// Test database connection with Sequelize
async function testDatabaseConnection() {
    try {
        await sequelize.authenticate();
        logger.info(
            `Database connected: ${sequelize.config.database}@${sequelize.config.host}:${sequelize.config.port}`
        );
    } catch (error) {
        logger.error(
            {
                error: error.message,
                stack: error.stack,
            },
            'Unable to connect to the database'
        );
        logger.info("Database connection failed");
    }
}

const { initWebSocket } = require('./utils/websocket');

// Start server
async function startServer() {
    try {
        const server = app.listen(PORT, '0.0.0.0', async () => {
            logger.info(`Server is running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`Log level: ${process.env.LOG_LEVEL || 'info'}`);
            logger.info(`Health check: http://localhost:${PORT}/health`);
            logger.info(`Database: ${sequelize.config.database} on ${sequelize.config.host}:${sequelize.config.port}`);
        });

        // Initialize WebSocket Server
        initWebSocket(server);

        // Test database connectivity
        await testDatabaseConnection();

        // Graceful shutdown handling
        const gracefulShutdown = async () => {
            logger.info('Shutdown signal received. Closing server...');

            server.close(async () => {
                logger.info('HTTP server closed');

                // Close Sequelize connection
                try {
                    await sequelize.close();
                    logger.info('Database connection closed successfully');
                } catch (closeError) {
                    logger.error({ error: closeError.message }, 'Error closing database connection');
                }

                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('Could not close connections in time, forcing shutdown');
                process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        // Handle unhandled rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error(
                {
                    reason: reason ? (reason.message || reason) : 'Unknown reason',
                    promise,
                },
                'Unhandled Rejection'
            );
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error(
                {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
                'Uncaught Exception'
            );
            process.exit(1);
        });
    } catch (error) {
        logger.error(
            {
                error: error.message,
                stack: error.stack,
            },
            'Server startup failed'
        );
        process.exit(1);
    }
}

startServer();
