import ioSockets from '.././ioSockets'
import len from 'object-length'

const ioSocket = new ioSockets()

class EventsCallsOutbound {
	/**
   * Controlando llamadas Outbound, Ring Outbound
   */
	callsOutbound (data) {
		const preEventID = data.event_id_old
		const postEventID = data.event_id

		console.log(`Calls Outbound ----  Pre : ${preEventID} - Post : ${postEventID} `)
		console.log(data)

		const valuesPostEventID = ['20','21']
		const eventsToCallsOutbound = ['9','13','17','20','21','23','27','28','29']
		const eventsToCallsInbound = ['18','24']

		if (valuesPostEventID.includes(postEventID)) {
			/**
			 * Se evalua si el evento anterior se encontraba en estado ACD
			 */
			if (preEventID === '1') {
				/**
				 * Se procede a emitir el evento hacia el dashboard para eliminar a dicho usuario del Panel Others
				 */
				ioSocket.sendSocketOther(data, true, false, false)

				/**
				 * Se evalua si el evento posterior sera estado Ring Inbound Interno
				 */
				if (postEventID === '18') {
					/**
					 * Como dicho filtro se cumple se deduce se procede a emitir el evento hacia el dashboard
					 * para agregar a dicho usuario al Panel CallsInbound
					 */
					ioSocket.sendSocketInbound(data, false, false, true)
				} else {
					/**
					 * Se procede a emitir el evento hacia el dashboard para agregar a dicho usuario al Panel CallsOutbound
					 */
					ioSocket.sendSocketOutbound(data, false, false, true)
				}
			}

			if (eventsToCallsOutbound.includes(preEventID)) {
				console.log('bbbbbbbbbb')
				ioSocket.sendSocketOutbound(data, false, true, false)
			}
			if (eventsToCallsInbound.includes(preEventID)) ioSocket.sendSocketInbound(data, false, true, false)
		}
	}

	/**
   * Controlando el evento hangup
   */
	hangup (data) {
		if (len(data) > 0) {
			if (data.agent_status === "0") {
				ioSocket.sendSocketInbound(data, true, false, false)
				ioSocket.sendSocketOutbound(data, true, false, false)
				ioSocket.sendSocketOther(data, false, false, true)
				ioSocket.sendSocketsExtras(data, true, true)
			} else {
				ioSocket.sendSocketOutbound(data, false, true, false)
			}
		}
	}

	pruebas(data, event = false) {
		if (len(data) > 0) {
			console.log(data)
			let preEventID = data.event_id_old
			let postEventID = data.event_id
			let secondCall = false

			if (data.second_outbound_phone !== "" && event === "eventHold" && event === "eventUnhold") {
				preEventID = data.event_id
				postEventID = data.second_event_id
				secondCall = true
			}
			console.log(`${event} ----  Post : ${postEventID}  - Pre : ${preEventID}`)

			// Controlando llamadas Outbound, Ring Outbound, Hold Outbound
			if ((event === "eventNewstate" || event === "eventHold" || event === "eventUnhold") && (postEventID === "9" || postEventID === "13" || postEventID === "17" || postEventID === "21" || postEventID === "18" || postEventID === "19" || postEventID === "20" || postEventID === "23" || postEventID === "25" || postEventID === "28" || postEventID === "29")) {
				if (preEventID === "1") {
					ioSocket.sendSocketOther(data, true, false, false)
					if (postEventID === "18") {
						ioSocket.sendSocketInbound(data, false, false, true)
					} else {
						ioSocket.sendSocketOutbound(data, false, false, true)
					}
				}

				if (preEventID === "9" || preEventID === "13" || preEventID === "17" || preEventID === "21" || preEventID === "23" || preEventID === "20" || preEventID === "27" || preEventID === "28" || preEventID === "29") ioSocket.sendSocketOutbound(data, false, true, false)
				if (preEventID === "18" || preEventID === "24") ioSocket.sendSocketInbound(data, false, true, false)
				if (secondCall === false) {
					if (postEventID === "9" || postEventID === "13" || postEventID === "18" || postEventID === "21" || postEventID === "19") ioSocket.sendSocketsExtras(data, true, true)
					else ioSocket.sendSocketsExtras(data, false, true)
				}
			}

			// Controlando llamadas Ring Inbound y Inbound
			if ((event === "eventNewConnectedLine" || event === "eventAgentConnect" || event === "eventHold" || event === "eventUnhold") && (postEventID === "8" || postEventID === "12" || postEventID === "16" || postEventID === "19" || postEventID === "22" || postEventID === "25" || postEventID === "26")) {
				if (preEventID === "1") {
					ioSocket.sendSocketOther(data, true, false, false)
					ioSocket.sendSocketInbound(data, false, false, true)
				}
				if (preEventID === "8" || preEventID === "12" || preEventID === "16" || preEventID === "19" || preEventID === "22" || preEventID === "25" || preEventID === "26") ioSocket.sendSocketInbound(data, false, true, false)
				if (postEventID === "8" || postEventID === "12") ioSocket.sendSocketsExtras(data, true, true)
				else ioSocket.sendSocketsExtras(data, false, true)
			}

			// Controlando llamadas Ring Inbound y Inbound
			if (event === "eventBlindTransfer") {
				let dataLiberar = data.liberar
				if (dataLiberar) {
					ioSocket.sendSocketOther(dataLiberar, false, false, true)
					if (dataLiberar.event_id_old === "17") ioSocket.sendSocketOutbound(dataLiberar, true, false, false)
					else ioSocket.sendSocketInbound(dataLiberar, true, false, false)
					ioSocket.sendSocketsExtras(dataLiberar, true, true)
				}

				let dataAsignar = data.asignar
				if (dataAsignar) {
					ioSocket.sendSocketOther(dataAsignar, true, false, false)
					if (dataAsignar.event_id === "27") ioSocket.sendSocketOutbound(dataAsignar, false, false, true)
					else ioSocket.sendSocketInbound(dataAsignar, false, false, true)
					ioSocket.sendSocketsExtras(dataAsignar, true, true)
				}
			}
		}
	}
}

module.exports = EventsCallsOutbound
