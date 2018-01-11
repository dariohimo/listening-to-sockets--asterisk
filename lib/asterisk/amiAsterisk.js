import AsteriskInterbank from './asteriskInterbank'
import AsteriskCorporativo from './asteriskCorporativo'
import AsteriskFactbilidad from './asteriskFactibilidad'
import AsteriskCdsgop from './asteriskCdsgop'
import AsteriskEntel from './asteriskEntel'
import AsteriskCalidda from './asteriskCalidda'

const asteriskInterbank = new AsteriskInterbank()
const asteriskCorporativo = new AsteriskCorporativo()
const asteriskFactibilidad = new AsteriskFactbilidad()
const asteriskCdsgop = new AsteriskCdsgop()
const asteriskEntel = new AsteriskEntel()
const asteriskCalidda = new AsteriskCalidda()

class AmiAsterisk {
	constructor (options) {
		this.servers = options || []
	}

	conectionAll () {
		this.servers.forEach(nameProyect => {
			if (nameProyect === 'corporativo') asteriskCorporativo.conectionAsterisk(nameProyect)
			if (nameProyect === 'interbank') asteriskInterbank.conectionAsterisk(nameProyect)
			if (nameProyect === 'factibilidad') asteriskFactibilidad.conectionAsterisk(nameProyect)
			if (nameProyect === 'cdsgop') asteriskCdsgop.conectionAsterisk(nameProyect)
			if (nameProyect === 'entel') asteriskEntel.conectionAsterisk(nameProyect)
			if (nameProyect === 'calidda') asteriskCalidda.conectionAsterisk(nameProyect)
		})
	}
}

module.exports = AmiAsterisk
