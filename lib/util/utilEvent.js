import Helper from './helperAsterisk'
import EventNewState from '../events/eventNewState'
import EventHangUp from '../events/eventHangUp'
import EventHold from '../events/eventHold'
import EventUnHold from '../events/eventUnHold'

const eventNewState = new EventNewState()
const eventHangUp = new EventHangUp()
const eventHold = new EventHold()
const eventUnHold = new EventUnHold()
const helper = new Helper()

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
	    }
	    
	}
}

module.exports = UtilEvent