import http from 'http';

export const getServer = (handler) => {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.unref();
    server.listen(0, () => {
      console.log(`listen on ${server.address().port}`);
      resolve(server);
    });
  });
};

export const closeServer = (server, cb) => server.close(cb);
