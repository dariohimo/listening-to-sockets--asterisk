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

  socket.on('listOther', data => {
    agents.shows().then(data => data.forEach(agent => socket.emit('AddOther', agent)))
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
    agents.memberCreate(data).then(data => { iosocket.emit('AddOther', data) })
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
  agents.memberAdd(data).then(data => iosocket.emit('UpdateOther', data))
  .catch(err => console.log('Error adding agent on the dashboard :' + err))
})

/**
* [Capturar el evento Queue Member Removed que se produce en el servicio de asterisk]
*/
ami.on('eventQueueMemberRemoved', data => {
  agents.memberRemoved(data).then(data => iosocket.emit('RemoveOther', data))
  .catch(err => { console.log('Error removing agent on the dashboard :' + err) })
})

/**
* [Capturar el evento Queue Member Pause que se produce en el servicio de asterisk]
*/
ami.on('eventQueueMemberPause', data => {
  agents.memberPause(data).then(data => iosocket.emit('UpdateOther', data))
  .catch(err => { console.log('Error pausing agent on the dashboard :' + err) })
})

/**
* [Capturar el evento de timbrado de la llamada entrante que se produce en el servicio de asterisk]
*/
ami.on('eventNewConnectedLine', data => {
  agents.ringInbound(data).then(data => pruebas(data,'eventNewConnectedLine'))
  .catch(err => { console.log('Error al mostrar ring de entrante :' + err) })
})

/**
* [Capturar el evento Answer de la llamada entrante que se produce en el servicio de asterisk]
*/
ami.on('eventAgentConnect', data => {
  agents.answerInbound(data).then(data => pruebas(data,'eventAgentConnect'))
  .catch(err => { console.log('Error al capturar (answer) de la llamada entrante :' + err) })
})

/**
* [Capturar el evento de timbrado de la llamada saliente que se produce en el servicio de asterisk]
*/
ami.on('eventNewstate', data => {
  agents.ringAnswerOutbound(data).then(data => pruebas(data,'eventNewstate'))
  .catch(err => { console.log('Error al mostrar Ring o Answer de Llamada Outbound :' + err) })
})

/**
* [Capturar el evento de corte de llamada sea entrante y/o saliente que se produce en el servicio de asterisk]
*/
ami.on('eventHangup', data => {
  agents.hangup(data).then(data => pruebas(data, 'eventHangup'))
  .catch(err => { console.log('Error al cortar (hangup) llamadas salientes y/o entrantes :' + err) })
})

/**
* [Capturar el evento cuando se completa una transferencia ciega que se produce en el servicio de asterisk]
*/
ami.on('eventBlindTransfer', data => sendSockets(agents.transferUnattended(data), true))

ami.on('eventHold', data => {
  agents.hold(data).then(data => pruebas(data, 'eventHold'))
  .catch(err => { console.log('Error al mostrar Hold :' + err) })
})

ami.on('eventUnhold', data => {
  agents.unhold(data).then(data => pruebas(data, 'eventUnhold'))
  .catch(err => { console.log('Error al mostrar UnHold :' + err) })
})

ami.on('eventQueueCallerJoin', data => {
  callWaiting.create(data).then(data => iosocket.emit('AddCallWaiting', data))
  .catch(err => { console.log('Error al insertar llamadas encoladas :' + err) })
})

ami.on('eventQueueCallerLeave', data => {
  callWaiting.delete(data).then(data => iosocket.emit('RemoveCallWaiting', data))
  .catch(err => { console.log('Error al eliminar llamadas encoladas :' + err) })
})

ami.on('eventAttendedTransfer', data => {
  // console.log(data)
})

const pruebas = (dataAgent, event = false) => {
  let preEventID = dataAgent.event_id_old
  let postEventID = dataAgent.event_id
  
  // Controlando el Hangup 
  if (event === 'eventHangup') {
    console.log(dataAgent)
    console.log(`eventHangup ----  Post : ${postEventID}  - Pre : ${preEventID}`)
    sendSocketInbound(dataAgent, true, false, false)
    sendSocketOutbound(dataAgent, true, false, false)
    sendSocketOther(dataAgent, false, false, true)
    sendSocketsExtras(dataAgent, true, true)
  }

  // Controlando llamadas Outbound, Ring Outbound, Hold Outbound
  if ((event === 'eventNewstate' || event === 'eventHold' || event === 'eventUnhold') && (postEventID === '9' || postEventID === '13' || postEventID === '17')) {
    console.log(`eventNewstate ----  Post : ${postEventID}  - Pre : ${preEventID}`)
    if (preEventID === '1') {
      sendSocketOther(dataAgent, true, false, false)
      sendSocketOutbound(dataAgent, false, false, true)
    }
    if (preEventID === '9' || preEventID === '13' || preEventID === '17') sendSocketOutbound(dataAgent, false, true, false)
    if (postEventID === '9' || postEventID === '13' ) sendSocketsExtras(dataAgent, true, true) 
    else sendSocketsExtras(dataAgent, false, true) 
  }

  // Controlando llamadas Ring Inbound y Inbound
  if ((event === 'eventNewConnectedLine' || event === 'eventAgentConnect' || event === 'eventHold' || event === 'eventUnhold') && (postEventID === '8' || postEventID === '12' || postEventID === '16')) {
    console.log(`eventNewConnectedLine ----  Post : ${postEventID}  - Pre : ${preEventID}`)
    if (preEventID === '1') {
      sendSocketOther(dataAgent, true, false, false)
      sendSocketInbound(dataAgent, false, false, true)
    }
    if (preEventID === '8' || preEventID === '12' || preEventID === '16') sendSocketInbound(dataAgent, false, true, false)
    if (postEventID === '8' || postEventID === '12') sendSocketsExtras(dataAgent, true, true) 
    else sendSocketsExtras(dataAgent, false, true) 
  }
}

const sendSocketsExtras = (dataAgent, isPause, isDetailEvents) => {
  if (dataAgent) {
    if (isPause) actionAmi.pauseQueue(dataAgent)
    if (isDetailEvents) eventDetail.insertEvent(dataAgent)
    iosocket.in('panelAgent:' + dataAgent.number_annexed).emit('statusAgent', {
      NameEvent: dataAgent.name_event,
      EventId: dataAgent.event_id
    })
  }
}

const sendSocketOther = (dataAgent, isRemoveOther, isUpdateOther, isAddOther) => {
  if (isRemoveOther) iosocket.emit('RemoveOther', dataAgent)
  if (isUpdateOther) iosocket.emit('UpdateOther', dataAgent)
  if (isAddOther) iosocket.emit('AddOther', dataAgent)
}

const sendSocketOutbound = (dataAgent, isRemoveOutbound, isUpdateOutbound, isAddOutbound) => {
  if (isRemoveOutbound) iosocket.emit('RemoveOutbound', dataAgent)
  if (isUpdateOutbound) iosocket.emit('UpdateOutbound', dataAgent)
  if (isAddOutbound) iosocket.emit('AddOutbound', dataAgent)
}

const sendSocketInbound = (dataAgent, isRemoveInbound, isUpdateInbound, isAddInbound) => {
  if (isRemoveInbound) iosocket.emit('RemoveInbound', dataAgent)
  if (isUpdateInbound) iosocket.emit('UpdateInbound', dataAgent)
  if (isAddInbound) iosocket.emit('AddInbound', dataAgent)
}

ami.on('eventAny', data => {
  // console.log(data)
})

/*
const sendSockets = (dataAgent, isPause, isDetailEvents) => {
  if (dataAgent) {
    if (isPause) actionAmi.pauseQueue(dataAgent)
    if (isDetailEvents) eventDetail.insertEvent(dataAgent)

    iosocket.emit('UpdateOther', dataAgent)
    updateStatusEventFront(dataAgent)
  }
}

 */
// QueueCallerJoin : cuando un cliente se agrega a la cola
// QueueCallerLeave : cuando un cliente deja la cola o es contestada
// QueueMemberStatus : ver el estado del agente en la cola
// AgentConnect : Cuando un agente se conecta con un llamante de la cola
