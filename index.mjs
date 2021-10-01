export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const resolveHandler = (req, options = {}) => {
  let handler = options.handler || options[req.method.toLowerCase()];
  console.log('PORCODDI');
  if (!handler) throw new ApiError('NextApiHandler: callback not defined!');
  return handler;
};

export const send = (res, data) => {
  if (typeof data === 'object') {
    res.setHeader('Content-Type', 'application/json');
    return res.json(data);
  }

  res.setHeader('Content-Type', 'text/plain');
  return res.end(String(data));
};

export default function apiWrapper(options) {
  const { beforeResponse, afterResponse, onError } = Object.assign(
    {
      beforeResponse: [],
      afterResponse: [],
      onError: () => {},
    },
    options
  );
  return async (req, res) => {
    try {
      const handler = resolveHandler(req, options);
      // beforeResponse hooks
      for (const middle of beforeResponse) {
        const out = await middle(req, res);
        if (res.writableEnded) return; // user called res.end
        if (out) return send(res, out);
      }

      const out = await handler(req, res);
      if (res.writableEnded) return; // user called res.end
      if (out) return send(res, out);

      // afterResponse hooks
      for (const middle of afterResponse) {
        await middle(req, res);
      }
    } catch (error) {
      process.stderr.write(`[api-error]: ${error.message}\n${error.stack}\n`);
      console.log('OKOKOKO---');
      const statusCode = error.statusCode || 500;
      if (typeof onError === 'function') {
        const out = await onError(req, res, error).catch((error) => {
          return (
            res.writableEnded &&
            res.json({
              statusCode: 500,
              message: error.message,
            })
          );
        });
        if (res.writableEnded) return; // handle res.end
        if (out) return send(res, out);
      }

      console.log('OKOKOKO');
      if (!res.writableEnded) {
        console.log('OKOKOKO1');
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
