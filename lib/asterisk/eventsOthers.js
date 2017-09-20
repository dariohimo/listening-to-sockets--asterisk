import ioSockets from '.././ioSockets'
import DetailDashboard from '.././detailDashboard'

const ioSocket = new ioSockets()
const detailDashboard = new DetailDashboard()

class EventsOthers {
	/**
	 * [Controlar los mensajes de error]
	 */
	handlerError(msj, err) {
		console.log(`${msj} : ${err}`)
	}

	queueMemberPause (data) {
		let agentStatus = ""
		if (data.Interface !== "") agentStatus = data.Paused

		detailDashboard.memberPause(data).then(data => {
			data.agent_status = agentStatus
			ioSocket.sendEmitDashboard("UpdateOther", data)
			ioSocket.sendSocketsExtras(data, false, false)
		}).catch(err => this.handlerError("Error pausing agent on the dashboard", err))
	}

	queueMemberAdd (data){
		detailDashboard.memberAdd(data)
			.then(data => ioSocket.sendEmitFrontPanel(data))
			.catch(err => this.handlerError("Error adding agent on the dashboard", err))
	}
}

module.exports = EventsOthers
