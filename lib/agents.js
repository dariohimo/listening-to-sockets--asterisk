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
      if (params) { if (method === 'GET') uri = uri + '?' + qs.encode(params) }

      const options = {
        uri: uri,
        method: method,
        json: true,
        form: params
      }

      // console.log(method + ' - ' + uri)
      request(options, (err, res, body) => {
        if (err) return reject(err)
        if (res.statusCode !== 200 && res.statusCode !== 201) return reject(new Error('An error ocurred in the request : ' + res.statusCode))
        return resolve(body)
      })
    })
  }

  getRequest (data, eventQueue, urlController, typeSend, msjLog, actionTransfer = null) {
    return new Promise((resolve, reject) => {
      let agent = getStructure(eventQueue, data, actionTransfer)
      if (agent) {
        console.log('Agents : ' + msjLog + ' - ' + urlController + ' - ' + eventQueue)
        this.sendRequest(urlController, typeSend, agent)
        .then(dataAgent => resolve(dataAgent))
        .catch(err => reject(err))
      } else {
        console.log('No se obtuvo estructura del agent_online')
      }
    })
  }

  shows () {
    return new Promise((resolve, reject) => {
      this.sendRequest('/', 'GET', null)
      .then(dataAgent => { return resolve(dataAgent) })
      .catch(err => { return reject(err) })
    })
  }

  createAgent (data) { return this.getRequest(data, 'eventCreateAgent', '/create', 'POST', 'Create Agent in the dashboard') }
  add (data) { return this.getRequest(data, 'eventQueueMemberAdded', '/searchAndUpdate', 'POST', 'Adding Agent in the dashboard') }
  del (data) { return this.getRequest(data, 'eventQueueMemberRemoved', '/delete', 'POST', 'Deleting Agent in the dashboard') }
  pause (data) { return this.getRequest(data, 'eventQueueMemberPause', '/searchAndUpdate', 'POST', 'Pausing Agent in the dashboard') }
  ringInbound (data) { return this.getRequest(data, 'eventNewConnectedLine', '/searchAndUpdate', 'POST', 'Ring Inbound Agent in the dashboard') }
  answerInbound (data) { return this.getRequest(data, 'eventAgentConnect', '/searchAndUpdate', 'POST', 'Answer Inbound Agent in the dashboard') }
  ringOutbound (data) { return this.getRequest(data, 'eventNewstate', '/searchAndUpdate', 'POST', 'Ring Outbound Agent in the dashboard') }
  hangup (data) { return this.getRequest(data, 'eventHangup', '/searchAndUpdate', 'POST', 'Hangup Agent in the dashboard') }
  transferUnattended (data) {
    let completedTranfers = async() => {
      let removeTranfer = await this.getRequest(data, 'eventBlindTransfer', '/searchAndUpdate', 'POST', 'Transfer Unattended the Agent in the dashboard', 'Remove')
      let addTranfer = await this.getRequest(data, 'eventBlindTransfer', '/searchAndUpdate', 'POST', 'Transfer Unattended the Agent in the dashboard', 'Add')
    }
    completedTranfers()
  }
  hold (data) { return this.getRequest(data, 'eventHold', '/searchAndUpdate', 'POST', 'Hold Agent in the dashboard') }
  unhold (data) { return this.getRequest(data, 'eventUnHold', '/searchAndUpdate', 'POST', 'UnHold Agent in the dashboard') }
  attendedTransfer (data) { return this.getRequest(data, 'attendedTransfer', '/searchAndUpdate', 'POST', 'AttendedTransfer Agent in the dashboard') }
}

function getPhoneNumberInbound (callerIDNum, callerIDName) {
  if (callerIDName === '<unknown>') return callerIDNum
  return `${callerIDNum} - ${callerIDName}`
}

function getStructure (event, data, actionTransfer = null) {
  let datos = (event, data)
  let numberAnnexed = ''
  let nameEvent = ''
  let nameQueueInbound = ''
  let phoneNumberInbound = ''
  let statusPause = ''
  let agent = ''
  let eventId = ''
  let observaciones = ''

  /*
      Para detectar la creacion de un agente en la tabla agent_online
  */
  if (event === 'eventCreateAgent') {
    agent = {
      'name_agent': data['username'],
      'number_annexed': data['anexo'],
      'name_event': 'login',
      'status_pause': 1,
      'user_id': data['userid']
    }
    return agent
  }

  /*
      Para detectar el evento add y remove a las colas del servidor asterisk
  */
  if (event === 'eventQueueMemberAdded' || event === 'eventQueueMemberRemoved') {
    if (datos['Interface'] !== '') {
      agent = {
        'number_annexed': datos['Interface'].replace('SIP/', ''),
        'name_agent': datos['MemberName'].replace('Agent/', ''),
        'name_event': 'ACD',
        'status_pause': datos['Paused']
      }
    }
    return agent
  }

  /*
      Para detectar el evento pause  del servidor asterisk
  */
  if (event === 'eventQueueMemberPause') {
    if (datos['Interface'] !== '') {
      agent = {
        'number_annexed': datos['Interface'].replace('SIP/', ''),
        'name_agent': datos['MemberName'].replace('Agent/', ''),
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
      phoneNumberInbound = getPhoneNumberInbound(datos['ConnectedLineNum'], datos['ConnectedLineName'])
      statusPause = '1'
      eventId = '12'
      observaciones = 'Evento Asterisk - Inicio Ring Inbound'
    }

    /*
      Para detectar el Answer de llamadas entrantes
    */
    if (event === 'eventAgentConnect' && datos['ChannelStateDesc'] === 'Up' && context[0] === 'context') {
      numberAnnexed = datos['Interface'].replace('SIP/', '')
      nameEvent = 'Inbound'
      nameQueueInbound = datos['Queue']
      phoneNumberInbound = getPhoneNumberInbound(datos['CallerIDNum'], datos['CallerIDName'])
      statusPause = '1'
      eventId = '8'
      observaciones = 'Evento Asterisk - Inicio Inbound'
    }

    /*
      Para detectar el timbrado de llamadas salientes
    */
    if (event === 'eventNewstate' && datos['ChannelStateDesc'] === 'Ring' && context[0] === 'nivel') {
      numberAnnexed = datos['CallerIDNum'].replace('SIP/', '')
      nameEvent = 'Ring OutBound'
      phoneNumberInbound = datos['Exten']
      statusPause = '1'
      eventId = '13'
      observaciones = 'Evento Asterisk - Inicio Ring OutBound'
    }

    /*
      Para detectar cuando el cliente conteste la llamada saliente
    */
    if (event === 'eventNewstate' && datos['ChannelStateDesc'] === 'Up' && datos['ConnectedLineNum'] !== '<unknown>' && context[0] === 'context') {
      numberAnnexed = datos['ConnectedLineNum']
      nameEvent = 'OutBound'
      phoneNumberInbound = datos['Exten']
      statusPause = '1'
      eventId = '9'
      observaciones = 'Evento Asterisk - Inicio OutBound'
    }

    /*
      Para detectar el corte de llamadas salientes y/o entrantes
    */
    if (event === 'eventHangup' && datos['ConnectedLineNum'] !== '<unknown>' && context[0] === 'context') {
      numberAnnexed = datos['ConnectedLineNum']
      nameEvent = 'ACD'
      statusPause = '0'
      eventId = '1'
      observaciones = 'Evento Asterisk - Fin Inbound/OutBound'
    }

    /*
      Para detectar el corte de llamadas entrantes que no son contestadas en los anexos
    */
    if (event === 'eventHangup' && datos['ChannelStateDesc'] === 'Ringing' && context[0] === 'nivel') {
      numberAnnexed = datos['CallerIDNum']
      nameEvent = 'ACD'
      statusPause = '0'
      eventId = '1'
      observaciones = 'Evento Asterisk - Fin Ring Call Inbound'
    }

    /*
      Para detectar el corte de llamadas entre anexos internos del asterisk

    if (event === 'eventHangup' && datos['Exten'].length !== 0 && context[0] === 'nivel') {
      console.log('aaaaaaaaaaaaaaaaaaaa')
      console.log(datos['Exten'].length)
      numberAnnexed = datos['ConnectedLineNum']
      nameEvent = 'ACD'
      statusPause = '0'
      eventId = '1'
      observaciones = 'Evento Asterisk - Fin Llamada Interna entre anexos'
    }
    */
     /*
      Para detectar el estado Hold realizado por un analista
    */
    if (event === 'eventHold') {
      if (datos['ConnectedLineNum'] !== '<unknown>') {
        nameEvent = 'Hold Inbound'
        eventId = '16'
      } else {
        nameEvent = 'Hold Outbound'
        eventId = '17'
      }
      numberAnnexed = datos['CallerIDNum']
      observaciones = 'Evento Asterisk - Inicio ' + nameEvent
    }

    /*
      Para detectar el estado unHold realizado por un analista
    */
    if (event === 'eventUnHold') {
      if (datos['ConnectedLineNum'] !== '<unknown>') {
        nameEvent = 'Inbound'
        eventId = '8'
      } else {
        nameEvent = 'Outbound'
        eventId = '9'
      }
      numberAnnexed = datos['CallerIDNum']
      observaciones = 'Evento Asterisk - Fin Hold ' + nameEvent
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
      eventId = '1'
      observaciones = 'Evento Asterisk - Fin Inbound por Transfer'
    }

    if (actionTransfer === 'Add') {
      numberAnnexed = datos['Extension']
      nameEvent = 'Inbound Transfer'
      nameQueueInbound = datos['TransfereeExten']
      phoneNumberInbound = getPhoneNumberInbound(datos['TransfereeCallerIDNum'], datos['TransfereeCallerIDName'])
      statusPause = '1'
      eventId = '15'
      observaciones = 'Evento Asterisk - Inicio Inbound por Transfer'
    }
  }

  if (numberAnnexed) {
    agent = {
      'number_annexed': numberAnnexed,
      'name_event': nameEvent,
      'name_queue_inbound': nameQueueInbound,
      'phone_number_inbound': phoneNumberInbound,
      'star_call_inbound': (new Date()).getTime(),
      'status_pause': statusPause,
      'event_id': eventId,
      'observaciones': observaciones
    }
  }

  return agent
}

module.exports = Agent

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
