import AsteriskInterbank from './asteriskInterbank'
import AsteriskCorporativo from './asteriskCorporativo'

const asteriskInterbank = new AsteriskInterbank()
const asteriskCorporativo = new AsteriskCorporativo()

class AmiAsterisk {
	constructor (options){
		this.servers = options || []
	}

	conectionAll () {
		this.servers.forEach(nameProyect => {
			if (nameProyect === 'corporativo') asteriskCorporativo.conectionAsterisk(nameProyect)
			if (nameProyect === 'interbank') asteriskInterbank.conectionAsterisk(nameProyect)
		})
	}
}

module.exports = AmiAsterisk
