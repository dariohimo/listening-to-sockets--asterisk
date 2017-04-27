'use strict'
import http from 'http'
import express from 'express'
import socketio from 'socket.io'
import asteriskio from 'asterisk.io'
import socketredis from 'socket.io-redis'
import AmiAction from './lib/amiActions'
import Agent from './lib/agents'
import DetailEvents from './lib/detailEvents'
import CallWaiting from './lib/callWaiting'

const asteriskHost = process.env.asteriskHost
const asteriskPort = process.env.asteriskPort
const asteriskUsername = process.env.asteriskUsername
const asteriskSecret = process.env.asteriskSecret

const eventDetail = new DetailEvents({
  endpoint: process.env.endpoint,
  nameapi: process.env.nameapiEventDetail
})

const agents = new Agent({
  endpoint: process.env.endpoint,
  nameapi: process.env.nameapiAgents
})

const callWaiting = new CallWaiting({
  endpoint: process.env.endpoint,
  nameapi: process.env.callWaiting
})

const actionAmi = new AmiAction({
  host: asteriskHost,
  port: asteriskPort,
  username: asteriskUsername,
  secret: asteriskSecret
})

const redisHost = process.env.redisHost
const redisPort = process.env.redisPort
const redisPassword = process.env.redisSecret

const app = express()
const server = http.createServer(app)
const port = process.env.expressPort
server.listen(port, () => console.log('Rest API para el dashboard se encuentra escuchando el puerto %d', port))

const io = socketio.listen(server)
io.adapter(socketredis({ host: redisHost, port: redisPort, password: redisPassword }))
var iosocket = io.sockets.on('connection', (socket) => {
  console.log('Connection to client established ' + socket.id)

  socket.on('listAgentConnect', data => {
    agents.shows().then(data => {
      data.forEach(agent => socket.emit('QueueMemberAdded', { QueueMemberAdded: agent }))
    })
    .catch(err => console.log('Error al obtener agentes :' + err))
  })

  socket.on('createRoom', anexo => {
    socket.room = 'panelAgent:' + anexo
    socket.join('panelAgent:' + anexo)
  })

  socket.on('leaveRoom', anexo => {
    socket.leave('panelAgent:' + anexo)
  })

  socket.on('createAgent', data => {
    agents.createAgent(data).then(data => iosocket.emit('QueueMemberAdded', { QueueMemberAdded: data }))
    .catch(err => { console.log('Error adding agent on the dashboard :' + err) })
  })
})

const ami = asteriskio.ami(asteriskHost, asteriskPort, asteriskUsername, asteriskSecret)
ami.on('error', err => {
  if (err.message === 'Authentication failed.') console.log('Error en la autenticacion del AMI')
})

/**
* [Capturar el evento Queue Member Added que se produce en el servicio de asterisk]
*/
ami.on('eventQueueMemberAdded', data => {
  agents.add(data).then(data => iosocket.emit('QueueMemberAdded', { QueueMemberAdded: data }))
  .catch(err => console.log('Error adding agent on the dashboard :' + err))
})

/**
* [Capturar el evento Queue Member Removed que se produce en el servicio de asterisk]
*/
ami.on('eventQueueMemberRemoved', data => {
  agents.del(data).then(data => iosocket.emit('QueueMemberRemoved', { NumberAnnexed: data }))
  .catch(err => { console.log('Error removing agent on the dashboard :' + err) })
})

/**
* [Capturar el evento Queue Member Pause que se produce en el servicio de asterisk]
*/
ami.on('eventQueueMemberPause', data => {
  agents.pause(data).then(data => iosocket.emit('QueueMemberChange', { QueueMemberChange: data }))
  .catch(err => { console.log('Error pausing agent on the dashboard :' + err) })
})

/**
* [Capturar el evento de timbrado de la llamada entrante que se produce en el servicio de asterisk]
*/
ami.on('eventNewConnectedLine', data => {
  agents.ringInbound(data).then(data => sendSockets(data, false))
  .catch(err => { console.log('Error al mostrar ring de entrante :' + err) })
})

/**
* [Capturar el evento Answer de la llamada entrante que se produce en el servicio de asterisk]
*/
ami.on('eventAgentConnect', data => {
  agents.answerInbound(data).then(data => sendSockets(data, true))
  .catch(err => { console.log('Error al capturar (answer) de la llamada entrante :' + err) })
})

/**
* [Capturar el evento de timbrado de la llamada saliente que se produce en el servicio de asterisk]
*/
ami.on('eventNewstate', data => {
  agents.ringOutbound(data).then(data => sendSockets(data, true))
  .catch(err => { console.log('Error al mostrar ring de salientes :' + err) })
})

/**
* [Capturar el evento de corte de llamada sea entrante y/o saliente que se produce en el servicio de asterisk]
*/
ami.on('eventHangup', data => {
  agents.hangup(data).then(data => sendSockets(data, true))
  .catch(err => { console.log('Error al cortar (hangup) llamadas salientes y/o entrantes :' + err) })
})

/**
* [Capturar el evento cuando se completa una transferencia ciega que se produce en el servicio de asterisk]
*/
ami.on('eventBlindTransfer', data => sendSockets(agents.transferUnattended(data), true))

ami.on('eventHold', data => {
  agents.hold(data).then(data => sendSockets(data, true))
  .catch(err => { console.log('Error al mostrar Hold :' + err) })
})

ami.on('eventUnhold', data => {
  agents.unhold(data).then(data => sendSockets(data, true))
  .catch(err => { console.log('Error al mostrar UnHold :' + err) })
})

ami.on('eventQueueCallerJoin', data => {
  callWaiting.create(data).then(data => sendCallWaiting(data, 'AddCallWaiting'))
  .catch(err => { console.log('Error al insertar llamadas encoladas :' + err) })
})

ami.on('eventQueueCallerLeave', data => {
  callWaiting.delete(data).then(data => sendCallWaiting(data, 'RemoveCallWaiting'))
  .catch(err => { console.log('Error al eliminar llamadas encoladas :' + err) })
})

ami.on('eventAttendedTransfer', data => {
  // console.log(data)
})

function sendCallWaiting (data, nameEventEmit) {
  if (data) {
    console.log(data)
    iosocket.emit(nameEventEmit, { CallWaiting: data })
  }
}

function sendSockets (data, isPause) {
  if (data) {
    // console.log(isPause)
    // console.log(data)
    if (isPause) actionAmi.pauseQueue(data)
    else eventDetail.insertEvent(data)

    iosocket.emit('QueueMemberChange', { QueueMemberChange: data })
    iosocket.in('panelAgent:' + data.number_annexed).emit('statusAgent', {
      NameEvent: data.name_event,
      EventId: data.event_id
    })
  }
}

ami.on('eventAny', data => {
  // console.log(data)
})

// QueueCallerJoin : cuando un cliente se agrega a la cola
// QueueCallerLeave : cuando un cliente deja la cola o es contestada
// QueueMemberStatus : ver el estado del agente en la cola
// AgentConnect : Cuando un agente se conecta con un llamante de la cola
