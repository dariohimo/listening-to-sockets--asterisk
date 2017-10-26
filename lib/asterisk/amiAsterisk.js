import AsteriskInterbank from './asteriskInterbank'
import AsteriskCorporativo from './asteriskCorporativo'
import AsteriskFactbilidad from './asteriskFactibilidad'

const asteriskInterbank = new AsteriskInterbank()
const asteriskCorporativo = new AsteriskCorporativo()
const asteriskFactibilidad = new AsteriskFactbilidad()

class AmiAsterisk {
  constructor (options) {
    this.servers = options || []
  }

  conectionAll () {
    this.servers.forEach(nameProyect => {
      if (nameProyect === 'corporativo') asteriskCorporativo.conectionAsterisk(nameProyect)
      if (nameProyect === 'interbank') asteriskInterbank.conectionAsterisk(nameProyect)
      if (nameProyect === 'factibilidad') asteriskFactibilidad.conectionAsterisk(nameProyect)
    })
  }
}

module.exports = AmiAsterisk
