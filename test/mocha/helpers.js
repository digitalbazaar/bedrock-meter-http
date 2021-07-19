/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const database = require('bedrock-mongodb');
const {handlers} = require('bedrock-meter-http');

exports.cleanDB = async () => {
  await database.collections['meter-meter'].deleteMany({});
};

const HANDLER_COUNTS = {
  create: 0,
  update: 0,
  remove: 0,
  use: 0
};
exports.HANDLER_COUNTS = HANDLER_COUNTS;

exports.clearHandlers = () => {
  handlers._HANDLERS.create = null;
  handlers._HANDLERS.update = null;
  handlers._HANDLERS.remove = null;
  handlers._HANDLERS.use = null;
};

exports.setCountHandlers = () => {
  handlers.setCreateHandler({
    handler: ({meter} = {}) => {
      HANDLER_COUNTS.create++;
      return {meter};
    }
  });
  handlers.setUpdateHandler({
    handler: ({meter} = {}) => {
      HANDLER_COUNTS.update++;
      return {meter};
    }
  });
  handlers.setRemoveHandler({
    handler: ({meter} = {}) => {
      HANDLER_COUNTS.remove++;
      return {meter};
    }
  });
  handlers.setUseHandler({
    handler: ({meter} = {}) => {
      HANDLER_COUNTS.use++;
      return {meter};
    }
  });
};

exports.clearHandlerCounts = () => {
  HANDLER_COUNTS.create = 0;
  HANDLER_COUNTS.update = 0;
  HANDLER_COUNTS.remove = 0;
  HANDLER_COUNTS.use = 0;
};

exports.resetCountHandlers = () => {
  exports.clearHandlers();
  exports.setCountHandlers();
  exports.clearHandlerCounts();
};
