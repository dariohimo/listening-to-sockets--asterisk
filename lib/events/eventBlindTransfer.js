import Helper from '../util/helperAsterisk'
import len from 'object-length'

const helper = new Helper()

class EventBlindTransfer {
	blindTransfer (sendData) {
		const dataTransfer = {}

		dataTransfer['liberar'] = this.liberateCall(sendData)
		dataTransfer['asignar'] = this.AssignCall(sendData)

		return dataTransfer
	}

	liberateCall (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate

		if(len(dataPreUpdate) > 0) {
			const typeCall = (dataPreUpdate.inbound_phone != '') ? true : false
			if (typeCall) {
				return {
					'agent_annexed': dataEmitAsterisk['TransfererCallerIDNum'],
					'agent_status': '0',
					'event_id': '1',
					'event_time': sendData.horaActualServer,
					'inbound_queue': '',
					'inbound_phone': '',
					'inbound_start': '',
					'event_observaciones': 'Evento Asterisk - Fin Inbound Transfer'
				}
			}else{
				return {
					'agent_annexed': dataEmitAsterisk['TransfererCallerIDNum'],
					'agent_status': '0',
					'event_id': '1',
					'event_time': sendData.horaActualServer,
					'inbound_queue': '',
					'inbound_phone': '',
					'inbound_start': '',
					'event_observaciones': 'Evento Asterisk - Fin Outbound Transfer'
				}
			}
		}
	}

	AssignCall (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate

		if(len(dataPreUpdate) > 0) {
			const typeCall = (dataPreUpdate.inbound_phone != '') ? true : false
			if (typeCall) {
				return {
					'agent_annexed': dataEmitAsterisk['Extension'],
					'agent_status': '1',
					'event_id': '24',
					'event_time': sendData.horaActualServer,
					'inbound_queue': dataPreUpdate.inbound_queue,
					'inbound_phone': dataPreUpdate.inbound_phone,
					'inbound_start': dataPreUpdate.inbound_start,
					'event_observaciones': 'Evento Asterisk - Inicio ' + helper.nameEvent('24')
				}
			} else {
				return {
					'agent_annexed': dataEmitAsterisk['Extension'],
					'agent_status': '1',
					'event_id': '27',
					'event_time': sendData.horaActualServer,
					'outbound_phone': dataPreUpdate.outbound_phone,
					'outbound_start': dataPreUpdate.outbound_start,
					'event_observaciones': 'Evento Asterisk - Inicio ' + helper.nameEvent('27')
				}
			}
		}else{
			return {
				'agent_annexed': dataEmitAsterisk['TransfererCallerIDNum']
			}
		}
	}
}

module.exports = EventBlindTransfer
