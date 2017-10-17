import Request from './util/sendRequest'
import EnvironmentVariables from './util/environmentVariables'

const env = new EnvironmentVariables()
const envSails = env.envSails()

const request = new Request({
	endpoint: envSails.endpoint,
	apiName: envSails.apiDetailCallsWaiting
})

class DetailCallsWaiting {
	getRequest (data, event, urlController, typeSend, msjLog) {
		return new Promise((resolve, reject) => {
			let eventAgent = getStructure(event, data)
			if (eventAgent) {
				console.log('callWaiting: ' + msjLog + ' - ' + urlController)
				request.send(urlController, typeSend, eventAgent).then(dataAgent => resolve(dataAgent)).catch(err => reject(err))
			}
		})
	}

	create (data) { return this.getRequest(data, 'QueueCallerJoin', '/create', 'POST', 'Insert detail calls waiting para controlar encolamiento') }
	delete (data) { return this.getRequest(data, 'QueueCallerJoin', '/delete', 'POST', 'Delete detail calls waiting para controlar encolamiento') }
}

function getStructure (event, data) {
	let datos = (event, data)
	let callWaiting = ''
	if (event === 'QueueCallerJoin') {
		callWaiting = {
			'number_phone': datos.CallerIDNum,
			'name_number': (datos.CallerIDName === '<unknown>') ? '' : datos.CallerIDName,
			'name_queue': datos.Queue,
			'start_call': (new Date()).getTime()
		}
		return callWaiting
	}
}

module.exports = DetailCallsWaiting
