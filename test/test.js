/*!
 * Copyright (c) 2020-2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as bedrock from '@bedrock/core';
import {handlers} from '@bedrock/meter-http';
import '@bedrock/app-identity';
import '@bedrock/express';
import '@bedrock/https-agent';
import '@bedrock/meter';
import '@bedrock/mongodb';

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

import '@bedrock/test';
bedrock.start();
