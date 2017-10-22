'use strict'
import http from 'http'
import express from 'express'
import ioSockets from './util/ioSockets'
import BringBackData from './bringBackData'
import AmiAsterisk from './asterisk/amiAsterisk'
import EnvironmentVariables from './util/environmentVariables'

const env = new EnvironmentVariables()
const envExpress = env.envExpress()
const ioSocket = new ioSockets()
const bringBackData = new BringBackData()

const app = express()
const server = http.createServer(app)
const expressPort = envExpress.expressPort
server.listen(expressPort, () => console.log(`Rest API para el dashboard se encuentra escuchando el puerto ${expressPort}`))

const ioAdapterRedis = ioSocket.conectionSocketIORedis(server)

const iosocket = ioAdapterRedis.sockets.on('connection', (socket) => {

	console.log(`Connection to client established ${socket.id}`)

	socket.on('createRoomFrontPanel', data => ioSocket.createRoomFrontPanel(socket, data))
	socket.on('leaveRoomFrontPanel', data => ioSocket.leaveRoomFrontPanel(socket, data))

	socket.on('createRoomDashboard', data => ioSocket.createRoomDashboard(socket, data))
	socket.on('addUserToDashboard', data => bringBackData.addUserToDashboard(data))
	socket.on('updateDataDashboard', data => bringBackData.updateUserToDashboard(data))
	socket.on('listDataDashboard', data => bringBackData.listUsersConnect(data))

	socket.on('broadcastAgentes', data => {
		console.log('Enviando mensaje desde el frontPanel de supervision, para enviar mensajes masivos')
		console.log(data)
	})

	socket.on('disconnect', () =>  {
		console.log(`Se ha eliminado el socketID: ${socket.id}`)
		socket.disconnect(true)
	})
})

ioSocket.setIOSocket(iosocket)

/**
 * Realizar las conexion a los servidores asterisk
 */
const amiAsterisk = new AmiAsterisk(['interbank'])
amiAsterisk.conectionAll()
