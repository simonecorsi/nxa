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

export function sendResponse(res, data) {
  if (typeof data === 'object') {
    res.setHeader('Content-Type', 'application/json');
    return res.json(data);
  }

  res.setHeader('Content-Type', 'text/plain');
  return res.end(String(data));
}

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
