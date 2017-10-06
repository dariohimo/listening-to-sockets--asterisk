import Request from '.././sendRequest'
import getEnv from '.././getEnv'
import SearchDataEmitAsterisk from './searchDataEmitAsterisk'

const env = new getEnv()
const envSails = env.envSails()

const searchDataEmitAsterisk = new SearchDataEmitAsterisk()

const request = new Request({
	endpoint: envSails.endpoint,
	apiName: envSails.apiDetailDashboard
})

class SearchDashboardData {

	getDataPreUpdate (data) {
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