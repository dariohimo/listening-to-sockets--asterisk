import ioSockets from '.././ioSockets'
import DetailDashboard from '.././detailDashboard'
import EventsCallsOutbound from './eventsOutbound'
import DetailCallsWaiting from '.././detailCallsWaiting'

const ioSocket = new ioSockets()
const detailDashboard = new DetailDashboard()
const eventsCallsOutbound = new EventsCallsOutbound()
const detailCallsWaiting = new DetailCallsWaiting()

class EventsAsterisk {
	/**
	 * Controlar los mensajes de error
	 */
	handlerError (msj, err) {
		console.log(`${msj} : ${err}`)
	}

	queueMemberPause (data) {
		let agentStatus = ''
		if (data.Interface !== '') agentStatus = data.Paused

		detailDashboard.memberPause(data).then(data => {
			data.agent_status = agentStatus
			ioSocket.sendEmitDashboard('UpdateOther', data)
			ioSocket.sendSocketsExtras(data, false, false)
		}).catch(err => this.handlerError('Error pausing agent on the dashboard', err))
	}

	queueMemberAdd (data) {
		detailDashboard.memberAdd(data)
			.then(data => ioSocket.sendEmitFrontPanel(data))
			.catch(err => this.handlerError('Error adding agent on the dashboard', err))
	}

	newstate (data) {
		detailDashboard.ringAnswerOutbound(data)
			.then(data => eventsCallsOutbound.callsOutbound(data))
			.catch(err => this.handlerError('Error al mostrar Ring o Answer de Llamada Outbound', err))
	}

	newConnectedLine (data) {
		detailDashboard.ringInbound(data)
			.then(data => eventsCallsOutbound.pruebas(data, 'eventNewConnectedLine'))
			.catch(err => this.handlerError('Error al mostrar ring de entrante', err))
	}

	agentConnect (data) {
		detailDashboard.answerInbound(data)
			.then(data => eventsCallsOutbound.pruebas(data, 'eventAgentConnect'))
			.catch(err => this.handlerError('Error al capturar (answer) de la llamada entrante', err))
	}

	hangup (data) {
		detailDashboard.hangup(data)
			.then(data => eventsCallsOutbound.hangup(data))
			.catch(err => this.handlerError('Error al cortar (hangup) llamadas salientes y/o entrantes', err))
	}

	blindTransfer (data) {
		detailDashboard.transferUnattended(data)
			.then(data => eventsCallsOutbound.pruebas(data, 'eventBlindTransfer'))
			.catch(err => this.handlerError('Error al realizar transferencias ciegas', err))
	}

	hold (data) {
		detailDashboard.hold(data)
			.then(data => eventsCallsOutbound.hold(data))
			.catch(err => this.handlerError('Error al mostrar Hold', err))
	}

	unHold (data) {
		detailDashboard.unhold(data)
			.then(data => eventsCallsOutbound.unHold(data))
			.catch(err => this.handlerError('Error al mostrar UnHold', err))
	}

	queueCallerJoin (data) {
		detailCallsWaiting.create(data)
			.then(data => ioSocket.sendEmitDashboard('AddCallWaiting', data))
			.catch(err => this.handlerError('Error al insertar llamadas encoladas', err))
	}

	queueCallerLeave (data) {
		detailCallsWaiting.delete(data)
			.then(data => ioSocket.sendEmitDashboard('RemoveCallWaiting', data))
			.catch(err => this.handlerError('Error al eliminar llamadas encoladas', err))
	}
}

module.exports = EventsAsterisk
