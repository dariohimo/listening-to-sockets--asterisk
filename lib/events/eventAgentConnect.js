import Helper from '../util/helperAsterisk'
import len from 'object-length'

const helper = new Helper()

class EventAgentConnect {
	agentConnect (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const context = dataEmitAsterisk['DestContext'].split('-')

		if(len(dataEmitAsterisk) > 0) {
			if(dataEmitAsterisk['ChannelStateDesc'] === 'Up' && context[0] === 'nivel'){
				return this.answerInbound(sendData)
			}
		}
	}

	answerInbound (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		return {
			'agent_annexed' : dataEmitAsterisk['Interface'].replace('SIP/', ''),
			'agent_status' : '1',
			'event_id' : '8',
			'event_time' : sendData.horaActualServer,
			'event_observaciones' : 'Evento Asterisk - Inicio Inbound',
			'inbound_queue' : dataEmitAsterisk['Queue'],
			'inbound_phone' : helper.getInboundPhone(dataEmitAsterisk['CallerIDNum'], dataEmitAsterisk['CallerIDName']),
			'inbound_start' : sendData.horaActualServer,
			'second_outbound_phone' : '',
			'second_status_call' : '0'
		}
	}
}

module.exports = EventAgentConnect