import words from './words'
import multer from 'multer'
import {sample} from 'lodash'
import express from 'express'
import randomWord from 'random-word'
import svgCaptcha from 'svg-captcha'
import bodyParser from 'body-parser'

const app = express()
const upload = multer()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.post('/', upload.array(), function (req, res) {
  let text = req.body.text || sample(words)
  let captcha = svgCaptcha(text)

  return res.set('Content-Type', 'image/svg+xml')
    .status(200)
    .send(captcha)
})

app.use(function (err, req, res, next) {
  res.status(500).json({error: err})
})

const port = parseInt(process.env.PORT) || 3000

app.listen(port, function () {
  console.log('Captcha listening on port ' + port + '!')
})
