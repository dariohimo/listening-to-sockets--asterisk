import DetailEvents from './detailEvents'
import ioSockets from './ioSockets'

const ioSocket = new ioSockets()
const detailEvent = new DetailEvents()

class BringBackData {

	// Controlando cuando el agente se conecta al sistema.
	addUserToDashboard(dataAgent) {
		this.sendSocketOther(dataAgent, false, false, true)
		this.sendSocketsExtras(dataAgent, true, false)
	}

	sendSocketsExtras(dataAgent, isPause, isDetailEvents) {
		if (dataAgent) {
			// if (isPause) actionAmi.pauseQueue(dataAgent)
			if (isDetailEvents) detailEvent.insertEvent(dataAgent)
			ioSocket.sendEmitFrontPanel(dataAgent)
		}
	}

	sendSocketOther(dataAgent, isRemoveOther, isUpdateOther, isAddOther) {
		if (isRemoveOther) ioSocket.sendEmitDashboard('RemoveOther', dataAgent)
		if (isUpdateOther) ioSocket.sendEmitDashboard('UpdateOther', dataAgent)
		if (isAddOther) ioSocket.sendEmitDashboard('AddOther', dataAgent)
	}


	sendSocketOutbound(dataAgent, isRemoveOutbound, isUpdateOutbound, isAddOutbound) {
		if (isRemoveOutbound) ioSocket.sendEmitDashboard('RemoveOutbound', dataAgent)
		if (isUpdateOutbound) ioSocket.sendEmitDashboard('UpdateOutbound', dataAgent)
		if (isAddOutbound) ioSocket.sendEmitDashboard('AddOutbound', dataAgent)
	}

	sendSocketInbound(dataAgent, isRemoveInbound, isUpdateInbound, isAddInbound) {
		if (isRemoveInbound) ioSocket.sendEmitDashboard('RemoveInbound', dataAgent)
		if (isUpdateInbound) ioSocket.sendEmitDashboard('UpdateInbound', dataAgent)
		if (isAddInbound) ioSocket.sendEmitDashboard('AddInbound', dataAgent)
	}

}

module.exports = BringBackData

/*
const brindBack = (dataAgent, event = false) => {
	let preEventID = dataAgent.event_id_old
	let postEventID = dataAgent.event_id
	let secondCall = false

	if (dataAgent.second_outbound_phone !== '' && event === 'eventHold' &&
			event === 'eventUnhold') {
		preEventID = dataAgent.event_id
		postEventID = dataAgent.second_event_id
		secondCall = true
	}
	console.log(`${event} ----  Post : ${postEventID}  - Pre : ${preEventID}`)

	// Controlando se cambio de estados desde el frontend
	if (event === 'updateDashboard') {
		if (postEventID === '15') sendSocketOther(dataAgent, true, false, false)
		else sendSocketOther(dataAgent, false, true, false)
	}

	// Controlando el Hangup
	if (event === 'eventHangup') {
		if (dataAgent.agent_status === '0') {
			sendSocketInbound(dataAgent, true, false, false)
			sendSocketOutbound(dataAgent, true, false, false)
			sendSocketOther(dataAgent, false, false, true)
			sendSocketsExtras(dataAgent, true, true)
		} else {
			sendSocketOutbound(dataAgent, false, true, false)
		}
	}

	// Controlando llamadas Outbound, Ring Outbound, Hold Outbound
	if ((event === 'eventNewstate' || event === 'eventHold' ||
			event === 'eventUnhold') &&
			(postEventID === '9' || postEventID === '13' || postEventID === '17' ||
			postEventID === '21' || postEventID === '18' || postEventID === '19' ||
			postEventID === '20' || postEventID === '23' || postEventID === '25' ||
			postEventID === '28' || postEventID === '29')) {
		if (preEventID === '1') {
			sendSocketOther(dataAgent, true, false, false)
			if (postEventID === '18') {
				sendSocketInbound(dataAgent, false, false, true)
			} else {
				sendSocketOutbound(dataAgent, false, false, true)
			}
		}

		if (preEventID === '9' || preEventID === '13' || preEventID === '17' ||
				preEventID === '21' || preEventID === '23' || preEventID === '20' ||
				preEventID === '27' || preEventID === '28' ||
				preEventID === '29') sendSocketOutbound(dataAgent, false, true, false)
		if (preEventID === '18' || preEventID === '24') sendSocketInbound(dataAgent,
			false, true, false)
		if (secondCall === false) {
			if (postEventID === '9' || postEventID === '13' || postEventID === '18' ||
					postEventID === '21' || postEventID === '19') sendSocketsExtras(
				dataAgent, true, true)
			else sendSocketsExtras(dataAgent, false, true)
		}
	}

	// Controlando llamadas Ring Inbound y Inbound
	if ((event === 'eventNewConnectedLine' || event === 'eventAgentConnect' ||
			event === 'eventHold' || event === 'eventUnhold') &&
			(postEventID === '8' || postEventID === '12' || postEventID === '16' ||
			postEventID === '19' || postEventID === '22' || postEventID === '25' ||
			postEventID === '26')) {
		if (preEventID === '1') {
			sendSocketOther(dataAgent, true, false, false)
			sendSocketInbound(dataAgent, false, false, true)
		}
		if (preEventID === '8' || preEventID === '12' || preEventID === '16' ||
				preEventID === '19' || preEventID === '22' || preEventID === '25' ||
				preEventID === '26') sendSocketInbound(dataAgent, false, true, false)
		if (postEventID === '8' || postEventID === '12') sendSocketsExtras(
			dataAgent, true, true)
		else sendSocketsExtras(dataAgent, false, true)
	}

	// Controlando llamadas Ring Inbound y Inbound
	if (event === 'eventBlindTransfer') {
		let dataLiberar = dataAgent.liberar
		if (dataLiberar) {
			sendSocketOther(dataLiberar, false, false, true)
			if (dataLiberar.event_id_old === '17') sendSocketOutbound(dataLiberar,
				true, false, false)
			else sendSocketInbound(dataLiberar, true, false, false)
			sendSocketsExtras(dataLiberar, true, true)
		}

		let dataAsignar = dataAgent.asignar
		if (dataAsignar) {
			sendSocketOther(dataAsignar, true, false, false)
			if (dataAsignar.event_id === '27') sendSocketOutbound(dataAsignar, false,
				false, true)
			else sendSocketInbound(dataAsignar, false, false, true)
			sendSocketsExtras(dataAsignar, true, true)
		}
	}
}

*/
