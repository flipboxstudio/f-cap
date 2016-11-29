import crypto from 'crypto'
const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default {
  validate (guid) {
    return guid.match(guidRegex) !== null
  },

  translate (secret, guid) {
    return crypto.createHmac('sha256', secret)
      .update(guid)
      .digest('hex')
  }
}
