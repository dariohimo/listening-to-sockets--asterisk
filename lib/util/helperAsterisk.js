import moment from 'moment'

class Helper {
	getInboundPhone (callerIDNum, callerIDName) {
		if (callerIDNum === callerIDName) return callerIDNum
		if (callerIDName === '<unknown>') return callerIDNum
		return `${callerIDNum} - ${callerIDName}`
	}

	extractAnnex (datos) {
		let agentAnnexed = datos['Channel'].split('-')
		agentAnnexed = agentAnnexed[0].split('/')
		agentAnnexed = agentAnnexed[1]
		return agentAnnexed
	}

	nextEvent (eventId, nextNameEvent) {
		let nextEvent = ''
		if (eventId === 8 ) nextEvent = (nextNameEvent === true) ? 'Hold Inbound' : 16
		else if (eventId === 16 ) nextEvent = (nextNameEvent === true) ? 'Inbound' : 8
		else if (eventId === 19 ) nextEvent = (nextNameEvent === true) ? 'Hold Inbound Interno' : 22
		else if (eventId === 22 ) nextEvent = (nextNameEvent === true) ? 'Inbound Interno' : 19
		else if (eventId === 9 ) nextEvent = (nextNameEvent === true) ? 'Hold Outbound' : 17
		else if (eventId === 17 ) nextEvent = (nextNameEvent === true) ? 'Outbound' : 9
		else if (eventId === 20 ) nextEvent = (nextNameEvent === true) ? 'Hold Outbound Interno' : 23
		else if (eventId === 23 ) nextEvent = (nextNameEvent === true) ? 'Outbound Interno' : 20
		else if (eventId === 25 ) nextEvent = (nextNameEvent === true) ? 'Hold Inbound Transfer' : 26
		else if (eventId === 26 ) nextEvent = (nextNameEvent === true) ? 'Inbound Transfer' : 25
		else if (eventId === 29 ) nextEvent = (nextNameEvent === true) ? 'Hold Outbound Transfer' : 28
		else if (eventId === 28 ) nextEvent = (nextNameEvent === true) ? 'Outbound Transfer' : 29
		return nextEvent
	}

	timeServer () {
		return moment().format('HH:mm:ss')
	}

	nameEvent(eventID) {
		let event = ''
		switch(eventID) {
		case 1 :
			event = 'ACD'
			break
		case 2 :
			event = 'Break'
			break
		case 3 :
			event = 'SS.HH'
			break
		case 4 :
			event = 'Refrigerio'
			break
		case 5 :
			event = 'Feedback'
			break
		case 6 :
			event = 'Capacitación'
			break
		case 7 :
			event = 'Gestión BackOffice'
			break
		case 8 :
			event = 'Inbound'
			break
		case 9 :
			event = 'OutBound'
			break
		case 10 :
			event = 'ACW'
			break
		case 11 :
			event = 'Login'
			break
		case 12 :
			event = 'Ring-Inbound'
			break
		case 13 :
			event = 'Ring-Outbound'
			break
		case 14 :
			event = 'Estado D'
			break
		case 15 :
			event = 'Desconectado'
			break
		case 16 :
			event = 'Hold Inbound'
			break
		case 17 :
			event = 'Hold Outbound'
			break
		case 18 :
			event = 'Ring Inbound Interno'
			break
		case 19 :
			event = 'Inbound Interno'
			break
		case 20 :
			event = 'Outbound Interno'
			break
		case 21 :
			event = 'Ring Outbound Interno'
			break
		case 22 :
			event = 'Hold Inbound Interno'
			break
		case 23 :
			event = 'Hold Outbound Interno'
			break
		case 24 :
			event = 'Ring Inbound Transfer'
			break
		case 25 :
			event = 'Inbound Transfer'
			break
		case 26 :
			event = 'Hold Inbound Transfer'
			break
		case 27 :
			event = 'Ring Outbound Transfer'
			break
		case 28 :
			event = 'Hold Outbound Transfer'
			break
		case 29 :
			event = 'Outbound Transfer'
			break
		}
		return event
	}
}

module.exports = Helper
