import Helper from '../util/helperAsterisk'
const helper = new Helper()

class EventHold {
	// Para detectar el estado Hold realizado por un analista
	hold(datos, dataPreUpdate, horaActualServer) {		
		console.dir(dataPreUpdate)
		const holdInbound = ['8','19','25']
		const holdOutbound = ['9','20','29']
		let eventID = dataPreUpdate.event_id

		if(eventID.includes(holdInbound)){
			console.log('Es Hold Inbound')
		}else if(eventID.includes(holdOutbound)){
			console.log('Es Hold Outbound')
		}
	}
}

module.exports = EventHold
