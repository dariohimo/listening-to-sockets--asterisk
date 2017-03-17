var request = require('request')
var qs = require('querystring')

function Agent (options) {
  this.options = options || {}
  this.endpoint = this.options.endpoint || 'http://127.0.0.1:3000'
  this.nameapi = this.options.nameapi || 'nombre_api'
}

Agent.prototype._request = function (path, method, params, callback) {
  let uri = this.endpoint + this.nameapi + path

  if (params) {
    if (method === 'GET') {
      uri = uri + '?' + qs.encode(params)
    }
  }

  const options = {
    uri: uri,
    method: method,
    json: true,
    form: params
  }

  console.log(method + ' - ' + uri)
  request(options, (err, res, body) => {
    if (err) return callback(err)

    if (res.statusCode !== 200 && res.statusCode !== 201) return callback(new Error('An error ocurred in the request : ' + res.statusCode))

    callback(null, body)
  })
}

Agent.prototype.shows = function (callback) {
  this._request('/', 'GET', null, callback)
}

Agent.prototype.add = function (data, callback) {
  let agent = getAgentStructure('eventQueueMemberAdded', data)
  if (agent !== '') {
    console.log('Updating Agent in the dashboard')
    this._request('/', 'POST', agent, callback)
  }
}

Agent.prototype.del = function (data, callback) {
  let agent = getAgentStructure('eventQueueMemberRemoved', data)
  if (agent !== '') {
    console.log('Deleting Agent in the dashboard')
    this._request('/delete', 'POST', agent, callback)
  }
}

Agent.prototype.pause = function (data, callback) {
  let agent = getAgentStructure('eventQueueMemberPause', data)
  if (agent !== '') {
    console.log('Pausing Agent in the dashboard')
    this._request('/update', 'POST', agent, callback)
  }
}

Agent.prototype.ring = function (data, callback) {
  let agent = getStructure('eventNewstate', data)
  if (agent !== '') {
    console.log('Ring Agent in the dashboard')
    this._request('/update', 'POST', agent, callback)
  }
}

Agent.prototype.hangup = function (data, callback) {
  let agent = getStructure('eventHangup', data)
  if (agent !== '') {
    console.log('Hangup Agent in the dashboard')
    this._request('/update', 'POST', agent, callback)
  }
}

function getAgentStructure (event, data) {
  let datos = (event, data)
  let agent = {
    'number_annexed': datos['Interface'].replace('SIP/', ''),
    'name_agent': datos['MemberName'],
    'name_event': 'Login',
    'phone_number_inbound': '-',
    'status_pause': datos['Paused']
  }
  return agent
}

function getStructure (event, data) {
  let datos = (event, data)
  let numberAnnexed = ''
  let nameEvent = ''
  let phoneNumberInbound = ''
  let statusPause = ''
  let agent = ''

  if (typeof datos['CallerIDNum'] !== 'undefined') {
    /*
      Para detectar el timbrado de llamadas salientes
    */
    if (event === 'eventNewstate' && datos['ChannelStateDesc'] === 'Ring') {
      numberAnnexed = datos['CallerIDNum'].replace('SIP/', '')
      nameEvent = 'Ring OutBound'
      phoneNumberInbound = datos['Exten']
      statusPause = '1'
    }

    /*
      Para detectar cuando el cliente conteste la llamada saliente
    */
    if (event === 'eventNewstate' && datos['ChannelStateDesc'] === 'Up' && datos['ConnectedLineNum'] !== '<unknown>') {
      numberAnnexed = datos['ConnectedLineNum']
      nameEvent = 'OutBound'
      phoneNumberInbound = datos['Exten']
      statusPause = '1'
    }

    /*
      Para detectar el corte de llamadas salientes y/o entrantes
    */
    if (event === 'eventHangup' && datos['ConnectedLineNum'] !== '<unknown>') {
      console.log(datos)
      numberAnnexed = datos['ConnectedLineNum']
      nameEvent = 'ACD'
      statusPause = '0'
    }
  }

  if (numberAnnexed !== '') {
    agent = {
      'number_annexed': numberAnnexed,
      'name_event': nameEvent,
      'phone_number_inbound': phoneNumberInbound,
      'status_pause': statusPause
    }
  }

  return agent
}

module.exports = Agent
