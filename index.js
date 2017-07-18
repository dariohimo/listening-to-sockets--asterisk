'use strict'
import http from 'http'
import pmx from 'pmx'
import express from 'express'
import socketio from 'socket.io'
import asteriskio from 'asterisk.io'
import socketredis from 'socket.io-redis'
import AmiAction from './lib/amiActions'
import DetailDashboard from './lib/detailDashboard'
import DetailEvents from './lib/detailEvents'
import DetailCallsWaiting from './lib/detailCallsWaiting'

pmx.init({
  http: true, // HTTP routes logging (default: true)
  ignore_routes: [/socket\.io/, /notFound/], // Ignore http routes with this pattern (Default: [])
  errors: true, // Exceptions logging (default: true)
  custom_probes: true, // Auto expose JS Loop Latency and HTTP req/s as custom metrics
  network: true, // Network monitoring at the application level
  ports: true  // Shows which ports your app is listening on (default: false)
})

const nameProyect = process.env.nameProyect

const redisHost = process.env.redisHost
const redisPort = process.env.redisPort
const redisPassword = process.env.redisSecret

const asteriskHost = process.env.asteriskHost
const asteriskPort = process.env.asteriskPort
const asteriskUsername = process.env.asteriskUsername
const asteriskSecret = process.env.asteriskSecret

const detailDashboard = new DetailDashboard()
const detailEvent = new DetailEvents()
const detailCallsWaiting = new DetailCallsWaiting()
const actionAmi = new AmiAction({ host: asteriskHost, port: asteriskPort, username: asteriskUsername, secret: asteriskSecret })

const app = express()
const server = http.createServer(app)
const port = process.env.expressPort
server.listen(port, () => console.log('Rest API para el dashboard se encuentra escuchando el puerto %d', port))

const io = socketio.listen(server)
io.adapter(socketredis({ host: redisHost, port: redisPort, password: redisPassword }))
var iosocket = io.sockets.on('connection', (socket) => {
  console.log('Connection to client established ' + socket.id)

  socket.on('listDataDashboard', data => {
    detailDashboard.shows().then(data => {
      data.forEach(agent => {
        let eventID = agent.event_id
        if (eventID === '8' || eventID === '12' || eventID === '16' || eventID === '19' || eventID === '18' || eventID === '22' || eventID === '25' || eventID === '24' || eventID === '26') socket.emit('AddInbound', agent)
        else if (eventID === '9' || eventID === '13' || eventID === '17' || eventID === '20' || eventID === '21' || eventID === '23' || eventID === '27' || eventID === '28' || eventID === '29') socket.emit('AddOutbound', agent)
        else socket.emit('AddOther', agent)
      })
    })
    .catch(err => handlerError('Error al obtener agentes', err))
  })

  socket.on('createUserDashboard', data => {
    createRoom(socket, data)
    pruebas(data, 'createUserDashboard')
  })

  socket.on('createRoomDashboard', data => {
    createRoomDashboard(socket, data)
  })
  socket.on('createRoom', data => createRoom(socket, data))
  socket.on('updateDataDashboard', data => pruebas(data, 'updateDashboard'))
  socket.on('disconnect', function () {
    // sockets[socket.id].disconnect()
    socket.disconnect()
  })
})

const createRoom = (socket, data) => {
  console.log('Creando Sala del userID : ' + data.agent_user_id)
  socket.room = 'panelAgent:' + data.agent_user_id
  socket.join('panelAgent:' + data.agent_user_id)
}

const createRoomDashboard = (socket, data) => {
  console.log('Creando Sala para el Dashboard del proyecto : ' + data.nameProyect)
  socket.room = 'dashboard:' + data.nameProyect
  socket.join('dashboard:' + data.nameProyect)
}

const ami = asteriskio.ami(asteriskHost, asteriskPort, asteriskUsername, asteriskSecret)
ami.on('error', err => {
  if (err.message === 'Authentication failed.') console.log('Error en la autenticacion del AMI')
})

/* [Capturar el evento Queue Member Added que se produce en el servicio de asterisk] */
ami.on('eventQueueMemberAdded', data => {
  detailDashboard.memberAdd(data).then(data => sendEmitDashboard('UpdateOther', data))
  .catch(err => handlerError('Error adding agent on the dashboard', err))
})

/* [Capturar el evento Queue Member Pause que se produce en el servicio de asterisk] */
ami.on('eventQueueMemberPause', data => {
  const datos = ('memberPause', data)
  let agentStatus = ''

  if (datos['Interface'] !== '') agentStatus = datos['Paused']
  detailDashboard.memberPause(data).then(data => {
    data.agent_status = agentStatus
    sendEmitDashboard('UpdateOther', data)
    sendSocketsExtras(data, false, false)
  })
  .catch(err => handlerError('Error pausing agent on the dashboard', err))
})

/* [Capturar el evento de timbrado de la llamada entrante que se produce en el servicio de asterisk] */
ami.on('eventNewConnectedLine', data => {
  detailDashboard.ringInbound(data).then(data => pruebas(data, 'eventNewConnectedLine'))
  .catch(err => handlerError('Error al mostrar ring de entrante', err))
})

/* [Capturar el evento Answer de la llamada entrante que se produce en el servicio de asterisk] */
ami.on('eventAgentConnect', data => {
  detailDashboard.answerInbound(data).then(data => pruebas(data, 'eventAgentConnect'))
  .catch(err => handlerError('Error al capturar (answer) de la llamada entrante', err))
})

/* [Capturar el evento de timbrado de la llamada saliente que se produce en el servicio de asterisk] */
ami.on('eventNewstate', data => {
  detailDashboard.ringAnswerOutbound(data).then(data => pruebas(data, 'eventNewstate'))
  .catch(err => handlerError('Error al mostrar Ring o Answer de Llamada Outbound', err))
})

/* [Capturar el evento de corte de llamada sea entrante y/o saliente que se produce en el servicio de asterisk] */
ami.on('eventHangup', data => {
  detailDashboard.hangup(data).then(data => pruebas(data, 'eventHangup'))
  .catch(err => handlerError('Error al cortar (hangup) llamadas salientes y/o entrantes', err))
})

/* [Capturar el evento cuando se completa una transferencia ciega que se produce en el servicio de asterisk] */
ami.on('eventBlindTransfer', data => {
  detailDashboard.transferUnattended(data).then(data => pruebas(data, 'eventBlindTransfer'))
  .catch(err => handlerError('Error al realizar transferencias ciegas', err))
})

ami.on('eventAttendedTransfer', data => {
  /* detailDashboard.attendedTransfer(data).then(data => pruebas(data, 'eventAttendedTransfer'))
  .catch(err => handlerError('Error al realizar transferencias atendida', err)) */
})

ami.on('eventHold', data => {
  detailDashboard.hold(data).then(data => pruebas(data, 'eventHold'))
  .catch(err => handlerError('Error al mostrar Hold', err))
})

ami.on('eventUnhold', data => {
  detailDashboard.unhold(data).then(data => pruebas(data, 'eventUnhold'))
  .catch(err => handlerError('Error al mostrar UnHold', err))
})

ami.on('eventQueueCallerJoin', data => {
  detailCallsWaiting.create(data).then(data => sendEmitDashboard('AddCallWaiting', data))
  .catch(err => handlerError('Error al insertar llamadas encoladas', err))
})

ami.on('eventQueueCallerLeave', data => {
  detailCallsWaiting.delete(data).then(data => sendEmitDashboard('RemoveCallWaiting', data))
  .catch(err => handlerError('Error al eliminar llamadas encoladas', err))
})

const handlerError = (msj, err) => console.log(`${msj} : ${err}`)

const pruebas = (dataAgent, event = false) => {
  let preEventID = dataAgent.event_id_old
  let postEventID = dataAgent.event_id
  let secondCall = false

  if (dataAgent.second_outbound_phone !== '' && event === 'eventHold' && event === 'eventUnhold') {
    preEventID = dataAgent.event_id
    postEventID = dataAgent.second_event_id
    secondCall = true
  }
  console.log(`${event} ----  Post : ${postEventID}  - Pre : ${preEventID}`)

  // Controlando cuando el agente se conecta al sistema.
  if (event === 'createUserDashboard') {
    sendSocketOther(dataAgent, false, false, true)
    sendSocketsExtras(dataAgent, true, false)
  }

  // Controlando se cambio de estados desde el frontend
  if (event === 'updateDashboard') {
    if (postEventID === '15') sendSocketOther(dataAgent, true, false, false)
    else sendSocketOther(dataAgent, false, true, false)
  }

  // Controlando el Hangup
  if (event === 'eventHangup') {
    if (dataAgent.agent_status === '0') {
      sendSocketInbound(dataAgent, true, false, false)
      sendSocketOutbound(dataAgent, true, false, false)
      sendSocketOther(dataAgent, false, false, true)
      sendSocketsExtras(dataAgent, true, true)
    } else {
      sendSocketOutbound(dataAgent, false, true, false)
    }
  }

  // Controlando llamadas Outbound, Ring Outbound, Hold Outbound
  if ((event === 'eventNewstate' || event === 'eventHold' || event === 'eventUnhold') && (postEventID === '9' || postEventID === '13' || postEventID === '17' || postEventID === '21' || postEventID === '18' || postEventID === '19' || postEventID === '20' || postEventID === '23' || postEventID === '25' || postEventID === '28' || postEventID === '29')) {
    if (preEventID === '1') {
      sendSocketOther(dataAgent, true, false, false)
      if (postEventID === '18') {
        sendSocketInbound(dataAgent, false, false, true)
      } else {
        sendSocketOutbound(dataAgent, false, false, true)
      }
    }

    if (preEventID === '9' || preEventID === '13' || preEventID === '17' || preEventID === '21' || preEventID === '23' || preEventID === '20' || preEventID === '27' || preEventID === '28' || preEventID === '29') sendSocketOutbound(dataAgent, false, true, false)
    if (preEventID === '18' || preEventID === '24') sendSocketInbound(dataAgent, false, true, false)
    if (secondCall === false) {
      if (postEventID === '9' || postEventID === '13' || postEventID === '18' || postEventID === '21' || postEventID === '19') sendSocketsExtras(dataAgent, true, true)
      else sendSocketsExtras(dataAgent, false, true)
    }
  }

  // Controlando llamadas Ring Inbound y Inbound
  if ((event === 'eventNewConnectedLine' || event === 'eventAgentConnect' || event === 'eventHold' || event === 'eventUnhold') && (postEventID === '8' || postEventID === '12' || postEventID === '16' || postEventID === '19' || postEventID === '22' || postEventID === '25' || postEventID === '26')) {
    if (preEventID === '1') {
      sendSocketOther(dataAgent, true, false, false)
      sendSocketInbound(dataAgent, false, false, true)
    }
    if (preEventID === '8' || preEventID === '12' || preEventID === '16' || preEventID === '19' || preEventID === '22' || preEventID === '25' || preEventID === '26') sendSocketInbound(dataAgent, false, true, false)
    if (postEventID === '8' || postEventID === '12') sendSocketsExtras(dataAgent, true, true)
    else sendSocketsExtras(dataAgent, false, true)
  }

  // Controlando llamadas Ring Inbound y Inbound
  if (event === 'eventBlindTransfer') {
    let dataLiberar = dataAgent.liberar
    if (dataLiberar) {
      sendSocketOther(dataLiberar, false, false, true)
      if (dataLiberar.event_id_old === '17') sendSocketOutbound(dataLiberar, true, false, false)
      else sendSocketInbound(dataLiberar, true, false, false)
      sendSocketsExtras(dataLiberar, true, true)
    }

    let dataAsignar = dataAgent.asignar
    if (dataAsignar) {
      sendSocketOther(dataAsignar, true, false, false)
      if (dataAsignar.event_id === '27') sendSocketOutbound(dataAsignar, false, false, true)
      else sendSocketInbound(dataAsignar, false, false, true)
      sendSocketsExtras(dataAsignar, true, true)
    }
  }
}

const sendSocketsExtras = (dataAgent, isPause, isDetailEvents) => {
  if (dataAgent) {
    if (isPause) actionAmi.pauseQueue(dataAgent)
    if (isDetailEvents) detailEvent.insertEvent(dataAgent)
    console.log('Emitiendo Socket a FrontEnd del userID : + ' + dataAgent.agent_user_id)
    iosocket.in('panelAgent:' + dataAgent.agent_user_id).emit('statusAgent', {
      statusAddAgentDashboard: true,
      eventName: dataAgent.event_name,
      eventId: dataAgent.event_id,
      annexedStatusAsterisk: dataAgent.agent_status
    })
  }
}

const sendEmitDashboard = (nameEmit, dataAgent) => {
  if (dataAgent) {
    iosocket.in('dashboard:' + nameProyect).emit(nameEmit, dataAgent)
  }
}

const sendSocketOther = (dataAgent, isRemoveOther, isUpdateOther, isAddOther) => {
  if (isRemoveOther) sendEmitDashboard('RemoveOther', dataAgent)
  if (isUpdateOther) sendEmitDashboard('UpdateOther', dataAgent)
  if (isAddOther) sendEmitDashboard('AddOther', dataAgent)
}

const sendSocketOutbound = (dataAgent, isRemoveOutbound, isUpdateOutbound, isAddOutbound) => {
  if (isRemoveOutbound) sendEmitDashboard('RemoveOutbound', dataAgent)
  if (isUpdateOutbound) sendEmitDashboard('UpdateOutbound', dataAgent)
  if (isAddOutbound) sendEmitDashboard('AddOutbound', dataAgent)
}

const sendSocketInbound = (dataAgent, isRemoveInbound, isUpdateInbound, isAddInbound) => {
  if (isRemoveInbound) sendEmitDashboard('RemoveInbound', dataAgent)
  if (isUpdateInbound) sendEmitDashboard('UpdateInbound', dataAgent)
  if (isAddInbound) sendEmitDashboard('AddInbound', dataAgent)
}

ami.on('eventAny', data => {
  // console.log(data)
})
