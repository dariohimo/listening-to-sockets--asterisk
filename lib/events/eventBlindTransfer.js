class EventBlindTransfer {
	blindTransfer (sendData) {
		const dataTransfer = {}
		const dataPreUpdate = sendData.dataPreUpdate

		dataTransfer['liberar'] = this.liberateCall(sendData)
		dataTransfer['asignar'] = (dataPreUpdate.inbound_phone !== '') ? this.AssignCall(sendData, true) : this.AssignCall(sendData, false)

		return dataTransfer
	}

	liberateCall (sendData) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
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

	AssignCall (sendData, typeCall) {
		const dataEmitAsterisk = sendData.dataEmitAsterisk
		const dataPreUpdate = sendData.dataPreUpdate
		if (typeCall) {
			return {
				'agent_annexed': dataEmitAsterisk['Extension'],
				'agent_status': '1',
				'event_id': '24',
				'event_time': sendData.horaActualServer,
				'inbound_queue': dataPreUpdate.inbound_queue,
				'inbound_phone': dataPreUpdate.inbound_phone,
				'inbound_start': dataPreUpdate.inbound_start,
				'event_observaciones': 'Evento Asterisk - Inicio Inbound Transfer'
			}
		} else {
			return {
				'agent_annexed': dataEmitAsterisk['Extension'],
				'agent_status': '1',
				'event_id': '27',
				'event_time': sendData.horaActualServer,
				'outbound_phone': dataPreUpdate.outbound_phone,
				'outbound_start': dataPreUpdate.outbound_start,
				'event_observaciones': 'Evento Asterisk - Inicio Outbound Transfer'
			}
		}
	}
}

module.exports = EventBlindTransfer
