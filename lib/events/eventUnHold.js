import Helper from '../util/helperAsterisk'
import len from 'object-length'

const helper = new Helper()

class EventUnHold {
	unHold(sendData) {
		let actionJSON = ''
		let UnholdJSON = ''
		let secondCall = ''

		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const UnholdInbound = ['16','22','26']
		const UnholdOutbound = ['17','23','28']

		if(len(dataPreUpdate) > 0){
			/**
			* [Valida si el evento anterior es una llamada tipo Inbound o Outbound (Interna, Transfer, Saliente)]
			**/
			if (UnholdInbound.includes(dataPreUpdate.event_id)) UnholdJSON = this.pressUnHoldCallInbound(sendData)
			if (UnholdOutbound.includes(dataPreUpdate.event_id)) UnholdJSON = this.pressUnHoldCallOutbound(sendData)
			if (dataPreUpdate.second_status_call === 1) secondCall = (dataPreUpdate.second_outbound_phone === dataEmitAsterisk['Exten']) ? this.validateUnHoldinSecondCall(sendData, true) : this.validateUnHoldinSecondCall(sendData, false)
			actionJSON = Object.assign(UnholdJSON, secondCall)

			return this.generateResponseJson(actionJSON)
		}
	}

	/**
	* [Crea el objeto que indica que se quito el Hold en una llamada tipo Inbound (entrante)]
	**/
	pressUnHoldCallInbound (sendData) {
		const dataPreUpdate = sendData.dataPreUpdate
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const secondStatusCall = (dataPreUpdate.second_status_call === '1') ? '1' : '0'
		return {
			'statusPause' : '1',
			'agentAnnexed' : (dataEmitAsterisk['CallerIDNum'].length > '4') ? helper.extractAnnex(dataEmitAsterisk) : dataEmitAsterisk['CallerIDNum'],
			'inboundQueue' : dataPreUpdate.inbound_queue,
			'inboundPhone' : dataPreUpdate.inbound_phone,
			'inboundStart' : dataPreUpdate.inbound_start,
			'eventId' : helper.nextEvent(dataPreUpdate.event_id, false),
			'eventTime' : sendData.horaActualServer,
			'eventObservaciones' : 'Evento Asterisk - Fin Hold ' + helper.nextEvent(dataPreUpdate.event_id, true),
			'secondStatusCall' : secondStatusCall
		}
	}

	/**
	* [Crea el objeto que indica que se quito el Hold en una llamada tipo Outbound (saliente)]
	**/
	pressUnHoldCallOutbound (sendData) {
		const dataPreUpdate = sendData.dataPreUpdate
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const secondStatusCall = (dataPreUpdate.second_status_call === '1') ? '1' : '0'
		return {
			'statusPause' : '1',
			'agentAnnexed' : (dataEmitAsterisk['CallerIDNum'].length > '4') ? helper.extractAnnex(dataEmitAsterisk) : dataEmitAsterisk['CallerIDNum'],
			'eventId' : helper.nextEvent(dataPreUpdate.event_id, false),
			'eventTime' : sendData.horaActualServer,
			'outboundPhone' : dataPreUpdate.outbound_phone,
			'outboundStart' : dataPreUpdate.outbound_start,
			'eventObservaciones' : 'Evento Asterisk - Fin Hold ' + helper.nextEvent(dataPreUpdate.event_id, true),
			'secondStatusCall' : secondStatusCall
		}
	}

	/**
	* [Crea el objecto que indica que se esta en una segunda, y se presiona el Hold]
	**/
	validateUnHoldinSecondCall (sendData, secondCall) {
		const dataPreUpdate = sendData.dataPreUpdate
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		if(secondCall) {
			return {
				'secondCall' : true,
				'secondOutboundPhone' : dataEmitAsterisk['Exten'],
				'secondOutboundStart' : sendData.horaActualServer,
				'secondEventId' : helper.nextEvent(dataPreUpdate.second_event_id, false),
				'secondStatusCall' : '1',
				'changeEventPrimary' : '0'
			}
		} else {
			return {
				'secondOutboundPhone' : dataPreUpdate.second_outbound_phone,
				'secondOutboundStart' : dataPreUpdate.second_outbound_start,
				'secondEventId' : helper.nextEvent(dataPreUpdate.second_event_id, false),
				'secondStatusCall' : '1',
				'changeEventPrimary' : '1',
				'changeSecondStatusCall' :'1'
			}
		}
	}

	/**
	* [Valida cuando se contesta una llamada saliente (fijos, celular, 0800), valida igualmente si es una segunda llamada]
	*/
	generateResponseJson (data) {
		if (data.agentAnnexed) {
			if (data.secondCall === true) {
				return {
					'agent_annexed': (data.agentAnnexed) ? data.agentAnnexed : '',
					'second_outbound_phone': (data.secondOutboundPhone) ? data.secondOutboundPhone : '',
					'second_outbound_start': (data.secondOutboundStart) ? data.secondOutboundStart : '',
					'second_event_id': (data.secondEventId) ? data.secondEventId : '',
					'second_status_call' : (data.secondStatusCall) ? data.secondStatusCall : '1',
					'changeEventPrimary' : (data.changeEventPrimary) ? data.changeEventPrimary : '1',
					'changeSecondStatusCall' : (data.changeSecondStatusCall) ? data.changeSecondStatusCall : '0'
				}
			} else {
				return {
					'agent_annexed': (data.agentAnnexed) ? data.agentAnnexed : '',
					'agent_status': (data.statusPause) ? data.statusPause : '',
					'event_id': (data.eventId) ? data.eventId : '',
					'event_id_old': (data.eventIDOld) ? data.eventIDOld : '',
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
					'second_status_call' : (data.secondStatusCall) ? data.secondStatusCall : '0',
					'changeEventPrimary' : (data.changeEventPrimary) ? data.changeEventPrimary : '0'
				}
			}
		}
	}
}

module.exports = EventUnHold
