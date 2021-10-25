import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from 'next/dist/server/api-utils';
import {
  SUPPORTED_METHODS,
  sendResponse,
  canSend,
  onErrorHandler,
} from './utils';

export type Handler = (
  req: NextApiRequest,
  res: NextApiResponse,
  error?: Error
) => any;

export type NamedHandlers = {
  [key in SUPPORTED_METHODS | 'all']?: Handler;
};

export type nxaOptions = {
  beforeResponse?: Array<Handler>;
  afterResponse?: Handler;
  onError?: Handler;
} & NamedHandlers;

export interface naxOptions extends NamedHandlers {}

export default function nxa(options: nxaOptions) {
  const { beforeResponse, afterResponse, onError } = Object.assign(
    {
      beforeResponse: [],
      afterResponse: () => {},
      onError: onErrorHandler,
    },
    options
  );

  const handlers: NamedHandlers = {};

  if (options.all) {
    handlers.all = options.all;
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

  return async (req, res) => {
    try {
      if (handlers[req.method.toLowerCase()] && handlers.all) {
        throw new ApiError(405, 'Method Not Allowed');
      }

      const handler = handlers[req.method.toLowerCase()] || handlers.all;

      // beforeResponse hooks
      for (const fn of beforeResponse) {
        let out = fn(req, res);
        if (out?.then) {
          out = await out;
        }
        if (canSend(res, out)) sendResponse(res, out);
      }

      if (!res.writableEnded) {
        let out = handler(req, res);
        if (out?.then) {
          out = await out;
        }
        if (canSend(res, out)) sendResponse(res, out);
      }

      res.on('finish', () => {
        // afterResponse hooks
        if (typeof afterResponse === 'function') {
          const result = afterResponse(req, res);
          if (result?.then) {
            result.catch(console.error);
          }
        }
      });
    } catch (error) {
      const result = onError(req, res, error);
      if (result?.then) {
        result
          .then((out) => {
            if (canSend(res, out)) sendResponse(res, out);
          })
          .catch(
            // handler syntax errors for better debugging
            (error: Error) =>
              !res.writableEnded &&
              res.end(
                JSON.stringify({
                  statusCode: 500,
                  message: error.message,
                })
              )
          );
      } else {
        if (canSend(res, result)) sendResponse(res, result);
      }
    }
  };
}