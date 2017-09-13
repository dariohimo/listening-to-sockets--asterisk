'use strict'
import dotenv from 'dotenv'

dotenv.config({path: './config/.env_production'})

class getEnv {
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
	
	envSails () {
		return {
			'endpoint': process.env.endpoint,
			'apiDetailEvent': process.env.apiDetailEvent,
			'apiDetailDashboard': process.env.apiDetailDashboard,
			'apiDetailCallsWaiting': process.env.apiDetailCallsWaiting
		}
	}

}

module.exports = getEnv