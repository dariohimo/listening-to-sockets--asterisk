
class EventHold {

  // Para detectar el estado Hold realizado por un analista
  hold() {

		if (dataPreUpdate.event_id === '8' || dataPreUpdate.event_id === '19' || dataPreUpdate.event_id === '25') {
			eventId = nextEvent(dataPreUpdate.event_id, false)
			eventName = nextEvent(dataPreUpdate.event_id, true)
			inboundQueue = dataPreUpdate.inbound_queue
			inboundPhone = dataPreUpdate.inbound_phone
			inboundStart = dataPreUpdate.inbound_start
		}

		if (dataPreUpdate.event_id === '9' || dataPreUpdate.event_id === '20' || dataPreUpdate.event_id === '29') {
			eventId = nextEvent(dataPreUpdate.event_id, false)
			eventName = nextEvent(dataPreUpdate.event_id, true)
			outboundPhone = dataPreUpdate.outbound_phone
			outboundStart = dataPreUpdate.outbound_start
		}

		statusPause = '1'
		agentAnnexed = (datos['CallerIDNum'].length > '4') ? extractAnnex(datos) : datos['CallerIDNum']
		eventTime = horaActualServer
		eventObservaciones = 'Evento Asterisk - Inicio ' + eventName

		if (dataPreUpdate.second_outbound_phone === datos['Exten']) {
			secondCall = true
			secondOutboundPhone = datos['Exten']
			secondOutboundStart = horaActualServer
			secondEventId = nextEvent(dataPreUpdate.second_event_id, false)
			secondEventName = nextEvent(dataPreUpdate.second_event_id, true)
		} else {
			secondOutboundPhone = dataPreUpdate.second_outbound_phone
			secondOutboundStart = dataPreUpdate.second_outbound_start
			secondEventId = dataPreUpdate.second_event_id
			secondEventName = dataPreUpdate.second_event_name
		}
  }
}

module.exports = EventHold
