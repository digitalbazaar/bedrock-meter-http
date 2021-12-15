/*
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const {getAppIdentity} = require('bedrock-app-identity');
const {
  clearHandlers, createMeter, getMeter, resetCountHandlers, updateMeter,
  deleteMeter, getMeterUsage, updateMeterUsage
} = require('./helpers');
const {handlers} = require('bedrock-meter-http');
const {decodeSecretKeySeed} = require('bnid');
const didKey = require('@digitalbazaar/did-method-key');

const didKeyDriver = didKey.driver();

describe('api', () => {
  describe('setHandler', () => {
    beforeEach(async () => {
      clearHandlers();
    });
    // empty handler
    const _h = ({meter} = {}) => ({meter});
    it('setCreateHandler', async () => {
      handlers.setCreateHandler({handler: _h});
    });
    it('setUpdateHandler', async () => {
      handlers.setUpdateHandler({handler: _h});
    });
    it('setRemoveHandler', async () => {
      handlers.setRemoveHandler({handler: _h});
    });
    it('setUseHandler', async () => {
      handlers.setUseHandler({handler: _h});
    });
    it('setCreateHandler without function', async () => {
      let err;
      try {
        handlers.setCreateHandler({handler: null});
      } catch(e) {
        err = e;
      }
      should.exist(err);
      err.name.should.equal('AssertionError');
    });
    it('setUpdateHandler without function', async () => {
      let err;
      try {
        handlers.setUpdateHandler({handler: null});
      } catch(e) {
        err = e;
      }
      should.exist(err);
      err.name.should.equal('AssertionError');
    });
    it('setRemoveHandler without function', async () => {
      let err;
      try {
        handlers.setRemoveHandler({handler: null});
      } catch(e) {
        err = e;
      }
      should.exist(err);
      err.name.should.equal('AssertionError');
    });
    it('setUseHandler without function', async () => {
      let err;
      try {
        handlers.setUseHandler({handler: null});
      } catch(e) {
        err = e;
      }
      should.exist(err);
      err.name.should.equal('AssertionError');
    });
    it('setCreateHandler twice', async () => {
      handlers.setCreateHandler({handler: _h});
      let err;
      try {
        handlers.setCreateHandler({handler: _h});
      } catch(e) {
        err = e;
      }
      should.exist(err);
      err.name.should.equal('DuplicateError');
    });
    it('setUpdateHandler twice', async () => {
      handlers.setUpdateHandler({handler: _h});
      let err;
      try {
        handlers.setUpdateHandler({handler: _h});
      } catch(e) {
        err = e;
      }
      should.exist(err);
      err.name.should.equal('DuplicateError');
    });
    it('setRemoveHandler twice', async () => {
      handlers.setRemoveHandler({handler: _h});
      let err;
      try {
        handlers.setRemoveHandler({handler: _h});
      } catch(e) {
        err = e;
      }
      should.exist(err);
      err.name.should.equal('DuplicateError');
    });
    it('setUseHandler twice', async () => {
      handlers.setUseHandler({handler: _h});
      let err;
      try {
        handlers.setUseHandler({handler: _h});
      } catch(e) {
        err = e;
      }
      should.exist(err);
      err.name.should.equal('DuplicateError');
    });
  });

  describe('http create meter', () => {
    beforeEach(async () => {
      resetCountHandlers();
    });
    it('create successfully', async () => {
      const {id: controller, keys} = getAppIdentity();
      const invocationSigner = keys.capabilityInvocationKey.signer();

      const meter = {
        controller,
        product: {
          // mock ID for webkms service product
          id: 'urn:uuid:80a82316-e8c2-11eb-9570-10bf48838a41',
        },
        serviceId: 'mockWebKmsServiceId'
      };

      const {data, status} = await createMeter({meter, invocationSigner});
      // meter service should return a response with status code `200`
      status.should.equal(200);
      // meter should send well formed response JSON body
      should.exist(data);
      should.exist(data.meter);
      should.exist(data.meter.id);
      should.exist(data.meter.controller);
      should.exist(data.meter.serviceId);
      should.exist(data.meter.product);
      should.exist(data.meter.product.id);
      // meter should return the same data used in the body in the request
      data.meter.controller.should.equal(meter.controller);
      data.meter.product.id.should.equal(meter.product.id);
      data.meter.serviceId.should.equal(meter.serviceId);
    });
    it('throw error if serviceId is not set', async () => {
      const {id: controller, keys} = getAppIdentity();
      const invocationSigner = keys.capabilityInvocationKey.signer();

      const meter = {
        controller,
        product: {
          // mock ID for webkms service product
          id: 'urn:uuid:80a82316-e8c2-11eb-9570-10bf48838a41',
        },
      };
      let data;
      let err;
      try {
        ({data} = await createMeter({meter, invocationSigner}));
      } catch(e) {
        err = e;
      }
      should.not.exist(data);
      should.exist(err);
      err.message.should.equal(
        'The meter could not be matched with a service.');
    });
  });

  describe('http get meter', () => {
    beforeEach(async () => {
      resetCountHandlers();
    });
    it('get successfully', async () => {
      const {id: controller, keys} = getAppIdentity();
      const invocationSigner = keys.capabilityInvocationKey.signer();

      const meter = {
        controller,
        product: {
          // mock ID for webkms service product
          id: 'urn:uuid:80a82316-e8c2-11eb-9570-10bf48838a41',
        },
        serviceId: 'mockWebKmsServiceId'
      };

      let result;
      let error;
      try {
        const {data} = await createMeter({meter, invocationSigner});
        const {meter: {id: meterId}} = data;
        result = await getMeter({meterId, invocationSigner});
      } catch(e) {
        error = e;
      }

      should.not.exist(error);
      should.exist(result);

      const {data, status} = result;
      // meter service should return a response with status code `200`
      status.should.equal(200);
      // meter should send well formed response JSON body
      should.exist(data);
      should.exist(data.meter);
      should.exist(data.meter.id);
      should.exist(data.meter.controller);
      should.exist(data.meter.product);
      should.exist(data.meter.product.id);
      // meter should return the same data used in the body in the request
      data.meter.controller.should.equal(meter.controller);
      data.meter.product.id.should.equal(meter.product.id);
    });
  });
  describe('http delete meter', () => {
    beforeEach(async () => {
      resetCountHandlers();
    });
    it('delete successfully', async () => {
      // create meter --> get meter ---> delete meter ---> get meter
      const {id: controller, keys} = getAppIdentity();
      const invocationSigner = keys.capabilityInvocationKey.signer();

      const meter = {
        controller,
        product: {
          // mock ID for webkms service product
          id: 'urn:uuid:80a82316-e8c2-11eb-9570-10bf48838a41',
        },
        serviceId: 'mock-service-id'
      };

      let result;
      let err;
      let meterId;
      try {
        const {data} = await createMeter({meter, invocationSigner});
        ({meter: {id: meterId}} = data);
        result = await getMeter({meterId, invocationSigner});
      } catch(e) {
        err = e;
      }

      should.not.exist(err);
      should.exist(result);

      const {data, status} = result;
      // meter service should return a response with status code `200`
      status.should.equal(200);
      // meter should send well formed response JSON body
      should.exist(data);
      should.exist(data.meter);
      should.exist(data.meter.id);
      should.exist(data.meter.controller);
      should.exist(data.meter.product);
      should.exist(data.meter.product.id);
      // meter should return the same data used in the body in the request
      data.meter.controller.should.equal(meter.controller);
      data.meter.product.id.should.equal(meter.product.id);

      let err1;
      try {
        // delete meter that was created
        await deleteMeter({meterId, invocationSigner});
      } catch(e) {
        err1 = e;
      }
      should.not.exist(err1);

      let result2;
      let err2;
      try {
        // then try to get the meter again, should get meter not found error
        result2 = await getMeter({meterId, invocationSigner});
      } catch(e) {
        err2 = e;
      }
      should.not.exist(result2);
      should.exist(err2);
      const {data: data2, response} = err2;
      // meter service should return a response with status code `404`
      response.status.should.equal(404);

      data2.type.should.equal('NotFoundError');
      data2.details.httpStatusCode.should.equal(404);
    });
  });
  describe('http update meter', () => {
    beforeEach(async () => {
      resetCountHandlers();
    });
    it('update successfully', async () => {
      const {id: controller, keys} = getAppIdentity();
      const invocationSigner = keys.capabilityInvocationKey.signer();

      const meter = {
        controller,
        product: {
          // mock ID for webkms service product
          id: 'urn:uuid:80a82316-e8c2-11eb-9570-10bf48838a41',
        },
        serviceId: 'mockWebKmsServiceId'
      };

      const {data: meterData} = await createMeter({meter, invocationSigner});

      let result;
      let error;

      const updatedController = 'updated-controller';
      try {
        result = await updateMeter({
          meter: {
            ...meterData.meter,
            controller: updatedController
          },
          invocationSigner
        });
      } catch(e) {
        error = e;
      }

      should.not.exist(error);
      should.exist(result);
      const {status, data} = result;
      // meter service should return a response with status code `200`
      status.should.equal(200);
      // meter should send well formed response JSON body
      should.exist(data);
      should.exist(data.meter);
      should.exist(data.meter.id);
      should.exist(data.meter.controller);
      should.exist(data.meter.serviceId);
      should.exist(data.meter.product);
      should.exist(data.meter.product.id);
      // meter should return the same data used in the body in the request
      data.meter.controller.should.equal(updatedController);
      data.meter.product.id.should.equal(meter.product.id);
      data.meter.serviceId.should.equal(meter.serviceId);
    });

    it('update failure (id mismatch)', async () => {
      const {id: controller, keys} = getAppIdentity();
      const invocationSigner = keys.capabilityInvocationKey.signer();

      const meter = {
        controller,
        product: {
          // mock ID for webkms service product
          id: 'urn:uuid:80a82316-e8c2-11eb-9570-10bf48838a41',
        },
        serviceId: 'mockWebKmsServiceId'
      };

      const {data: meterData} = await createMeter({meter, invocationSigner});

      let result;
      let error;

      const updatedController = 'updated-controller';
      try {
        result = await updateMeter({
          meterId: meterData.meter.id,
          meter: {
            ...meterData.meter,
            id: 'foobar',
            controller: updatedController
          },
          invocationSigner
        });
      } catch(e) {
        error = e;
      }

      should.exist(error);
      should.not.exist(result);

      should.exist(error.response);
      should.exist(error.response.status);
      should.exist(error.data);

      const {data, response} = error;

      // meter service should return a response with status code `400`
      response.status.should.equal(400);

      data.type.should.equal('DataError');
      data.details.httpStatusCode.should.equal(400);
      data.details.expectedMeterId.should.equal(meterData.meter.id);
      data.details.actualMeterId.should.equal('foobar');
    });

    it('update failure (bad sequence)', async () => {
      const {id: controller, keys} = getAppIdentity();
      const invocationSigner = keys.capabilityInvocationKey.signer();

      const meter = {
        controller,
        product: {
          // mock ID for webkms service product
          id: 'urn:uuid:80a82316-e8c2-11eb-9570-10bf48838a41',
        },
        serviceId: 'mockWebKmsServiceId'
      };

      const {data: meterData} = await createMeter({meter, invocationSigner});

      let result;
      let error;

      const sequence = 10;
      try {
        await updateMeter({
          meter: {
            ...meterData.meter,
            sequence
          },
          invocationSigner
        });
        result = await updateMeter({
          meter: {
            ...meterData.meter,
            sequence
          },
          invocationSigner
        });
      } catch(e) {
        error = e;
      }

      should.exist(error);
      should.not.exist(result);

      should.exist(error.response);
      should.exist(error.response.status);
      should.exist(error.data);

      const {data, response} = error;

      // meter service should return a response with status code `400`
      response.status.should.equal(409);

      data.type.should.equal('InvalidStateError');
      data.details.httpStatusCode.should.equal(409);
    });
  });
  describe('http meter usage', () => {
    beforeEach(async () => {
      resetCountHandlers();
    });
    it('get successfully', async () => {
      const {id: controller, keys} = getAppIdentity();
      const invocationSigner = keys.capabilityInvocationKey.signer();

      const meter = {
        controller,
        product: {
          // mock ID for webkms service product
          id: 'urn:uuid:80a82316-e8c2-11eb-9570-10bf48838a41',
        },
        // mock service id for webkms services
        serviceId: 'did:key:z6MkwZ7AXrDpuVi5duY2qvVSx1tBkGmVnmRjDvvwzoVnAzC4'
      };

      const {data, status} = await createMeter({meter, invocationSigner});

      status.should.equal(200);
      should.exist(data);
      should.exist(data.meter);

      // Use the secret seed of webkms service to generate capability
      // invocation key pair and use it to get the signer
      const seedMultibase = 'z1AWrfBoQx1mbiWBfWT7eksbtJf91v2pvEpwhoHDzezfaiH';
      const decoded1 = decodeSecretKeySeed({secretKeySeed: seedMultibase});
      const {methodFor} = await didKeyDriver.generate({seed: decoded1});
      const invocationCapabilityKeyPair = methodFor(
        {purpose: 'capabilityInvocation'});

      let err;
      let res;
      try {
        res = await getMeterUsage({
          meterId: data.meter.id,
          invocationSigner: invocationCapabilityKeyPair.signer()
        });
      } catch(e) {
        err = e;
      }
      should.exist(res);
      should.not.exist(err);
      res.status.should.equal(200);
      res.data.id.should.equal(data.meter.id);
      res.data.controller.should.equal(data.meter.controller);
      res.data.serviceId.should.equal(data.meter.serviceId);
      res.data.product.id.should.equal(data.meter.product.id);
      should.exist(res.data.usage);
      res.data.usage.available.storage.should.equal(100);
      res.data.usage.available.operations.should.equal(100);
    });
    it('fail to update', async () => {
      const {id: controller, keys} = getAppIdentity();
      const invocationSigner = keys.capabilityInvocationKey.signer();

      const meter = {
        controller,
        product: {
          // mock ID for webkms service product
          id: 'urn:uuid:80a82316-e8c2-11eb-9570-10bf48838a41',
        },
        // mock service id for webkms services
        serviceId: 'did:key:z6MkwZ7AXrDpuVi5duY2qvVSx1tBkGmVnmRjDvvwzoVnAzC4'
      };

      const {data, status} = await createMeter({meter, invocationSigner});

      status.should.equal(200);
      should.exist(data);
      should.exist(data.meter);

      // Use the secret seed of webkms service to generate capability
      // invocation key pair and use it to get the signer
      const seedMultibase = 'z1AWrfBoQx1mbiWBfWT7eksbtJf91v2pvEpwhoHDzezfaiH';
      const decoded1 = decodeSecretKeySeed({secretKeySeed: seedMultibase});
      const {methodFor} = await didKeyDriver.generate({seed: decoded1});
      const invocationCapabilityKeyPair = methodFor(
        {purpose: 'capabilityInvocation'});

      // Get meter usage

      const res = await getMeterUsage({
        meterId: data.meter.id,
        invocationSigner: invocationCapabilityKeyPair.signer()
      });

      should.exist(res);
      res.status.should.equal(200);
      should.exist(res.data.usage);
      res.data.usage.available.storage.should.equal(100);
      res.data.usage.available.operations.should.equal(100);

      // Update meter usage
      const updateMeter = {
        controller,
        product: {
          id: 'urn:uuid:80a82316-e8c2-11eb-9570-10bf48838a41'
        },
        serviceId: 'did:key:z6MkwZ7AXrDpuVi5duY2qvVSx1tBkGmVnmRjDvvwzoVnAzC4',
        usage: {available: {storage: 200, operations: 150}}
      };
      let err;
      let result;
      try {
        result = await updateMeterUsage({
          meter: updateMeter,
          meterId: data.meter.id,
          invocationSigner: invocationCapabilityKeyPair.signer()
        });
      } catch(e) {
        err = e;
      }
      should.exist(err);
      should.not.exist(result);
      err.status.should.equal(503);
      err.message.should.equal('Service Unavailable');
    });
  });
});
