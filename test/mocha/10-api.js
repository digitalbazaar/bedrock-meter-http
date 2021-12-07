/*
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const {getAppIdentity} = require('bedrock-app-identity');
const {
  clearHandlers, createMeter, getMeter, resetCountHandlers, updateMeter,
  deleteMeter
} = require('./helpers');
const {handlers} = require('bedrock-meter-http');

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
    it.only('delete successfully', async () => {
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
      let error;
      let meterId;
      try {
        const {data} = await createMeter({meter, invocationSigner});
        ({meter: {id: meterId}} = data);
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

      let result2;
      let error2;
      try {
        // delete meter that was created
        await deleteMeter({meterId, invocationSigner});

        // then try to get the meter again, should get meter not found error
        // result2 = await getMeter({meterId, invocationSigner});
      } catch(e) {
        error2 = e;
      }
      should.exist(error2);
      should.not.exist(result2);
      console.log(error2);
      const {data: data2, response} = error2;

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
});
