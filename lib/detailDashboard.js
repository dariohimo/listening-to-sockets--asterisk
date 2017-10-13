import Request from './sendRequest'
import getEnv from './getEnv'
import SearchDashboardData from './dashboard/searchDashboardData'
import UtilEvent from './util/utilEvent'

const env = new getEnv()
const envSails = env.envSails()

const searchDashboardData = new SearchDashboardData()
const utilEvent = new UtilEvent()

const request = new Request({
	endpoint: envSails.endpoint,
	apiName: envSails.apiDetailDashboard
})

class DetailDashboard {
	getRequest (data, event, urlController, msjLog, isGetDataPreUpdate = false) {
		return new Promise(async (resolve, reject) => {
			let dataPreUpdate = {}
			let agent = ''
			console.log('DetailDashboard......................')
			console.log(data['Event'])
			if(data['Event'] === 'Unhold' || data['Event'] === 'Hangup') {
				setTimeout(async function() {
					if (isGetDataPreUpdate) dataPreUpdate = await searchDashboardData.getDataPreUpdate(data)
					if (data['Event'] === 'Newstate' || data['Event'] === 'Hangup' || data['Event'] === 'Hold' || data['Event'] === 'Unhold' || data['Event'] === 'BlindTransfer') agent = await utilEvent.returnAgent(data, dataPreUpdate)
					else agent = await getStructure(event, data, dataPreUpdate)
					if (agent) {
						console.log(`${msjLog} [${event} -> ${urlController}]`)
						request.send(urlController, 'POST', agent)
							.then(data => resolve(data))
							.catch(err => reject(err))
					}
				}, 800)
			} else {
				if (isGetDataPreUpdate) dataPreUpdate = await searchDashboardData.getDataPreUpdate(data)
				if (data['Event'] === 'Newstate' || data['Event'] === 'Hangup' || data['Event'] === 'Hold' || data['Event'] === 'Unhold' || data['Event'] === 'BlindTransfer') agent = await utilEvent.returnAgent(data, dataPreUpdate)
				else agent = await getStructure(event, data, dataPreUpdate)
				if (agent) {
					console.log(`${msjLog} [${event} -> ${urlController}]`)
					request.send(urlController, 'POST', agent)
						.then(data => resolve(data))
						.catch(err => reject(err))
				}
			}
		})
	}

	shows () {
		return new Promise((resolve, reject) => {
			request.send('/', 'GET', null)
				.then(data => resolve(data))
				.catch(err => reject(err))
		})
	}

	search (data) {
		return this.getRequest(data, 'searchAgent', '/search', 'Search segun el anexo el EventId del Agente')
	}

	memberPause (data) {
		return this.getRequest(data, 'memberPause', '/updatePause', 'Pausing Agent')
	}

	memberAdd (data) {
		return this.getRequest(data, 'memberAdd', '/searchAndUpdate', 'Dashboard : Adding Agent')
	}

	ringInbound (data) {
		return this.getRequest(data, 'newConnectedLine', '/searchAndUpdate', 'Dashboard : Ring Inbound')
	}

	answerInbound (data) {
		return this.getRequest(data, 'agentConnect', '/searchAndUpdate', 'Dashboard : Answer Inbound')
	}

	ringAnswerOutbound (data) {
		return this.getRequest(data, 'newState', '/searchAndUpdate', 'Dashboard : Ring Outbound', true)
	}

	hangup (data) {
		return this.getRequest(data, 'hangup', '/searchAndUpdate', 'Dashboard : Hangup', true)
	}

	hold (data) {
		return this.getRequest(data, 'hold', '/searchAndUpdate', 'Dashboard : Hold', true)
	}

	unhold (data) {
		return this.getRequest(data, 'unHold', '/searchAndUpdate', 'Dashboard : UnHold', true)
	}

	blindTransfer (data) {
		return this.getRequest(data, 'blindTransfer', '/transferUnattended', 'Dashboard : Remove Transfer Unattended', true)
	}

	attendedTransfer (data) {
		return this.getRequest(data, 'attendedTransfer', '/searchAndUpdate', 'Dashboard : AttendedTransfer')
	}
}

const getInboundPhone = (callerIDNum, callerIDName) => {
	if (callerIDNum === callerIDName) return callerIDNum
	if (callerIDName === '<unknown>') return callerIDNum
	return `${callerIDNum} - ${callerIDName}`
}


const getStructure = (event, data, dataPreUpdate) => {
	const datos = (event, data)
	const horaActualServer = (new Date()).getTime()
	let agent = ''
	let agentAnnexed = ''
	let eventId = ''
	let eventName = ''
	let eventTime = ''
	let eventObservaciones = ''
	let inboundQueue = ''
	let inboundPhone = ''
	let inboundStart = ''
	let outboundPhone = ''
	let outboundStart = ''
	let statusPause = ''
	let secondOutboundPhone = ''
	let secondOutboundStart = ''
	let secondEventId = ''
	let secondEventName = ''
	let secondCall = false

	// Para detectar la creacion de un agente en la tabla agent_online
	if (event === 'searchAgent') {
		agent = {'agent_annexed': datos['CallerIDNum'].replace('SIP/', '') ? datos['CallerIDNum'].replace('SIP/', '') : datos['ConnectedLineNum']}
		return agent
	}

	// Para detectar el evento add y remove a las colas del servidor asteris
	if (event === 'memberAdd' || event === 'memberRemoved') {
		if (datos['Interface'] !== '') {
			agent = {
				'agent_user_id': dataPreUpdate.agent_user_id,
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
		let context = datos['Context'].split('-')

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
	}

	// Para detectar la transferencia ciega realizada por un analista
	if (event === 'blindTransfer') {
		const dataTransfer = {}

		dataTransfer['liberar'] = {
			'agent_annexed': datos['TransfererCallerIDNum'],
			'agent_status': '0',
			'event_id': '1',
			'event_name': 'ACD',
			'event_time': horaActualServer,
			'inbound_queue': '',
			'inbound_phone': '',
			'inbound_start': '',
			'event_observaciones': 'Evento Asterisk - Fin Inbound por Transfer'
		}

		if (dataPreUpdate.inbound_phone !== '') {
			dataTransfer['asignar'] = {
				'agent_annexed': datos['Extension'],
				'agent_status': '1',
				'event_id': '24',
				'event_name': 'Ring Inbound Transfer',
				'event_time': horaActualServer,
				'inbound_queue': dataPreUpdate.inbound_queue,
				'inbound_phone': dataPreUpdate.inbound_phone,
				'inbound_start': dataPreUpdate.inbound_start,
				'event_observaciones': 'Evento Asterisk - Inicio Inbound por Transfer'
			}
		} else {
			dataTransfer['asignar'] = {
				'agent_annexed': datos['Extension'],
				'agent_status': '1',
				'event_id': '27',
				'event_name': 'Ring OutBound Transfer',
				'event_time': horaActualServer,
				'outbound_phone': dataPreUpdate.outbound_phone,
				'outbound_start': dataPreUpdate.outbound_start,
				'event_observaciones': 'Evento Asterisk - Inicio Outbound por Transfer'
			}
		}

		return dataTransfer
	}

	if (agentAnnexed) {
		if (secondCall === true) {
			agent = {
				'agent_annexed': agentAnnexed,
				'second_outbound_phone': secondOutboundPhone,
				'second_outbound_start': secondOutboundStart,
				'second_event_id': secondEventId,
				'second_event_name': secondEventName
			}
		} else {
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
				'outbound_start': outboundStart,
				'second_outbound_phone': secondOutboundPhone,
				'second_outbound_start': secondOutboundStart,
				'second_event_id': secondEventId,
				'second_event_name': secondEventName
			}
		}
	}
	return agent
}

module.exports = DetailDashboard
