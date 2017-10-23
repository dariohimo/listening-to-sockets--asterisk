import Helper from '../../util/helperAsterisk'

const helper = new Helper()

class HangUpRing {
	typeCall (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const callNoAnswer = (dataEmitAsterisk['Uniqueid'] === dataEmitAsterisk['Linkedid']) ? true : false

		const arrayInternalCallOutbound = ['20','21','23']

		const arrayCallInbound = ['8','12','16']
		const arrayCallOutbound = ['9','13','17']

		let responseRing = ''

		if(callNoAnswer){
			if(arrayCallInbound.includes(dataPreUpdate.event_id)) responseRing = this.inBound(sendData)
			if(arrayCallOutbound.includes(dataPreUpdate.event_id)) responseRing = this.outBound(sendData)
			if(arrayInternalCallOutbound.includes(dataPreUpdate.event_id)) responseRing = this.inTernal(sendData)
		}else{
			responseRing = {
				'agentAnnexed' : (dataPreUpdate.event_id === '24') ? dataPreUpdate.agent_annexed : dataEmitAsterisk['CallerIDNum'],
				'eventObservaciones' : 'Evento Asterisk - Fin ' + helper.nameEvent(dataPreUpdate.event_id),
				'statusPause' : '0',
				'eventId' : '1',
				'eventTime' : sendData.horaActualServer
			}
		}

		return responseRing
	}

	inBound (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const connectedLineNum = dataEmitAsterisk['ConnectedLineNum']
		const callerIDNum = dataEmitAsterisk['CallerIDNum']
		const eventName = helper.nameEvent(dataPreUpdate.event_id)
		const secondCall = (dataPreUpdate.second_status_call === 1) ? true : false
		const arrayInboundRing = ['12']

		if(secondCall){
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
		}else{
			if(arrayInboundRing.includes(dataPreUpdate.event_id)){
				return {
					'agentAnnexed' : (dataEmitAsterisk['Exten'].length === 0) ? callerIDNum : connectedLineNum,
					'eventObservaciones' : 'Evento Asterisk - Fin ' + eventName,
					'statusPause' : '0',
					'eventId' : '1',
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
		}else{	
			return {
				'agentAnnexed' : agentAnnexed,
				'eventObservaciones' : 'Evento Asterisk - Fin ' + eventName,
				'statusPause' : '0',
				'eventId' : '1',
				'eventTime' : sendData.horaActualServer
			}
		}

	}

	inTernal (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		const eventName = helper.nameEvent(dataPreUpdate.event_id)

		return {
			'agentAnnexed' : (dataPreUpdate.event_id === '13') ? dataPreUpdate.agent_annexed : dataEmitAsterisk['CallerIDNum'],
			'eventObservaciones' : 'Evento Asterisk - Fin ' + eventName,
			'statusPause' : '0',
			'eventId' : '1',
			'eventTime' : sendData.horaActualServer
		}

	}
}

module.exports = HangUpRing