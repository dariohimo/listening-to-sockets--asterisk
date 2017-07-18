import co from 'co'
import AmiClient from 'asterisk-ami-client'

class AmiAction {
  constructor (options) {
    this.options = options || {}
    this.host = this.options.host || '127.0.0.1'
    this.port = this.options.port || '5038'
    this.username = this.options.username || 'username'
    this.secret = this.options.secret || 'secret'
  }

  actionsAmi (parameters) {
    return new Promise((resolve, reject) => {
      let _this = this
      let client = new AmiClient({reconnect: false})
      co(function * () {
        yield client.connect(_this.username, _this.secret, {host: _this.host, port: _this.port})
        let response = yield client.action(parameters, true)
        client.disconnect()
        return resolve(response)
      }).catch(error => reject(error))
    })
  }

  pauseQueue (data) {
    let parametros = {
      Action: 'QueuePause',
      Interface: 'SIP/' + data.agent_annexed,
      Paused: data.agent_status
    }
    this.actionsAmi(parametros)
    .then(data => data.Response)
    .catch(err => err)
  }
}

module.exports = AmiAction
