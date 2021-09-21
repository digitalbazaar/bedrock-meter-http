/*
 * Copyright (c) 2020-2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const bedrock = require('bedrock');
require('bedrock-app-identity');
require('bedrock-https-agent');
require('bedrock-mongodb');
const {handlers} = require('bedrock-meter-http');

bedrock.events.on('bedrock.init', async () => {
  /* Handlers need to be added before `bedrock.start` is called. The empty
  handlers that are added here will be replaced within tests. */
  handlers.setCreateHandler({
    handler({meter} = {}) {
      // use mock DID for metered service ID
      meter.serviceId = 'did:key:mock';
      return {meter};
    }
  });
  handlers.setUpdateHandler({handler: ({meter} = {}) => ({meter})});
  handlers.setRemoveHandler({handler: ({meter} = {}) => ({meter})});
  handlers.setUseHandler({handler: ({meter} = {}) => ({meter})});
});

require('bedrock-test');
bedrock.start();
