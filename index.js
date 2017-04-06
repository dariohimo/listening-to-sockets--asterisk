'use strict'
import http from 'http'
import express from 'express'
import socketio from 'socket.io'
import asteriskio from 'asterisk.io'
import socketredis from 'socket.io-redis'
import Agent from './lib/agents'

const agents = new Agent({
  endpoint: 'http://192.167.99.246:1338',
  nameapi: '/agent_online'
})

const redisHost = process.env.REDIS_HOST || '127.0.0.1'
const redisPort = process.env.REDIS_PORT || '6388'
const redisPassword = process.env.REDIS_PASSWORD || 'cosapida3slomasfacil'

/**
 * [description: Se instancia el servidor de express]
 *
 * @param app     [Nueva instancia express]
 * @param server  [Creacion Server HTTP]
 * @param port    [Se asigna el puerto de escucha de express]
 *
 */
const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 3000
server.listen(port, () => {
  console.log('Rest API para el dashboard se encuentra escuchando el puerto %d', port)
})

const io = socketio.listen(server)
io.adapter(socketredis({ host: redisHost, port: redisPort, password: redisPassword }))
var iosocket = io.sockets.on('connection', (socket) => {
  // console.log('Connection to client established ' + socket.id)

  socket.on('connect_dashboard', data => {
    agents.shows()
    .then(value => {
      value.forEach((item) => {
        socket.emit('QueueMemberAdded', {
          QueueMemberAdded: item
        })
      })
    })
    .catch(err => {
      console.log('Error al obtener agentes :' + err)
    })
  })

  socket.on('join', room => {
    console.log('Se esta creando la sala del anexo :' + room)
    socket.room = 'panel_agent:' + room
    socket.join('panel_agent:' + room)
  })
})

const ami = asteriskio.ami('192.167.99.224', '5038', 'admin', 'admin')
ami.on('error', err => {
  if (err.message === 'Authentication failed.') console.log('Error en la autenticacion del AMI')
})

/**
*
* [Capturar el evento Queue Member Added que se produce en el servicio de asterisk]
*
*/
ami.on('eventQueueMemberAdded', data => {
  agents.add(data)
  .then(value => {
    iosocket.emit('QueueMemberAdded', {
      QueueMemberAdded: value
    })
  })
  .catch(err => {
    console.log('Error adding agent on the dashboard :' + err)
  })
})

/**
*
* [Capturar el evento Queue Member Removed que se produce en el servicio de asterisk]
*
*/
ami.on('eventQueueMemberRemoved', data => {
  agents.del(data)
  .then(value => {
    iosocket.emit('QueueMemberRemoved', {
      NumberAnnexed: value
    })
  })
  .catch(err => {
    console.log('Error removing agent on the dashboard :' + err)
  })
})

/**
*
* [Capturar el evento Queue Member Pause que se produce en el servicio de asterisk]
*
*/
ami.on('eventQueueMemberPause', data => {
  agents.pause(data, (err, data) => {
    if (err) console.log('Error pausing agent on the dashboard :' + err)

    iosocket.emit('QueueMemberChange', {
      NumberAnnexed: data['number_annexed'],
      QueueMemberChange: data
    })
  })
})

/**
*
* [Capturar el evento de timbrado de la llamada entrante que se produce en el servicio de asterisk]
*
*/
ami.on('eventNewConnectedLine', data => {
  agents.ringInbound(data, (err, data) => {
    if (err) console.log('Error al mostrar ring de entrante :' + err)

    iosocket.emit('QueueMemberChange', {
      NumberAnnexed: data['number_annexed'],
      QueueMemberChange: data
    })

    iosocket.in('panel_agent:' + data['number_annexed']).emit('status_agent', {
      Name_Event: data['name_event'],
      Event_id: '8'
    })
  })
})

/**
*
* [Capturar el evento Answer de la llamada entrante que se produce en el servicio de asterisk]
*
*/
ami.on('eventAgentConnect', data => {
  agents.answerInbound(data, (err, data) => {
    if (err) console.log('Error al capturar (answer) de la llamada entrante :' + err)

    iosocket.emit('QueueMemberChange', {
      NumberAnnexed: data['number_annexed'],
      QueueMemberChange: data
    })

    iosocket.in('panel_agent:' + data['number_annexed']).emit('status_agent', {
      Name_Event: 'Inbound',
      Event_id: '8'
    })
  })
})

/**
*
* [Capturar el evento de la llamada saliente que se produce en el servicio de asterisk]
*
*/
ami.on('eventNewstate', data => {
  agents.ringOutbound(data, (err, data) => {
    if (err) console.log('Error al mostrar ring de salientes :' + err)

    iosocket.emit('QueueMemberChange', {
      NumberAnnexed: data['number_annexed'],
      QueueMemberChange: data
    })

    iosocket.in('panel_agent:' + data['number_annexed']).emit('status_agent', {
      Name_Event: data['name_event'],
      Event_id: '9'
    })
  })
})

/**
*
* [Capturar el evento de corte de llamada sea entrante y/o saliente que se produce en el servicio de asterisk]
*
*/
ami.on('eventHangup', data => {
  console.log(data)

  agents.hangup(data, (err, data) => {
    if (err) console.log('Error al cortar (hangup) llamadas salientes y/o entrantes :' + err)

    iosocket.emit('QueueMemberChange', {
      NumberAnnexed: data['number_annexed'],
      QueueMemberChange: data
    })

    iosocket.in('panel_agent:' + data['number_annexed']).emit('status_agent', {
      Name_Event: 'ACD',
      Event_id: '1'
    })
  })
})

/**
*
* [Capturar el evento cuando se completa una transferencia ciega que se produce en el servicio de asterisk]
*
*/
ami.on('eventBlindTransfer', data => {
  agents.transferUnattended(data, (err, data) => {
    if (err) console.log('Error al cortar (hangup) llamadas salientes y/o entrantes :' + err)

    iosocket.emit('QueueMemberChange', {
      NumberAnnexed: data['number_annexed'],
      QueueMemberChange: data
    })

    iosocket.in('panel_agent:' + data['number_annexed']).emit('status_agent', {
      Name_Event: 'ACD',
      Event_id: '1'
    })
  })
})

ami.on('eventAny', data => {
  // console.log(data)
})

ami.on('eventHold', data => {
  // console.log(data)
})

ami.on('eventUnhold', data => {
  // console.log(data)
})

ami.on('eventAttendedTransfer', data => {
  // console.log(data)
})

// QueueCallerJoin : cuando un cliente se agrega a la cola
// QueueCallerLeave : cuando un cliente deja la cola o es contestada
// QueueMemberStatus : ver el estado del agente en la cola
// AgentConnect : Cuando un agente se conecta con un llamante de la cola
