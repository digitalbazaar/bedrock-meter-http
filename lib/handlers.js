/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as bedrock from '@bedrock/core';
import assert from 'assert-plus';

const {util: {BedrockError}} = bedrock;

const HANDLERS = {
  // this handler must be called when creating a new meter as a gating function
  create: null,
  // this handler must be called when updating a new meter as a gating function
  update: null,
  // this handler must be called when removing meter as a gating function
  remove: null,
  // this handler must be called from `.use()` as a gating function
  use: null
};

bedrock.events.on('bedrock.start', async () => {
  _checkHandlerSet({name: 'create', handler: HANDLERS.create});
  _checkHandlerSet({name: 'update', handler: HANDLERS.update});
  _checkHandlerSet({name: 'remove', handler: HANDLERS.remove});
  _checkHandlerSet({name: 'use', handler: HANDLERS.use});
});

export function setCreateHandler({handler} = {}) {
  assert.func(handler, 'handler');
  _checkHandlerNotSet({name: 'create', handler: HANDLERS.create});
  HANDLERS.create = handler;
}

export function setUpdateHandler({handler} = {}) {
  assert.func(handler, 'handler');
  _checkHandlerNotSet({name: 'update', handler: HANDLERS.update});
  HANDLERS.update = handler;
}

export function setRemoveHandler({handler} = {}) {
  assert.func(handler, 'handler');
  _checkHandlerNotSet({name: 'remove', handler: HANDLERS.remove});
  HANDLERS.remove = handler;
}

export function setUseHandler({handler} = {}) {
  assert.func(handler, 'handler');
  _checkHandlerNotSet({name: 'use', handler: HANDLERS.use});
  HANDLERS.use = handler;
}

// expose HANDLERS for testing and internal use only
export const _HANDLERS = HANDLERS;

function _checkHandlerSet({name, handler}) {
  if(!handler) {
    throw new BedrockError(
      'Meter handler not set.',
      'InvalidStateError', {name});
  }
}

function _checkHandlerNotSet({name, handler}) {
  // can only set handlers once
  if(handler) {
    throw new BedrockError(
      'Meter handler already set.',
      'DuplicateError', {name});
  }
}
