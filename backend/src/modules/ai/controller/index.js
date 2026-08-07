'use strict';

const { logger } = require('../../../utils/logger');

function makeChatAction(chatAssistantUsecase) {
  return async function chatAction(req, res, next) {
    try {
      const { message, history } = req.body || {};
      logger.info({ message }, 'Controller: AI chat action invoked');

      const result = await chatAssistantUsecase({ message, history });

      return res.status(200).json({
        success: true,
        message: 'AI assistant response generated',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error({ error: error.message }, 'Controller: AI chat action failed');
      return next(error);
    }
  };
}

module.exports = {
  makeChatAction
};
