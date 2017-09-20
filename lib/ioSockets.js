import getEnv from './getEnv'
import socketio from 'socket.io'
import socketredis from 'socket.io-redis'
import DetailEvents from './detailEvents'
import AmiAction from './amiActions'

let iosocket = ''
const env = new getEnv()
const detailEvents = new DetailEvents()
const amiAction = new AmiAction()

const envRedis = env.envRedis()
const redisHost = envRedis.redisHost
const redisPort = envRedis.redisPort
const redisSecret = envRedis.redisSecret

class ioSockets {

	conectionSocketIORedis (server) {
		const ioAdapterRedis = socketio.listen(server)
		ioAdapterRedis.adapter(socketredis({ host: redisHost, port: redisPort, password: redisSecret }))

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

	createRoomDashboard (socket, data) {
		let nameProyect = (data.nameProyect) ? data.nameProyect : data.name_proyect
		const nameRoom = `dashboard:${nameProyect}`
		socket.join(nameRoom)
		console.log(`Creando Sala Dashboard -> ${nameRoom}`)
	}

	sendSocketsExtras (data, isPause, isDetailEvents)  {
		if (data) {
			if (isPause) amiAction.pauseQueue(data)
			if (isDetailEvents) detailEvents.insertEvent(data)
			this.sendEmitFrontPanel(data)
		}
	}

	sendEmitDashboard(nameEmit, data ) {
		let nameProyect = (data.nameProyect) ? data.nameProyect : data.name_proyect
		console.log(`Emitiendo Socket -> dashboard:${nameProyect} -> Evento:${nameEmit}`)
		if (data) iosocket.in(`dashboard:${nameProyect}`).emit(nameEmit, data)
	}

	sendEmitFrontPanel(data){
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

module.exports = ioSockets
