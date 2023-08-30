/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as bedrock from '@bedrock/core';
import * as database from '@bedrock/mongodb';
import {agent} from '@bedrock/https-agent';
import {Ed25519Signature2020} from '@digitalbazaar/ed25519-signature-2020';
import {handlers} from '@bedrock/meter-http';
import {ZcapClient} from '@digitalbazaar/ezcap';

export async function cleanDB() {
  await database.collections['meter-meter'].deleteMany({});
}

export async function createMeter({meter, invocationSigner}) {
  const zcapClient = new ZcapClient({
    agent,
    invocationSigner,
    SuiteClass: Ed25519Signature2020
  });

  // create a meter
  const meterService = `${bedrock.config.server.baseUri}/meters`;
  return zcapClient.write({url: meterService, json: meter});
}

export async function getMeter({meterId, invocationSigner}) {
  const zcapClient = new ZcapClient({
    agent,
    invocationSigner,
    SuiteClass: Ed25519Signature2020
  });

  const meterService = `${bedrock.config.server.baseUri}/meters/${meterId}`;

  return zcapClient.read({url: meterService});
}

export async function updateMeter({meterId, meter, invocationSigner}) {
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
}

export async function deleteMeter({meterId, invocationSigner}) {
  const zcapClient = new ZcapClient({
    agent,
    invocationSigner,
    SuiteClass: Ed25519Signature2020
  });
  const meterService = `${bedrock.config.server.baseUri}/meters/${meterId}`;
  await zcapClient.request({
    url: meterService,
    method: 'delete',
    action: 'write',
  });
}

export async function getMeterUsage({meterId, invocationSigner}) {
  const zcapClient = new ZcapClient({
    agent,
    invocationSigner,
    SuiteClass: Ed25519Signature2020
  });

  const meterService =
    `${bedrock.config.server.baseUri}/meters/${meterId}/usage`;
  return zcapClient.read({url: meterService});
}

export async function updateMeterUsage({meterId, meter, invocationSigner}) {
  const zcapClient = new ZcapClient({
    agent,
    invocationSigner,
    SuiteClass: Ed25519Signature2020
  });

  const meterService =
    `${bedrock.config.server.baseUri}/meters/${meterId}/usage`;
  return zcapClient.write({url: meterService, json: {meter}});
}

export const HANDLER_COUNTS = {
  create: 0,
  update: 0,
  remove: 0,
  use: 0
};

export function clearHandlers() {
  handlers._HANDLERS.create = null;
  handlers._HANDLERS.update = null;
  handlers._HANDLERS.remove = null;
  handlers._HANDLERS.use = null;
}

export function setCountHandlers() {
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
}

export function clearHandlerCounts() {
  HANDLER_COUNTS.create = 0;
  HANDLER_COUNTS.update = 0;
  HANDLER_COUNTS.remove = 0;
  HANDLER_COUNTS.use = 0;
}

export function resetCountHandlers() {
  clearHandlers();
  setCountHandlers();
  clearHandlerCounts();
}
