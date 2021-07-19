/*
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const {clearHandlers, resetCountHandlers, HANDLER_COUNTS} =
  require('./helpers');
const {handlers} = require('bedrock-meter-http');

describe('api', () => {
  describe('setHandler', () => {
    beforeEach(async () => {
      clearHandlers();
    });
    // empty handler
    const _h = () => {};
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
    it.skip('create', async () => {
      // FIXME: post to `/meters`

      // FIXME: check result
      HANDLER_COUNTS.create.should.equal(1);
    });
  });
});
