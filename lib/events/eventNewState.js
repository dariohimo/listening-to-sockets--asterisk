import Helper from '../util/helperAsterisk'
const helper = new Helper()

class EventNewState {
	newState(data, dataPreUpdate, horaActualServer) {
		console.log('dataPreUpdate ------------- ')
		console.log(dataPreUpdate)
		console.log('Fin dataPreUpdate -----------')
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

		let context = data['Context'].split('-')

		const channelStateDesc = data['ChannelStateDesc']
		const connectedLineNum = data['ConnectedLineNum']
		const callerIDNum = data['CallerIDNum']
		const exten = data['Exten']
		const uniqueID = data['Uniqueid']
		const linkedID = data['Linkedid']
		const callerIDName = data['CallerIDName']
		const connectedLineName = data['ConnectedLineName']
		const preEventID = dataPreUpdate.event_id

		console.log('data ------------- ')
		console.log(data)
		console.log('Fin data -----------')

		// Para detectar el timbrado de llamadas salientes
		if (context[0] === 'nivel' && (channelStateDesc === 'Ring' || channelStateDesc === 'Ringing')) {
			if (connectedLineNum.length < 5 || connectedLineNum === '<unknown>') {
				agentAnnexed = callerIDNum.replace('SIP/', '')
				statusPause = '1'
				eventTime = horaActualServer
				if (exten.length > 4 && uniqueID === linkedID) {
					if (preEventID === '1') {
						outboundPhone = exten
						outboundStart = horaActualServer
						eventName = 'Ring OutBound'
						eventId = '13'
					} else {
						secondCall = true
						secondOutboundPhone = exten
						secondOutboundStart = horaActualServer
						secondEventName = 'Ring OutBound'
						secondEventId = '13'
					}
					eventObservaciones = 'Evento Asterisk - Inicio Ring OutBound'
				} else {
					if (uniqueID === linkedID) {
						outboundPhone = exten
						outboundStart = horaActualServer
						eventId = '21'
						eventName = 'Ring Outbound Interno'
						eventObservaciones = 'Evento Asterisk - Inicio Ring Outbound Interno'
					} else {
						inboundPhone = helper.getInboundPhone(connectedLineNum, connectedLineName)
						inboundStart = horaActualServer
						eventId = '18'
						eventName = 'Ring Inbound Interno'
						eventObservaciones = 'Evento Asterisk - Inicio Ring Inbound Interno'
					}
				}
			}
		}

		// Para detectar cuando el cliente conteste la llamada saliente
		if (channelStateDesc === 'Up') {
			if (dataPreUpdate) {
				if (connectedLineNum !== '<unknown>') {
					if (preEventID !== '12') {
						agentAnnexed = (connectedLineNum.length === 4) ? connectedLineNum : callerIDNum
						statusPause = '1'
						eventTime = horaActualServer
					}

					if (context[0] === 'context') {
						if (dataPreUpdate.second_outbound_start === '') {
							outboundPhone = exten
							outboundStart = horaActualServer
							eventId = '9'
							eventName = 'OutBound'
						} else {
							secondCall = true
							secondOutboundPhone = exten
							secondOutboundStart = horaActualServer
							secondEventId = '9'
							secondEventName = 'OutBound'
						}
					} else {
						if (uniqueID === linkedID) {
							// Anexo que recepciona la llamada Interna
							eventId = '19'
							eventName = 'Inbound Interno'
							inboundPhone = helper.getInboundPhone(callerIDNum, callerIDName)
							inboundStart = horaActualServer
						} else {
							if (preEventID === '27') eventId = '29'
							else if (preEventID === '24') eventId = '25'
							else if (preEventID === '21') eventId = '20'

							if (preEventID === '27') eventName = 'Outbound Transfer'
							else if (preEventID === '24') eventName = 'Inbound Transfer'
							else if (preEventID === '21') eventName = 'Outbound Interno'

							if (preEventID === '24') {
								// llamadas contestada Inbound transferidas
								inboundPhone = helper.getInboundPhone(connectedLineNum, connectedLineName)
								inboundStart = horaActualServer
							}

							if (preEventID === '21' || preEventID === '27') {
								// Anexo que realiza la llamada Interna
								outboundPhone = dataPreUpdate.outbound_phone
								outboundStart = horaActualServer
							}
						}
					}
				} else {
					if (uniqueID === linkedID) {
						// Para llamadas a anexos externos
						statusPause = '1'
						agentAnnexed = helper.extractAnnex(data)

						if (dataPreUpdate.second_outbound_start === '') {
							outboundPhone = exten
							outboundStart = horaActualServer
							eventId = '9'
							eventName = 'OutBound'
							eventTime = horaActualServer
						} else {
							secondCall = true
							secondOutboundPhone = exten
							secondOutboundStart = horaActualServer
							secondEventId = '9'
							secondEventName = 'OutBound'
						}
					}
				}

				if (eventName !== '') eventObservaciones = 'Evento Asterisk - Inicio ' + eventName
			}
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
		console.log('agent ------------- ')
		console.log(agent)
		console.log('Fin agent -----------')
		return agent
	}
}

module.exports = EventNewState