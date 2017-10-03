import Helper from './helperAsterisk'
import EventHold from '../events/eventHold'
import EventNewState from '../events/eventNewState'

const eventHold = new EventHold()
const eventNewState = new EventNewState()
const helper = new Helper()

class UtilEvent {
	returnAgent (data, dataPreUpdate) {
	    const horaActualServer = (new Date()).getTime()

	    if(data['Event'] === 'Hold') return eventHold.hold(data, dataPreUpdate, horaActualServer)
    	if(data['Event'] === 'Newstate') return eventNewState.newState(data, dataPreUpdate, horaActualServer)
    	//if(datos['Event'] === 'Unhold') 
	    
	}
}

module.exports = UtilEvent