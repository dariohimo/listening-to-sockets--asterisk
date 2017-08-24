import dotenv from 'dotenv'

dotenv.config()

/*
 
 import http from 'http'
 import express from 'express'
 import AmiClient from 'asterisk-ami-client'
 
 
console.log('Bienvenido Alan Cornejo Salazar')
const asteriskHost = process.env.asteriskHost
const asteriskPort = process.env.asteriskPort
const asteriskUsername = process.env.asteriskUsername
const asteriskSecret = process.env.asteriskSecret

const app = express()
const server = http.createServer(app)
const port = process.env.expressPort


server.listen(port, () => console.log('Rest API para el dashboard se encuentra escuchando el puerto '+ port))


let client = new AmiClient({
	reconnect: true,
	keepAlive: true,
	emitEventsByTypes: true,
	emitResponsesById: true
})

client.connect(asteriskUsername, asteriskSecret, {host: asteriskHost, port: asteriskPort})
.then(() => {
	
	client
	.on('connect', () => console.log('connect'))
	.on('event', event => console.log(event))
	.on('data', chunk => console.log(chunk))
	.on('response', response => console.log(response))
	.on('disconnect', () => console.log('disconnect'))
	.on('reconnection', () => console.log('reconnection'))
	.on('internalError', error => console.log(error))
	.action({
		Action: 'Ping'
	});
	
})
.catch(error => console.log(error));

*/