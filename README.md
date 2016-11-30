# F-Cap

F-Cap is a simple implementation of Captcha Service.
This is the most bare minimum of captcha service, so don't expect too much.
We can grow this service even more later.

## Quick Run

```bash
yarn install # if you don't have yarn, you can just `npm install`
npm run dev  # run a local server with auto reload enabled
```

## Running in Production

```bash
yarn install  # if you don't have yarn, you can just `npm install`
npm run build # convert from es6 syntax to node module syntax
npm run serve # serve an application
```

### Basic request

```js
var settings = {
  'url': '{{ YOUR-DOMAIN-HERE }}',
  'method': 'POST',
  'headers': {
    'accept': 'application/json',
    'x-request-identifier': '{{ A-VALID-GUID }}',
  }
}

$.ajax(settings).done(function (response) {
  console.log(response.captcha) // An SVG string, you may insert this response directly to your DOM

  $('#f-cap').append($(response.captcha))
});
```

Keep in mind, `A-VALID-GUID` should follows [RFC4122](https://www.ietf.org/rfc/rfc4122.txt).
You can generate this GUID using [UUID Package](https://www.npmjs.com/package/uuid).
For instance:

```js
const uuid = require('uuid')

let guid = uuid.v1()
```

> **NOTE** If you don't send headers `Accept: application/json`, then the server's response should be a blob which is an SVG binary.

### Validating User Input

From that response, you may validate user input using this method:

```js
var settings = {
  'url': '{{ YOUR-DOMAIN-HERE }}/validate',
  'method': 'POST',
  'headers': {
    'x-request-identifier': '{{ YOUR-PREVIOUS-GUID-HERE }}',
    'x-challenge': 'southerners',
    'cache-control': 'no-cache'
  }
}

$.ajax(settings).done(function (response) {
  // User input is valid
  // Below is the response
  // {
  //   "valid": true,
  //   "data": {
  //     "text": "southerners",
  //     "ip": "{{ REQUESTED-IP }}", // You may validate sender IP here, currently we're not validating it, maybe next.
  //     "identifier": "{{ YOUR-PREVIOUS-GUID-HERE }}"
  //   }
  // }
}).error(function (response) {
  // User input is invalid
});
```

> **NOTE** The server using cache to validate user input based on their captcha. The default captcha TTL is **90 seconds**.
So if after 90 seconds user doesn't validate their input, the response may return an error response.
When this happens server will return [426 status code](https://httpstatuses.com/426).
