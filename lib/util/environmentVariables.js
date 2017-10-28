'use strict'
import dotenv from 'dotenv'

dotenv.config({path: './config/.env_production'})

class EnvironmentVariables {
	envAsterisk (nameProyect) {

		let variables = ''

		switch(nameProyect) {
		case 'interbank':
			variables = {
				'asteriskHost' : process.env.interbankAsteriskHost,
				'asteriskPort' : process.env.interbankAsteriskPort,
				'asteriskUsername' : process.env.interbankAsteriskUsername,
				'asteriskSecret' : process.env.interbankAsteriskSecret
			}
			break
		case 'corporativo':
			variables = {
				'asteriskHost' : process.env.corporativoAsteriskHost,
				'asteriskPort' : process.env.corporativoAsteriskPort,
				'asteriskUsername' : process.env.corporativoAsteriskUsername,
				'asteriskSecret' : process.env.corporativoAsteriskSecret
			}
			break
		case 'factibilidad':
			variables = {
				'asteriskHost' : process.env.factibilidadAsteriskHost,
				'asteriskPort' : process.env.factibilidadAsteriskPort,
				'asteriskUsername' : process.env.factibilidadAsteriskUsername,
				'asteriskSecret' : process.env.factibilidadAsteriskSecret
			}
			break
		}



		return variables
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

	envSails (nameProyect) {
		return {
			'endpoint': process.env.endpoint,
			'port': this.getPortEndpoint(nameProyect),
			'apiDetailEvent': process.env.apiDetailEvent,
			'apiDetailDashboard': process.env.apiDetailDashboard,
			'apiDetailCallsWaiting': process.env.apiDetailCallsWaiting
		}
	}

	getPortEndpoint (nameProyect) {
		if (nameProyect === 'interbank') return process.env.portEndpointInterbank
		if (nameProyect === 'corporativo') return process.env.portEndpointCorporativo
		if (nameProyect === 'factibilidad') return process.env.portEndpointFactibilidad
	}

}

module.exports = EnvironmentVariables
