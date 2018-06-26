import ioSockets from './../util/ioSockets'
import len from 'object-length'

const ioSocket = new ioSockets()

class EventsCalls {
	/**
    * Controlando llamadas Outbound, Ring Outbound
    **/
	callsOutbound (data) {
		const preEventID = data.event_id_old
		const postEventID = data.event_id

		const valuesPostEventID = [9,13,18,19,20,21,25,29]
		const eventsToCallsOutbound = [9,13,17,20,21,23,27,28,29]
		const eventsToCallsInbound = [18,24]
		const eventsToPauseAsterisk = [9,13,18,19,21]

		let isActionPause = false

		if (valuesPostEventID.includes(postEventID)) {
			/**
			* Se evalua si el evento anterior se encontraba en estado ACD
			**/
			if (preEventID === 1 || preEventID === 7) {
				/**
				* Se procede a emitir el evento hacia el dashboard para eliminar a dicho usuario del Panel Others
				**/
				ioSocket.sendSocketOther(data, true, false, false)

				/**
				* Se evalua si el evento posterior sera estado Ring Inbound Interno
				**/
				if (postEventID === 18) {
					/**
					* Con dicho filtro se procede a emitir el evento hacia el dashboard
					* para agregar a dicho usuario al Panel CallsInbound
					**/
					ioSocket.sendSocketInbound(data, false, false, true)
				} else {
					/**
					* Se procede a emitir el evento hacia el dashboard para agregar a dicho usuario al Panel CallsOutbound
					**/
					ioSocket.sendSocketOutbound(data, false, false, true)
				}
			}


			/**
			* [Emite el evento hacia el dashboard para actualizar las llamadas outbound, validando si es una llamada saliente (transferida)]
			**/
			if ((valuesPostEventID.includes(preEventID) && valuesPostEventID.includes(postEventID))) {
				ioSocket.sendSocketOutbound(data, false, true, false)
			}
			if (eventsToCallsOutbound.includes(preEventID)) ioSocket.sendSocketOutbound(data, false, true, false)
			if (eventsToCallsInbound.includes(preEventID)) ioSocket.sendSocketInbound(data, false, true, false)
			if (eventsToPauseAsterisk.includes(postEventID)) isActionPause = true
			ioSocket.sendSocketsExtras(data, isActionPause, true)
		}
	}

	/**
    * Controlando el evento Hold
    **/
	hold (data) {
		if (len(data) > 0) {
			const preEventID = (data.second_status_call === 1) ? data.event_id : data.event_id_old
			const eventsToCallsOutbound = [9,20,29]
			const eventsToCallsInbound = [8,19,25]
			if (eventsToCallsOutbound.includes(preEventID)) ioSocket.sendSocketOutbound(data, false, true, false)
			if (eventsToCallsInbound.includes(preEventID)) ioSocket.sendSocketInbound(data, false, true, false)
			ioSocket.sendSocketsExtras(data, false, true)
		}
	}

	/**
    * Controlando el evento unHold
    **/
	unHold (data) {
		if (len(data) > 0) {
			const preEventID = (data.second_status_call === 1) ? data.event_id : data.event_id_old
			const eventsToCallsOutbound = [17,23,28]
			const eventsToSecondCallsOutbound = [8,9]
			const eventsToCallsInbound = [16,22,26]
			const eventsToSecondCallsInbound = [8,9]
			if (eventsToCallsOutbound.includes(preEventID)) ioSocket.sendSocketOutbound(data, false, true, false)
			if (eventsToCallsInbound.includes(preEventID)) ioSocket.sendSocketInbound(data, false, true, false)
			if (eventsToSecondCallsOutbound.includes(preEventID)) ioSocket.sendSocketOutbound(data, false, true, false)
			if (eventsToSecondCallsInbound.includes(preEventID)) ioSocket.sendSocketInbound(data, false, true, false)
			ioSocket.sendSocketsExtras(data, false, true)
		}
	}

	/**
    * Controlando el evento hangup
    **/
	hangup (data) {
		if (len(data) > 0) {
			if (data.agent_status === 0) {
				ioSocket.sendSocketInbound(data, true, false, false)
				ioSocket.sendSocketOutbound(data, true, false, false)
				ioSocket.sendSocketOther(data, false, false, true)
				ioSocket.sendSocketsExtras(data, true, true)
			} else if(data.second_event_id === 19) {
				ioSocket.sendSocketInbound(data, true, false, false)
				ioSocket.sendSocketOutbound(data, false, true, true)
				ioSocket.sendSocketsExtras(data, true, true)
			} else if(data.second_event_id === 20) {
				ioSocket.sendSocketOutbound(data, false, true, false)
				ioSocket.sendSocketsExtras(data, true, true)
			} else if(data.event_id === 7) {
				ioSocket.sendSocketOutbound(data, true, true, false)
				ioSocket.sendSocketOther(data, false, false, true)
				ioSocket.sendSocketsExtras(data, true, true)
			}else{
				ioSocket.sendSocketOutbound(data, false, true, false)
			}
		}
	}

	/**
    * Controlando el evento blindTransfer
    **/
	blindTransfer (data) {
		if (len(data) > 0) {
			let dataLiberar = data.liberar
			if (dataLiberar) {
				ioSocket.sendSocketOther(dataLiberar, false, false, true)
				if(dataLiberar.event_id_old === 17 || dataLiberar.event_id_old === 23) {
					ioSocket.sendSocketOutbound(dataLiberar, true, false, false)
				} else {
					ioSocket.sendSocketInbound(dataLiberar, true, false, false)
				}
				ioSocket.sendSocketsExtras(dataLiberar, true, true)
			}

			let dataAsignar = data.asignar
			if (dataAsignar) {
				ioSocket.sendSocketOther(dataAsignar, true, false, false)
				if(dataAsignar.event_id === 27) {
					ioSocket.sendSocketOutbound(dataAsignar, false, false, true)
				} else {
					ioSocket.sendSocketInbound(dataAsignar, false, false, true)
				}
				ioSocket.sendSocketsExtras(dataAsignar, true, true)
			}
		}
	}

	/**
    * Controlando el evento attendedTransfer
    **/
	attendedTransfer (data) {
		if (len(data) > 0) {
			const preEventID = data.event_id
			const eventsToCallsInbound = [1]
			if (eventsToCallsInbound.includes(preEventID)) ioSocket.sendSocketOutbound(data, false, true, false)
			ioSocket.sendSocketsExtras(data, true, true)
		}
	}

	/**
    * Controlando llamadas Inbound, Ring Inbound
    */
	callsInbound (data) {
		const eventInbound = [8, 12, 16, 19, 22, 25, 26]
		const beginInbound = [8,12]
		const preEventID = data.event_id_old
		const postEventID = data.event_id

		if(eventInbound.includes(postEventID)) {
			if (preEventID === 1) {
				ioSocket.sendSocketOther(data, true, false, false)
				ioSocket.sendSocketInbound(data, false, false, true)
			}
			if (eventInbound.includes(preEventID)) ioSocket.sendSocketInbound(data, false, true, false)
			if (beginInbound.includes(postEventID)) ioSocket.sendSocketsExtras(data, true, true)
			else ioSocket.sendSocketsExtras(data, false, true)
		}
	}

	/**
    * Controlador las llamadas encoladas (agregando)
    */
	addCallWaiting (data) {
		if (len(data) > 0) ioSocket.sendEmitDashboard('AddCallWaiting',data)
	}

	/**
    * Controlador las llamadas encoladas (eliminando)
    */
	removeCallWaiting (data) {
		if (len(data) > 0) ioSocket.sendEmitDashboard('RemoveCallWaiting',data)
	}

	/**
    * Cuando el asterisk se reinicia, manda a eliminar todas las llamadas encoladas
    */
	disconnectAsterisk (data) {
		if (len(data) > 0) ioSocket.sendEmitDashboard('refreshDashboard',data)
	}
}

module.exports = EventsCalls
