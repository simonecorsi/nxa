import { ApiError } from "next/dist/server/api-utils.js";

const allowedHttpMethod = (allowed, method) => {
  if (!Array.isArray(allowed)) allowed = [allowed];
  return allowed.includes(method);
};

const resolveHandler = (options, req) => {
  let handler;
  if (!options.handler) {
    handler = options.handler;
    if (!allowedHttpMethod(method, req.method)) {
      throw new ApiError(405, "Method not allowed");
    }
  } else {
    handler = options[req.method.toLowerCase()];
  }

  if (!handler) throw new ApiError("NextApiHandler: callback not defined!");
  return handler;
};

const send = (data, res) => {
  if (typeof data === "object") {
    res.setHeader("content-type", "application/json");
    return res.json(data);
  }

  res.setHeader("Content-Type", "text/plain");
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

  const handler = resolveHandler(options);

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
