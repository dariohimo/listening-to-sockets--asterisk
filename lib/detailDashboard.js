import Request from './util/sendRequest'
import UtilEvent from './util/utilEvent'
import EnvironmentVariables from './util/environmentVariables'
import SearchDashboardData from './dashboard/searchDashboardData'

const env = new EnvironmentVariables()
const searchDashboardData = new SearchDashboardData()
const utilEvent = new UtilEvent()

class DetailDashboard {
	getRequest (data, url, msjLog, isGetDataPreUpdate = false) {
		const envSails = env.envSails(data.NameProyect)
		const request = new Request({
			endpoint: envSails.endpoint,
			port: envSails.port,
			apiName: envSails.apiDetailDashboard
		})

		let dataPreUpdate = {}
		let agent = ''

		return new Promise(async (resolve, reject) => {
			if(data['Event'] === 'Unhold' || data['Event'] === 'Hangup') {
				setTimeout(async function() {
					if (isGetDataPreUpdate) dataPreUpdate = await searchDashboardData.getDataPreUpdate(data)
					agent = await utilEvent.returnAgent(data, dataPreUpdate)
					if (agent) {
						request.send(url, 'POST', agent).then(data => resolve(data)).catch(err => reject(err))
					}
				}, 800)
			} else {
				if (isGetDataPreUpdate) dataPreUpdate = await searchDashboardData.getDataPreUpdate(data)
				agent = await utilEvent.returnAgent(data, dataPreUpdate)
				if (agent) {
					request.send(url, 'POST', agent).then(data => resolve(data)).catch(err => reject(err))
				}
			}
		})
	}

	shows (data) {
		const envSails = env.envSails(data.nameProyect)
		const request = new Request({
			endpoint: envSails.endpoint,
			port: envSails.port,
			apiName: envSails.apiDetailDashboard
		})

		return new Promise((resolve, reject) => {
			request.send('/', 'GET', null).then(data => resolve(data)).catch(err => reject(err))
		})
	}

	search (data) {
		return this.getRequest(data,'/search', 'Search segun el anexo el EventId del Agente',false)
	}

	memberPause (data) {
		return this.getRequest(data,'/updatePause','Pausing Agent',false)
	}

	memberAdd (data) {
		return this.getRequest(data,'/searchAndUpdate','Dashboard : Adding Agent',false)
	}

	ringInbound (data) {
		return this.getRequest(data,'/searchAndUpdate','Dashboard : Ring Inbound',true)
	}

	answerInbound (data) {
		return this.getRequest(data,'/searchAndUpdate','Dashboard : Answer Inbound',true)
	}

	ringAnswerOutbound (data) {
		return this.getRequest(data,'/searchAndUpdate','Dashboard : Ring Outbound',true)
	}

	hangup (data) {
		return this.getRequest(data,'/searchAndUpdate','Dashboard : Hangup',true)
	}

	hold (data) {
		return this.getRequest(data,'/searchAndUpdate','Dashboard : Hold',true)
	}

	unhold (data) {
		return this.getRequest(data,'/searchAndUpdate','Dashboard : UnHold',true)
	}

	blindTransfer (data) {
		return this.getRequest(data,'/transferUnattended', 'Dashboard : Remove Transfer Unattended',true)
	}

	attendedTransfer (data) {
		return this.getRequest(data,'/searchAndUpdate','Dashboard : AttendedTransfer',true)
	}
}

module.exports = DetailDashboard
