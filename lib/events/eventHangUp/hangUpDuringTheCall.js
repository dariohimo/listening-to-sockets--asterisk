import Helper from '../../util/helperAsterisk'
import len from 'object-length'

const helper = new Helper()

class HangUpAnswer {
	typeCall (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const callNoAnswer = (dataEmitAsterisk['Uniqueid'] === dataEmitAsterisk['Linkedid']) ? true : false

		const arrayInternalCallOutbound = ['20','21','23']

		const arrayCallInbound = ['8','12','16']
		const arrayCallOutbound = ['9','13','17']

		let responseAnswer = ''

		if(callNoAnswer){
			if(arrayCallInbound.includes(dataPreUpdate.event_id)) responseAnswer = this.inBound(sendData)
			if(arrayCallOutbound.includes(dataPreUpdate.event_id)) responseAnswer = this.outBound(sendData)
			if(arrayInternalCallOutbound.includes(dataPreUpdate.event_id)) responseAnswer = this.internalOutbound(sendData)
		} else {
			responseAnswer = this.internalInbound(sendData)
		}

		return responseAnswer
	}

	inBound (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const connectedLineNum = dataEmitAsterisk['ConnectedLineNum']
		const callerIDNum = dataEmitAsterisk['CallerIDNum']
		const eventName = helper.nameEvent(dataPreUpdate.event_id)
		const secondCall = (dataPreUpdate.second_status_call === 1) ? true : false
		const arrayRingInbound = ['8','16']

		if(secondCall){
			if(len(dataEmitAsterisk['Exten']) > 4 ) {
				return {
					'agentAnnexed' : (dataEmitAsterisk['Exten'].length === 0) ? callerIDNum : connectedLineNum,
					'secondCall' : false,
					'statusPause' : '1',
					'outboundPhone' : dataPreUpdate.second_outbound_phone,
					'outboundStart' : sendData.horaActualServer,
					'eventId' : dataPreUpdate.second_event_id,
					'eventTime' : sendData.horaActualServer,
					'eventObservaciones' : 'Evento Asterisk - Inicio ' + helper.nameEvent('20'),
					'secondOutboundPhone' : '',
					'secondOutboundStart' : '',
					'secondEventId' : '19',
					'secondStatusCall' : '0',
					'changeSecondStatusCall' : '1'
				}
			}else{
				return {
					'agentAnnexed' : callerIDNum,
					'secondCall' : true,
					'statusPause' : '1',
					'secondOutboundPhone' : '',
					'secondOutboundStart' : '',
					'secondEventId' : '',
					'secondStatusCall' : '1',
					'changeSecondStatusCall' : '1'
				}
			}
		}else{
			if(arrayRingInbound.includes(dataPreUpdate.event_id)){
				return {
					'agentAnnexed' : (dataEmitAsterisk['Exten'].length === 0) ? callerIDNum : connectedLineNum,
					'eventObservaciones' : 'Evento Asterisk - Fin ' + eventName,
					'statusPause' : (dataPreUpdate.event_hangup === '1') ? '0' : '1',
					'eventId' : dataPreUpdate.event_hangup,
					'eventTime' : sendData.horaActualServer
				}
			}
		}

	}

	outBound (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const connectedLineNum = dataEmitAsterisk['ConnectedLineNum']
		const callerIDNum = dataEmitAsterisk['CallerIDNum']
		const eventName = helper.nameEvent(dataPreUpdate.event_id)
		const secondCall = (dataPreUpdate.second_status_call === 1) ? true : false

		let agentAnnexed = ''

		if (connectedLineNum === '<unknown>' && dataPreUpdate.event_id === '9') agentAnnexed = dataPreUpdate.agent_annexed
		else agentAnnexed = (callerIDNum.length > '4') ? helper.extractAnnex(dataEmitAsterisk) : callerIDNum


		if(secondCall){
			if(len(dataEmitAsterisk['Exten']) > 4 ) {
				return {
					'agentAnnexed' : agentAnnexed,
					'secondCall' : false,
					'statusPause' : '1',
					'outboundPhone' : dataPreUpdate.second_outbound_phone,
					'outboundStart' : sendData.horaActualServer,
					'eventId' : dataPreUpdate.second_event_id,
					'eventTime' : sendData.horaActualServer,
					'eventObservaciones' : 'Evento Asterisk - Inicio ' + helper.nameEvent('20'),
					'secondOutboundPhone' : '',
					'secondOutboundStart' : '',
					'secondEventId' : '20',
					'secondStatusCall' : '0',
					'changeSecondStatusCall' : '1'
				}
			}else{
				return {
					'agentAnnexed' : agentAnnexed,
					'secondCall' : true,
					'statusPause' : '1',
					'secondOutboundPhone' : '',
					'secondOutboundStart' : '',
					'secondEventId' : '',
					'secondStatusCall' : '1',
					'changeSecondStatusCall' : '1'
				}
			}
		}else{
			return {
				'agentAnnexed' : agentAnnexed,
				'eventObservaciones' : 'Evento Asterisk - Fin ' + eventName,
				'statusPause' : (dataPreUpdate.event_hangup === '1') ? '0' : '1',
				'eventId' : dataPreUpdate.event_hangup,
				'eventTime' : sendData.horaActualServer
			}
		}
	}

	internalOutbound (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const eventName = helper.nameEvent(dataPreUpdate.event_id)
		return {
			'agentAnnexed' : (dataPreUpdate.event_id === '13') ? dataPreUpdate.agent_annexed : dataEmitAsterisk['CallerIDNum'],
			'eventObservaciones' : 'Evento Asterisk - Fin ' + eventName,
			'statusPause' : (dataPreUpdate.event_hangup === '1') ? '0' : '1',
			'eventId' : dataPreUpdate.event_hangup,
			'eventTime' : sendData.horaActualServer
		}
	}

	internalInbound (sendData){
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const callerIDNum = dataEmitAsterisk['CallerIDNum']
		const secondCall = (dataPreUpdate.second_status_call === 1) ? true : false

		if(secondCall){
			if(len(dataEmitAsterisk['Exten']) > 4 ) {
				return {
					'agentAnnexed' : callerIDNum,
					'secondCall' : false,
					'statusPause' : '1',
					'outboundPhone' : dataPreUpdate.second_outbound_phone,
					'outboundStart' : sendData.horaActualServer,
					'eventId' : dataPreUpdate.second_event_id,
					'eventTime' : sendData.horaActualServer,
					'eventObservaciones' : 'Evento Asterisk - Inicio ' + helper.nameEvent('20'),
					'secondOutboundPhone' : '',
					'secondOutboundStart' : '',
					'secondEventId' : '19',
					'secondStatusCall' : '0',
					'changeSecondStatusCall' : '1'
				}
			}else{
				return {
					'agentAnnexed' : callerIDNum,
					'secondCall' : true,
					'statusPause' : '1',
					'secondOutboundPhone' : '',
					'secondOutboundStart' : '',
					'secondEventId' : '',
					'secondStatusCall' : '1',
					'changeSecondStatusCall' : '1'
				}
			}
		}else{
			return {
				'agentAnnexed' : (dataPreUpdate.event_id === '24') ? dataPreUpdate.agent_annexed : dataEmitAsterisk['CallerIDNum'],
				'eventObservaciones' : 'Evento Asterisk - Fin ' + helper.nameEvent(dataPreUpdate.event_id),
				'statusPause' : (dataPreUpdate.event_hangup === '1') ? '0' : '1',
				'eventId' : dataPreUpdate.event_hangup,
				'eventTime' : sendData.horaActualServer
			}
		}
	}
}

module.exports = HangUpAnswer