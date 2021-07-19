/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import {asyncHandler} from 'bedrock-express';
import {authorizeZcapInvocation} from '@digitalbazaar/ezcap-express';
import bedrock from 'bedrock';
import cors from 'cors';
import {documentLoader} from 'bedrock-jsonld-document-loader';
import * as handlers from './handlers.js';
import {IdGenerator, IdEncoder} from 'bnid';
import {logger} from './logger.js';
import {meters} from 'bedrock-meter';
import {ZCAP_CLIENT} from './zcapClient.js';

const {config, util: {BedrockError}} = bedrock;
const {_HANDLERS: HANDLERS} = handlers;

// 128 bit random id generator
const idGenerator = new IdGenerator({bitLength: 128});
// base58-multibase encoder
const idEncoder = new IdEncoder({
  encoding: 'base58', fixedLength: false, multibase: true
});

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
    // FIXME: add validation; do not allow client to set `serviceId`
    //validate({bodySchema: postMeterBody}),
    asyncHandler(async (req, res) => {
      let {body: meter} = req;
      meter.id = idEncoder.encode(await idGenerator.generate());

      /*
      - Create a new meter, requires a registered async hook that is called to
        check if the meter should be created
        - Can be implemented to require and check `zSubscription`
      - Requires a related service DID
      - Requires a `controller`; any controller with a valid `zSubscription` and
        referenced service can create a meter
      - Meter holds a `zMeter` zcap delegated to the service, must be given to
        the service by the user to create new instances at that service
      */

      // update meter according to handler result, if returned
      ({meter} = await HANDLERS.create({meter}));

      // ensure `serviceId` has been set by handler
      if(!(meter.serviceId && typeof meter.serviceId === 'string')) {
        throw new BedrockError(
          'The meter could not be matched with a service.',
          'UnknownError', {
            httpStatusCode: 500,
            public: true,
            meterId: meter.id
          });
      }

      // delegate `zMeter` for usage reporting
      const url = `${req.protocol}://${req.get('host')}${req.url}` +
        `/${meter.id}/usage`;
      meter.usageCapability = await ZCAP_CLIENT.delegate({
        url,
        targetDelegate: meter.serviceId,
        allowedActions: ['read', 'write'],
        // FIXME: use `expires` from config
        expires: undefined
        // FIXME: add refresh service to zcap? ... maybe know to post zcap
        // invocationTarget/revocations or invocationTarget/refresh ?
      });

      // insert meter into database
      await meters.insert({meter});

      res.json({meter});
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
      //const {body: meter} = req;

      /* FIXME
      meters.update
      - Allows `zSubscription` to be updated (but it must be checked and found
        to be a valid value)
      - Allows `controller` to change? Or not?
      - Service cannot be changed, meters are immutably bound to a particular
        service.
      */

      // FIXME: implement
      res.send(503);
    }));

  // delete meter
  app.delete(
    routes.meter,
    cors(),
    authorize,
    asyncHandler(async (req, res) => {
      const {meterId} = req.params;

      await HANDLERS.remove({id: meterId});

      // FIXME: implement
      /*
      meters.remove
      - Removes a meter; details around how that affects billing TBD
      - Removing a meter should disable the service using it to stop
        functioning
      */
      // FIXME: implement
      res.send(503);
    }));

  // update meter usage
  app.options(routes.meterUsage, cors());
  app.post(
    routes.meterUsage,
    cors(),
    // FIXME: add validation
    //validate({bodySchema: updateMeterUsageBody}),
    // FIXME: enable
    //authorize,
    asyncHandler(async (req, res) => {
      //const {body: meter} = req;

      /*
      meters.use
      - Call meters.use() to store stats, get usage back
      - Call usage handler to report meter usage; how to avoid duplicate
        reporting in the face of errors?
      */

      // FIXME: implement
      res.send(503);
    }));

  // get meter usage
  app.get(
    routes.meterUsage,
    cors(),
    // FIXME: enable
    //authorize,
    asyncHandler(async (req, res) => {
      // FIXME: implement

      // FIXME: metering service should report current usage as well as
      // available usage (the latter of which is determined by a custom usage
      // hook for the metering system)

      // FIXME: mock, replace this
      res.json({available: {storage: 100, operations: 100}});
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
        meterId,
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
