'use strict'
import http from 'http'
import express from 'express'
import ioSockets from './util/ioSockets'
import BringBackData from './bringBackData'
import AmiAsterisk from './asterisk/amiAsterisk'
import EnvironmentVariables from './util/environmentVariables'
import Helper from './util/helperAsterisk'

const env = new EnvironmentVariables()
const envExpress = env.envExpress()
const ioSocket = new ioSockets()
const bringBackData = new BringBackData()
const helper = new Helper()

const app = express()
const server = http.createServer(app)
const expressPort = envExpress.expressPort
server.listen(expressPort, () => console.log(`Rest API para el dashboard se encuentra escuchando el puerto ${expressPort}`))

const ioAdapterRedis = ioSocket.conectionSocketIORedis(server)

const iosocket = ioAdapterRedis.sockets.on('connection', (socket) => {
	console.log(`Connection to client established ${socket.id}`)

	/**
	 * Este socket es para poder emitir la hora actual del servidor
	 */
	let interval
	if (interval) clearInterval(interval)
	interval = setInterval(() => socket.emit('datetime', { datetime: helper.timeServer() }), 30000)

	socket.on('createRoomFrontPanel', data => ioSocket.createRoomFrontPanel(socket, data))
	socket.on('leaveRoomFrontPanel', data => ioSocket.leaveRoomFrontPanel(socket, data))

	socket.on('createRoomDashboard', data => ioSocket.createRoomDashboard(socket, data))
	socket.on('addUserToDashboard', data => bringBackData.addUserToDashboard(data))
	socket.on('updateDataDashboard', data => bringBackData.updateUserToDashboard(data))
	socket.on('listDataDashboard', data => bringBackData.listUsersConnect(data))
	socket.on('listCallsWaiting', data => bringBackData.listCallsWaiting(data))

	socket.on('broadcastAgentes', () => {
		console.log('Enviando mensaje desde el frontPanel de supervision, para enviar mensajes masivos')
	})

	socket.on('disconnect', () => {
		console.log(`Se ha eliminado el socketID: ${socket.id}`)
		socket.disconnect(true)
	})
})

ioSocket.setIOSocket(iosocket)

/**
 * Realizar las conexion a los servidores asterisk
 */
const amiAsterisk = new AmiAsterisk(['interbank','corporativo','factibilidad','cdsgop','entel'])
amiAsterisk.conectionAll()
