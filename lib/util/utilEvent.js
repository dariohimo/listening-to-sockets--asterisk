import EventNewState from '../events/eventNewState'
import EventHangUp from '../events/eventHangUp'
import EventHold from '../events/eventHold'
import EventUnHold from '../events/eventUnHold'
import EventBlindTransfer from '../events/eventBlindTransfer'
import EventAttendedTransfer from '../events/eventAttendedTransfer'

const eventNewState = new EventNewState()
const eventHangUp = new EventHangUp()
const eventHold = new EventHold()
const eventUnHold = new EventUnHold()
const eventBlindTransfer = new EventBlindTransfer()
const eventAttentedTransfer = new EventAttendedTransfer()

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
			if(data['Event'] === 'AttendedTransfer') return eventAttentedTransfer.attendedTransfer(sendData)
		}
	}
}

module.exports = UtilEvent