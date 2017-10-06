

class SearchDataEmitAsterisk {

	getNumberExtension (data) {
		const event = data['Event']
		if (event === 'Hold') return this.eventHold(data)
		if (event === 'Unhold') return this.eventUnHold(data)
		if (event === 'Newstate') return this.eventNewState(data)
		if (event === 'Hangup') return this.eventHangup(data)
		if (event === 'BlindTransfer') return this.eventBlindTransfer(data)
	}

	extractNumberExtension (data) {
		let numberExtension = data['Channel'].split('-')
		numberExtension = numberExtension[0].split('/')
		numberExtension = numberExtension[1]
		return numberExtension
	}

  eventHold (data) {
    return (data['CallerIDNum'].length > '4') ? this.extractNumberExtension(data) : data['CallerIDNum']
  }

  eventUnHold (data) {
    return (data['CallerIDNum'].length > '4') ? this.extractNumberExtension(data) : data['CallerIDNum']
  }

  eventNewState (data) {
    return (data['ConnectedLineNum'].length === 4) ? data['ConnectedLineNum'] : data['CallerIDNum']
  }

  eventHangup (data) {
    const callerIDNum = data['CallerIDNum']
		const connectedLineNum = data['ConnectedLineNum']

    const exten = data['Exten']
    const uniqueID = data['Uniqueid']
    const linkedid = data['Linkedid']
    const channelStateDesc = data['ChannelStateDesc']
    const context = data['Context'].split('-')

    if (connectedLineNum !== '<unknown>' && context[0] === 'context') return connectedLineNum
    if (connectedLineNum === '<unknown>' && context[0] === 'feature') return callerIDNum

    if (context[0] === 'nivel') {
      if (data['ChannelStateDesc'] === 'Up') {
        if (connectedLineNum !== '<unknown>') {
          if (exten.length === 0) return callerIDNum
          else return (exten.length <= 4) ? callerIDNum : connectedLineNum
        } else {
          if(uniqueID === linkedid && connectedLineNum !== '<unknown>') {
            return this.extractNumberExtension(data)
          }else if(connectedLineNum !== '<unknown>'){
            return callerIDNum
          }
        }
      } else return (channelStateDesc === 'Ring' && uniqueID === linkedid) ? this.extractNumberExtension(data) : callerIDNum
    }
  }

  eventBlindTransfer (data) {
    if (data['TransfererCallerIDNum'] !== 'undefined') {
  		return data['TransfererCallerIDNum']
  	}
  }

}

module.exports = SearchDataEmitAsterisk
