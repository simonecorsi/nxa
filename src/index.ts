import { ApiError, isResEnded } from './utils';
import { NamedHandlers, nxaOptions, SUPPORTED_METHODS } from './types';
import { sendResponse, canSend, onErrorHandler } from './utils';

/* istanbul ignore next */
export { ApiError } from './utils';

export default function nxa(options: nxaOptions = {}) {
  const { beforeResponse, afterResponse, onError } = {
    beforeResponse: [],
    afterResponse: () => {},
    onError: onErrorHandler,
    ...options,
  };

  const handlers: NamedHandlers = {};

  if (options.controller) {
    handlers.controller = options.controller;
  } else {
    for (const [key, v] of Object.entries(options)) {
      if (
        Object.keys(SUPPORTED_METHODS).includes(key) &&
        typeof v === 'function'
      ) {
        handlers[key] = v;
      }
    }
  }

  if (!Object.keys(handlers).length) {
    throw new TypeError('NextApiHandler: callback not defined!');
  }

  const selfSupportedMethods = Object.keys(handlers);
  return async (req, res) => {
    try {
      // if named function provided, and no catch-all method
      // checks if current method is supported by this handler
      if (!handlers.controller && selfSupportedMethods.length) {
        if (!selfSupportedMethods.includes(req.method.toLowerCase())) {
          throw new ApiError(405, 'Method Not Allowed');
        }
      }

      const handler = handlers[req.method.toLowerCase()] || handlers.controller;

      // beforeResponse hooks
      for (const fn of beforeResponse) {
        let out = fn.call(options, req, res);
        if (out?.then) {
          out = await out;
        }
        if (canSend(res, out)) sendResponse(res, out);
      }

      if (!isResEnded(res)) {
        let out = handler.call(options, req, res);
        if (out?.then) {
          out = await out;
        }
        if (canSend(res, out)) sendResponse(res, out);
      }

      res.on('finish', () => {
        // afterResponse hooks
        if (typeof afterResponse === 'function') {
          const result = afterResponse.call(options, req, res);
          if (result?.then) {
            result.catch(console.error);
          }
        }
      });
    } catch (error) {
      const result = onError.call(options, req, res, error);
      if (result?.then) {
        result
          .then((out) => {
            if (canSend(res, out)) sendResponse(res, out);
          })

          // handler syntax errors for better debugging
          .catch(
            /* istanbul ignore next */
            (error: Error) =>
              !isResEnded(res) &&
              res.json({
                statusCode: 500,
                message: error.message,
              })
          );
      } else {
        if (canSend(res, result)) sendResponse(res, result);
      }
    }
  };
}
