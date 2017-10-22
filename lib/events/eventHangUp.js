import Helper from '../util/helperAsterisk'
import HangUpDuringTheRing from './eventHangUp/hangUpDuringTheRing'
import HangUpDuringTheCall from './eventHangUp/hangUpDuringTheCall'

import len from 'object-length'

const helper = new Helper()
const hangUpDuringTheRing = new HangUpDuringTheRing()
const hangUpDuringTheCall = new HangUpDuringTheCall()

class EventHangUp {
	hangUp(sendData) {
		let actionJSON = ''
		let hangUpJSON = ''
		//let statusAsteriskJSON = ''

		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate

		const context = dataEmitAsterisk['Context'].split('-')

		if (len(dataPreUpdate) > 0 && dataPreUpdate.event_id !== '1') {
			/**
			* [Valida si el corte se realiza cuando es una llamada saliente (fijo, celulares o 0800)]
			**/
			/*if(dataEmitAsterisk['ConnectedLineNum'] !== '<unknown>' && context[0] === 'context') {
				const eventInbound = ['8','12','16']
				const eventOutbound = ['9','13','17']
				console.log('dsasaadsdsssdd----------------------')
				if(eventOutbound.includes(dataPreUpdate.event_id)) {
					hangUpJSON = hangUpOutbound.outBoundCall(sendData)
				}
				if(eventInbound.includes(dataPreUpdate.event_id)) hangUpJSON = this.endsTheInboundCall(sendData)
			}*/

			if (context[0] === 'nivel') {
				const channelStateDesc = dataEmitAsterisk['ChannelStateDesc']
				if(channelStateDesc === 'Ring' || channelStateDesc === 'Ringing') hangUpJSON = hangUpDuringTheRing.typeCall(sendData)
				if(channelStateDesc === 'Up') hangUpJSON = hangUpDuringTheCall.typeCall(sendData)
				//hangUpJSON = this.endsTheInternalCall(sendData)
			}

			//statusAsteriskJSON = this.asteriskResponse(sendData)
			actionJSON = Object.assign(hangUpJSON)

			return this.generateResponseJson(actionJSON)
		}
	}


	endsTheOutboundCall (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const eventName = helper.nameEvent(dataPreUpdate.event_id)
		return {
			'agentAnnexed' : dataEmitAsterisk['ConnectedLineNum'],
			'eventObservaciones' : 'Evento Asterisk - Fin ' + eventName
		}
	}

	endsTheInboundCall (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const eventName = helper.nameEvent(dataPreUpdate.event_id)
		return {
			'agentAnnexed' : dataEmitAsterisk['ConnectedLineNum'],
			'eventObservaciones' : 'Evento Asterisk - Fin ' + eventName
		}
	}

	endsTheInternalCall (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const callNoAnswer = (dataEmitAsterisk['Uniqueid'] === dataEmitAsterisk['Linkedid']) ? true : false

		// const arrayCallInboundTransfer = ['24','25','26']
		// const arrayCallOutboundTransfer = ['27','28','29']
		// const arrayInternalCallInbound = ['18','19','22']
		const arrayInternalCallOutbound = ['20','21','23']

		const arrayCallInbound = ['8','12','16']
		const arrayCallOutbound = ['9','13','17']

		let responseJSON = ''

		if(callNoAnswer){
			if(arrayCallInbound.includes(dataPreUpdate.event_id)) responseJSON = this.responseInbound(sendData)
			if(arrayCallOutbound.includes(dataPreUpdate.event_id)) responseJSON = this.responseOutbound(sendData)
			if(arrayInternalCallOutbound.includes(dataPreUpdate.event_id)) responseJSON = this.responseInternal(sendData)
		}else{
			responseJSON = {
				'agentAnnexed' : (dataPreUpdate.event_id === '24') ? dataPreUpdate.agent_annexed : dataEmitAsterisk['CallerIDNum'],
				'eventObservaciones' : 'Evento Asterisk - Fin ' + helper.nameEvent(dataPreUpdate.event_id)
			}
		}
		return responseJSON
	}

	responseInbound (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const connectedLineNum = dataEmitAsterisk['ConnectedLineNum']
		const callerIDNum = dataEmitAsterisk['CallerIDNum']

		if(dataPreUpdate.second_status_call === '1'){
			return {
				'agentAnnexed' : callerIDNum,
				'eventObservaciones' : 'Evento Asterisk - Fin ' + helper.nameEvent(dataPreUpdate.event_id)
			}
		}else{
			return {
				'agentAnnexed' : (dataEmitAsterisk['Exten'].length === 0) ? callerIDNum : connectedLineNum,
				'eventObservaciones' : 'Evento Asterisk - Fin ' + helper.nameEvent(dataPreUpdate.event_id)
			}
		}		
	}

	responseOutbound (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const connectedLineNum = dataEmitAsterisk['ConnectedLineNum']
		const callerIDNum = dataEmitAsterisk['CallerIDNum']

		let agentAnnexed = ''

		if (connectedLineNum === '<unknown>' && dataPreUpdate.event_id === '9') agentAnnexed = dataPreUpdate.agent_annexed
		else agentAnnexed = (callerIDNum.length > '4') ? helper.extractAnnex(dataEmitAsterisk) : callerIDNum
		return {
			'agentAnnexed' : agentAnnexed,
			'eventObservaciones' : 'Evento Asterisk - Fin ' + helper.nameEvent(dataPreUpdate.event_id)
		}
	}

	responseInternal (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		return {
			'agentAnnexed' : (dataPreUpdate.event_id === '13') ? dataPreUpdate.agent_annexed : dataEmitAsterisk['CallerIDNum'],
			'eventObservaciones' : 'Evento Asterisk - Fin ' + helper.nameEvent(dataPreUpdate.event_id)
		}
	}

	asteriskResponse (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const secondCall = (dataPreUpdate.second_status_call === 1) ? true : false

		/**
		 * [Estando en una llamada saliente, se realiza una segunda llamada hacia un anexo
		 * interno a la PBX]
		 */
		if(secondCall){
			if(len(dataEmitAsterisk['Exten']) > 4 ) {
				/**
				 * [Se produce cuando se corta la primera llamada saliente]
				 */
				return {
					'secondCall' : false,
					'statusPause' : '1',
					'outboundPhone' : dataPreUpdate.second_outbound_phone,
					'outboundStart' : sendData.horaActualServer,
					'eventId' : dataPreUpdate.second_event_id,
					'eventTime' : sendData.horaActualServer,
					'secondOutboundPhone' : '',
					'secondOutboundStart' : '',
					'secondEventId' : '',
					'secondStatusCall' : '0'
				}
			}else{
				/**
				 * [Se produce cuando se corta la segunda llamada interna]
				 */
				return {
					'secondCall' : true,
					'statusPause' : '1',
					'secondOutboundPhone' : '',
					'secondOutboundStart' : '',
					'secondEventId' : '',
					'secondStatusCall' : '1'
				}
			}
		}else{
			return {
				'statusPause' : '0',
				'eventId' : '1',
				'eventTime' : sendData.horaActualServer
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
					'second_event_id': (data.secondEventId) ? data.secondEventId : '',
					'second_status_call' : (data.secondStatusCall) ? data.secondStatusCall : '1',
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
					'second_status_call' : (data.changeSecondStatusCall) ? data.changeSecondStatusCall : '0',
					'changeSecondStatusCall' : (data.changeSecondStatusCall) ? data.changeSecondStatusCall : '1'
				}
			}
		}
	}
}

module.exports = EventHangUp