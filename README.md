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

```
yarn install  # if you don't have yarn, you can just `npm install`
npm run build # convert from es6 syntax to node module syntax
npm run serve # serve an application
```

### Basic request

```js
axios.post('http://yourcaptchadomain', {
  text: 'Flipbox'
}).then(response => {
  // `response` data is an SVG
}).catch(response => {
  // Error response
})
```

### Known Issues

- Cannot post `text` more than one word

### Future

- Captcha validation
