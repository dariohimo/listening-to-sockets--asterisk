import request from 'request'
import qs from 'querystring'

class CallWaiting {
  constructor (options) {
    this.options = options || {}
    this.endpoint = this.options.endpoint || 'http://127.0.0.1:3000'
    this.nameapi = this.options.nameapi || 'nombre_api'
  }

  sendRequest (path, method, params) {
    return new Promise((resolve, reject) => {
      let uri = this.endpoint + this.nameapi + path
      if (params) { if (method === 'GET') uri = uri + '?' + qs.encode(params) }

      const options = {
        uri: uri,
        method: method,
        json: true,
        form: params
      }

      request(options, (err, res, body) => {
        if (err) return reject(err)
        if (res.statusCode !== 200 && res.statusCode !== 201) return reject(new Error('An error ocurred in the request : ' + res.statusCode))
        return resolve(body)
      })
    })
  }

  getRequest (data, event, urlController, typeSend, msjLog) {
    return new Promise((resolve, reject) => {
      let eventAgent = getStructure(event, data)
      if (eventAgent) {
        console.log('callWaiting: ' + msjLog + ' - ' + urlController)
        this.sendRequest(urlController, typeSend, eventAgent)
        .then(dataAgent => resolve(dataAgent))
        .catch(err => reject(err))
      } else {
        console.log('No se obtuvo estructura del call waiting')
      }
    })
  }

  create (data) { return this.getRequest(data, 'QueueCallerJoin', '/create', 'POST', 'Insert detail calls waiting para controlar encolamiento') }
  delete (data) { return this.getRequest(data, 'QueueCallerJoin', '/delete', 'POST', 'Delete detail calls waiting para controlar encolamiento') }
}

function getStructure (event, data) {
  let datos = (event, data)
  let callWaiting = ''
  if (event === 'QueueCallerJoin') {
    callWaiting = {
      'number_phone': datos.CallerIDNum,
      'name_number': (datos.CallerIDName === '<unknown>') ? '' : datos.CallerIDName,
      'name_queue': datos.Queue,
      'start_call': (new Date()).getTime()
    }
    return callWaiting
  }
}

module.exports = CallWaiting
