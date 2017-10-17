import Helper from '../../util/helperAsterisk'

const helper = new Helper()

class NewStateRing {

	/**
	* [Valida el ring de una llamada saliente (fijos,celular,0800), valida igualmente si es una segunda llamada]
	*/

	outBoundCall (sendData) {
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

	/**
	* [Valida el ring de una llamada saliente interna, menciona tambien si el tipo de llamada es outbound o inbound]
	*/

	internalEmisor (sendData) {
		return {
			'agentAnnexed' : sendData.dataEmitAsterisk['CallerIDNum'].replace('SIP/', ''),
			'statusPause' : '1',
			'eventId' : '21',
			'eventTime' : sendData.horaActualServer,
			'eventObservaciones' : 'Evento Asterisk - Inicio Ring Outbound Interno',
			'outboundPhone' : sendData.dataEmitAsterisk['Exten'],
			'outboundStart' : sendData.horaActualServer
		}
	}

	internalReceptor (sendData) {
		const connectedLineNum = sendData.dataEmitAsterisk['ConnectedLineNum']
		const connectedLineName = sendData.dataEmitAsterisk['ConnectedLineName']
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

	internalSecondCall (sendData) {
		return {
			'agentAnnexed' : sendData.dataEmitAsterisk['CallerIDNum'].replace('SIP/', ''),
			'statusPause' : '1',
			'secondCall' : true,
			'secondEventId' : '21',
			'secondEventName' : 'Ring Outbound Interno',
			'eventTime' : sendData.horaActualServer,
			'eventObservaciones' : 'Evento Asterisk - Inicio Ring Second Call Outbound Interno',
			'secondOutboundPhone' : sendData.dataEmitAsterisk['Exten'],
			'secondOutboundStart' : sendData.horaActualServer,
			'changeEventPrimary' : '0'
		}
	}

}

module.exports = NewStateRing