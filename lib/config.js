/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import bedrock from 'bedrock';
const {config} = bedrock;

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
