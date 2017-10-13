import Helper from '../util/helperAsterisk'
import len from 'object-length'

const helper = new Helper()

class EventHangUp {
	hangUp(sendData) {
		let actionJSON = ''
		let hangUpJSON = ''
		let statusAsteriskJSON = ''

		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate

		const context = dataEmitAsterisk['Context'].split('-')

		if (len(dataPreUpdate) > 0) {
			/**
			* [Valida si el corte se realiza cuando es una llamada saliente (fijo, celulares o 0800)]
			**/
			if(dataEmitAsterisk['ConnectedLineNum'] !== '<unknown>' && context[0] === 'context') {
				const preEventID = ['8','9','13','16','17']
				hangUpJSON = (preEventID.includes(dataPreUpdate.event_id)) ? this.endsTheOutboundCall(sendData) : ''
			}

			if (context[0] === 'nivel') {
				hangUpJSON = (dataEmitAsterisk['Uniqueid'] === dataEmitAsterisk['Linkedid']) ? this.endsTheInternalCall(sendData, true) : this.endsTheInternalCall(sendData, false)
			}

			statusAsteriskJSON = (dataPreUpdate.second_outbound_start === '') ? this.asteriskResponse(sendData, false) : this.asteriskResponse(sendData, true)
			actionJSON = Object.assign(hangUpJSON, statusAsteriskJSON)

			return this.generateResponseJson(actionJSON)
		}
	}


	endsTheOutboundCall (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const eventName = (dataPreUpdate.event_id === 13) ? 'Ring Outbound' : dataPreUpdate.event_name
		return {
			'agentAnnexed' : dataEmitAsterisk['ConnectedLineNum'],
			'eventObservaciones' : 'Evento Asterisk - Fin ' + eventName
		}
	}

	endsTheInternalCall (sendData, callNoAnswer) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate

		// const arrayCallInboundTransfer = ['24','25','26']
		// const arrayCallOutboundTransfer = ['27','28','29']

		// const arrayInternalCallInbound = ['18','19','22']
		const arrayInternalCallOutbound = ['20','21','23']

		const arrayCallInbound = ['8','12']
		const arrayCallOutbound = ['9','13','17']

		let responseJSON = ''

		if(callNoAnswer){
			if (arrayCallInbound.includes(dataPreUpdate.event_id)) {
				responseJSON = {
					'agentAnnexed' : (dataEmitAsterisk['Exten'].length === 0) ? dataEmitAsterisk['CallerIDNum'] : dataEmitAsterisk['ConnectedLineNum'],
					'eventObservaciones' : 'Evento Asterisk - Fin ' + dataPreUpdate.event_name
				}
			}
			if(arrayCallOutbound.includes(dataPreUpdate.event_id)){
				let agentAnnexed = ''
				if (dataEmitAsterisk['ConnectedLineNum'] === '<unknown>' && dataPreUpdate.event_id === '9') agentAnnexed = dataPreUpdate.agent_annexed
				else agentAnnexed = (dataEmitAsterisk['CallerIDNum'].length > '4') ? helper.extractAnnex(dataEmitAsterisk) : dataEmitAsterisk['CallerIDNum']
				responseJSON = {
					'agentAnnexed' : agentAnnexed,
					'eventObservaciones' : 'Evento Asterisk - Fin ' + dataPreUpdate.event_name
				}
			}
			if(arrayInternalCallOutbound.includes(dataPreUpdate.event_id)){
				responseJSON = {
					'agentAnnexed' : (dataPreUpdate.event_id === '13') ? dataPreUpdate.agent_annexed : dataEmitAsterisk['CallerIDNum'],
					'eventObservaciones' : 'Evento Asterisk - Fin ' + dataPreUpdate.event_name
				}
			}
		}else{
			responseJSON = {
				'agentAnnexed' : (dataPreUpdate.event_id === '24') ? dataPreUpdate.agent_annexed : dataEmitAsterisk['CallerIDNum'],
				'eventObservaciones' : 'Evento Asterisk - Fin ' + dataPreUpdate.event_name
			}
		}
		return responseJSON
	}

	asteriskResponse (sendData, secondCall) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		if(secondCall){
			return {
				'statusPause' : '0',
				'eventId' : '1',
				'eventTime' : sendData.horaActualServer
			}
		}else{
			let numberActually = (dataEmitAsterisk['Exten'].length === 0) ? dataEmitAsterisk['CallerIDNum'] : dataEmitAsterisk['Exten']
			if (dataPreUpdate.second_outbound_phone === numberActually) {
				return {
					'secondCall' : true,
					'statusPause' : '1',
					'eventId' : '17',
					'outboundStart' : dataPreUpdate.second_outbound_start,
					'outboundPhone' : dataPreUpdate.second_outbound_phone,
					'eventTime' : sendData.horaActualServer
				}
			} else {
				return {
					'statusPause' : '0',
					'eventId' : '1',
					'eventTime' : sendData.horaActualServer
				}
			}
		}
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
					'second_event_id': (data.secondEventId) ? data.secondEventId : ''
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
					'second_event_id': (data.secondEventId) ? data.secondEventId : ''
				}
			}
		}
	}
}

module.exports = EventHangUp
