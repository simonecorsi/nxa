import http from 'http';

class ServerRes extends http.ServerResponse {
  json(data) {
    this.end(JSON.stringify(data));
  }
}

export const getServer = (handler): Promise<http.Server> => {
  return new Promise((resolve) => {
    const server = http.createServer({ ServerResponse: ServerRes }, handler);
    server.unref();
    server.listen(0, () => {
      console.log(`listen on ${(server.address() as any).port}`);
      resolve(server);
    });
  });
};

export const closeServer = (server, cb?) => server.close(cb);
