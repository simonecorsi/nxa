export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const allowedHttpMethod = (allowed, method) => {
  if (!Array.isArray(allowed)) allowed = [allowed];
  return allowed.includes(method);
};

export const resolveHandler = (req, options = {}) => {
  let handler;
  if (options.handler) {
    handler = options.handler;
    if (!allowedHttpMethod(options.method, req.method)) {
      throw new ApiError(405, 'Method not allowed');
    }
  } else {
    handler = options[req.method.toLowerCase()];
  }

  if (!handler) throw new ApiError('NextApiHandler: callback not defined!');
  return handler;
};

export const send = (data, res) => {
  if (typeof data === 'object') {
    res.setHeader('content-type', 'application/json');
    return res.json(data);
  }

  res.setHeader('Content-Type', 'text/plain');
  return res.end(String(data));
};

export default function apiWrapper(options) {
  const { beforeResponse } = Object.assign(
    {
      beforeResponse: [],
      afterResponse: [],
      onError: [],
    },
    options
  );

  const handler = resolveHandler(req, options);

  return async (req, res) => {
    try {
      // beforeResponse hooks
      for (const middle of beforeResponse) {
        const out = await middle(req, res);
        if (res.writableEnded) return; // handle res.end
        if (out) return send(out, res);
      }

      const out = await handler(req, res);
      if (res.writableEnded) return; // handle res.end
      if (out) return send(out, res);

      // afterResponse hooks
      for (const middle of afterResponse) {
        await middle(req, res);
      }
    } catch (error) {
      process.stderr.write(`[api-error]: ${error.message}\n${error.stack}\n`);
      const statusCode = error.statusCode || 500;

      for (const middle of onError) {
        const out = await middle(req, res, error).catch((error) => {
          return (
            res.writableEnded &&
            res.json({
              statusCode: 500,
              message: error.message,
            })
          );
        });
        if (res.writableEnded) return; // handle res.end
        if (out) return send(out, res);
      }

      if (!res.writableEnded) {
        // handler outgoing client throws
        res.status(error?.response?.statusCode || statusCode);
        return res.json({
          statusCode: statusCode,
          message: error.message,
        });
      }
    }
  };
}
