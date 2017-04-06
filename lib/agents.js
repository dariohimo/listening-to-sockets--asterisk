import request from 'request'
import qs from 'querystring'

class Agent {
  constructor (options) {
    this.options = options || {}
    this.endpoint = this.options.endpoint || 'http://127.0.0.1:3000'
    this.nameapi = this.options.nameapi || 'nombre_api'
  }

  sendRequest (path, method, params) {
    return new Promise((resolve, reject) => {
      let uri = this.endpoint + this.nameapi + path
      if (params) {
        if (method === 'GET') uri = uri + '?' + qs.encode(params)
      }

      const options = {
        uri: uri,
        method: method,
        json: true,
        form: params
      }

      console.log(method + ' - ' + uri)
      request(options, (err, res, body) => {
        if (err) return reject(err)
        if (res.statusCode !== 200 && res.statusCode !== 201) return reject(new Error('An error ocurred in the request : ' + res.statusCode))
        return resolve(body)
      })
    })
  }

  shows () {
    return new Promise((resolve, reject) => {
      this.sendRequest('/', 'GET', null)
      .then(value => {
        return resolve(value)
      }).catch(err => {
        return reject(err)
      })
    })
  }

  add (data) {
    return new Promise(async (resolve, reject) => {
      let agent = getStructure('eventQueueMemberAdded', data)
      if (agent !== '') {
        console.log('Search................')
        let data = await this.sendRequest('/find', 'POST', agent)
        console.log(data)
        if (data.length === 0) {
          console.log('Create..................')
          await this.sendRequest('/create', 'POST', agent)
        } else {
          console.log('Update.................')
          await this.sendRequest('/update', 'POST', agent)
        }
      }
    })
  }

  del (data) {
    return new Promise((resolve, reject) => {
      let agent = getStructure('eventQueueMemberRemoved', data)
      if (agent !== '') {
        console.log('Deleting Agent in the dashboard')
        this.sendRequest('/delete', 'POST', agent)
        .then(value => {
          return resolve(value)
        }).catch(err => {
          return reject(err)
        })
      }
    })
  }

  pause (data) {
    return new Promise((resolve, reject) => {
      let agent = getStructure('eventQueueMemberPause', data)
      if (agent !== '') {
        console.log('Pausing Agent in the dashboard')
        this.sendRequest('/searchAndUpdate', 'POST', agent)
        .then(value => {
          return resolve(value)
        }).catch(err => {
          return reject(err)
        })
      }
    })
  }

  ringInbound (data) {
    return new Promise((resolve, reject) => {
      let agent = getStructure('eventNewConnectedLine', data)
      if (agent !== '') {
        console.log('Ring Inbound Agent in the dashboard')
        this.sendRequest('/updateOrCreate', 'POST', agent)
        .then(value => {
          return resolve(value)
        }).catch(err => {
          return reject(err)
        })
      }
    })
  }

  answerInbound (data) {
    return new Promise((resolve, reject) => {
      let agent = getStructure('eventAgentConnect', data)
      if (agent !== '') {
        console.log('Answer Inbound Agent in the dashboard')
        this.sendRequest('/updateOrCreate', 'POST', agent)
        .then(value => {
          return resolve(value)
        }).catch(err => {
          return reject(err)
        })
      }
    })
  }

  ringOutbound (data) {
    return new Promise((resolve, reject) => {
      let agent = getStructure('eventNewstate', data)
      if (agent !== '') {
        console.log('Ring Outbound Agent in the dashboard')
        this.sendRequest('/updateOrCreate', 'POST', agent)
        .then(value => {
          return resolve(value)
        }).catch(err => {
          return reject(err)
        })
      }
    })
  }

  hangup (data) {
    return new Promise((resolve, reject) => {
      let agent = getStructure('eventHangup', data)
      if (agent !== '') {
        console.log('Hangup Agent in the dashboard')
        this.sendRequest('/updateOrCreate', 'POST', agent)
        .then(value => {
          return resolve(value)
        }).catch(err => {
          return reject(err)
        })
      }
    })
  }

  transferUnattended (data) {
    return new Promise((resolve, reject) => {
      let agent = getStructure('eventBlindTransfer', data, 'Remove')
      if (agent !== '') {
        console.log('Transfer Unattended the Agent in the dashboard')
        this.sendRequest('/updateOrCreate', 'POST', agent)
        .then(value => {
          return resolve(value)
        }).catch(err => {
          return reject(err)
        })
      }

      agent = getStructure('eventBlindTransfer', data, 'Add')
      if (agent !== '') {
        console.log('Transfer Unattended the Agent in the dashboard')
        this.sendRequest('/updateOrCreate', 'POST', agent)
        .then(value => {
          return (value)
        }).catch(err => {
          return err
        })
      }
    })
  }
}

function getStructure (event, data, actionTransfer = null) {
  let datos = (event, data)
  let numberAnnexed = ''
  let nameEvent = ''
  let nameQueueInbound = ''
  let phoneNumberInbound = ''
  let statusPause = ''
  let agent = ''

  /*
      Para detectar el evento add y remove a las colas del servidor asterisk
  */
  if (event === 'eventQueueMemberAdded' || event === 'eventQueueMemberRemoved') {
    if (datos['Interface'] !== '') {
      agent = {
        'number_annexed': datos['Interface'].replace('SIP/', ''),
        'name_agent': datos['MemberName'],
        'name_event': 'ACD',
        'status_pause': datos['Paused']
      }
    }
    return agent
  }

  if (typeof datos['CallerIDNum'] !== 'undefined') {
    var context = datos['Context'].split('-')
    /*
      Para detectar el timbrado de llamadas entrantes
    */
    if (event === 'eventNewConnectedLine' && datos['ChannelStateDesc'] === 'Ringing' && context[0] === 'nivel') {
      numberAnnexed = datos['CallerIDNum']
      nameEvent = 'Ring Inbound'
      nameQueueInbound = datos['Exten']
      phoneNumberInbound = datos['ConnectedLineNum']
      statusPause = '1'
    }

    /*
      Para detectar el Answer de llamadas entrantes
    */
    if (event === 'eventAgentConnect' && datos['ChannelStateDesc'] === 'Up' && context[0] === 'context') {
      numberAnnexed = datos['Interface'].replace('SIP/', '')
      nameEvent = 'Inbound'
      nameQueueInbound = datos['Queue']
      phoneNumberInbound = datos['CallerIDNum']
      statusPause = '1'
    }

    /*
      Para detectar el timbrado de llamadas salientes
    */
    if (event === 'eventNewstate' && datos['ChannelStateDesc'] === 'Ring' && context[0] === 'nivel') {
      numberAnnexed = datos['CallerIDNum'].replace('SIP/', '')
      nameEvent = 'Ring OutBound'
      phoneNumberInbound = datos['Exten']
      statusPause = '1'
    }

    /*
      Para detectar cuando el cliente conteste la llamada saliente
    */
    if (event === 'eventNewstate' && datos['ChannelStateDesc'] === 'Up' && datos['ConnectedLineNum'] !== '<unknown>' && context[0] === 'context') {
      console.log(datos)
      numberAnnexed = datos['ConnectedLineNum']
      nameEvent = 'OutBound'
      phoneNumberInbound = datos['Exten']
      statusPause = '1'
    }

    /*
      Para detectar el corte de llamadas salientes y/o entrantes
    */
    if (event === 'eventHangup' && datos['ConnectedLineNum'] !== '<unknown>' && context[0] === 'context') {
      numberAnnexed = datos['ConnectedLineNum']
      nameEvent = 'ACD'
      statusPause = '0'
    }

    /*
      Para detectar especificamente corte de timbrado de llamadas entrantes
    */
    if (event === 'eventHangup' && context[0] === 'nivel') {
      numberAnnexed = datos['CallerIDNum']
      nameEvent = 'ACD'
      statusPause = '0'
    }
  }

  /*
    Para detectar la transferencia ciega realizada por un analista
  */
  if (event === 'eventBlindTransfer') {
    if (actionTransfer === 'Remove') {
      numberAnnexed = datos['TransfererCallerIDNum']
      nameEvent = 'ACD'
      statusPause = '0'
    }

    if (actionTransfer === 'Add') {
      numberAnnexed = datos['Extension']
      nameEvent = 'Inbound Transfer'
      nameQueueInbound = datos['TransfereeExten']
      phoneNumberInbound = datos['TransfereeCallerIDNum']
      statusPause = '1'
    }
  }

    /*
      Para detectar la transferencia ciega realizada por un analista

   console.log(event + ' - ' + event.search('-'))
    if (event.search('-') > -1) {
      let event = event.split('-')
      console.dir(event)
      if (event[0] === 'eventBlindTransfer' && datos['Result'] === 'Success') {
        console.log(event[1])
        console.log(datos)
        if (event[1] === 'Remove') {
          numberAnnexed = datos['TransfererCallerIDNum']
          nameEvent = 'ACD'
          statusPause = '0'
        }
        if (event[1] === 'Add') {
          numberAnnexed = datos['Extension']
          nameEvent = 'Inbound Transfer'
          nameQueueInbound = datos['TransfereeExten']
          phoneNumberInbound = datos['TransfereeCallerIDNum']
          statusPause = '1'
        }
      }
    } */

  if (numberAnnexed !== '') {
    agent = {
      'number_annexed': numberAnnexed,
      'name_event': nameEvent,
      'name_queue_inbound': nameQueueInbound,
      'phone_number_inbound': phoneNumberInbound,
      'status_pause': statusPause
    }
  }

  return agent
}

module.exports = Agent
