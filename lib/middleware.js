/*!
 * Copyright (c) 2018-2024 Digital Bazaar, Inc. All rights reserved.
 */
import * as bedrock from '@bedrock/core';
import * as brZCapStorage from '@bedrock/zcap-storage';
import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import {
  authorizeZcapInvocation as _authorizeZcapInvocation,
  authorizeZcapRevocation as _authorizeZcapRevocation
} from '@digitalbazaar/ezcap-express';
import {asyncHandler} from '@bedrock/express';
import {documentLoader as brDocLoader} from '@bedrock/jsonld-document-loader';
import {didIo} from '@bedrock/did-io';
import {
  Ed25519Signature2020
} from '@digitalbazaar/ed25519-signature-2020';
import forwarded from 'forwarded';
import {meters} from '@bedrock/meter';
import {Netmask} from 'netmask';

const {config, util: {BedrockError}} = bedrock;

// gets the meter record for the current request and caches it in
// `req.meterRecord`
export const getMeterRecord = asyncHandler(_getMeterRecord);

// calls ezcap-express's authorizeZcapInvocation w/constant params, exposing
// only those params that change in this module
export function authorizeZcapInvocation({
  getExpectedValues, getRootController
}) {
  const {authorizeZcapInvocationOptions} = bedrock.config['meter-http'];
  return _authorizeZcapInvocation({
    documentLoader, getExpectedValues, getRootController,
    getVerifier,
    inspectCapabilityChain,
    onError,
    suiteFactory,
    ...authorizeZcapInvocationOptions
  });
}

// creates middleware for base meter route authz checks
export function authorizeMeterZcapInvocation() {
  const {routes: {basePath}} = config['meter-http'];
  return authorizeZcapInvocation({
    async getExpectedValues({req}) {
      const {server: {baseUri, host}} = config;
      return {
        host,
        rootInvocationTarget:
          `${baseUri}${basePath}/${req.meterRecord.meter.id}`
      };
    },
    async getRootController({req}) {
      // this will always be present based on where this middleware is used
      return req.meterRecord.meter.controller;
    }
  });
}

// creates middleware for meter usage authz checks
export function authorizeMeterUsageZcapInvocation() {
  const {routes: {basePath}} = config['meter-http'];
  return authorizeZcapInvocation({
    async getExpectedValues({req}) {
      const {server: {baseUri, host}} = config;
      return {
        host,
        // only support meter usage URL as root invocation target; root
        // controller of this is the service associated with the meter,
        // not the controller of the meter
        rootInvocationTarget:
          `${baseUri}${basePath}/${req.meterRecord.meter.id}/usage`
      };
    },
    async getRootController({req}) {
      // root controller for meter usage is always the service associated
      // with the meter
      const {meter: {serviceId}} = req.meterRecord;
      return serviceId;
    }
  });
}

// creates middleware for revocation of zcaps for meters
export function authorizeZcapRevocation() {
  return _authorizeZcapRevocation({
    documentLoader,
    expectedHost: config.server.host,
    async getRootController({req}) {
      // this will always be present based on where this middleware is used
      return req.meterRecord.meter.controller;
    },
    getVerifier,
    inspectCapabilityChain,
    onError,
    suiteFactory
  });
}

async function documentLoader(url) {
  let document;
  if(url.startsWith('did:')) {
    document = await didIo.get({did: url});
    return {
      contextUrl: null,
      documentUrl: url,
      document
    };
  }

  // finally, try the bedrock document loader
  return brDocLoader(url);
}

// hook used to verify zcap invocation HTTP signatures
async function getVerifier({keyId, documentLoader}) {
  const {document} = await documentLoader(keyId);
  const key = await Ed25519Multikey.from(document);
  const verificationMethod = await key.export(
    {publicKey: true, includeContext: true});
  const verifier = key.verifier();
  return {verifier, verificationMethod};
}

async function inspectCapabilityChain({
  capabilityChain, capabilityChainMeta
}) {
  // if capability chain has only root, there's nothing to check as root
  // zcaps cannot be revoked
  if(capabilityChain.length === 1) {
    return {valid: true};
  }

  // collect capability IDs and delegators for all delegated capabilities in
  // chain (skip root) so they can be checked for revocation
  const capabilities = [];
  for(const [i, capability] of capabilityChain.entries()) {
    // skip root zcap, it cannot be revoked
    if(i === 0) {
      continue;
    }
    const [{purposeResult}] = capabilityChainMeta[i].verifyResult.results;
    if(purposeResult && purposeResult.delegator) {
      capabilities.push({
        capabilityId: capability.id,
        delegator: purposeResult.delegator.id,
      });
    }
  }

  const revoked = await brZCapStorage.revocations.isRevoked({capabilities});
  if(revoked) {
    return {
      valid: false,
      error: new Error(
        'One or more capabilities in the chain have been revoked.')
    };
  }

  return {valid: true};
}

function onError({error}) {
  if(!(error instanceof BedrockError)) {
    // always expose cause message and name; expose cause details as
    // BedrockError if error is marked public
    let details = {};
    if(error.details && error.details.public) {
      details = error.details;
    }
    error = new BedrockError(
      error.message,
      error.name || 'NotAllowedError', {
        ...details,
        public: true,
      }, error);
  }
  throw new BedrockError(
    'Authorization error.', 'NotAllowedError', {
      httpStatusCode: 403,
      public: true,
    }, error);
}

// hook used to create suites for verifying zcap delegation chains
async function suiteFactory() {
  return new Ed25519Signature2020();
}

async function _getMeterRecord(req, res, next) {
  if(!req.edv) {
    // get meter so its data can be used in the authz check
    const {meterId: id} = req.params;
    const record = await meters.get({id});

    // verify that request is from an IP that is allowed to access the config
    const {verified} = _verifyRequestIp({meter: record.meter, req});
    if(!verified) {
      throw new BedrockError(
        'Permission denied. Source IP is not allowed.', 'NotAllowedError', {
          httpStatusCode: 403,
          public: true,
        });
    }

    req.meterRecord = record;
  }
  next();
}

function _verifyRequestIp({meter, req}) {
  const {ipAllowList} = meter;
  if(!ipAllowList) {
    return {verified: true};
  }

  // the first IP in the sourceAddresses array will *always* be the IP
  // reported by Express.js via `req.connection.remoteAddress`. Any additional
  // IPs will be from the `x-forwarded-for` header.
  const sourceAddresses = forwarded(req);

  // ipAllowList is an array of CIDRs
  for(const cidr of ipAllowList) {
    const netmask = new Netmask(cidr);
    for(const address of sourceAddresses) {
      if(netmask.contains(address)) {
        return {verified: true};
      }
    }
  }

  return {verified: false};
}
