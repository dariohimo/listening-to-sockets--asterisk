import request from 'request'

class Agent {
  constructor (options) {
    this.options = options || {}
    this.endpoint = this.options.endpoint || 'http://127.0.0.1:3000'
    this.nameapi = this.options.nameapi || 'nombre_api'
  }

  sendRequest (path, typeSend, params) {
    return new Promise((resolve, reject) => {
      let uri = this.endpoint + this.nameapi + path
      const options = {
        uri: uri,
        method: typeSend,
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

  getRequest (data, event, urlController, msjLog, isSearchAnnexed, actionTransfer = null) {
    return new Promise(async (resolve, reject) => {
      let dataPreUpdate = ''
      if (isSearchAnnexed) dataPreUpdate = await this.getRequestSearchAnnexed(event, data)
      let agent = await getStructure(event, data, dataPreUpdate, actionTransfer)
      if (agent) {
        console.log('Agents : ' + msjLog + ' - ' + urlController + ' - ' + event)
        this.sendRequest(urlController, 'POST', agent)
          .then(dataAgent => resolve(dataAgent))
          .catch(err => reject(err))
      }
    })
  }

  getRequestSearchAnnexed (event, data) {
    return new Promise(async (resolve, reject) => {
      let annexed = getAnnexed(event, data)
      if (annexed) resolve(await this.sendRequest('/search', 'POST', {'agent_annexed': annexed}))
    })
  }

  shows () {
    return new Promise((resolve, reject) => {
      this.sendRequest('/', 'GET', null)
      .then(dataAgent => { return resolve(dataAgent) })
      .catch(err => { return reject(err) })
    })
  }

  search (data) { return this.getRequest(data, 'searchAgent', '/search', 'Search segun el anexo el EventId del Agente') }

  memberCreate (data) { return this.getRequest(data, 'memberCreate', '/create', 'Create Agent in the dashboard') }
  memberRemoved (data) { return this.getRequest(data, 'memberRemoved', '/delete', 'Deleting Agent in the dashboard') }
  memberPause (data) { return this.getRequest(data, 'memberPause', '/updatePause', 'Pausing Agent in the dashboard') }
  memberAdd (data) { return this.getRequest(data, 'memberAdd', '/searchAndUpdate', 'Adding Agent in the dashboard') }

  ringInbound (data) { return this.getRequest(data, 'newConnectedLine', '/searchAndUpdate', 'Ring Inbound Agent in the dashboard') }
  answerInbound (data) { return this.getRequest(data, 'agentConnect', '/searchAndUpdate', 'Answer Inbound Agent in the dashboard') }
  ringAnswerOutbound (data) { return this.getRequest(data, 'newState', '/searchAndUpdate', 'Ring Outbound Agent in the dashboard') }
  hangup (data) { return this.getRequest(data, 'hangup', '/searchAndUpdate', 'Hangup Agent in the dashboard') }
  hold (data) { return this.getRequest(data, 'hold', '/searchAndUpdate', 'Hold Agent in the dashboard', true) }
  unhold (data) { return this.getRequest(data, 'unHold', '/searchAndUpdate', 'UnHold Agent in the dashboard', true) }

  transferUnattended (data) {
    let completedTranfers = async() => {
      await this.getRequest(data, 'blindTransfer', '/searchAndUpdate', 'Transfer Unattended the Agent in the dashboard', 'Remove')
      await this.getRequest(data, 'blindTransfer', '/searchAndUpdate', 'Transfer Unattended the Agent in the dashboard', 'Add')
    }
    completedTranfers()
  }
  attendedTransfer (data) { return this.getRequest(data, 'attendedTransfer', '/searchAndUpdate', 'AttendedTransfer Agent in the dashboard') }
}

const getInboundPhone = (callerIDNum, callerIDName) => {
  if (callerIDNum === callerIDName) return callerIDNum
  if (callerIDName === '<unknown>') return callerIDNum
  return `${callerIDNum} - ${callerIDName}`
}

const getAnnexed = (event, data) => {
  const datos = (event, data)
  let annexed = ''

  if (typeof datos['CallerIDNum'] !== 'undefined') {
    let context = datos['Context'].split('-')

    if (event === 'newConnectedLine' && datos['ChannelStateDesc'] === 'Ringing' && context[0] === 'nivel') annexed = datos['CallerIDNum']
    if (event === 'agentConnect' && datos['ChannelStateDesc'] === 'Up' && context[0] === 'context') annexed = datos['Interface'].replace('SIP/', '')
    if (event === 'newState' && datos['ChannelStateDesc'] === 'Ring' && context[0] === 'nivel') annexed = datos['CallerIDNum'].replace('SIP/', '')
    if (event === 'newState' && datos['ChannelStateDesc'] === 'Up' && datos['ConnectedLineNum'] !== '<unknown>' && context[0] === 'context') annexed = datos['ConnectedLineNum']
    if (event === 'hangup' && datos['ConnectedLineNum'] !== '<unknown>' && context[0] === 'context') annexed = datos['ConnectedLineNum']
    if (event === 'hangup' && datos['ChannelStateDesc'] === 'Ringing' && context[0] === 'nivel') annexed = datos['CallerIDNum']
    if (event === 'hold') annexed = datos['CallerIDNum']
    if (event === 'unHold') annexed = datos['CallerIDNum']
  }
  return annexed
}

const getStructure = (event, data, dataPreUpdate, actionTransfer = null) => {
  const datos = (event, data)
  const horaActualServer = (new Date()).getTime()
  let agentAnnexed = ''
  let eventId = ''
  let eventName = ''
  let eventTime = ''
  let inboundQueue = ''
  let inboundPhone = ''
  let inboundStart = ''
  let outboundPhone = ''
  let outboundStart = ''
  let statusPause = ''
  let agent = ''
  let eventObservaciones = ''

  // Para detectar la creacion de un agente en la tabla agent_online
  if (event === 'searchAgent') {
    agent = {'agent_annexed': datos['CallerIDNum'].replace('SIP/', '') ? datos['CallerIDNum'].replace('SIP/', '') : datos['ConnectedLineNum']}
    return agent
  }

  // Para detectar la creacion de un agente en la tabla agent_online
  if (event === 'memberCreate') {
    agent = {
      'agent_user_id': data['userid'],
      'agent_name': data['username'],
      'agent_annexed': data['anexo'],
      'agent_status': '1',
      'event_id': '1',
      'event_name': 'login',
      'event_time': horaActualServer
    }
    return agent
  }

  // Para detectar el evento add y remove a las colas del servidor asteris
  if (event === 'memberAdd' || event === 'memberRemoved') {
    if (datos['Interface'] !== '') {
      agent = {
        'agent_annexed': datos['Interface'].replace('SIP/', ''),
        'agent_status': datos['Paused'],
        'event_id': '11',
        'event_name': 'ACD',
        'event_time': horaActualServer
      }
    }
    return agent
  }

    // Para detectar el evento pause  del servidor asteris
  if (event === 'memberPause') {
    if (datos['Interface'] !== '') {
      agent = {
        'agent_annexed': datos['Interface'].replace('SIP/', ''),
        'agent_status': datos['Paused'],
        'event_time': horaActualServer
      }
    }
    return agent
  }

  if (typeof datos['CallerIDNum'] !== 'undefined') {
    var context = datos['Context'].split('-')

    // Para detectar el timbrado de llamadas entrantes
    if (event === 'newConnectedLine' && datos['ChannelStateDesc'] === 'Ringing' && context[0] === 'nivel') {
      agentAnnexed = datos['CallerIDNum']
      statusPause = '1'
      eventId = '12'
      eventName = 'Ring Inbound'
      eventTime = horaActualServer
      eventObservaciones = 'Evento Asterisk - Inicio Ring Inbound'
      inboundQueue = datos['Exten']
      inboundPhone = getInboundPhone(datos['ConnectedLineNum'], datos['ConnectedLineName'])
      inboundStart = horaActualServer
    }

    // Para detectar el Answer de llamadas entrantes
    if (event === 'agentConnect' && datos['ChannelStateDesc'] === 'Up' && context[0] === 'context') {
      agentAnnexed = datos['Interface'].replace('SIP/', '')
      statusPause = '1'
      eventId = '8'
      eventName = 'Inbound'
      eventTime = horaActualServer
      eventObservaciones = 'Evento Asterisk - Inicio Inbound'
      inboundQueue = datos['Queue']
      inboundPhone = getInboundPhone(datos['CallerIDNum'], datos['CallerIDName'])
      inboundStart = horaActualServer
    }

    // Para detectar el timbrado de llamadas salientes
    if (event === 'newState' && datos['ChannelStateDesc'] === 'Ring' && context[0] === 'nivel') {
      agentAnnexed = datos['CallerIDNum'].replace('SIP/', '')
      statusPause = '1'
      eventId = '13'
      eventName = 'Ring OutBound'
      eventTime = horaActualServer
      eventObservaciones = 'Evento Asterisk - Inicio Ring OutBound'
      outboundPhone = datos['Exten']
      outboundStart = horaActualServer
    }

    // Para detectar cuando el cliente conteste la llamada saliente
    if (event === 'newState' && datos['ChannelStateDesc'] === 'Up' && datos['ConnectedLineNum'] !== '<unknown>' && context[0] === 'context') {
      agentAnnexed = datos['ConnectedLineNum']
      statusPause = '1'
      eventId = '9'
      eventName = 'OutBound'
      eventTime = horaActualServer
      eventObservaciones = 'Evento Asterisk - Inicio OutBound'
      outboundPhone = datos['Exten']
      outboundStart = horaActualServer
    }

    // Para detectar el corte de llamadas salientes y/o entrantes
    if (event === 'hangup' && datos['ConnectedLineNum'] !== '<unknown>' && context[0] === 'context') {
      agentAnnexed = datos['ConnectedLineNum']
      statusPause = '0'
      eventId = '1'
      eventName = 'ACD'
      eventTime = horaActualServer
      eventObservaciones = 'Evento Asterisk - Fin Inbound/OutBound'
    }

    // Para detectar el corte de llamadas entrantes que no son contestadas en los anexos
    if (event === 'hangup' && datos['ChannelStateDesc'] === 'Ringing' && context[0] === 'nivel') {
      agentAnnexed = datos['CallerIDNum']
      statusPause = '0'
      eventId = '1'
      eventName = 'ACD'
      eventTime = horaActualServer
      eventObservaciones = 'Evento Asterisk - Fin Ring Call Inbound'
    }

    // Para detectar el estado Hold realizado por un analista
    if (event === 'hold') {
      if (dataPreUpdate.event_id === '8') {
        eventId = '16'
        eventName = 'Hold Inbound'
        inboundQueue = dataPreUpdate.inbound_queue
        inboundPhone = dataPreUpdate.inbound_phone
        inboundStart = dataPreUpdate.inbound_start
      }

      if (dataPreUpdate.event_id === '9') {
        eventId = '17'
        eventName = 'Hold Outbound'
        outboundPhone = dataPreUpdate.outbound_phone
        outboundStart = dataPreUpdate.outbound_start
      }

      statusPause = '1'
      agentAnnexed = datos['CallerIDNum']
      eventTime = horaActualServer
      eventObservaciones = 'Evento Asterisk - Inicio ' + eventName
      
    }

    // Para detectar el estado unHold realizado por un analista
    if (event === 'unHold') {

      if (dataPreUpdate.event_id === '16') {
        eventId = '8'
        eventName = 'Inbound'
        inboundQueue = dataPreUpdate.inbound_queue
        inboundPhone = dataPreUpdate.inbound_phone
        inboundStart = dataPreUpdate.inbound_start
      }

      if (dataPreUpdate.event_id === '17') {
        eventId = '9'
        eventName = 'Outbound'
        outboundPhone = dataPreUpdate.outbound_phone
        outboundStart = dataPreUpdate.outbound_start
      }

      statusPause = '1'
      agentAnnexed = datos['CallerIDNum']
      eventTime = horaActualServer
      eventObservaciones = 'Evento Asterisk - Fin Hold ' + eventName
    }
  }

  // Para detectar la transferencia ciega realizada por un analista
  if (event === 'blindTransfer') {
    if (actionTransfer === 'Remove') {
      agentAnnexed = datos['TransfererCallerIDNum']
      eventName = 'ACD'
      statusPause = '0'
      eventId = '1'
      eventObservaciones = 'Evento Asterisk - Fin Inbound por Transfer'
    }

    if (actionTransfer === 'Add') {
      agentAnnexed = datos['Extension']
      eventName = 'Inbound Transfer'
      inboundQueue = datos['TransfereeExten']
      inboundPhone = getInboundPhone(datos['TransfereeCallerIDNum'], datos['TransfereeCallerIDName'])
      statusPause = '1'
      eventId = '18'
      eventObservaciones = 'Evento Asterisk - Inicio Inbound por Transfer'
    }
  }

  if (agentAnnexed) {
    agent = {
      'agent_annexed': agentAnnexed,
      'agent_status': statusPause,
      'event_id': eventId,
      'event_id_old': '',
      'event_name': eventName,
      'event_time': eventTime,
      'event_observaciones': eventObservaciones,
      'inbound_queue': inboundQueue,
      'inbound_phone': inboundPhone,
      'inbound_start': inboundStart,
      'outbound_phone': outboundPhone,
      'outbound_start': outboundStart
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
      if (event[0] === 'blindTransfer' && datos['Result'] === 'Success') {
        console.log(event[1])
        console.log(datos)
        if (event[1] === 'Remove') {
          agentAnnexed = datos['TransfererCallerIDNum']
          eventName = 'ACD'
          statusPause = '0'
        }
        if (event[1] === 'Add') {
          agentAnnexed = datos['Extension']
          eventName = 'Inbound Transfer'
          inboundQueue = datos['TransfereeExten']
          inboundPhone = datos['TransfereeCallerIDNum']
          statusPause = '1'
        }
      }
    } */




/*
      Para detectar el corte de llamadas entre anexos internos del asterisk

    if (event === 'hangup' && datos['Exten'].length !== 0 && context[0] === 'nivel') {
      console.log('aaaaaaaaaaaaaaaaaaaa')
      console.log(datos['Exten'].length)
      agentAnnexed = datos['ConnectedLineNum']
      eventName = 'ACD'
      statusPause = '0'
      eventId = '1'
      eventObservaciones = 'Evento Asterisk - Fin Llamada Interna entre anexos'
    }
    */