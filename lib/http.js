/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as bedrock from '@bedrock/core';
import * as brZCapStorage from '@bedrock/zcap-storage';
import * as handlers from './handlers.js';
import {asyncHandler} from '@bedrock/express';
import {
  authorizeZcapInvocation,
  authorizeMeterZcapInvocation,
  authorizeMeterUsageZcapInvocation,
  authorizeZcapRevocation,
  getMeterRecord
} from './middleware.js';
import cors from 'cors';
import {meters} from '@bedrock/meter';
import {IdGenerator, IdEncoder} from 'bnid';

import './config.js';

const {config, util: {BedrockError}} = bedrock;
const {_HANDLERS: HANDLERS} = handlers;

// 128 bit random id generator
const idGenerator = new IdGenerator({bitLength: 128});
// base58-multibase-multihash encoder
const idEncoder = new IdEncoder({
  encoding: 'base58',
  multibase: true,
  multihash: true
});

bedrock.events.on('bedrock-express.configure.routes', app => {
  const routes = {...config['meter-http'].routes};
  routes.meter = `${routes.basePath}/:meterId`;
  routes.meterUsage = `${routes.basePath}/:meterId/usage`;
  routes.revocations = `${routes.basePath}/zcaps/revocations/:revocationId`;
  routes.meterUsageRevocations =
    `${routes.basePath}/:meterId/usage/zcaps/revocations/:revocationId`;

  /* Note: CORS is used on all endpoints. This is safe because authorization
  uses HTTP signatures + capabilities, not cookies; CSRF is not possible. */

  // create a new meter
  app.options(routes.basePath, cors());
  app.post(
    routes.basePath,
    cors(),
    // FIXME: add validation; do not allow client to set `serviceId`
    //validate({bodySchema: postMeterBody}),
    authorizeZcapInvocation({
      async getExpectedValues() {
        return {
          host: config.server.host,
          // expect root invocation target to match this route; the root zcap
          // will have its controller dynamically set to the meter creation
          // allow list
          rootInvocationTarget: `${config.server.baseUri}${routes.basePath}`
        };
      },
      async getRootController() {
        const cfg = bedrock.config['meter-http'];
        // root controller(s) for meter creation is found in its allow list
        return cfg.meterCreationAllowList;
      }
    }),
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

      const fullId = `${config.server.baseUri}${routes.basePath}/${meter.id}`;
      res.status(201).location(fullId).json({meter});
    }));

  // get meter config
  app.get(
    routes.meter,
    cors(),
    getMeterRecord,
    authorizeMeterZcapInvocation(),
    asyncHandler(async (req, res) => {
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
    getMeterRecord,
    authorizeMeterZcapInvocation(),
    asyncHandler(async (req, res) => {
      let {body: meter} = req;
      const {meterRecord: record} = req;
      const {id: meterId, controller, sequence} = meter;
      if(meterId !== record.meter.id) {
        const requestUrl = `https://${req.get('host')}${req.originalUrl}`;
        throw new BedrockError(
          'The meter "id" in request body does not match its record.',
          'URLMismatchError', {
            httpStatusCode: 400,
            public: true,
            meterId,
            requestUrl,
            expected: record.meter.id,
            actual: meterId,
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
      res.json({meter: updatedMeter});
    }));

  // delete meter
  app.delete(
    routes.meter,
    cors(),
    getMeterRecord,
    authorizeMeterZcapInvocation(),
    asyncHandler(async (req, res) => {
      const {meterId} = req.params;

      await HANDLERS.remove({id: meterId});

      await meters.remove({id: meterId});
      res.sendStatus(204);
    }));

  // insert a revocation based in `/meters/:meterId`
  app.options(routes.revocations, cors());
  app.post(
    routes.revocations,
    cors(),
    //validate({bodySchema: postRevocationBody}),
    getMeterRecord,
    authorizeZcapRevocation(),
    asyncHandler(async (req, res) => {
      const {
        body: capability,
        zcapRevocation: {delegator, capabilityChain}
      } = req;

      // record revocation
      const rootTarget = capabilityChain[0].invocationTarget;
      await brZCapStorage.revocations.insert(
        {delegator, rootTarget, capability});

      // success, no response body
      res.status(204).end();
    }));

  // update meter usage
  app.options(routes.meterUsage, cors());
  app.post(
    routes.meterUsage,
    cors(),
    // FIXME: add validation
    //validate({bodySchema: updateMeterUsageBody}),
    getMeterRecord,
    authorizeMeterUsageZcapInvocation(),
    asyncHandler(async (req, res) => {
      let {body: meter} = req;

      // update meter according to handler result
      ({meter} = await HANDLERS.use({meter}));

      // FIXME: call meters.use()

      // FIXME: implement
      res.sendStatus(503);
    }));

  // get meter usage
  app.get(
    routes.meterUsage,
    cors(),
    getMeterRecord,
    authorizeMeterUsageZcapInvocation(),
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

  // insert a revocation based in `/meters/:meterId/usage`
  app.options(routes.meterUsageRevocations, cors());
  app.post(
    routes.meterUsageRevocations,
    cors(),
    //validate({bodySchema: postRevocationBody}),
    getMeterRecord,
    authorizeZcapRevocation(),
    asyncHandler(async (req, res) => {
      const {
        body: capability,
        zcapRevocation: {delegator, capabilityChain}
      } = req;

      // record revocation
      const rootTarget = capabilityChain[0].invocationTarget;
      await brZCapStorage.revocations.insert(
        {delegator, rootTarget, capability});

      // success, no response body
      res.status(204).end();
    }));
});
