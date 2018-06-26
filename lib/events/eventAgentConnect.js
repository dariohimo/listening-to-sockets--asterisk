import Helper from '../util/helperAsterisk'
import len from 'object-length'

const helper = new Helper()

class EventAgentConnect {
	agentConnect (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const context = dataEmitAsterisk['DestContext'].split('-')

		if(len(dataEmitAsterisk) > 0 && len(dataPreUpdate) > 0) {
			if(dataEmitAsterisk['ChannelStateDesc'] === 'Up' && context[0] === 'nivel'){
				if(dataPreUpdate.event_id === 12) return this.answerInbound(sendData)
			}
		}
	}

	answerInbound (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		let responseJson = {
			'agentAnnexed' : dataEmitAsterisk['Interface'].replace('SIP/', ''),
			'statusPause' : 1,
			'eventId' : 8,
			'eventTime' : sendData.horaActualServer,
			'eventObservaciones' : 'Evento Asterisk - Inicio Inbound',
			'inboundQueue' : dataEmitAsterisk['Queue'],
			'inboundPhone' : helper.getInboundPhone(dataEmitAsterisk['CallerIDNum'], dataEmitAsterisk['CallerIDName']),
			'inboundStart' : sendData.horaActualServer,
			'secondOutboundPhone' : '',
			'secondStatusCall' : 0
		}
		return this.generateResponseJson(responseJson)
	}

	/**
	* [Genera un objecto que pasara como parametro a una ruta de SailsJS]
	*/
	generateResponseJson (data) {
		if (data.agentAnnexed) {
			if (data.secondCall === true) {
				return {
					'agent_annexed': (data.agentAnnexed) ? data.agentAnnexed : '',
					'second_outbound_phone': (data.secondOutboundPhone) ? data.secondOutboundPhone : '',
					'second_outbound_start': (data.secondOutboundStart) ? data.secondOutboundStart : '',
					'second_event_id': (data.secondEventId) ? data.secondEventId : '',
					'second_event_name': (data.secondEventName) ? data.secondEventName : '',
					'second_status_call' : (data.secondEventName) ? data.secondEventName : 1,
					'changeEventPrimary' : (data.changeEventPrimary) ? data.changeEventPrimary : 1
				}
			} else {
				return {
					'agent_annexed': (data.agentAnnexed) ? data.agentAnnexed : '',
					'agent_status': (data.statusPause) ? data.statusPause : '',
					'event_id': (data.eventId) ? data.eventId : '',
					'event_id_old': (data.eventIDOld) ? data.eventIDOld : '',
					'event_name': (data.eventName) ? data.eventName : '',
					'event_time': (data.eventTime) ? data.eventTime : '',
					'event_observaciones': (data.eventObservaciones) ? data.eventObservaciones : '',
					'inbound_queue': (data.inboundQueue) ? data.inboundQueue : '',
					'inbound_phone': (data.inboundPhone) ? data.inboundPhone : '',
					'inbound_start': (data.inboundStart) ? data.inboundStart : '',
					'outbound_phone': (data.outboundPhone) ? data.outboundPhone : '',
					'outbound_start': (data.outboundStart) ? data.outboundStart : '',
					'second_outbound_phone': (data.secondOutboundPhone) ? data.secondOutboundPhone : '',
					'second_outbound_start': (data.secondOutboundStart) ? data.secondOutboundStart : '',
					'second_event_id': (data.secondEventId) ? data.secondEventId : '',
					'second_event_name': (data.secondEventName) ? data.secondEventName : '',
					'second_status_call' : (data.secondEventName) ? data.secondEventName : 0,
					'changeEventPrimary' : (data.changeEventPrimary) ? data.changeEventPrimary : 0
				}
			}
		}
	}
}

module.exports = EventAgentConnect