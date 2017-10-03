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
			if (isGetDataPreUpdate) dataPreUpdate = await searchDashboardData.getDataPreUpdate(data)
			if(data['Event'] === 'Holds' || data['Event'] === 'Newstate') {
				agent = utilEvent.returnAgent(data, dataPreUpdate)
			}else{
				agent = await getStructure(event, data, dataPreUpdate)
			}


			if (agent) {
				console.log(`${msjLog} [${event} -> ${urlController}]`)
				request.send(urlController, 'POST', agent)
					.then(data => resolve(data))
					.catch(err => reject(err))
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

	transferUnattended (data) {
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

const extractAnnex = (datos) => {
	let agentAnnexed = datos['Channel'].split('-')
	agentAnnexed = agentAnnexed[0].split('/')
	agentAnnexed = agentAnnexed[1]
	return agentAnnexed
}

const nextEvent = (eventId, nextNameEvent) => {
	let nextEvent = ''
	if (eventId === '8') nextEvent = (nextNameEvent === true) ? 'Hold Inbound' : '16'
	else if (eventId === '16') nextEvent = (nextNameEvent === true) ? 'Inbound' : '8'
	else if (eventId === '19') nextEvent = (nextNameEvent === true) ? 'Hold Inbound Interno' : '22'
	else if (eventId === '22') nextEvent = (nextNameEvent === true) ? 'Inbound Interno' : '19'
	else if (eventId === '9') nextEvent = (nextNameEvent === true) ? 'Hold Outbound' : '17'
	else if (eventId === '17') nextEvent = (nextNameEvent === true) ? 'Outbound' : '9'
	else if (eventId === '20') nextEvent = (nextNameEvent === true) ? 'Hold Outbound Interno' : '23'
	else if (eventId === '23') nextEvent = (nextNameEvent === true) ? 'Outbound Interno' : '20'
	else if (eventId === '25') nextEvent = (nextNameEvent === true) ? 'Hold Inbound Transfer' : '26'
	else if (eventId === '26') nextEvent = (nextNameEvent === true) ? 'Inbound Transfer' : '25'
	else if (eventId === '29') nextEvent = (nextNameEvent === true) ? 'Hold Outbound Transfer' : '28'
	else if (eventId === '28') nextEvent = (nextNameEvent === true) ? 'Outbound Transfer' : '29'
	return nextEvent
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

		// Para detectar el timbrado de llamadas salientes
		if (event === 'newState' && context[0] === 'nivel' && (datos['ChannelStateDesc'] === 'Ring' || datos['ChannelStateDesc'] === 'Ringing')) {
			if (datos['ConnectedLineNum'].length < 5 || datos['ConnectedLineNum'] === '<unknown>') {
				agentAnnexed = datos['CallerIDNum'].replace('SIP/', '')
				statusPause = '1'
				eventTime = horaActualServer
				if (datos['Exten'].length > 4 && datos['Uniqueid'] === datos['Linkedid']) {
					if (dataPreUpdate.event_id === '1') {
						outboundPhone = datos['Exten']
						outboundStart = horaActualServer
						eventName = 'Ring OutBound'
						eventId = '13'
					} else {
						secondCall = true
						secondOutboundPhone = datos['Exten']
						secondOutboundStart = horaActualServer
						secondEventName = 'Ring OutBound'
						secondEventId = '13'
					}
					eventObservaciones = 'Evento Asterisk - Inicio Ring OutBound'
				} else {
					if (datos['Uniqueid'] === datos['Linkedid']) {
						outboundPhone = datos['Exten']
						outboundStart = horaActualServer
						eventId = '21'
						eventName = 'Ring Outbound Interno'
						eventObservaciones = 'Evento Asterisk - Inicio Ring Outbound Interno'
					} else {
						inboundPhone = getInboundPhone(datos['ConnectedLineNum'], datos['ConnectedLineName'])
						inboundStart = horaActualServer
						eventId = '18'
						eventName = 'Ring Inbound Interno'
						eventObservaciones = 'Evento Asterisk - Inicio Ring Inbound Interno'
					}
				}
			}
		}

		// Para detectar cuando el cliente conteste la llamada saliente
		if (event === 'newState' && datos['ChannelStateDesc'] === 'Up') {
			if (dataPreUpdate) {
				if (datos['ConnectedLineNum'] !== '<unknown>') {
					if (dataPreUpdate.event_id !== '12') {
						agentAnnexed = (datos['ConnectedLineNum'].length === 4) ? datos['ConnectedLineNum'] : datos['CallerIDNum']
						statusPause = '1'
						eventTime = horaActualServer
					}

					if (context[0] === 'context') {
						if (dataPreUpdate.second_outbound_start === '') {
							outboundPhone = datos['Exten']
							outboundStart = horaActualServer
							eventId = '9'
							eventName = 'OutBound'
						} else {
							secondCall = true
							secondOutboundPhone = datos['Exten']
							secondOutboundStart = horaActualServer
							secondEventId = '9'
							secondEventName = 'OutBound'
						}
					} else {
						if (datos['Uniqueid'] === datos['Linkedid']) {
							// Anexo que recepciona la llamada Interna
							eventId = '19'
							eventName = 'Inbound Interno'
							inboundPhone = getInboundPhone(datos['CallerIDNum'], datos['CallerIDName'])
							inboundStart = horaActualServer
						} else {
							if (dataPreUpdate.event_id === '27') eventId = '29'
							else if (dataPreUpdate.event_id === '24') eventId = '25'
							else if (dataPreUpdate.event_id === '21') eventId = '20'

							if (dataPreUpdate.event_id === '27') eventName = 'Outbound Transfer'
							else if (dataPreUpdate.event_id === '24') eventName = 'Inbound Transfer'
							else if (dataPreUpdate.event_id === '21') eventName = 'Outbound Interno'

							if (dataPreUpdate.event_id === '24') {
								// llamadas contestada Inbound transferidas
								inboundPhone = getInboundPhone(datos['ConnectedLineNum'], datos['ConnectedLineName'])
								inboundStart = horaActualServer
							}

							if (dataPreUpdate.event_id === '21' || dataPreUpdate.event_id === '27') {
								// Anexo que realiza la llamada Interna
								outboundPhone = dataPreUpdate.outbound_phone
								outboundStart = horaActualServer
							}
						}
					}
				} else {
					if (datos['Uniqueid'] === datos['Linkedid']) {
						// Para llamadas a anexos externos
						statusPause = '1'
						agentAnnexed = extractAnnex(datos)

						if (dataPreUpdate.second_outbound_start === '') {
							outboundPhone = datos['Exten']
							outboundStart = horaActualServer
							eventId = '9'
							eventName = 'OutBound'
							eventTime = horaActualServer
						} else {
							secondCall = true
							secondOutboundPhone = datos['Exten']
							secondOutboundStart = horaActualServer
							secondEventId = '9'
							secondEventName = 'OutBound'
						}
					}
				}

				if (eventName !== '') eventObservaciones = 'Evento Asterisk - Inicio ' + eventName
			}
		}

		// Para detectar el corte de llamadas salientes y/o entrantes
		if (event === 'hangup') {
			if (dataPreUpdate) {
				let preEventID = dataPreUpdate.event_id
				eventTime = horaActualServer
				if (datos['ConnectedLineNum'] !== '<unknown>' && context[0] === 'context') {
					if (preEventID === '8' || preEventID === '9' || preEventID === '13' || preEventID === '16' || preEventID === '17') {
						agentAnnexed = datos['ConnectedLineNum']
						eventObservaciones = 'Evento Asterisk - Fin ' + (preEventID === '13') ? 'Ring Outbound' : dataPreUpdate.event_name
					}
				}

				if (context[0] === 'nivel') {
					// Para detectar el corte de llamadas entrantes que son transferidas a otro analista.
					if (datos['Uniqueid'] === datos['Linkedid']) {
						if ((datos['Exten'].length >= 5 && datos['ConnectedLineNum'] !== '<unknown>') || (datos['Exten'].length <= 5 && datos['ConnectedLineNum'] === '<unknown>') || (datos['Exten'] === datos['ConnectedLineNum'])) {
							if (preEventID === '12' || preEventID === '8') {
								agentAnnexed = (datos['Exten'].length === 0) ? datos['CallerIDNum'] : datos['ConnectedLineNum']
								eventObservaciones = 'Evento Asterisk - Fin Inbound Transfer'
							}

							if (preEventID === '17' || preEventID === '9') {
								if (datos['ConnectedLineNum'] === '<unknown>' && preEventID === '9') agentAnnexed = dataPreUpdate.agent_annexed
								else agentAnnexed = (datos['CallerIDNum'].length > '4') ? extractAnnex(datos) : datos['CallerIDNum']
								eventObservaciones = 'Evento Asterisk - Fin Outbound Transfer'
							}

							// Fin de llamada Outbound Interno.
							if (preEventID === '20') {
								agentAnnexed = datos['CallerIDNum']
								eventObservaciones = 'Evento Asterisk - Fin Outbound Interno'
							}

							// Fin de Ring Outbound Interno.
							if (preEventID === '21') {
								agentAnnexed = datos['CallerIDNum']
								eventObservaciones = 'Evento Asterisk - Fin Ring Outbound Interno'
							}

							// Fin de Hold Outbound Interno.
							if (preEventID === '23') {
								agentAnnexed = datos['CallerIDNum']
								eventObservaciones = 'Evento Asterisk - Fin Hold Outbound Interno'
							}

							// Fin de Ring Outbound.
							if (preEventID === '13') {
								agentAnnexed = dataPreUpdate.agent_annexed
								eventObservaciones = 'Evento Asterisk - Fin Ring Outbound'
							}
						}
					} else {
						// Para detectar el corte de llamadas entrantes que no son contestadas en los anexos.
						if (preEventID === '12') {
							agentAnnexed = datos['CallerIDNum']
							eventObservaciones = 'Evento Asterisk - Fin Ring Call Inbound'
						}

						// Fin de llamada Inbound Interno.
						if (preEventID === '19') {
							agentAnnexed = datos['CallerIDNum']
							eventObservaciones = 'Evento Asterisk - Fin Inbound Interno'
						}

						// Fin de Ring Inbound Interno.
						if (preEventID === '18') {
							agentAnnexed = datos['CallerIDNum']
							eventObservaciones = 'Evento Asterisk - Fin Ring Inbound Interno'
						}

						// Fin de Hold Inbound Interno.
						if (preEventID === '22') {
							agentAnnexed = datos['CallerIDNum']
							eventObservaciones = 'Evento Asterisk - Fin Hold Inbound Interno'
						}

						// Fin de Ring Inbound Transfer.
						if (preEventID === '24') {
							agentAnnexed = dataPreUpdate.agent_annexed
							eventObservaciones = 'Evento Asterisk - Fin Ring Inbound Transfer'
						}

						// Fin de Hold Inbound Interno.
						if (preEventID === '25') {
							agentAnnexed = datos['CallerIDNum']
							eventObservaciones = 'Evento Asterisk - Fin Inbound Transfer'
						}

						// Fin de Hold Inbound Interno.
						if (preEventID === '26') {
							agentAnnexed = datos['CallerIDNum']
							eventObservaciones = 'Evento Asterisk - Fin Hold Inbound Transfer'
						}

						// Fin de Ring Outbound Transfer.
						if (preEventID === '27') {
							agentAnnexed = datos['CallerIDNum']
							eventObservaciones = 'Evento Asterisk - Fin Ring Outbound Transfer'
						}

						// Fin de Hold Outbound Transfer.
						if (preEventID === '28') {
							agentAnnexed = datos['CallerIDNum']
							eventObservaciones = 'Evento Asterisk - Fin Hold Outbound Transfer'
						}

						// Fin de Outbound Transfer.
						if (preEventID === '29') {
							agentAnnexed = datos['CallerIDNum']
							eventObservaciones = 'Evento Asterisk - Fin Outbound Transfer'
						}
					}
				}

				if (dataPreUpdate.second_outbound_start === '') {
					statusPause = '0'
					eventId = '1'
					eventName = 'ACD'
				} else {
					let numberActually = (datos['Exten'].length === 0) ? datos['CallerIDNum'] : datos['Exten']
					if (dataPreUpdate.second_outbound_phone === numberActually) {
						secondCall = true
					} else {
						statusPause = '1'
						eventId = '17'
						eventName = 'Hold Outbound'
						outboundStart = dataPreUpdate.second_outbound_start
						outboundPhone = dataPreUpdate.second_outbound_phone
					}
				}
			}
		}

		// Para detectar el estado Hold realizado por un analista
		if (event === 'hold') {
			if (dataPreUpdate.event_id === '8' || dataPreUpdate.event_id === '19' || dataPreUpdate.event_id === '25') {
				eventId = nextEvent(dataPreUpdate.event_id, false)
				eventName = nextEvent(dataPreUpdate.event_id, true)
				inboundQueue = dataPreUpdate.inbound_queue
				inboundPhone = dataPreUpdate.inbound_phone
				inboundStart = dataPreUpdate.inbound_start
			}

			if (dataPreUpdate.event_id === '9' || dataPreUpdate.event_id === '20' || dataPreUpdate.event_id === '29') {
				eventId = nextEvent(dataPreUpdate.event_id, false)
				eventName = nextEvent(dataPreUpdate.event_id, true)
				outboundPhone = dataPreUpdate.outbound_phone
				outboundStart = dataPreUpdate.outbound_start
			}

			statusPause = '1'
			agentAnnexed = (datos['CallerIDNum'].length > '4') ? extractAnnex(datos) : datos['CallerIDNum']
			eventTime = horaActualServer
			eventObservaciones = 'Evento Asterisk - Inicio ' + eventName

			if (dataPreUpdate.second_outbound_phone === datos['Exten']) {
				secondCall = true
				secondOutboundPhone = datos['Exten']
				secondOutboundStart = horaActualServer
				secondEventId = nextEvent(dataPreUpdate.second_event_id, false)
				secondEventName = nextEvent(dataPreUpdate.second_event_id, true)
			} else {
				secondOutboundPhone = dataPreUpdate.second_outbound_phone
				secondOutboundStart = dataPreUpdate.second_outbound_start
				secondEventId = dataPreUpdate.second_event_id
				secondEventName = dataPreUpdate.second_event_name
			}
		}

		// Para detectar el estado unHold realizado por un analista
		if (event === 'unHold') {
			if (dataPreUpdate.event_id === '16' || dataPreUpdate.event_id === '22' || dataPreUpdate.event_id === '26') {
				eventId = nextEvent(dataPreUpdate.event_id, false)
				eventName = nextEvent(dataPreUpdate.event_id, true)
				inboundQueue = dataPreUpdate.inbound_queue
				inboundPhone = dataPreUpdate.inbound_phone
				inboundStart = dataPreUpdate.inbound_start
			}

			if (dataPreUpdate.event_id === '23' || dataPreUpdate.event_id === '17' || dataPreUpdate.event_id === '28') {
				eventId = nextEvent(dataPreUpdate.event_id, false)
				eventName = nextEvent(dataPreUpdate.event_id, true)
				outboundPhone = dataPreUpdate.outbound_phone
				outboundStart = dataPreUpdate.outbound_start
			}
			statusPause = '1'
			agentAnnexed = (datos['CallerIDNum'].length > '4') ? extractAnnex(datos) : datos['CallerIDNum']
			eventTime = horaActualServer
			eventObservaciones = 'Evento Asterisk - Fin Hold ' + eventName

			if (dataPreUpdate.second_outbound_phone === datos['Exten']) {
				secondCall = true
				secondOutboundPhone = datos['Exten']
				secondOutboundStart = horaActualServer
				secondEventId = nextEvent(dataPreUpdate.second_event_id, false)
				secondEventName = nextEvent(dataPreUpdate.second_event_id, true)
			} else {
				secondOutboundPhone = dataPreUpdate.second_outbound_phone
				secondOutboundStart = dataPreUpdate.second_outbound_start
				secondEventId = dataPreUpdate.second_event_id
				secondEventName = dataPreUpdate.second_event_name
			}
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
