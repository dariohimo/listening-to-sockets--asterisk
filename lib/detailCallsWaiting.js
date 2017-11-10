import Request from './util/sendRequest'
import EnvironmentVariables from './util/environmentVariables'
import len from 'object-length'

const env = new EnvironmentVariables()

class DetailCallsWaiting {
	getRequest (data, urlController, typeSend, msjLog) {
		const envSails = env.envSails(data.NameProyect)
		const request = new Request({
			endpoint: envSails.endpoint,
			port: envSails.port,
			apiName: envSails.apiDetailCallsWaiting
		})

		return new Promise((resolve, reject) => {
			let eventAgent = getStructure(data)
			if (eventAgent) {
				console.log('callWaiting: ' + msjLog + ' - ' + urlController)
				request.send(urlController, typeSend, eventAgent).then(data => resolve(data)).catch(err => reject(err))
			}
		})
	}
	create (data) { return this.getRequest(data, '/createCallWaiting', 'POST', 'Insert detail calls waiting para controlar encolamiento') }
	delete (data) { return this.getRequest(data, '/deleteCallWaiting', 'POST', 'Delete detail calls waiting para controlar encolamiento') }
	show (data) { 
		const envSails = env.envSails(data.nameProyect)
		const request = new Request({
			endpoint: envSails.endpoint,
			port: envSails.port,
			apiName: envSails.apiDetailCallsWaiting
		})
		
		return new Promise((resolve, reject) => {
			request.send('/', 'GET').then(data => resolve(data)).catch(err => reject(err))
		})
	}
	deleteAll (data) {
		const envSails = env.envSails(data.nameProyect)
		const request = new Request({
			endpoint: envSails.endpoint,
			port: envSails.port,
			apiName: envSails.apiDetailCallsWaiting
		})
		
		return new Promise((resolve, reject) => {
			request.send('/deleteAllCallWaiting', 'POST').then(data => resolve(data)).catch(err => reject(err))
		})
	}
}

function getStructure (data) {
	if (len(data) > 0) {
		return {
			'number_phone': data.CallerIDNum,
			'name_number': (data.CallerIDName === '<unknown>') ? '' : data.CallerIDName,
			'name_queue': data.Queue,
			'unique_id': data.Uniqueid,
			'start_call': (new Date()).getTime()
		}
	}
	return false
}

module.exports = DetailCallsWaiting
