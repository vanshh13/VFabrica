'use strict';

const { sequelize } = require('../../../models');
const dataAccess = require('./data-access');
const makeChatAssistant = require('./usecase/chatAssistant');
const { makeChatAction } = require('./controller');
const createAIRoutes = require('./routes');

const chatAssistantUsecase = makeChatAssistant({
  sequelize,
  getCatalogForAI: dataAccess.getCatalogForAI,
  getProductsByIds: dataAccess.getProductsByIds
});

const chatAction = makeChatAction(chatAssistantUsecase);

const aiRouter = createAIRoutes({
  chatAction
});

module.exports = {
  aiRouter,
  chatAssistantUsecase
};
