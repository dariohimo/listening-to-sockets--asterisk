import co from 'co'
import AmiClient from 'asterisk-ami-client'
import EnvironmentVariables from './../util/environmentVariables'

const env = new EnvironmentVariables()

class AmiAction {
	constructor (){
		this.asteriskHost = ''
		this.asteriskPort = ''
		this.asteriskUsername = ''
		this.asteriskSecret = ''
	}

	actionsAmi (parameters) {
		return new Promise((resolve, reject) => {
			let _this = this
			let client = new AmiClient({reconnect: false})
			const envAsterisk = env.envAsterisk(parameters.NameProyect)

			this.asteriskHost = envAsterisk.asteriskHost
			this.asteriskPort = envAsterisk.asteriskPort
			this.asteriskUsername = envAsterisk.asteriskUsername
			this.asteriskSecret = envAsterisk.asteriskSecret

			co(function * () {
				yield client.connect(_this.asteriskUsername, _this.asteriskSecret, {host: _this.asteriskHost, port: _this.asteriskPort})
				let response = yield client.action(parameters, true)
				client.disconnect()
				return resolve(response)
			}).catch(error => reject(error))
		})
	}

	pauseQueue (data) {
		let parametros = {
			NameProyect : data.name_proyect,
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
