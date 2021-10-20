import isAsyncFunction from '@scdev/is-async-function';
import {
  ApiError,
  SUPPORTED_METHODS,
  sendResponse,
  canSend,
  onErrorHandler,
} from './lib/utils.mjs';

export default function apiWrapper(options) {
  const { beforeResponse, afterResponse, onError } = Object.assign(
    {
      beforeResponse: [],
      afterResponse: () => {},
      onError: onErrorHandler,
    },
    options
  );

  const handlers = {};

  if (options.handler) {
    handlers.default = options.handler;
  } else {
    for (const [key, v] of Object.entries(options)) {
      if (
        SUPPORTED_METHODS.includes(key.toUpperCase()) &&
        typeof v === 'function'
      ) {
        handlers[key] = v;
      }
    }
  }

  if (!Object.keys(handlers).length) {
    throw new ApiError('NextApiHandler: callback not defined!');
  }

  return async (req, res) => {
    try {
      const handler = handlers.default || handlers[req.method.toLowerCase()];

      // beforeResponse hooks
      for (const fn of beforeResponse) {
        const out = await fn(req, res);
        if (canSend(res, out)) sendResponse(res, out);
      }

      if (!res.writableEnded) {
        const out = await handler(req, res);
        if (canSend(res, out)) sendResponse(res, out);
      }

      res.on('finish', () => {
        // afterResponse hooks
        if (typeof afterResponse === 'function') {
          if (isAsyncFunction(afterResponse)) {
            afterResponse(req, res).catch(console.error);
          } else {
            afterResponse(req, res);
          }
        }
      });
    } catch (error) {
      if (isAsyncFunction(onError)) {
        onError(req, res, error)
          .then((out) => {
            if (canSend(res, out)) sendResponse(res, out);
          })
          .catch(
            // handler syntax errors for better debugging
            (error) =>
              !res.writableEnded &&
              res.end(
                JSON.stringify({
                  statusCode: 500,
                  message: error.message,
                })
              )
          );
      } else {
        const out = onError(req, res, error);
        if (canSend(res, out)) sendResponse(res, out);
      }
    }
  };
}
