import type { NextApiRequest, NextApiResponse } from 'next';

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export enum SUPPORTED_METHODS {
  head = 'head',
  get = 'get',
  post = 'post',
  put = 'put',
  patch = 'patch',
  delete = 'delete',
}

export function sendResponse(res: NextApiResponse, data: any) {
  if (typeof data === 'object') {
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(data));
  }

  res.setHeader('Content-Type', 'text/plain');
  return res.end(String(data));
}

export function canSend(res: NextApiResponse, data: any) {
  return Boolean(data && !res.writableEnded);
}

let ECache = {};
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
    let payload;
    if (ECache[statusCode + error.message]) {
      payload = ECache[statusCode + error.message];
    } else {
      payload = JSON.stringify({
        statusCode: statusCode,
        message: error.message,
      });
    }
    return res.end(payload);
  }
}
