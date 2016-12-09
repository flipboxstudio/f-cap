import fs from 'fs'
import cors from 'cors'
import path from 'path'
import https from 'https'
import crypt from './lib'
import words from './words'
import {sample} from 'lodash'
import express from 'express'
import randomWord from 'random-word'
import svgCaptcha from 'svg-captcha'
import NodeCache from 'node-cache'

require('dotenv').config({path: path.join(__dirname, '/../', '.env')})

const app = express()
const appCache = new NodeCache({stdTTL: process.env.CACHE_TTL || 120})
const corsOptions = {
  maxAge: (24 * 60 * 60) * 7
}

app.use(cors(corsOptions))

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome peeps!'
  })
})

app.post('/', (req, res) => {
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

app.post('/validate', (req, res) => {
  let challenge = req.headers['x-challenge'] || ''
  let identifier = req.headers['x-request-identifier'] || ''
  let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress

  if (!crypt.validate(identifier)) {
    return res.status(400).json({
      error: 'X-Request-Identifier headers is not a valid GUID based on RFC4122 standard'
    })
  }

  identifier = crypt.translate(ip, identifier)

  appCache.get(identifier, (error, value) => {
    if (!error) {
      appCache.del(identifier)

      return (value === undefined) ?
          res.status(426).json({valid: false, message: 'Captcha challenge has been expired'}) :
          (value.text.toLowerCase() === challenge.toLowerCase().trim())
            ? res.json({valid: true, data: value})
            : res.status(400).json({valid: false, data: value})
    }

    return res.status(500).json({valid: false, error})
  })
})

app.use((err, req, res, next) => {
  console.error(err)

  res.status(500).json({error: err})
})

const port = parseInt(process.env.PORT) || 3000

app.listen(port, function () {
  console.log('Captcha listening on port ' + port + '!')
})

const key = path.resolve(process.env.SSL_KEY)
const cert = path.resolve(process.env.SSL_CERT)

try {
  const options = {
    key: fs.readFileSync(key),
    cert: fs.readFileSync(cert)
  }

  const sslPort = parseInt(process.env.SSL_PORT) || (port + 443)

  https.createServer(options, app).listen(sslPort, fn => {
    console.log('Captcha with SSL listening on port ' + sslPort + '!')
  })
} catch (e) {
  console.log(e)
}
