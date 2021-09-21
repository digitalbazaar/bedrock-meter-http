/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const bedrock = require('bedrock');
const database = require('bedrock-mongodb');
const {handlers} = require('bedrock-meter-http');
const {httpClient, DEFAULT_HEADERS} = require('@digitalbazaar/http-client');
const {agent} = require('bedrock-https-agent');
const {signCapabilityInvocation} = require('http-signature-zcap-invoke');

exports.cleanDB = async () => {
  await database.collections['meter-meter'].deleteMany({});
};

exports.createMeter = async ({meter, invocationSigner}) => {
  const meterService = `${bedrock.config.server.baseUri}/meters`;

  const capability = `urn:zcap:root:${encodeURIComponent(meterService)}`;
  const headers = await signCapabilityInvocation({
    url: meterService, method: 'post', headers: DEFAULT_HEADERS, capability,
    json: meter, invocationSigner, capabilityAction: 'write'
  });

  return httpClient.post(meterService, {agent, json: meter, headers});
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
