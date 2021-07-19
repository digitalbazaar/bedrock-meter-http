/*
 * Copyright (c) 2020-2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const bedrock = require('bedrock');
require('bedrock-https-agent');
require('bedrock-mongodb');
const {handlers} = require('bedrock-meter-http');

bedrock.events.on('bedrock.init', async () => {
  /* Handlers need to be added before `bedrock.start` is called. The empty
  handlers that are added here will be replaced within tests. */
  handlers.setCreateHandler({handler: ({}) => {}});
  handlers.setUpdateHandler({handler: ({}) => {}});
  handlers.setRemoveHandler({handler: () => {}});
  handlers.setUseHandler({handler: () => {}});
});

require('bedrock-test');
bedrock.start();
