import request from 'request'
import qs from 'querystring'

class Request {
  constructor (options) {
    this.options = options || {}
    this.endpoint = this.options.endpoint || 'http://127.0.0.1:3000'
    this.apiName = this.options.apiName || 'apiSapia'
  }

  send (path, method, params) {
    return new Promise((resolve, reject) => {
      let uri = this.endpoint + this.apiName + path
      if (params) { if (method === 'GET') uri = uri + '?' + qs.encode(params) }

      const options = { uri: uri, method: method, json: true, form: params }
      request(options, (err, res, body) => {
        if (err) return reject(err)
        if (res.statusCode !== 200 && res.statusCode !== 201) return reject(new Error('An error ocurred in the request : ' + res.statusCode))
        return resolve(body)
      })
    })
  }
}

module.exports = Request
