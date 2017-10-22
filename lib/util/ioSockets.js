import len from 'object-length'
import socketio from 'socket.io'
import socketredis from 'socket.io-redis'
import DetailEvents from './../detailEvents'
import AmiAction from './../asterisk/amiActions'
import EnvironmentVariables from './environmentVariables'

let iosocket = ''

const env = new EnvironmentVariables()
const detailEvents = new DetailEvents()
const amiAction = new AmiAction()

const envRedis = env.envRedis()
const redisHost = envRedis.redisHost
const redisPort = envRedis.redisPort
const redisSecret = envRedis.redisSecret

class ioSockets {

	conectionSocketIORedis (server) {
		let ioAdapterRedis = socketio.listen(server)
		ioAdapterRedis = ioAdapterRedis.adapter(socketredis({ host: redisHost, port: redisPort, password: redisSecret}))

		return ioAdapterRedis
	}

	setIOSocket (iosockets) {
		iosocket = iosockets
	}

	createRoomFrontPanel (socket, data) {
		let nameProyect = (data.nameProyect) ? data.nameProyect : data.name_proyect
		const nameRoom = `frontPanel:${nameProyect}:${data.agent_user_id}`
		socket.join(nameRoom)
		console.log(`Creando Sala frontPanel -> ${nameRoom}`)
	}

	leaveRoomFrontPanel (socket, data) {
		let nameProyect = (data.nameProyect) ? data.nameProyect : data.name_proyect
		const nameRoom = `frontPanel:${nameProyect}:${data.agent_user_id}`
		socket.leave(nameRoom)
		console.log(`Eliminando Sala frontPanel -> ${nameRoom}`)
	}

	createRoomDashboard (socket, data) {
		let nameProyect = (data.nameProyect) ? data.nameProyect : data.name_proyect
		const nameRoom = `dashboard:${nameProyect}`
		socket.join(nameRoom)
		console.log(`Creando Sala Dashboard -> ${nameRoom}`)
	}

	/**
	 * Function que controla la pausa en el asterisk, el registro en el detalle de eventos y finalmente
	 * emite un mensaje al FrontPanel para informar el estado actual de ese agente.
	 */
	sendSocketsExtras (data, isPause, isDetailEvents)  {
		if (data) {
			if (isPause) amiAction.pauseQueue(data)
			if (isDetailEvents) detailEvents.insertEvent(data)
			this.sendEmitFrontPanel(data)
		}
	}


	sendEmitDashboard(nameEmit, data ) {
		if(len(data) != 0) {
			let nameProyect = (data.nameProyect) ? data.nameProyect : data.name_proyect
			console.log(`Emitiendo Socket -> dashboard:${nameProyect} -> Evento:${nameEmit}`)
			iosocket.in(`dashboard:${nameProyect}`).emit(nameEmit, data)
		}
	}

	sendEmitFrontPanel(data){
		if(len(data) != 0) {
			let nameProyect = (data.nameProyect) ? data.nameProyect : data.name_proyect
			console.log(`Emitiendo Socket -> frontPanel:${nameProyect}:${data.agent_user_id}`)
			iosocket.in(`frontPanel:${nameProyect}:${data.agent_user_id}`).emit('statusAgent', {
				statusAddAgentDashboard: true,
				eventName: data.event_name,
				eventId: data.event_id,
				annexedStatusAsterisk: data.agent_status,
			})
		}
	}

	sendSocketOther (data, isRemoveOther, isUpdateOther, isAddOther) {
		if (isRemoveOther) this.sendEmitDashboard('RemoveOther',data)
		if (isUpdateOther) this.sendEmitDashboard('UpdateOther',data)
		if (isAddOther) this.sendEmitDashboard('AddOther',data)
	}

	sendSocketOutbound (data, isRemoveOutbound, isUpdateOutbound, isAddOutbound) {
		if (isRemoveOutbound) this.sendEmitDashboard('RemoveOutbound',data)
		if (isUpdateOutbound) this.sendEmitDashboard('UpdateOutbound',data)
		if (isAddOutbound) this.sendEmitDashboard('AddOutbound',data)
	}

	sendSocketInbound (data, isRemoveInbound, isUpdateInbound, isAddInbound) {
		if (isRemoveInbound) this.sendEmitDashboard('RemoveInbound',data)
		if (isUpdateInbound) this.sendEmitDashboard('UpdateInbound',data)
		if (isAddInbound) this.sendEmitDashboard('AddInbound',data)
	}
}

module.exports = ioSockets
