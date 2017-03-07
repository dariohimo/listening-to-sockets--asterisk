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
  this._request('/', 'POST', agent, callback)
}

Agent.prototype.del = function (data, callback) {
  let agent = getAgentStructure('eventQueueMemberRemoved', data)
  this._request('/delete', 'POST', agent, callback)
}

Agent.prototype.pause = function (data, callback) {
  let agent = getAgentStructure('eventQueueMemberPause', data)
  this._request('/update', 'POST', agent, callback)
}

function getAgentStructure (event, data) {
  let datos = (event, data)
  let agent = {
    'number_annexed': datos['Interface'],
    'name_agent': datos['MemberName'],
    'status_pause': datos['Paused']
  }

  return agent
}

module.exports = Agent
