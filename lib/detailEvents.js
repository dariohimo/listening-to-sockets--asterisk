import ip from 'ip'
import dateFormat from 'dateformat'
import Request from './util/sendRequest'
import EnvironmentVariables from './util/environmentVariables'

const env = new EnvironmentVariables()


class DetailEvents {
	getRequest (data, event, urlController, typeSend) {
		const envSails = env.envSails(data.name_proyect)
		const request = new Request({
			endpoint: envSails.endpoint,
			port: envSails.port,
			apiName: envSails.apiDetailEvent
		})
		return new Promise((resolve, reject) => {
			let eventAgent = getStructure(event, data)
			if (eventAgent) request.send(urlController, typeSend, eventAgent).then(dataAgent => resolve(dataAgent)).catch(err => reject(err))
		})
	}

	insertEvent (data) { return this.getRequest(data, 'insertEvent', '/createEvent', 'POST', 'Insert detail events en la table detalle_eventos') }
}

function getStructure (event, data) {
	let eventAgent = ''
	if (event === 'insertEvent') {
		eventAgent = {
			'event_id': data.event_id,
			'agent_user_id': data.agent_user_id,
			'event_time': dateFormat(new Date(), 'yyyy-mm-dd H:MM:ss'),
			'event_observaciones': data.event_observaciones,
			'ip': ip.address(),
			'agent_annexed': data.agent_annexed
		}
		return eventAgent
	}
}

module.exports = DetailEvents
