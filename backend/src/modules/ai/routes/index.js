'use strict';

const { Router } = require('express');

function createAIRoutes({ chatAction }) {
  const router = Router();

  router.post('/chat', chatAction);

  return router;
}

module.exports = createAIRoutes;
