import getEnv from './../getEnv'
import AmiClient from 'asterisk-ami-client'

const env = new getEnv()

let client = new AmiClient({
	// Auto reconnection
	reconnect: true,

	// Max count of attempts when client tries to reconnect to Asterisk;
	maxAttemptsCount: 100,

	// Delay (ms) between attempts of reconnection
	attemptsDelay: 3000,

	// When is true, client send Action: Ping to Asterisk automatic every minute
	keepAlive: true,

	// Delay (ms) between keep-alive actions, when parameter keepAlive was set to true;
	keepAliveDelay: 1000,

	// When is true, client will emit events by names
	emitEventsByTypes: false,

	// When is true, client will emit events by names in lower case. Uses with emitEventsByTypes;
	eventTypeToLowerCase: false,

	// When is true and data package of action has ActionID field, client will emit responses by resp_ActionID
	emitResponsesById: false,

	// When is true, client will be add into events and responses field $time with value equal to ms-timestamp;
	addTime: true,

	// Object, array or Set with names of events, which will be ignored by client.
	eventFilter: null
})

class AsteriskCorporativo {
	constructor (){
		this.asteriskHost = ''
		this.asteriskPort = ''
		this.asteriskUsername = ''
		this.asteriskSecret = ''
	}

	conectionAsterisk (nameProyect) {
		let envAsterisk = env.envAsterisk(nameProyect)

		this.asteriskHost = envAsterisk.asteriskHost
		this.asteriskPort = envAsterisk.asteriskPort
		this.asteriskUsername = envAsterisk.asteriskUsername
		this.asteriskSecret = envAsterisk.asteriskSecret

		console.log(`Connecting AMI Asterisk to the server -> ${this.asteriskHost}`)

		client.connect(this.asteriskUsername, this.asteriskSecret, {host: this.asteriskHost, port: this.asteriskPort})
			.then(() => {
				client
					.on('connect', () => console.log(`Connecting on the server -> ${this.asteriskHost}`))
					.on('response', response => console.log(response))
					.on('disconnect', () => console.log(`Disconnection on the server -> ${this.asteriskHost}`))
					.on('reconnection', () => console.log(`Reconnection on the server -> ${this.asteriskHost}`))
					.on('internalError', error => {
						console.log(`Error on the server -> ${this.asteriskHost}`)
						console.log(error)
					})

					.on('event', event => {
						// console.log(event.Event)
						if (event.Event === 'QueueMemberPause') {
							// console.log(this.asteriskHost)
							// console.log(event)
						}
					})
			})
			.catch(error => console.log(error))

	}
}

module.exports = AsteriskCorporativo
