import type { NextApiRequest, NextApiResponse } from './types';

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function sendResponse(res: NextApiResponse, data: any) {
  if (typeof data === 'object') {
    res.setHeader('Content-Type', 'application/json');
    return res.json(data);
  }

  res.setHeader('Content-Type', 'text/plain');
  return res.end(String(data));
}

export function canSend(res: NextApiResponse, data: any) {
  return Boolean(data && !res.writableEnded);
}

export async function onErrorHandler(
  _: NextApiRequest,
  res: NextApiResponse,
  error: ApiError | Error
) {
  // handle generic errors
  process.stderr.write(`[api-error]: ${error.message}\n${error.stack}\n`);
  if (!res.writableEnded) {
    const statusCode = (error as any)?.statusCode || 500;
    res.statusCode = statusCode;
    return res.json(
      JSON.stringify({
        statusCode: statusCode,
        message: error.message,
      })
    );
  }
}
