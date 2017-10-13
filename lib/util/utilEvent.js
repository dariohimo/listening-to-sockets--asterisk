import EventNewState from '../events/eventNewState'
import EventHangUp from '../events/eventHangUp'
import EventHold from '../events/eventHold'
import EventUnHold from '../events/eventUnHold'
import EventBlindTransfer from '../events/eventBlindTransfer'

const eventNewState = new EventNewState()
const eventHangUp = new EventHangUp()
const eventHold = new EventHold()
const eventUnHold = new EventUnHold()
const eventBlindTransfer = new EventBlindTransfer()

class UtilEvent {
	returnAgent (data, dataPreUpdate) {
		const sendData = {
			'horaActualServer' : (new Date()).getTime(),
			'dataPreUpdate'	: dataPreUpdate,
			'dataEmitAsterisk' : data
		}

		if (typeof sendData.dataEmitAsterisk['CallerIDNum'] !== 'undefined') {
			if(data['Event'] === 'Hold') return eventHold.Hold(sendData)
			if(data['Event'] === 'Newstate') return eventNewState.newState(sendData)
			if(data['Event'] === 'Unhold') return eventUnHold.unHold(sendData)
			if(data['Event'] === 'Hangup') return eventHangUp.hangUp(sendData)
		} else {
			if(data['Event'] === 'BlindTransfer') return eventBlindTransfer.blindTransfer(sendData)
		}
	}
}

module.exports = UtilEvent