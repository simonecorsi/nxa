import { mockRequest, mockResponse } from 'mock-req-res';
import tap from 'tap';
import {
  allowedHttpMethod,
  resolveHandler,
  send,
  default as Middlenext,
} from '../index.mjs';

tap.test('allowedHttpMethod', (t) => {
  t.notOk(allowedHttpMethod('POST', 'GET'));
  t.notOk(allowedHttpMethod(['POST'], 'GET'));
  t.notOk(allowedHttpMethod(['PUT', 'POST'], 'GET'));
  t.end();
});

tap.test('resolveHandler', (t) => {
  const req = mockRequest();
  const h = () => {};
  t.throws(() => resolveHandler(req));
  t.equal(resolveHandler(req, { get: h }), h);

  req.method = 'POST';
  t.equal(resolveHandler(req, { post: h }), h);

  req.method = 'PUT';
  t.equal(resolveHandler(req, { put: h }), h);

  req.method = 'DELETE';
  t.equal(resolveHandler(req, { delete: h }), h);

  t.throws(() => resolveHandler(req, { patch: h }));

  t.end();
});

tap.test('send', (t) => {
  const res = mockResponse();
  send({ ok: 1 }, res);
  t.ok(res.json.called);
  t.ok(res.setHeader.calledWith('Content-Type', 'application/json'));

  const res2 = mockResponse();
  send('ok', res2);
  t.ok(res2.end.called);
  t.ok(res2.setHeader.calledWith('Content-Type', 'text/plain'));

  t.end();
});
