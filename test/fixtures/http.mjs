import http from 'http';

export default (url) =>
  new Promise((resolve, reject) => {
    return http
      .request(url, (res) => {
        let data = '';
        res.on('error', reject);
        res.on('data', (c) => {
          data += c;
        });
        res.on('end', () => {
          return resolve(data);
        });
      })
      .end();
  });
