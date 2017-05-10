import request from 'request'
import qs from 'querystring'
import dateFormat from 'dateformat'
import ip from 'ip'

class DetailEvents {
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
        this.sendRequest(urlController, typeSend, eventAgent)
        .then(dataAgent => resolve(dataAgent))
        .catch(err => reject(err))
      } else {
        console.log('No se obtuvo estructura del detalle de eventos')
      }
    })
  }

  insertEvent (data) {
    return this.getRequest(data, 'insertEvent', '/createEvent', 'POST', 'Insert detail events en la table detalle_eventos')
  }
}

function getStructure (event, data) {
  let eventAgent = ''
  if (event === 'insertEvent') {
    eventAgent = {
      'event_id': data.event_id,
      'agent_user_id': data.agent_user_id,
      'event_time': dateFormat(new Date(), 'yyyy-mm-dd H:MM:ss'),
      'event_observaciones': data.event_observaciones,
      'ip': ip.address(),
      'agent_annexed': data.agent_annexed
    }
    return eventAgent
  }
}

module.exports = DetailEvents
