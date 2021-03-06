<p align="center">
    <img src="https://github.com/simonecorsi/nxa/blob/a54c3c6fb18a16aca64da7cc9f9b4b0decb8fa1f/logo.png" alt="NxA" width="150px"/>
</p>

<h1 align="center">NxA</h1>
<p align="center">Minimalistc, zero dependencies and configurable Next.js API handler with hook support that avoids pointless boilerplate 🦄</p>

> This package has been used in my projects before Next.js 12 added support for native middlewares, I'll leave this here just for fun now 😂

<!-- toc -->

- [About](#about)
- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
  - [`nxa(options): AsyncFunction`](#nxaoptions-asyncfunction)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

<!-- tocstop -->

## About

The purpose of this package is to help me prototype faster without wasting time writing countless boilerplate for Next.js api handlers.

Comes with support for hooks (beforeResponse, afterResponse, onError) to help you validate, check authentication and whatever you need.

You can also use conventience method to have a single file handling multiple http methods thus allowing you to write RESTful routes easily.

<!-- GETTING STARTED -->

## Installation

```sh
npm i nxa
```

<!-- USAGE EXAMPLES -->

## Usage

```javascript
// pages/api/users/index.js
const nxa = require("nxa");

export default nxa({
  // if handler method found it will be used for every request
  handler: (req, res) => res.end("OK"),

  // if {get,post,put,patch,delete} named method found it will be routed here
  get(req, res) {
    return res.json({ ok: 1 })
    
  },

  put(req, res) {
    // convenience use res.json under the hood and sets content-type to json
    return { ok: 1 }
  },
  
  // catch-all errors in your handlers
  onError(req,res,error) {
    // handler error and return
    return { message: "youwhatbro" }
  },

  // Executed serially in order
  beforeResponse: [
    validate,
    checkJwt,
    (req, res) =>{
    // exit before method handlers or just return empty to follow
    return "OK"
    
  }],

  // Fires when res emits "finish" event
  afterResponse: (req, res) => {
    // send some metrics?
  }
})
```

If you don't want nxa to route methods to named functions you can use a generic `handler` and check method on your own

```js
// pages/api/users/index.js
const nxa = require("nxa");
export default nxa({
  handler(req, res) {
    if (req.method === 'GET') // Do what you need
  }
})
```

## Options

### `nxa(options): AsyncFunction`

| field | description |
| --- | --- |
| `handler`| Universal handler for all request on the file | 
| `{head,get,post,put,patch,delete}` | Convenience method to route http methods | 
| `beforeResponse` | Array of functions to execute before handling response | 
| `afterResponse` | function to execute on response finish | 
| `onError` | function called when there is an error in an handler | 


<!-- CONTRIBUTING -->

## Contributing

Project is pretty simple and straight forward for what is my needs, but if you have any idea you're welcome!

This projects uses [Conventional Commits](https://www.conventionalcommits.org/) so be sure to use standard commit format or PR won't be accepted

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
