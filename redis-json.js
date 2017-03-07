var flatten = require('flat')
var unflatten = require('flat').unflatten

var JSONStore = function (redis) {
  this.redis = redis

  return this
}

JSONStore.prototype.set = function (key, jsonObj, done) {
  var obj = flatten(jsonObj)
  var keyValArr = []

  keyValArr.push(key)

  for (var key in obj) {
    keyValArr.push(key)
    keyValArr.push(obj[key])
  }
  keyValArr.push(done)

  this.redis.hmset.apply(this.redis, keyValArr)
}

JSONStore.prototype.get = function (key, done) {
  this.redis.hgetall(key, (err, result) => {
    if (result) {
      done(null, unflatten(result))
    } else if (!err) {
      done(null, {})
    } else {
      done(err, null)
    }
  })
}

JSONStore.prototype.del = function (key, jsonObj, done) {
  var obj = flatten(jsonObj)
  var keyValArr = []

  keyValArr.push(key)

  for (var key in obj) {
    keyValArr.push(key)
    keyValArr.push(obj[key])
  }
  keyValArr.push(done)

  this.redis.hdel.apply(this.redis, keyValArr)
}

module.exports = JSONStore

