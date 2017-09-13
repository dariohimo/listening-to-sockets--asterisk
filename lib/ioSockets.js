import socketio from 'socket.io'
import socketredis from 'socket.io-redis'
import getEnv from './getEnv'

let iosocket = ''
const env = new getEnv()

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
		const nameRoom = "frontPanel:" + data.nameProyect + ":" + data.agent_user_id
		socket.join(nameRoom)
		console.log("Creando Sala frontPanel -> " + nameRoom)
	}
	
	createRoomDashboard (socket, data) {
		const nameRoom = "dashboard:" + data.nameProyect
		socket.join(nameRoom)
		console.log("Creando Sala Dashboard -> " + nameRoom)
	}
	
	sendEmitDashboard(nameEmit, dataAgent ) {
		console.log('Emitiendo Socket a Dashboard ->  Proyecto:' + dataAgent.nameProyect)
		if (dataAgent) iosocket.in('dashboard:' + dataAgent.nameProyect).emit(nameEmit, dataAgent)
	}
	
	sendEmitFrontPanel(dataAgent){
		console.log('Emitiendo Socket a FrontEnd ->  USERID:' + dataAgent.agent_user_id)
		iosocket.in('panelAgent:' + dataAgent.agent_user_id).emit('statusAgent', {
			statusAddAgentDashboard: true,
			eventName: dataAgent.event_name,
			eventId: dataAgent.event_id,
			annexedStatusAsterisk: dataAgent.agent_status,
		})
	}
}

module.exports = ioSockets