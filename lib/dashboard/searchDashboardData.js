import Request from './../util/sendRequest'
import EnvironmentVariables from './../util/environmentVariables'
import SearchDataEmitAsterisk from './searchDataEmitAsterisk'

const env = new EnvironmentVariables()

const searchDataEmitAsterisk = new SearchDataEmitAsterisk()


class SearchDashboardData {

	getDataPreUpdate (data) {
		const envSails = env.envSails(data.NameProyect)
		const request = new Request({
			endpoint: envSails.endpoint,
			port: envSails.port,
			apiName: envSails.apiDetailDashboard
		})
		return new Promise(async (resolve) => {
			const numberExtension = searchDataEmitAsterisk.getNumberExtension(data)
			if (numberExtension) {
				resolve(await request.send('/search', 'POST', {'agent_annexed': numberExtension}))
			} else {
				console.log('Evento : ' + data['Event'])
				console.log('Error al buscar la dataPreUpdate debido a que no se encuentra con un anexo')
			}
		})
	}

}

module.exports = SearchDashboardData
