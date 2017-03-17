const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const asteriskio = require('asterisk.io')
const socketredis = require('socket.io-redis')

const Agent = require('./lib/agents')
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
  console.log('Server listening at port %d', port)
})

const io = socketio.listen(server)
io.adapter(socketredis({ host: redisHost, port: redisPort, password: redisPassword }))
var iosocket = io.sockets.on('connection', (socket) => {
  socket.on('connect_dashboard', (data) => {
    agents.shows((err, data) => {
      if (err) console.log('Error al obtener agentes de redis  :' + err)

      for (let key in data) {
        socket.emit('QueueMemberAdded', {
          QueueMemberAdded: data[key]
        })
      }
    })
  })
})

const ami = asteriskio.ami('192.167.99.224', '5038', 'admin', 'admin')

ami.on('error', err => {
  if (err.message === 'Authentication failed.') console.log('Error en la autenticacion del AMI')
})

/**
*
* [Capturar eventos Queue Member Added que se produce en el servicio de asterisk]
*
*/
ami.on('eventQueueMemberAdded', (data) => {
  agents.add(data, (err, data) => {
    if (err) console.log('Error adding agent on the dashboard :' + err)

    iosocket.emit('QueueMemberAdded', {
      QueueMemberAdded: data
    })
  })
})

/**
*
* [Capturar eventos Queue Member Removed que se produce en el servicio de asterisk]
*
*/
ami.on('eventQueueMemberRemoved', (data) => {
  agents.del(data, (err, data) => {
    if (err) console.log('Error removing agent on the dashboard :' + err)

    iosocket.emit('QueueMemberRemoved', {
      NumberAnnexed: data
    })
  })
})

/**
*
* [Capturar eventos Queue Member Pause que se produce en el servicio de asterisk]
*
*/
ami.on('eventQueueMemberPause', (data) => {
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
* [Capturar eventos Queue New State que se produce en el servicio de asterisk]
*
*/
ami.on('eventNewstate', (data) => {
  agents.ring(data, (err, data) => {
    if (err) console.log('Error al mostrar ring de salientes :' + err)

    iosocket.emit('QueueMemberChange', {
      NumberAnnexed: data['number_annexed'],
      QueueMemberChange: data
    })
  })
})

ami.on('eventHangup', (data) => {
  agents.hangup(data, (err, data) => {
    if (err) console.log('Error al cortar (hangup) llamadas salientes :' + err)

    iosocket.emit('QueueMemberChange', {
      NumberAnnexed: data['number_annexed'],
      QueueMemberChange: data
    })
  })
})

ami.on('eventNewConnectedLine', (data) => {
  // let datos = ('eventNewConnectedLine', data)
  /*
  agents.set('agents', agents, (err, data) => {
    if (err) {
      console.log('Error pausing agent on the :' + err)
    }

    socket.emit('NewConnectedLine', {
      NewConnectedLine: datos['MemberName']
    })

  })
  */
})



/*
function getAgentStructureRinging (data, event) {
  let datos = (event, data)

  let agents = {}
  let annexed = 'SIP/' + datos['CallerIDNum']

  if (datos['ChannelStateDesc'] === 'Ringing') {
    let phoneNumberInbound = datos['ConnectedLineNum']
    if (datos['ConnectedLineName'] === 'unknown') {
      phoneNumberInbound = datos['ConnectedLineNum'] + ' | ' + datos['ConnectedLineName']
    }

    agents[annexed] = {
      'name_queue_inbound': datos['Exten'],
      'phone_number_inbound': phoneNumberInbound
    }
  }

  return agents
}

// Segundo Array - Esto sirve para mostrar los anexos
     // que estan timbrando
     // { Event: 'NewConnectedLine',
     //  ChannelStateDesc: 'Ringing',
     //  CallerIDNum: '227',
     //  ConnectedLineNum: '963925318',
     //  ConnectedLineName: '<unknown>',
     //  Context: 'nivel-agentes',
     //  Exten: 'HD_CE_Internet',
     // }
     //
/*
'number_annexed': datos['Interface'],
    'name_agent': datos['MemberName'],
    'name_event': 'Conectado',
    'name_queue_inbound': '',
    'phone_number_inbound': '',
    'star_call_inbound': '',
    'total_calls': '0',
    'name_queue': datos['Queue'],
    'status_pause': datos['Paused'],
    'penalty_agent': datos['Penalty'],
    'ringinuse_agent': datos['Ringinuse']
*/

//    var list_agents = {}
//    var number_annexed = datos['Interface']
//    list_agents[number_annexed] = {
//      'number_annexed': datos['Interface'],
//      'name_agent': datos['MemberName'],
//      'name_event': 'Conectado',
//      'name_queue_inbound': '',
//      'phone_number_inbound': '',
//      'star_call_inbound': '',
//      'total_calls': '0',
//      'name_queue': datos['Queue'],
//      'status_pause': datos['Paused'],
//      'penalty_agent': datos['Penalty'],
//      'ringinuse_agent': datos['Ringinuse']
//    }
//
//    json.set('agents', list_agents, (err, result) => {
//      if (err) {
//        return res.sendStatus(500).json(err)
//      }
//
//      socket.emit('QueueMemberAdded', {
//        QueueMemberAdded: list_agents
//      })
//    })

  // socket.on('new_message', function (data) {
    // console.log(data)
    // io.sockets.emit('new_message', {
      // name: data.name,
      // email: data.email,
      // subject: data.subject,
      // created_at: data.created_at,
      // id: data.id
    // })
  // })

//
//
//  ami.on('eventQueueCallerAbandon', (data) => {
//    datos = ('eventQueueCallerAbandon', data)
//    mostrar_log('Llamadas abandonadas', datos['MemberName'])
//
//    socket.emit('QueueCallerAbandon', {
//      QueueCallerAbandon: datos['MemberName']
//    })
//
//    // CallerIDNum: '963925318',
//    // CallerIDName: '<unknown>',
//    // ConnectedLineNum: '227',
//    // Queue: 'HD_CE_Internet',
//    // HoldTime: '28'
//  })
//
//  ami.on('eventNewConnectedLine', (data) => {
//    datos = ('eventNewConnectedLine', data)
//    mostrar_log('Anexos que estan timbrando', datos['MemberName'])
//
//    socket.emit('NewConnectedLine', {
//      NewConnectedLine: datos['MemberName']
//    })
//    // Segundo Array - Esto sirve para mostrar los anexos
//    // que estan timbrando
//    // { Event: 'NewConnectedLine',
//
//    //  ChannelStateDesc: 'Ringing',
//    //  CallerIDNum: '227',
//    //  ConnectedLineNum: '963925318',
//    //  ConnectedLineName: '<unknown>',
//    //  Context: 'nivel-agentes',
//    //  Exten: 'HD_CE_Internet',
//    // }
//  })
//
//  ami.on('eventHangup', (data) => {
//    datos = ('eventHangup', data)
//    mostrar_log('Llamadas terminadas', datos['MemberName'])
//
//    socket.emit('Hangup', {
//      Hangup: datos['MemberName']
//    })
//    // Es el primer array
//    // CallerIDNum: '227'
//  })
