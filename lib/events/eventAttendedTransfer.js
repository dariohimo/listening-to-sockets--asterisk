import Helper from '../util/helperAsterisk'

const helper = new Helper()

class EventAttendedTransfer {
	attendedTransfer (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		return {
			'agent_annexed': dataEmitAsterisk['OrigTransfererCallerIDNum'],
			'agent_status': '0',
			'inbound_queue': '',
			'inbound_phone': '',
			'inbound_start': '',
			'outbound_phone': dataPreUpdate.outbound_phone,
			'outbound_start': dataPreUpdate.outbound_start,
			'event_id': '1',
			'event_time': sendData.horaActualServer,
			'event_observaciones': 'Evento Asterisk - Fin ' + helper.nameEvent(dataPreUpdate.event_id),
			'second_status_call' : '0',
			'second_outbound_phone': '',
			'second_outbound_start': '',
			'second_event_id': '',
			'changeEventPrimary' : '0'
		}
	}
}

module.exports = EventAttendedTransfer