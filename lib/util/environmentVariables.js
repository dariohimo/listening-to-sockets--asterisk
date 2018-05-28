'use strict'

class EnvironmentVariables {
	envAsterisk () {
		return {
				'asteriskHost' : process.env.asteriskHost,
				'asteriskPort' : process.env.asteriskPort,
				'asteriskUsername' : process.env.asteriskUsername,
				'asteriskSecret' : process.env.asteriskSecret
			}
	}

	envRedis () {
		return {
			'redisHost' : process.env.redisHost,
			'redisPort' : process.env.redisPort,
			'redisSecret' : process.env.redisSecret
		}
	}

	envExpress () {
		return {
			'expressPort': process.env.expressPort
		}
	}

	envNameProyect() {
		return {
			'nameProyect': process.env.nameProyect
		}
	}

	envSails () {
		return {
			'endpoint': process.env.endpoint,
			'port': process.env.portEndpoint,
			'apiDetailEvent': process.env.apiDetailEvent,
			'apiDetailDashboard': process.env.apiDetailDashboard,
			'apiDetailCallsWaiting': process.env.apiDetailCallsWaiting
		}
	}
}

module.exports = EnvironmentVariables
