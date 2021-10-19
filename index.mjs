export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const SUPPORTED_METHODS = [
  'HEAD',
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
];

export const send = (res, data) => {
  if (typeof data === 'object') {
    res.setHeader('Content-Type', 'application/json');
    return res.json(data);
  }

  res.setHeader('Content-Type', 'text/plain');
  return res.end(String(data));
};

export function canSend(res, data) {
  return Boolean(data && !res.writableEnded);
}

export async function onErrorHandler(req, res, error) {
  process.stderr.write(`[api-error]: ${error.message}\n${error.stack}\n`);
  const statusCode = error.statusCode || 500;
  // handle generic errors
  if (!res.writableEnded) {
    res.status(error?.response?.statusCode || statusCode);
    return res.end(
      JSON.stringify({
        statusCode: statusCode,
        message: error.message,
      })
    );
  }
}

const isAsyncFunction = (fn) => {
  if (typeof fn !== 'function') return false;
  return fn[Symbol.toStringTag] === 'AsyncFunction';
};

export default function apiWrapper(options) {
  const { beforeResponse, afterResponse, onError } = Object.assign(
    {
      beforeResponse: [],
      afterResponse: [],
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
        if (canSend(res, out)) send(res, out);
      }

      if (!res.writableEnded) {
        const out = await handler(req, res);
        if (canSend(res, out)) send(res, out);
      }

      // afterResponse hooks
      for (const fn of afterResponse) {
        await fn(req, res);
      }
    } catch (error) {
      if (isAsyncFunction(onError)) {
        onError(req, res, error)
          .then((out) => {
            if (canSend(res, out)) send(res, out);
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
        if (canSend(res, out)) send(res, out);
      }
    }
  };
}
