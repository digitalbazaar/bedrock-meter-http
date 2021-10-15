/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const bedrock = require('bedrock');
const database = require('bedrock-mongodb');
const {Ed25519Signature2020} = require('@digitalbazaar/ed25519-signature-2020');
const {handlers} = require('bedrock-meter-http');
const {agent} = require('bedrock-https-agent');
const {ZcapClient} = require('@digitalbazaar/ezcap');

exports.cleanDB = async () => {
  await database.collections['meter-meter'].deleteMany({});
};

exports.createMeter = async ({meter, invocationSigner}) => {
  const zcapClient = new ZcapClient({
    agent,
    invocationSigner,
    SuiteClass: Ed25519Signature2020
  });

  // create a meter
  const meterService = `${bedrock.config.server.baseUri}/meters`;
  return zcapClient.write({url: meterService, json: meter});
};

exports.getMeter = async ({meterId, invocationSigner}) => {
  const zcapClient = new ZcapClient({
    agent,
    invocationSigner,
    SuiteClass: Ed25519Signature2020
  });

  const meterService = `${bedrock.config.server.baseUri}/meters/${meterId}`;

  return zcapClient.read({url: meterService});
};

exports.updateMeter = async ({meterId, meter, invocationSigner}) => {
  const zcapClient = new ZcapClient({
    agent,
    invocationSigner,
    SuiteClass: Ed25519Signature2020
  });

  // create a meter
  if(!meterId) {
    ({id: meterId} = meter);
  }

  const meterService = `${bedrock.config.server.baseUri}/meters/${meterId}`;

  if(!(Number.isInteger(meter.sequence) && meter.sequence >= 0)) {
    throw new Error(`"meter.sequence" not found.`);
  }

  ++meter.sequence;

  return zcapClient.write({url: meterService, json: meter});
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
