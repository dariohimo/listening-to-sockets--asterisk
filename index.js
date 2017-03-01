const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const asteriskio = require('asterisk.io')
const socketredis = require('socket.io-redis')

var agent = require('./agents')

/**
 * [description: Se realiza la conexion con el servicio de redis, el cual almacenara los datos para el dashboard de las calls inbound y outbound]
 *
 * @param redis_port      [El puerto de conexion con redis]
 * @param redis_host      [La ip en donde se encuentra el servicio de redis]
 * @param redis_password  [El puerto de conexion con redis]
 * @param rediscli        [Crear la instancia con redis con las parametros ya descritos]
 *
 */
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

/**
 * [description: La ruta estatica (/) la cual devolvera un status code 200 (OK)]
 *
 * @param  req        Peticion Request de HTPP
 * @param  res        Peticion Response de HTTP
 * @return            Retorna el status code 200 (OK)
 *
 */
app.get('/', (req, res) => {
  res.status(200).json('Hola Mundo')
})

/**
 * [io description]
 * @type {[type]}
 */
const io = socketio.listen(server)
io.adapter(socketredis({ host: redisHost, port: redisPort, password: redisPassword }))
io.sockets.on('connection', (socket) => {
  var ami = null
  ami = asteriskio.ami('192.167.99.224', '5038', 'admin', 'admin')
  ami.on('error', (err) => {
    console.log('Error al conectar a ami del asterisk  :' + err)
  })

  /**
   * [Captura el evento connect dashboard, sirve para listar la lista de agentes conectados
   * y el status de su llamada entrante o saliente]
   *
   * @return {ListAgents} [Retorna el HAS de la lista de agentes]
   */
  socket.on('connect_dashboard', (data) => {
    agent.get('agents', (err, data) => {
      if (err) {
        console.log('Error al obtener agentes de redis  :' + err)
      }

      // Emite la lista de agentes conectados al asterisk
      socket.emit('connect_dashboard', {
        ListAgents: data
      })
    })
  })

  /**
   *
   * [Capturar eventos Queue Member Added que se produce en el servicio de asterisk]
   *
   */
  ami.on('eventQueueMemberAdded', (data) => {
    let agents = getAgentStructure(data, 'eventQueueMemberAdded')
    agent.set('agents', agents, (err, data) => {
      if (err) {
        console.log('Error al guardar agentes de redis  :' + err)
      }

      socket.emit('QueueMemberAdded', {
        QueueMemberAdded: agents
      })
    })
  })

  /**
   *
   * [Capturar eventos Queue Member Removed que se produce en el servicio de asterisk]
   *
   */
  ami.on('eventQueueMemberRemoved', (data) => {
    let agents = getAgentStructure(data, 'eventQueueMemberRemoved')
    let annexed = getAgentAnnexed(data, 'eventQueueMemberRemoved')

    agent.del('agents', agents, (err, data) => {
      if (err) {
        console.log('Error al borrar agentes de redis  :' + err)
      }

      socket.emit('QueueMemberRemoved', {
        QueueMemberRemoved: annexed
      })
    })
  })
})

function getAgentStructure (data, event) {
  let datos = (event, data)

  let agents = {}
  let annexed = datos['Interface']
  agents[annexed] = {
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
  }

  return agents
}

function getAgentAnnexed (data, event) {
  let datos = (event, data)
  let annexed = datos['Interface']

  return annexed
}

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
//  ami.on('eventQueueMemberPause', (data) => {
//    datos = ('eventQueueMemberPause', data)
//    mostrar_log('Queue Pausa', datos['MemberName'])
//
//    socket.emit('QueueMemberPause', {
//      QueueMemberPause: datos['MemberName']
//    })
//  })
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
