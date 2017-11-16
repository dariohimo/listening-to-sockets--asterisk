import NewStateRing from './eventNewState/newStateRing'
import NewStateAnswer from './eventNewState/newStateAnswer'
import len from 'object-length'

const newStateRing = new NewStateRing()
const newStateAnswer = new NewStateAnswer()

class EventNewState {
	newState(sendData) {
		let actionJSON = ''
		let answerInbound = ''
		let answerExternOutgoing = ''
		let answerInternal = ''

		const dataPreUpdate = sendData.dataPreUpdate
		const dataEmitAsterisk = sendData.dataEmitAsterisk

		const context = dataEmitAsterisk['Context'].split('-')

		const channelStateDesc = dataEmitAsterisk['ChannelStateDesc']
		const connectedLineNum = dataEmitAsterisk['ConnectedLineNum']
		const exten = dataEmitAsterisk['Exten']
		const uniqueID = dataEmitAsterisk['Uniqueid']
		const linkedID = dataEmitAsterisk['Linkedid']
		const preEventID = (len(dataPreUpdate) > 0 && dataPreUpdate.event_id) ? dataPreUpdate.event_id : ''

		/**
		* [Valida si el contexto es nivel, tambien si el estado del canal (anexo) es Ring - Ringing]
		**/

		if (context[0] === 'nivel' && (channelStateDesc === 'Ring' || channelStateDesc === 'Ringing')) {
			if (connectedLineNum.length <= 4 || connectedLineNum === '<unknown>') {
				/**
				* [Valida si la cantidad de caracteres de la extension (numero de llamada) es mayor a 4. Si se cumple este timbrado se considera como una llamada saliente (fijo,
				* celulares o 0800), caso contrario se considera como una llamada interna entre anexos ]
				**/
				if (exten.length > 4 && uniqueID === linkedID) {
					actionJSON = (preEventID === '1') ? newStateRing.outBoundCall(sendData, false) : ''
				} else {
					if(preEventID === '16' || preEventID === '17') {
						actionJSON = newStateRing.internalSecondCall(sendData)
					}else{
						/**
						 * [Valida si la extension es menor o igual a 4, de esta manera se puede validar si la llamada es interna
						 * ya que cuando es de un anexo de afuera (cliente), el exten nos muestra el nombre de la cola]
						 */
						if(exten.length <= 4) actionJSON = (uniqueID === linkedID) ? newStateRing.internalEmisor(sendData) : newStateRing.internalReceptor(sendData)			
					}
				}
			}
		}

		/**
		* [Valida si el estado del canal (anexo) es Up (Fue contestado)
		* Si la primera condición se cumple me indica que la llamada ha sido contestada teniendo dataPreUpdate, si no
		* seria una llamada interna que es transferida]
		**/
		if (channelStateDesc === 'Up' && len(dataPreUpdate) > 0) {
			if (connectedLineNum !== '<unknown>') {
				/**
				* [.....................................]
				**/
				answerInbound = (preEventID !== '12') ? newStateAnswer.validateInboundCall(sendData, true) : ''
				/**
				* [Valida si el nombre del contexto que se encuentra configurado en el servidor asterisk, lleva por nombre "context-cliente". Si se cumple se considera que la
				* llamada saliente fue contestada por el cliente "fijos, celular, 0800", caso contrario se considera que la llamada fue contestada por un anexo interno]
				**/
				if (context[0] === 'context') {
					answerExternOutgoing = newStateAnswer.outBoundCall(sendData)
					actionJSON = Object.assign(answerInbound,answerExternOutgoing)
				} else {
					if(uniqueID === linkedID){
						answerInternal = newStateAnswer.receptorInternalCall(sendData)
					}else{
						if(dataPreUpdate.event_id === '16' || dataPreUpdate.event_id === '17'){
							answerInternal = newStateAnswer.receptorSecondCall(sendData)
						}else{
							if(dataPreUpdate.event_id === '24') answerInternal = newStateAnswer.receptorBlindTransferCallInbound(sendData)
							else if(dataPreUpdate.event_id === '27') answerInternal = newStateAnswer.receptorBlindTransferCallOutbound(sendData)
							else answerInternal = newStateAnswer.emisorConnectInternalCall(sendData)
						}
					}
					actionJSON = Object.assign(answerInbound,answerInternal)
				}
			}
		}else if(context[0] === 'nivel' && uniqueID != linkedID && channelStateDesc === 'Up'){ /**/ }

		return this.generateResponseJson(actionJSON)
	}

	/**
	* [Genera un objecto que pasara como parametro a una ruta de SailsJS]
	*/
	generateResponseJson (data) {
		if (data.agentAnnexed) {
			if (data.secondCall === true) {
				return {
					'agent_annexed': (data.agentAnnexed) ? data.agentAnnexed : '',
					'second_outbound_phone': (data.secondOutboundPhone) ? data.secondOutboundPhone : '',
					'second_outbound_start': (data.secondOutboundStart) ? data.secondOutboundStart : '',
					'second_event_id': (data.secondEventId) ? data.secondEventId : '',
					'second_event_name': (data.secondEventName) ? data.secondEventName : '',
					'second_status_call' : '1',
					'changeEventPrimary' : (data.changeEventPrimary) ? data.changeEventPrimary : '1'
				}
			} else {
				return {
					'agent_annexed': (data.agentAnnexed) ? data.agentAnnexed : '',
					'agent_status': (data.statusPause) ? data.statusPause : '',
					'event_id': (data.eventId) ? data.eventId : '',
					'event_id_old': (data.eventIDOld) ? data.eventIDOld : '',
					'event_name': (data.eventName) ? data.eventName : '',
					'event_time': (data.eventTime) ? data.eventTime : '',
					'event_observaciones': (data.eventObservaciones) ? data.eventObservaciones : '',
					'inbound_queue': (data.inboundQueue) ? data.inboundQueue : '',
					'inbound_phone': (data.inboundPhone) ? data.inboundPhone : '',
					'inbound_start': (data.inboundStart) ? data.inboundStart : '',
					'outbound_phone': (data.outboundPhone) ? data.outboundPhone : '',
					'outbound_start': (data.outboundStart) ? data.outboundStart : '',
					'second_outbound_phone': (data.secondOutboundPhone) ? data.secondOutboundPhone : '',
					'second_outbound_start': (data.secondOutboundStart) ? data.secondOutboundStart : '',
					'second_event_id': (data.secondEventId) ? data.secondEventId : '',
					'second_event_name': (data.secondEventName) ? data.secondEventName : '',
					'second_status_call' : '0',
					'changeEventPrimary' : (data.changeEventPrimary) ? data.changeEventPrimary : '0'
				}
			}
		}
	}
}

module.exports = EventNewState
