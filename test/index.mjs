import { mockRequest } from 'mock-req-res';
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
  t.end();
});
