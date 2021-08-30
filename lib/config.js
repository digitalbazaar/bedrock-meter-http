/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import bedrock from 'bedrock';
const {config} = bedrock;

const namespace = 'meter-http';
const cfg = config[namespace] = {};

const basePath = '/meters';
cfg.routes = {
  basePath
};
