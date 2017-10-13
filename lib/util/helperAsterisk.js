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
		if (eventId === '8') nextEvent = (nextNameEvent === true) ? 'Hold Inbound' : '16'
		else if (eventId === '16') nextEvent = (nextNameEvent === true) ? 'Inbound' : '8'
		else if (eventId === '19') nextEvent = (nextNameEvent === true) ? 'Hold Inbound Interno' : '22'
		else if (eventId === '22') nextEvent = (nextNameEvent === true) ? 'Inbound Interno' : '19'
		else if (eventId === '9') nextEvent = (nextNameEvent === true) ? 'Hold Outbound' : '17'
		else if (eventId === '17') nextEvent = (nextNameEvent === true) ? 'Outbound' : '9'
		else if (eventId === '20') nextEvent = (nextNameEvent === true) ? 'Hold Outbound Interno' : '23'
		else if (eventId === '23') nextEvent = (nextNameEvent === true) ? 'Outbound Interno' : '20'
		else if (eventId === '25') nextEvent = (nextNameEvent === true) ? 'Hold Inbound Transfer' : '26'
		else if (eventId === '26') nextEvent = (nextNameEvent === true) ? 'Inbound Transfer' : '25'
		else if (eventId === '29') nextEvent = (nextNameEvent === true) ? 'Hold Outbound Transfer' : '28'
		else if (eventId === '28') nextEvent = (nextNameEvent === true) ? 'Outbound Transfer' : '29'
		return nextEvent
	}
}

module.exports = Helper
