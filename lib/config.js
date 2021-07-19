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

cfg.usage = {
  // root controller for meter usage
  rootController: {
    id: 'did:key:z6Mkw9Dxjfn3Xi4R4CYV71tpPZqW6Q9Umcpxwy6Td75hN99g',
    keyPair: {
      '@context': 'https://w3id.org/security/suites/ed25519-2020/v1',
      id: 'did:key:z6Mkw9Dxjfn3Xi4R4CYV71tpPZqW6Q9Umcpxwy6Td75hN99g' +
        '#z6Mkw9Dxjfn3Xi4R4CYV71tpPZqW6Q9Umcpxwy6Td75hN99g',
      type: 'Ed25519VerificationKey2020',
      publicKeyMultibase: 'z6Mkw9Dxjfn3Xi4R4CYV71tpPZqW6Q9Umcpxwy6Td75hN99g',
      privateKeyMultibase: 'zrv2XpbeJucgVbmJDjy79uzGPkX2oBvtcAZzHM3s3Fz7d' +
        '34xXy7r931KP1rM4ezT6DVJhas9TmS9aek1iyy9y1PrD1g'
    }
  }
};
// ensure `rootController` is overridden
config.ensureConfigOverride.fields.push('meter-http.usage.rootController');
