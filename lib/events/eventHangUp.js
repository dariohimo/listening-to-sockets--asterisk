import HangUpDuringTheRing from './eventHangUp/hangUpDuringTheRing'
import HangUpDuringTheCall from './eventHangUp/hangUpDuringTheCall'

import len from 'object-length'

const hangUpDuringTheRing = new HangUpDuringTheRing()
const hangUpDuringTheCall = new HangUpDuringTheCall()



class EventHangUp {
	hangUp(sendData) {
		let actionJSON = ''

		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate

		const context = dataEmitAsterisk['Context'].split('-')

		if (len(dataPreUpdate) > 0 && dataPreUpdate.event_id !== 1) {
			if (context[0] === 'nivel') {
				const channelStateDesc = dataEmitAsterisk['ChannelStateDesc']
				if(channelStateDesc === 'Ring' || channelStateDesc === 'Ringing') actionJSON = hangUpDuringTheRing.typeCall(sendData)
				if(channelStateDesc === 'Up') actionJSON = hangUpDuringTheCall.typeCall(sendData)
			}
			return this.generateResponseJson(actionJSON)
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
					'second_status_call' : (data.secondStatusCall) ? data.secondStatusCall : 1,
					'changeSecondStatusCall' : (data.changeSecondStatusCall) ? data.changeSecondStatusCall : 0
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
					'second_status_call' : (data.changeSecondStatusCall) ? data.changeSecondStatusCall : 0,
					'changeSecondStatusCall' : (data.changeSecondStatusCall) ? data.changeSecondStatusCall : 1
				}
			}
		}
	}
}

module.exports = EventHangUp