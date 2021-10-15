/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import {asyncHandler} from 'bedrock-express';
import {authorizeZcapInvocation} from '@digitalbazaar/ezcap-express';
import bedrock from 'bedrock';
import cors from 'cors';
import {didIo} from 'bedrock-did-io';
import {documentLoader as brDocLoader} from 'bedrock-jsonld-document-loader';
import * as handlers from './handlers.js';
import {IdGenerator, IdEncoder} from 'bnid';
import {logger} from './logger.js';
import {meters} from 'bedrock-meter';
import './config.js';

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

  // create a new meter
  app.options(routes.basePath, cors());
  app.post(
    routes.basePath,
    cors(),
    _createAuthorizeMiddleware({
      getExpectedTarget({req}) {
        const expectedTarget = `https://${req.get('host')}${routes.basePath}`;
        return {expectedTarget};
      },
      getRootController() {
        const cfg = bedrock.config['meter-http'];
        // root controller(s) for meter creation is found in its allow list
        return cfg.meterCreationAllowList;
      }
    }),
    // FIXME: add validation; do not allow client to set `serviceId`
    //validate({bodySchema: postMeterBody}),
    asyncHandler(async (req, res) => {
      let {body: meter} = req;
      meter.id = idEncoder.encode(await idGenerator.generate());

      // update meter according to handler result
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

      // insert meter into database
      ({meter} = await meters.insert({meter}));

      res.json({meter});
    }));

  // get meter config
  app.get(
    routes.meter,
    cors(),
    _addMeterRecordToRequest(),
    _createAuthorizeMiddleware({
      getExpectedTarget({req}) {
        // only support update meter config URL as expected target; controller
        // is the controller of the meter
        const baseUrl = `https://${req.get('host')}${routes.basePath}`;
        const expectedTarget =
          `${baseUrl}/${encodeURIComponent(req.params.meterId)}`;
        return {expectedTarget};
      },
      getRootController({req}) {
        // root controller for update meter config is always the controller of
        // the meter
        const {meter: {controller}} = req.meterRecord;
        return controller;
      }
    }),
    asyncHandler(async (req, res) => {
      // get meter record
      const {meterRecord: record} = req;

      // return `id`, `controller`, `product`, and `sequence` only
      const {meter: {id, controller, product, sequence}} = record;
      res.json({meter: {id, controller, product, sequence}});
    }));

  // update meter config
  app.options(routes.meter, cors());
  app.post(
    routes.meter,
    cors(),
    // FIXME: add validation
    //validate({bodySchema: updateMeterBody}),
    _addMeterRecordToRequest(),
    _createAuthorizeMiddleware({
      getExpectedTarget({req}) {
        // only support update meter config URL as expected target; controller
        // is the controller of the meter
        const baseUrl = `https://${req.get('host')}${routes.basePath}`;
        const expectedTarget =
          `${baseUrl}/${encodeURIComponent(req.params.meterId)}`;
        return {expectedTarget};
      },
      getRootController({req}) {
        // root controller for update meter config is always the controller of
        // the meter
        const {meter: {controller}} = req.meterRecord;
        return controller;
      }
    }),
    asyncHandler(async (req, res) => {
      let {body: meter} = req;
      // get meter record
      const {meterRecord: record} = req;

      const {id: meterId, controller, sequence} = meter;
      if(meterId !== record.meter.id) {
        throw new BedrockError(
          'The meter id in request body does not match its record.',
          'DataError', {
            httpStatusCode: 400,
            public: true,
            expectedMeterId: record.meter.id,
            actualMeterId: meterId,
          });
      }

      // update meter according to handler result
      // note: handler can throw if the update would be
      // unacceptable for any custom reason
      ({meter} = await HANDLERS.update({
        meter, currentMeterRecord: req.meterRecord
      }));

      // update the meter
      const updatedMeter = {
        ...record.meter,
        // allows controller to be updated
        controller,
        // allows sequence to be updated
        sequence
      };

      await meters.update({meter: updatedMeter});

      // break out of the loop and return a successful response if the
      // meter was successfully updated
      res.json({success: true, meter: updatedMeter});
    }));

  // delete meter
  app.delete(
    routes.meter,
    cors(),
    _createAuthorizeMiddleware({
      getExpectedTarget({req}) {
        const baseUrl = `https://${req.get('host')}${routes.basePath}`;
        const meterId = `${baseUrl}/${encodeURIComponent(req.params.meterId)}`;
        return {expectedTarget: [baseUrl, meterId]};
      }
    }),
    asyncHandler(async (req, res) => {
      const {meterId} = req.params;

      await HANDLERS.remove({id: meterId});

      // FIXME: remove meter via meters.remove()

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
    _addMeterRecordToRequest(),
    _createAuthorizeMiddleware({
      getExpectedTarget({req}) {
        // only support meter usage URL as expected target; controller is
        // the metering service itself, not the controller of the meter
        const baseUrl = `https://${req.get('host')}${routes.basePath}`;
        const expectedTarget =
          `${baseUrl}/${encodeURIComponent(req.params.meterId)}/usage`;
        return {expectedTarget};
      },
      getRootController({req}) {
        // root controller for meter usage is always the service associated
        // with the meter
        const {meter: {serviceId}} = req.meterRecord;
        return serviceId;
      }
    }),
    asyncHandler(async (req, res) => {
      let {body: meter} = req;

      // update meter according to handler result
      ({meter} = await HANDLERS.use({meter}));

      // FIXME: call meters.use()

      // FIXME: implement
      res.send(503);
    }));

  // get meter usage
  app.get(
    routes.meterUsage,
    cors(),
    _addMeterRecordToRequest(),
    _createAuthorizeMiddleware({
      getExpectedTarget({req}) {
        // only support meter usage URL as expected target; controller is
        // the metering service itself, not the controller of the meter
        const baseUrl = `https://${req.get('host')}${routes.basePath}`;
        const expectedTarget =
          `${baseUrl}/${encodeURIComponent(req.params.meterId)}/usage`;
        return {expectedTarget};
      },
      getRootController({req}) {
        // root controller for meter usage is always the service associated
        // with the meter
        const {meter: {serviceId}} = req.meterRecord;
        return serviceId;
      }
    }),
    asyncHandler(async (req, res) => {
      // get meter record
      const {meterRecord: record} = req;

      // FIXME: metering service should report current usage as well as
      // available usage (the latter of which is determined by a custom usage
      // hook for the metering system)

      // return `id`, `controller`, `product`, `sequence`, `serviceId`,
      // and `usage` only
      const {meter: {id, controller, product, sequence, serviceId}} = record;
      res.json({
        id,
        controller,
        product,
        sequence,
        serviceId,
        // FIXME: mock, replace this
        usage: {available: {storage: 100, operations: 100}}
      });
    }));
});

function _addMeterRecordToRequest() {
  return asyncHandler(async function(req, res, next) {
    // get meter so its data can be used in the authz check
    const {meterId: id} = req.params;
    const record = await meters.get({id});
    req.meterRecord = record;
    // call `next` on the next tick to ensure the promise from this function
    // resolves and does not reject because some subsequent middleware throws
    // an error
    process.nextTick(next);
  });
}

function _createAuthorizeMiddleware({
  getRootController = _getRootController,
  getExpectedTarget = _getExpectedTarget
} = {}) {
  return authorizeZcapInvocation({
    expectedHost: config.server.host,
    getRootController,
    documentLoader: _documentLoader,
    getExpectedTarget,
    logger,
    onError
  });
}

async function _documentLoader(url) {
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

async function _getExpectedTarget({req}) {
  const {body: {id: meterId}} = req;
  const requestUrl = `https://${req.get('host')}${req.url}`;
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

async function _getRootController({
  req, rootCapabilityId, rootInvocationTarget
}) {
  // get controller for an individual keystore
  let controller;
  try {
    ({controller} = await meters.get({id: rootInvocationTarget}));
  } catch(e) {
    if(e.type === 'NotFoundError') {
      const url = `https://${req.get('host')}${req.url}`;
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
