import { mockResponse } from 'mock-req-res';
import tap from 'tap';
import sinon from 'sinon';

import nxa from '../src/index';
import { sendResponse, ApiError } from '../src/utils';
import { getServer, closeServer } from './fixtures/server';
import request from './fixtures/http';

tap.test('ApiError', (t) => {
  t.throws(() => {
    throw new ApiError(200, 'Ok');
  });
  t.end();
});

tap.test('sendResponse', (t) => {
  const res = mockResponse();
  res.json = sinon.spy();
  sendResponse(res, { hello: 'world' });
  t.ok(res.json.called);
  res.json = sinon.spy();
  sendResponse(res, 'Hello world');
  t.ok(res.end.calledWith('Hello world'));
  t.end();
});

tap.test('nxa should throw without an handler', (t) => {
  t.throws(() => nxa({}));
  t.end();
});

tap.test('nxa throw 405 method not allowed', async (t) => {
  const server = await getServer(
    nxa({
      post: () => 'OK',
    })
  );
  const url = `http://localhost:${(server.address() as any).port}`;
  const response = await request(url);
  const out = JSON.parse(response as string);
  t.equal(out.statusCode, 405);
  t.equal(out.message, 'Method Not Allowed');
  t.teardown(() => closeServer(server));
  t.end();
});

tap.test('nxa text return', async (t) => {
  const server = await getServer(
    nxa({
      get: () => 'OK',
    })
  );
  const url = `http://localhost:${(server.address() as any).port}`;
  const response = await request(url);
  t.equal(response, 'OK');
  closeServer(server, t.end);
});

tap.test('nxa middlewares', async (t) => {
  const afterResponse = sinon.spy();
  const beforeResponse = sinon.spy();
  const controller = sinon.spy(() => 'handler');
  const server = await getServer(
    nxa({
      controller,
      beforeResponse: [beforeResponse],
      afterResponse: afterResponse,
    })
  );
  const url = `http://localhost:${(server.address() as any).port}`;
  await request(url);
  t.ok(controller.calledOnce);
  t.ok(beforeResponse.calledOnce);
  t.ok(afterResponse.calledOnce);
  t.teardown(() => closeServer(server));
  t.end();
});

tap.test('nxa should handler error', async (t) => {
  const server = await getServer(
    nxa({
      get: () => {
        throw new Error('error');
      },
    })
  );
  const url = `http://localhost:${(server.address() as any).port}`;
  const response = await request(url);
  t.ok(response, '{ statusCode: 500, message: "error" }');
  t.teardown(() => closeServer(server));
  t.end();
});

tap.test('nxa custom error handler', async (t) => {
  const server = await getServer(
    nxa({
      get: () => {
        throw new Error('error');
      },
      onError: (req, res, err) => {
        res.end('{message:"I\'m a teapot"}');
      },
    })
  );
  const url = `http://localhost:${(server.address() as any).port}`;
  const response = await request(url);
  t.equal(response, '{message:"I\'m a teapot"}');
  t.teardown(() => closeServer(server));
  t.end();
});

tap.test('nxa default handler async', async (t) => {
  const server = await getServer(
    nxa({
      controller: async () => 'handler',
    })
  );
  const url = `http://localhost:${(server.address() as any).port}`;
  const r = await request(url);
  t.equal(r, 'handler');
  t.teardown(() => closeServer(server));
  t.end();
});

tap.test('nxa beforeResponse', async (t) => {
  const server = await getServer(
    nxa({
      controller: () => 'handler',
      beforeResponse: [() => 'OK'],
    })
  );
  const url = `http://localhost:${(server.address() as any).port}`;
  const r = await request(url);
  t.equal(r, 'OK');
  t.teardown(() => closeServer(server));
  t.end();
});

tap.test('nxa beforeResponse async', async (t) => {
  const server = await getServer(
    nxa({
      controller: () => 'handler',
      beforeResponse: [async () => 'OK'],
    })
  );
  const url = `http://localhost:${(server.address() as any).port}`;
  const r = await request(url);
  t.equal(r, 'OK');
  t.teardown(() => closeServer(server));
  t.end();
});

tap.test('nxa afterResponse async', async (t) => {
  const server = await getServer(
    nxa({
      controller: () => 'handler',
      afterResponse: async () => {},
    })
  );
  const url = `http://localhost:${(server.address() as any).port}`;
  const r = await request(url);
  t.equal(r, 'handler');
  t.teardown(() => closeServer(server));
  t.end();
});

tap.test('nxa error handler return', async (t) => {
  const server = await getServer(
    nxa({
      get: () => {
        throw new Error('error');
      },
      onError: () => 'OKOK',
    })
  );
  const url = `http://localhost:${(server.address() as any).port}`;
  const response = await request(url);
  t.equal(response, 'OKOK');
  t.teardown(() => closeServer(server));
  t.end();
});

tap.test('nxa error async handler return', async (t) => {
  const server = await getServer(
    nxa({
      get: () => {
        throw new Error('error');
      },
      onError: async () => 'OKOK',
    })
  );
  const url = `http://localhost:${(server.address() as any).port}`;
  const response = await request(url);
  t.equal(response, 'OKOK');
  t.teardown(() => closeServer(server));
  t.end();
});
