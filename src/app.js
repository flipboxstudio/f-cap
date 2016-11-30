import cors from 'cors'
import crypt from './lib'
import words from './words'
import {sample} from 'lodash'
import express from 'express'
import randomWord from 'random-word'
import svgCaptcha from 'svg-captcha'
import NodeCache from 'node-cache'

const app = express()
const appCache = new NodeCache({stdTTL: 90})
const corsOptions = {
  maxAge: (24 * 60 * 60) * 7
}

app.use(cors(corsOptions))

app.post('/', function (req, res) {
  let text = sample(words)
  let captcha = svgCaptcha(text)
  let identifier = req.headers['x-request-identifier'] || ''
  let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress

  if (!crypt.validate(identifier)) {
    return res.status(400).json({
      error: 'X-Request-Identifier headers is not a valid GUID based on RFC4122 standard'
    })
  }

  let hash = crypt.translate(ip, identifier)

  appCache.set(hash, {text, ip, identifier}, (error, success) => {
    if (!error && success) {
      if (req.headers['accept'] === 'application/json') {
        return res.set('X-Request-Hash', hash)
          .status(200)
          .json({captcha})
      }

      return res.set('Content-Type', 'image/svg+xml')
        .set('X-Request-Hash', hash)
        .status(200)
        .send(captcha)
    }

    return res.status(400).json({error})
  })
})

app.post('/validate', function (req, res) {
  let challenge = req.headers['x-challenge'] || ''
  let identifier = req.headers['x-request-identifier'] || ''
  let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress

  if (!crypt.validate(identifier)) {
    return res.status(400).json({
      error: 'X-Request-Identifier headers is not a valid GUID based on RFC4122 standard'
    })
  }

  identifier = crypt.translate(ip, identifier)

  appCache.get(identifier, function (error, value) {
    if (!error) {
      appCache.del(identifier)

      return (value === undefined) ?
          res.status(400).json({valid: false, message: 'Captcha challenge has been expired'}) :
          (value.text.toLowerCase() === challenge.toLowerCase().trim())
            ? res.json({valid: true, data: value})
            : res.status(400).json({valid: false})
    }

    return res.status(400).json({valid: false, error})
  })
})

app.use(function (err, req, res, next) {
  console.error(err)

  res.status(500).json({error: err})
})

const port = parseInt(process.env.PORT) || 3000

app.listen(port, function () {
  console.log('Captcha listening on port ' + port + '!')
})
