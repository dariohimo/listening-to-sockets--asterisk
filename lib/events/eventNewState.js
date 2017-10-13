import Helper from '../util/helperAsterisk'
import len from 'object-length'

const helper = new Helper()

class EventNewState {
	newState(sendData) {
		let actionJSON = ''
		let answerInbound = ''
		let answerExternOutgoing = ''
		let answerInternal = ''

		const dataPreUpdate = sendData.dataPreUpdate
		const dataEmitAsterisk = sendData.dataEmitAsterisk

		const context = dataEmitAsterisk['Context'].split('-')

		const channelStateDesc = dataEmitAsterisk['ChannelStateDesc']
		const connectedLineNum = dataEmitAsterisk['ConnectedLineNum']
		const exten = dataEmitAsterisk['Exten']
		const uniqueID = dataEmitAsterisk['Uniqueid']
		const linkedID = dataEmitAsterisk['Linkedid']
		const preEventID = (len(dataPreUpdate) > 0 && dataPreUpdate.event_id) ? dataPreUpdate.event_id : ''

		/**
		* [Valida si el contexto es nivel, tambien si el estado del canal (anexo) es Ring - Ringing]
		**/
		if (context[0] === 'nivel' && (channelStateDesc === 'Ring' || channelStateDesc === 'Ringing')) {

			if (connectedLineNum.length <= 4 || connectedLineNum === '<unknown>') {
				/**
				* [Valida si la cantidad de caracteres de la extension (numero de llamada) es mayor a 4. Si se cumple este timbrado se considera como una llamada saliente (fijo,
				* celulares o 0800), caso contrario se considera como una llamada interna entre anexos ]
				**/
				if (exten.length > 4 && uniqueID === linkedID) {
					actionJSON = (preEventID === '1') ? this.ringExternCallOutbound(sendData, false) : this.ringExternCallOutbound(sendData, true)
				} else {
					if(channelStateDesc === 'Ringing'){
						actionJSON = (uniqueID === linkedID) ? this.ringInternalCall(sendData, true) : this.ringInternalCall(sendData, false, true)
					}else{
						actionJSON = (uniqueID === linkedID) ? this.ringInternalCall(sendData, true) : this.ringInternalCall(sendData, false)
					}
				}
			}
		}

		/**
		* [Valida si el estado del canal (anexo) es Up (Fue contestado)
		* Si la primera condición se cumple me indica que la llamada ha sido contestada teniendo dataPreUpdate, si no
		* seria una llamada interna que es transferida]
		**/
		if (channelStateDesc === 'Up' && len(dataPreUpdate) > 0) {
			if (connectedLineNum !== '<unknown>') {
				/**
				* [.....................................]
				**/
				answerInbound = (preEventID !== '12') ? this.answerValidateInboundCall(sendData, true) : ''
				/**
				* [Valida si el nombre del contexto que se encuentra configurado en el servidor asterisk, lleva por nombre "context-cliente". Si se cumple se considera que la
				* llamada saliente fue contestada por el cliente "fijos, celular, 0800", caso contrario se considera que la llamada fue contestada por un anexo interno]
				**/
				if (context[0] === 'context') {
					answerExternOutgoing = (dataPreUpdate.second_outbound_start === '') ? this.answerExternOutgoingCall(sendData, false) : this.answerExternOutgoingCall(sendData, true)
					actionJSON = Object.assign(answerInbound,answerExternOutgoing)
				} else {
					answerInternal = (uniqueID === linkedID) ? this.answerInternalCall(sendData, true) : this.answerInternalCall(sendData, false)
					actionJSON = Object.assign(answerInbound,answerInternal)
				}
			} else {
				/**
				* [.....................................]
				**/
				/*
				answerExternOutgoing = (uniqueID === linkedID) ? this.answerExternOutgoingCall(sendData, false) : this.answerExternOutgoingCall(sendData, true)
				actionJSON = Object.assign(this.answerValidateInboundCall(sendData, false),answerExternOutgoing)
				*/
			}
		}else if(context[0] === 'nivel' && uniqueID != linkedID && channelStateDesc === 'Up'){
			answerExternOutgoing = this.answerExternOutgoingCall(sendData, false, true)
			actionJSON = Object.assign(this.answerValidateInboundCall(sendData, true, true),answerExternOutgoing)
		}
		return this.generateResponseJson(actionJSON)
	}

	/**
	* [Valida el ring de una llamada saliente (fijos,celular,0800), valida igualmente si es una segunda llamada]
	*/
	ringExternCallOutbound (sendData, secondCall) {
		if(secondCall){
			return {
				'agentAnnexed' : sendData.dataEmitAsterisk['CallerIDNum'].replace('SIP/', ''),
				'statusPause' : '1',
				'secondCall' : true,
				'secondEventId' : '13',
				'secondEventName' : 'Ring OutBound',
				'eventTime' : sendData.horaActualServer,
				'eventObservaciones' : 'Evento Asterisk - Inicio Ring Second Call OutBound',
				'secondOutboundPhone' : sendData.dataEmitAsterisk['Exten'],
				'secondOutboundStart' : sendData.horaActualServer
			}
		}else{
			return {
				'agentAnnexed' : sendData.dataEmitAsterisk['CallerIDNum'].replace('SIP/', ''),
				'statusPause' : '1',
				'eventId' : '13',
				'eventTime' : sendData.horaActualServer,
				'eventObservaciones' : 'Evento Asterisk - Inicio Ring OutBound',
				'outboundPhone' : sendData.dataEmitAsterisk['Exten'],
				'outboundStart' : sendData.horaActualServer
			}
		}
	}

	/**
	* [Valida el ring de una llamada saliente interna, menciona tambien si el tipo de llamada es outbound o inbound]
	*/
	ringInternalCall (sendData, typeToCall, transferCall = false) {
		const connectedLineNum = sendData.dataEmitAsterisk['ConnectedLineNum']
		const connectedLineName = sendData.dataEmitAsterisk['ConnectedLineName']
		if(typeToCall){
			return {
				'agentAnnexed' : sendData.dataEmitAsterisk['CallerIDNum'].replace('SIP/', ''),
				'statusPause' : '1',
				'eventId' : '21',
				'eventTime' : sendData.horaActualServer,
				'eventObservaciones' : 'Evento Asterisk - Inicio Ring Outbound Interno',
				'outboundPhone' : sendData.dataEmitAsterisk['Exten'],
				'outboundStart' : sendData.horaActualServer
			}
		}else if(transferCall) {
			return {
				'agentAnnexed' : sendData.dataEmitAsterisk['CallerIDNum'].replace('SIP/', ''),
				'statusPause' : '1',
				'eventId' : '21',
				'eventTime' : sendData.horaActualServer,
				'eventObservaciones' : 'Evento Asterisk - Inicio Ring Outbound Interno',
				'outboundPhone' : sendData.dataEmitAsterisk['Exten'],
				'outboundStart' : sendData.horaActualServer
			}
		}else{
			return {
				'agentAnnexed' : sendData.dataEmitAsterisk['CallerIDNum'].replace('SIP/', ''),
				'statusPause' : '1',
				'eventId' : '18',
				'eventTime' : sendData.horaActualServer,
				'eventObservaciones' : 'Evento Asterisk - Inicio Ring Inbound Interno',
				'inboundPhone' : helper.getInboundPhone(connectedLineNum, connectedLineName),
				'inboundStart' : sendData.horaActualServer
			}
		}
	}

	/**
	* [.....................................]
	**/
	answerValidateInboundCall (sendData, externCall, transferCall = false){
		let connectedLineNum = sendData.dataEmitAsterisk['ConnectedLineNum']
		let callerIDNum = sendData.dataEmitAsterisk['CallerIDNum']
		if(externCall){
			return {
				'statusPause' : '1',
				'agentAnnexed' : (connectedLineNum.length === 4 && !transferCall) ? connectedLineNum : callerIDNum,
				'eventTime' : sendData.horaActualServer
			}
		}else{
			return {
				'statusPause' : '1',
				'agentAnnexed' : helper.extractAnnex(sendData.dataEmitAsterisk),
				'eventTime' : sendData.horaActualServer
			}
		}
	}

	/**
	* [Valida cuando se contesta una llamada saliente (fijos, celular, 0800), valida igualmente si es una segunda llamada.
	* Cumple tambien si se contesta una llamada que es transferida a un anexo registrado en el PBX]
	*/
	answerExternOutgoingCall (sendData, secondCall, transferCall = false) {
		let eventName = (!transferCall) ? 'OutBound' : 'OutBound Interno'
		if(secondCall){
			return {
				'secondEventId' : '9',
				'secondEventName' : 'OutBound',
				'eventObservaciones' : 'Evento Asterisk - Inicio Second Call OutBound',
				'secondOutboundPhone' : sendData.dataEmitAsterisk['Exten'],
				'secondOutboundStart' : sendData.horaActualServer
			}
		}else{
			return {
				'eventId' : (!transferCall) ? '9' : '20',
				'eventObservaciones' : 'Evento Asterisk - Inicio Call ' + eventName,
				'outboundPhone' : sendData.dataEmitAsterisk['Exten'],
				'outboundStart' : sendData.horaActualServer
			}
		}
	}

	/**
	* [Valida cuando se contesta una llamada saliente interna, menciona tambien si el tipo de llamada es outbound o inbound]
	*/
	answerInternalCall (sendData, typeToCall) {
		const dataPreUpdate = sendData.dataPreUpdate
		const callerIDNum = sendData.dataEmitAsterisk['CallerIDNum']
		const callerIDName = sendData.dataEmitAsterisk['CallerIDName']
		if(typeToCall){
			return {
				'eventId' : '19',
				'eventObservaciones' : 'Evento Asterisk - Inicio Call Inbound Interno',
				'inboundPhone' : helper.getInboundPhone(callerIDNum, callerIDName),
				'inboundStart' : sendData.horaActualServer
			}
		}else{
			return {
				'eventId' : '20',
				'eventObservaciones' : 'Evento Asterisk - Inicio Call OutBound Interno',
				'outboundPhone' : dataPreUpdate.outbound_phone,
				'outboundStart' : sendData.horaActualServer
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
					'second_event_name': (data.secondEventName) ? data.secondEventName : ''
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
					'second_event_name': (data.secondEventName) ? data.secondEventName : ''
				}
			}
		}
	}
}

module.exports = EventNewState
