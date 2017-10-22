import Helper from '../../util/helperAsterisk'

const helper = new Helper()

class NewStateAnswer {
	receptorSecondCall (sendData) {
		return {
			'agentAnnexed' : sendData.dataEmitAsterisk['ConnectedLineNum'],
			'statusPause' : '1',
			'secondCall' : true,
			'secondEventId' : '20',
			'secondEventName' : 'Outbound Interno',
			'eventTime' : sendData.horaActualServer,
			'eventObservaciones' : 'Evento Asterisk - Inicio Second Call ' + helper.nameEvent('20'),
			'secondOutboundPhone' : sendData.dataEmitAsterisk['Exten'],
			'secondOutboundStart' : sendData.horaActualServer,
			'changeEventPrimary' : '0'
		}
	}

	/**
	* [.....................................]
	**/
	validateInboundCall (sendData, externCall, transferCall = false){
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
	outBoundCall (sendData) {
		return {
			'eventId' : '9',
			'eventObservaciones' : 'Evento Asterisk - Inicio Call ' + helper.nameEvent('9'),
			'outboundPhone' : sendData.dataEmitAsterisk['Exten'],
			'outboundStart' : sendData.horaActualServer
		}
	}


	/**
	* [Valida cuando se contesta una llamada saliente interna, menciona tambien si el tipo de llamada es outbound o inbound]
	*/
	receptorInternalCall (sendData) {
		const callerIDNum = sendData.dataEmitAsterisk['CallerIDNum']
		const callerIDName = sendData.dataEmitAsterisk['CallerIDName']
		return {
			'eventId' : '19',
			'eventObservaciones' : 'Evento Asterisk - Inicio Call ' + helper.nameEvent('19'),
			'inboundPhone' : helper.getInboundPhone(callerIDNum, callerIDName),
			'inboundStart' : sendData.horaActualServer
		}
	}

	emisorConnectInternalCall (sendData) {
		const dataPreUpdate = sendData.dataPreUpdate
		return {
			'eventId' : '20',
			'eventObservaciones' : 'Evento Asterisk - Inicio Call ' + helper.nameEvent('20'),
			'outboundPhone' : dataPreUpdate.outbound_phone,
			'outboundStart' : sendData.horaActualServer
		}
	}

	receptorBlindTransferCallInbound (sendData) {
		const dataPreUpdate = sendData.dataPreUpdate
		return {
			'eventId' : '25',
			'eventObservaciones' : 'Evento Asterisk - Inicio Call ' + helper.nameEvent('25'),
			'inboundQueue' : dataPreUpdate.inbound_queue,
			'inboundPhone' : dataPreUpdate.inbound_phone,
			'inboundStart' : dataPreUpdate.inbound_start,
			'eventTime' : sendData.horaActualServer
		}
	}


	receptorBlindTransferCallOutbound (sendData) {
		const dataPreUpdate = sendData.dataPreUpdate
		return {
			'eventId' : '29',
			'eventObservaciones' : 'Evento Asterisk - Inicio Call ' + helper.nameEvent('29'),
			'outboundPhone' : dataPreUpdate.outbound_phone,
			'outboundStart' : sendData.horaActualServer,
			'eventTime' : sendData.horaActualServer
		}
	}
}

module.exports = NewStateAnswer