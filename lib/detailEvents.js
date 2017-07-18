import dateFormat from 'dateformat'
import ip from 'ip'
import Request from './sendRequest'
const request = new Request({
  endpoint: process.env.endpoint,
  apiName: process.env.apiDetailEvent
})

class DetailEvents {
  getRequest (data, event, urlController, typeSend, msjLog) {
    return new Promise((resolve, reject) => {
      let eventAgent = getStructure(event, data)
      if (eventAgent) request.send(urlController, typeSend, eventAgent).then(dataAgent => resolve(dataAgent)).catch(err => reject(err))
    })
  }

  insertEvent (data) { return this.getRequest(data, 'insertEvent', '/createEvent', 'POST', 'Insert detail events en la table detalle_eventos') }
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
