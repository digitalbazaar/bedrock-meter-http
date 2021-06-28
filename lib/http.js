/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import {asyncHandler} from 'bedrock-express';
import {authorizeZcapInvocation} from '@digitalbazaar/ezcap-express';
import bedrock from 'bedrock';
import {documentLoader} from 'bedrock-jsonld-document-loader';
import {meters} from 'bedrock-meters';
import * as cors from 'cors';
import {logger} from './logger.js';
const {config, util: {BedrockError}} = bedrock;

bedrock.events.on('bedrock-express.configure.routes', app => {
  const routes = {...config['meter-http'].routes};
  routes.meter = `${routes.basePath}/:meterId`;
  routes.meterUsage = `${routes.basePath}/:meterId/usage`;
  routes.revocations = `${routes.basePath}/revocations`;

  /* Note: CORS is used on all endpoints. This is safe because authorization
  uses HTTP signatures + capabilities, not cookies; CSRF is not possible. */

  const authorize = authorizeZcapInvocation({
    expectedHost: config.server.host,
    getRootController,
    documentLoader,
    getExpectedTarget,
    logger,
    onError
  });

  // create a new meter
  app.options(routes.basePath, cors());
  app.post(
    routes.basePath,
    cors(),
    // FIXME: add validation
    //validate({bodySchema: postMeterBody}),
    asyncHandler(async (/*req, res*/) => {
      // FIXME: implement
  }));

  // update meter config
  app.options(routes.meter, cors());
  app.post(
    routes.meter,
    cors(),
    // FIXME: add validation
    //validate({bodySchema: updateMeterBody}),
    authorize,
    asyncHandler(async (req, res) => {
      const {body: meter} = req;
      // FIXME: implement
    }));

  // update meter usage
  app.options(routes.meterUsage, cors());
  app.post(
    routes.meterUsage,
    cors(),
    // FIXME: add validation
    //validate({bodySchema: updateMeterUsageBody}),
    authorize,
    asyncHandler(async (req, res) => {
      const {body: meter} = req;
      // FIXME: implement
    }));

  // get meter usage
  app.get(
    routes.meterUsage,
    cors(),
    authorize,
    asyncHandler(async (req, res) => {
      const {body: meter} = req;
      // FIXME: implement
    }));

});

async function getExpectedTarget({req}) {
  const {body: {id: meterId}} = req;
  const requestUrl = `${req.protocol}://${req.get('host')}${req.url}`;
  if(meterId !== requestUrl) {
    throw new BedrockError(
      'The request URL does not match the meter ID.',
      'URLMismatchError', {
        // this error will be a `cause` in the onError handler below
        // this httpStatusCode is not operative
        httpStatusCode: 400,
        public: true,
        configId,
        requestUrl,
      });
  }
  return {expectedTarget: meterId};
}

async function getRootController({
  req, rootCapabilityId, rootInvocationTarget
}) {
  // get controller for an individual keystore
  let controller;
  try {
    ({controller} = await meters.get({id: rootInvocationTarget}));
  } catch(e) {
    if(e.type === 'NotFoundError') {
      const url = req.protocol + '://' + req.get('host') + req.url;
      throw new Error(
        `Invalid capability identifier "${rootCapabilityId}" ` +
        `for URL "${url}".`);
    }
    throw e;
  }
  return controller;
}

function onError({error}) {
  // cause must be a public BedrockError to be surfaced to the HTTP client
  let cause;
  if(error instanceof BedrockError) {
    cause = error;
  } else {
    cause = new BedrockError(
      error.message,
      error.name || 'NotAllowedError', {
        ...error.details,
        public: true,
      });
  }
  throw new BedrockError(
    'Authorization error.', 'NotAllowedError', {
      httpStatusCode: 403,
      public: true,
    }, cause);
}
