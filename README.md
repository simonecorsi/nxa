# middlenext

> Simple and configurable Next.js API handler wrapper that avoids pointless boilerplate

<!-- toc -->

- [middlenext](#middlenext)
  - [About The Project](#about-the-project)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Contributing](#contributing)
  - [License](#license)
  - [Contact](#contact)

<!-- tocstop -->

## About The Project

The purpose of this package is to help me prototype faster without wasting time writing countless boilerplate for Next.js api handlers.

Comes with support for hooks (beforeResponse, afterResponse, onError) to help you validate, check authentication and whatever you need.

You can also use conventience method to have a single file handling multiple http methods thus allowing you to write RESTful routes easily.

<!-- GETTING STARTED -->

## Installation

```sh
npm i middlenext
```

<!-- USAGE EXAMPLES -->

## Usage

```js
// pages/api/users/index.js
const middlenext = require("middlenext");
export default middlenext({
  get(req, res) {
    return res.json({ ok: 1 })
    
  },
  put(req, res) {
    // convenience use res.json setting content-type
    return { ok: 1 }
  }
  onError(req,res,error) {
    // handler error and return
    return { message: "youwhatbro" }
  }
  beforeResponse: [validate, checkJwt, (req, res) =>{
    // exit before method handlers or just return empty to follow
    return "OK"
    
  }],
  afterResponse: [(req, res) => {
    // send some metrics?
  }]
})
```

If you don't want middlenext to route methods to named functions you can use a generic `handler` and check method on your own

```js
// pages/api/users/index.js
const middlenext = require("middlenext");
export default middlenext({
  handler(req, res) {
    if (req.method === 'GET') // Do what you need
  }
})
```

<!-- CONTRIBUTING -->

## Contributing

Project is pretty simple and straight forward for what is my needs, but if you have any idea you're welcome.

This projects uses [commitizen](https://github.com/commitizen/cz-cli) so be sure to use standard commit format or PR won't be accepted

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat(scope): some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- CONTACT -->

## Contact

Simone Corsi - [@im_simonecorsi](https://twitter.com/im_simonecorsi)
