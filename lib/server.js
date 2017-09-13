'use strict'
import http from 'http'
import express from 'express'
import getEnv from './getEnv'
import ioSockets from './ioSockets'
import BringBackData from './bringBackData'
import DetailDashboard from './detailDashboard'
import AmiAsterisk from './asterisk/index'

const env = new getEnv()
const envExpress = env.envExpress()
const ioSocket = new ioSockets()
const bringBackData = new BringBackData()
const detailDashboard = new DetailDashboard()

const app = express()
const server = http.createServer(app)
const expressPort = envExpress.expressPort

const handlerError = (msj, err) => console.log(`${msj} : ${err}`)

server.listen(expressPort, () => console.log(`Rest API para el dashboard se encuentra escuchando el puerto ${expressPort}`))

const ioAdapterRedis = ioSocket.conectionSocketIORedis(server)
const iosocket = ioAdapterRedis.sockets.on("connection", (socket) => {
	console.log(`Connection to client established ${socket.id}`)

	socket.on('createRoomDashboard', data => { ioSocket.createRoomDashboard(socket, data) })
	socket.on('createRoomFrontPanel', data => {	ioSocket.createRoomFrontPanel(socket, data)	})
	socket.on('addUserToDashboard', data => { bringBackData.addUserToDashboard(data)	})

	socket.on('listDataDashboard', () => {
		detailDashboard.shows().then(data => {
			data.forEach(agent => {
				let eventID = agent.event_id
				if (eventID === '8' || eventID === '12' || eventID === '16' ||
						eventID === '19' || eventID === '18' || eventID === '22' ||
						eventID === '25' || eventID === '24' ||
						eventID === '26') socket.emit('AddInbound', agent)
				else if (eventID === '9' || eventID === '13' || eventID === '17' ||
						eventID === '20' || eventID === '21' || eventID === '23' ||
						eventID === '27' || eventID === '28' ||
						eventID === '29') socket.emit('AddOutbound', agent)
				else socket.emit('AddOther', agent)
			})
		}).catch(err => handlerError('Error al obtener agentes', err))
	})

})

ioSocket.setIOSocket(iosocket)

const amiAsterisk = new AmiAsterisk(['interbank', 'corporativo'])

amiAsterisk.conectionAll()
