import Helper from '../util/helperAsterisk'
import len from 'object-length'

const helper = new Helper()

class EventNewConnectedLine {
	newConnectedLine (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const context = dataEmitAsterisk['Context'].split('-')

		if(len(dataEmitAsterisk) > 0) {
			if(dataEmitAsterisk['ChannelStateDesc'] === 'Ringing' && context[0] === 'nivel'){
				return this.ringInbound(sendData)
			}
		}
	}

	ringInbound (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		return {
			'agent_annexed' : dataEmitAsterisk['CallerIDNum'],
			'agent_status' : '1',
			'event_id' : '12',
			'event_time' : sendData.horaActualServer,
			'event_observaciones' : 'Evento Asterisk - Inicio Ring Inbound',
			'inbound_queue' : dataEmitAsterisk['Exten'],
			'inbound_phone' : helper.getInboundPhone(dataEmitAsterisk['ConnectedLineNum'], dataEmitAsterisk['ConnectedLineName']),
			'inbound_start' : sendData.horaActualServer,
			'second_outbound_phone' : '',
			'second_status_call' : '0'
		}
	}
}

module.exports = EventNewConnectedLine