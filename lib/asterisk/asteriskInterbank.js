import AmiClient from 'asterisk-ami-client'

import EventsAsterisk from './eventsAsterisk'
import EnvironmentVariables from './../util/environmentVariables'

const env = new EnvironmentVariables()
const eventsAsterisk = new EventsAsterisk()

const client = new AmiClient({
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

class AsteriskInterbank {
	constructor (){
		this.asteriskHost = ''
		this.asteriskPort = ''
		this.asteriskUsername = ''
		this.asteriskSecret = ''
	}

	conectionAsterisk (nameProyect) {
		const envAsterisk = env.envAsterisk(nameProyect)

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
						/**
						 * [Capturar el evento Queue Member Added que se produce en el servicio del asterisk]
						 */
						if (event.Event === 'QueueMemberPause') eventsAsterisk.queueMemberPause(event)

						/**
						 * [Capturar el evento Queue Member Added que se produce en el servicio de asterisk]
						 */
						if (event.Event === 'QueueMemberAdded') eventsAsterisk.queueMemberPause(event)

						/**
						 * [Capturar el evento Queue Member Added que se produce en el servicio de asterisk]
						 */
						if (event.Event === 'Hold') eventsAsterisk.hold(event)

						/**
						 * [Capturar el evento Queue Member Added que se produce en el servicio de asterisk]
						 */
						if (event.Event === 'Unhold') eventsAsterisk.unHold(event)

						/**
						 * [Capturar el evento de timbrado de la llamada saliente que se produce en el servicio de asterisk]
						 */
						if (event.Event === 'Newstate') { eventsAsterisk.newstate(event) }

						/**
						 * [Capturar el evento de timbrado de la llamada entrante que se produce en el servicio de asterisk]
						 */
						if (event.Event === 'NewConnectedLine') { eventsAsterisk.newConnectedLine(event)}

						/**
						 * [Capturar el evento Answer de la llamada entrante que se produce en el servicio de asterisk]
						 */
						if (event.Event === 'AgentConnect') { eventsAsterisk.agentConnect(event)}

						/**
						 * [Capturar el evento de corte de llamada sea entrante y/o saliente que se produce en el servicio de asterisk]
						 */
						if (event.Event === 'Hangup') { eventsAsterisk.hangup(event)}

						/**
						 * [Capturar el evento cuando se completa una transferencia ciega que se produce en el servicio de asterisk]
						 */
						if (event.Event === 'BlindTransfer') { eventsAsterisk.blindTransfer(event)}

						/**
						 * [Capturar el evento cuando se completa una transferencia atendida que se produce en el servicio de asterisk]
						 */
						if (event.Event === 'AttendedTransfer') { eventsAsterisk.attendedTransfer(event)}

						/**
						 * [Capturar el evento cuando se ingresa una llamada encolada que se produce en el servicio de asterisk]
						 */
						if (event.Event === 'QueueCallerJoin') { eventsAsterisk.queueCallerJoin(event)}

						/**
						 * [Capturar el evento cuando se contesta una llamada encolada que se produce en el servicio de asterisk]
						 */
						if (event.Event === 'QueueCallerLeave') { eventsAsterisk.queueCallerLeave(event)}
					})
			})
			.catch(error => console.log(error))

	}
}

module.exports = AsteriskInterbank
