/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {config} from '@bedrock/core';

const namespace = 'meter-http';
const cfg = config[namespace] = {};

// list of allowed applications that can create meters
cfg.meterCreationAllowList = [
  // default "app" id found in `bedrock-app-identity`
  'did:key:z6MksNZwi2r6Qxjt3MYLrrZ44gs2fauzgv1dk4E372bNVjtc'
];

const basePath = '/meters';
cfg.routes = {
  basePath
};

cfg.authorizeZcapInvocationOptions = {
  maxChainLength: 10,
  // 300 second clock skew permitted by default
  maxClockSkew: 300,
  // 1 year max TTL by default
  maxDelegationTtl: 1 * 60 * 60 * 24 * 365 * 1000
};
