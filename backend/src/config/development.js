'use strict';

module.exports = {
    server: {
        port: process.env.PORT || 5000,
        host: process.env.HOST || 'localhost'
    },
    cors: {
        allowedOrigins: [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:8000',
            'https://vfabrica.vercel.app/',
            'https://vfabrica.onrender.com/',
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
        exposedHeaders: []
    },
    security: {
        helmet: {
            contentSecurityPolicy: false
        }
    },
    proxy: {
        frontendPort: 5173
    },
    database: {
        url: process.env.DATABASE_URL
    }
};
