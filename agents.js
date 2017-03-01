const redis = require('redis')
const redisjson = require('./redis-json')

/**
 * [description: Se realiza la conexion con el servicio de redis, el cual almacenara los datos para el dashboard de las calls inbound y outbound]
 *
 * @param redis_port      [El puerto de conexion con redis]
 * @param redis_host      [La ip en donde se encuentra el servicio de redis]
 * @param redis_password  [El puerto de conexion con redis]
 * @param rediscli        [Crear la instancia con redis con las parametros ya descritos]
 *
 */
const redis_host = process.env.REDIS_HOST || '127.0.0.1'
const redis_port = process.env.REDIS_PORT || '6388'
const redis_password = process.env.REDIS_PASSWORD || 'cosapida3slomasfacil'
const rediscli = redis.createClient(redis_port, redis_host, { password: redis_password })
rediscli.on('connect', function () {
  console.log('connected')
})

const json = new redisjson(rediscli)

function setData (key, data, callback) {
  json.set(key, data, callback)
}

// Se obtiene la lista de usuarios se usa la libreria json para obtener los datos parseados
function getData (key, callback) {
  json.get(key, callback)
}

function delData (key, data, callback) {
  json.del(key, data, callback)
}

exports.set = setData
exports.get = getData
exports.del = delData
