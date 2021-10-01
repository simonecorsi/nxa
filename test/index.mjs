import { mockRequest, mockResponse } from 'mock-req-res';
import tap from 'tap';
import { resolveHandler, send, default as Middlenext } from '../index.mjs';
import { getServer, closeServer } from './fixtures/server.mjs';
import request from './fixtures/http.mjs';

// tap.test('resolveHandler', (t) => {
//   const req = mockRequest();
//   const h = () => {};
//   t.throws(() => resolveHandler(req));
//   t.equal(resolveHandler(req, { handler: h }), h);

//   t.equal(resolveHandler(req, { get: h }), h);

//   req.method = 'POST';
//   t.equal(resolveHandler(req, { post: h }), h);

//   req.method = 'PUT';
//   t.equal(resolveHandler(req, { put: h }), h);

//   req.method = 'DELETE';
//   t.equal(resolveHandler(req, { delete: h }), h);

//   t.throws(() => resolveHandler(req, { patch: h }));

//   t.end();
// });

// tap.test('send', (t) => {
//   const res = mockResponse();
//   send({ ok: 1 }, res);
//   t.ok(res.json.called);
//   t.ok(res.setHeader.calledWith('Content-Type', 'application/json'));

//   const res2 = mockResponse();
//   send('ok', res2);
//   t.ok(res2.end.called);
//   t.ok(res2.setHeader.calledWith('Content-Type', 'text/plain'));

//   t.end();
// });

tap.test('Middlenext txt return', async (t) => {
  const server = await getServer(
    Middlenext({
      get: () => 'OK',
      onError: t.fail,
    })
  );
  t.teardown(() => closeServer(server));
  const url = `http://localhost:${server.address().port}`;
  const response = await request(url);
  t.equal(response, 'OK');
  t.end();
});

tap.test('Middlenext throws if no handler provided', async (t) => {
  const server = await getServer(Middlenext({}));
  t.teardown(() => closeServer(server));
  const url = `http://localhost:${server.address().port}`;
  const response = await request(url);
  console.log('response :>> ', response);
  t.equal(response, 'OK');
  t.end();
});

// tap.test('Middlenext beforeResponse', async (t) => {
//   const server = await getServer(
//     Middlenext({
//       beforeResponse: [() => 'OK'],
//       onError: t.fail,
//     })
//   );
//   t.teardown(() => closeServer(server));
//   const url = `http://localhost:${server.address().port}`;
//   const response = await request(url);
//   t.equal(response, 'OK');
//   t.end();
// });
