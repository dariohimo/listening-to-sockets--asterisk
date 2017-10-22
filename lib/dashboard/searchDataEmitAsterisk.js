class SearchDataEmitAsterisk {

	getNumberExtension (data) {
		const event = data['Event']
		if (event === 'Hold') return this.eventHold(data)
		if (event === 'Unhold') return this.eventUnHold(data)
		if (event === 'Newstate') return this.eventNewState(data)
		if (event === 'Hangup') return this.eventHangup(data)
		if (event === 'BlindTransfer') return this.eventBlindTransfer(data)
		if (event === 'AttendedTransfer') return this.eventAttendedTransfer(data)
	}

	extractNumberExtension (data, attendedTransfer = false) {
		let channelExtension = (attendedTransfer) ? data['OrigTransfererChannel'] : data['Channel']
		let numberExtension = channelExtension.split('-')
		numberExtension = numberExtension[0].split('/')
		numberExtension = numberExtension[1]
		return numberExtension
	}

	eventHold (data) {
		return (data['CallerIDNum'].length > '4') ? this.extractNumberExtension(data) : data['CallerIDNum']
	}

	eventUnHold (data) {
		return (data['CallerIDNum'].length > '4') ? this.extractNumberExtension(data) : data['CallerIDNum']
	}

	eventNewState (data) {
		/**
		 * [Capturar el anexo del receptor]
		 */
		if(data['ChannelStateDesc'] === 'Ringing') return data['CallerIDNum']

		/**
		 * [Capturar el anexo del emisor]
		 */
		return (data['ConnectedLineNum'].length === 4) ? data['ConnectedLineNum'] : data['CallerIDNum']
		
	}

	eventHangup (data) {
		const callerIDNum = data['CallerIDNum']
		const connectedLineNum = data['ConnectedLineNum']

		//const exten = data['Exten']
		const uniqueID = data['Uniqueid']
		const linkedid = data['Linkedid']
		const channelStateDesc = data['ChannelStateDesc']
		const context = data['Context'].split('-')

		/**
		* [Detecta cuando una llamada saliente es cortada por el cliente o por el agente, retorna el callerIDNum del emisor]
		
		if (connectedLineNum !== '<unknown>' && context[0] === 'context') {
			return connectedLineNum
		}

		*/

		/**
		* [----------------------------]
		*/
		if (connectedLineNum === '<unknown>' && context[0] === 'feature') return callerIDNum

		if (context[0] === 'nivel') {
			/**
			* [Este evento se genera cuando la llamada saliente o interna es contestada por el receptor]
			*/
			if (data['ChannelStateDesc'] === 'Up') {
				if (connectedLineNum !== '<unknown>') {
					/**
					* [Este evento se cumple cuando una llamada interna es contestada por el receptor]
				 	*/

					/**
				 	* [Si la llamada es cortada por el anexo receptor este conectado o no al sistema, se retorna el anexo receptor.
				 	* Caso contrario si la llamada es cortada por el anexo emisor, se retorna el anexo emisor.
					*/
				
					return callerIDNum

					/**
				 	* [Si se cumple la primera condición, y la llamada es cortada por el anexo receptor este conectado o no al sistema, se retorna el anexo receptor.
				 	* Caso contrario si la llamada es cortada por el anexo emisor, se retorna el anexo emisor.
					* 
					if(exten.length <= 4) {
						console.log('7')
						return callerIDNum
					}else {
						console.log('8')
						return connectedLineNum
					} 
					*/
				} else {
					/**
					* [Detecta cuando una llamada saliente es cortada por el cliente o por el agente.
					* Si el uniqueID y el linkedID son iguales, me retorna el anexo del emisor, si no ]
					*/
					return (uniqueID === linkedid) ? this.extractNumberExtension(data) : callerIDNum
				}
			} else {
				/**
				 * [Este evento se genera cuando la llamada es cortada mientras se encuentra timbrando tanto para una llamada saliente como una llamada interna.
				 *  
				 * Si es una llamada saliente, y se cumple que el uniqueID y el linkedID son iguales, me retorna el callerIDNum del emisor.
				 * Si es una llamada interna y el anexo del receptor no se encuentra conectado al sistema, si se cumple que el uniqueID y el linkedID son iguales, me retorna el callerIDNum del emisor, si no me retorna el callerIDNum del receptor.
				 * Si es una llamada interna y el anexo del receptor se encuentra conectado al sistema :
				 * 	- Si el emisor corta la llamada y se cumple la primera condicion, se retorna el callerIDNum del receptor, caso contrario se retorna el callerIDNum del emisor.
				 * 	- Si el receptor corta la llamada y se cumple la primera condicion, se retorna el callerIDNum del emisor, caso contrario se retorna el callerIDNum del receptor.]
				 */
				return (channelStateDesc === 'Ring' && uniqueID === linkedid) ? this.extractNumberExtension(data) : callerIDNum
			}
		}
		
	}

	eventBlindTransfer (data) {
		if (data['TransfererCallerIDNum'] !== 'undefined') {
			return data['TransfererCallerIDNum']
		}
	}

	eventAttendedTransfer (data) {
		return this.extractNumberExtension(data, true)
	}

}

module.exports = SearchDataEmitAsterisk
