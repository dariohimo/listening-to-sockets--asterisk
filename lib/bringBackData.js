import ioSockets from './util/ioSockets'
import DetailEvents from './detailEvents'
import DetailDashboard from './detailDashboard'

const ioSocket = new ioSockets()
const detailEvent = new DetailEvents()
const detailDashboard = new DetailDashboard()

class BringBackData {
  /**
   * [Controlar los mensajes de error]
   */
  handlerError (msj, err) {
    console.log(`${msj} : ${err}`)
  }

  // Controlando cuando el agente se conecta al sistema.
  addUserToDashboard (data) {
    this.sendSocketOther(data, false, false, true)
    this.sendSocketsExtras(data, true, false)
  }

  // Controlando se cambio de estados desde el frontend
  updateUserToDashboard (data) {
    let postEventID = data.event_id
    const valuesPanelInbound = ['8', '12', '16', '18', '19', '22', '24', '25', '26']
    const valuesPanelOutbound = ['9', '13', '17', '20', '21', '23', '27', '28', '29']
    const valuesPanelOthers = ['1', '2', '3', '4', '5', '6', '7']

    if (postEventID === '15') this.sendSocketOther(data, true, false, false)
    else {
      // Cuando se reinicia el asterisk, se tiene que evaluar cual es el evento anterior para de acuerdo a ello realizar cambios en los paneles del dashboard
      if (valuesPanelInbound.includes(data.event_id_old)) {
        this.sendSocketInbound(data, true, false, false)
        this.sendSocketOther(data, false, false, true)
      }

      if (valuesPanelOutbound.includes(data.event_id_old)) {
        this.sendSocketOutbound(data, true, false, false)
        this.sendSocketOther(data, false, false, true)
      }

      // Cuando el agente cambia de estado manualmente
      if (valuesPanelOthers.includes(data.event_id_old)) {
        this.sendSocketOther(data, false, true, false)
      }
    }
  }

  listUsersConnect (data) {
    detailDashboard.shows(data).then(data => {
      const valuesAddInbound = ['8', '12', '16', '19', '18', '22', '25', '24', '26']
      const valuesAddOutbound = ['9', '13', '17', '20', '21', '23', '27', '28', '29']
      data.forEach(agent => {
        let eventID = agent.event_id
        if (valuesAddInbound.includes(eventID)) ioSocket.sendEmitDashboard('AddInbound', agent)
        else if (valuesAddOutbound.includes(eventID)) ioSocket.sendEmitDashboard('AddOutbound', agent)
        else ioSocket.sendEmitDashboard('AddOther', agent)
      })
    }).catch(err => this.handlerError('Error al obtener agentes', err))
  }

  sendSocketsExtras (data, isPause, isDetailEvents) {
    if (data) {
      if (isDetailEvents) detailEvent.insertEvent(data)
      ioSocket.sendEmitFrontPanel(data)
    }
  }

  sendSocketOther (data, isRemoveOther, isUpdateOther, isAddOther) {
    if (isRemoveOther) ioSocket.sendEmitDashboard('RemoveOther', data)
    if (isUpdateOther) ioSocket.sendEmitDashboard('UpdateOther', data)
    if (isAddOther) ioSocket.sendEmitDashboard('AddOther', data)
  }

  sendSocketOutbound (data, isRemoveOutbound, isUpdateOutbound, isAddOutbound) {
    if (isRemoveOutbound) ioSocket.sendEmitDashboard('RemoveOutbound', data)
    if (isUpdateOutbound) ioSocket.sendEmitDashboard('UpdateOutbound', data)
    if (isAddOutbound) ioSocket.sendEmitDashboard('AddOutbound', data)
  }

  sendSocketInbound (data, isRemoveInbound, isUpdateInbound, isAddInbound) {
    if (isRemoveInbound) ioSocket.sendEmitDashboard('RemoveInbound', data)
    if (isUpdateInbound) ioSocket.sendEmitDashboard('UpdateInbound', data)
    if (isAddInbound) ioSocket.sendEmitDashboard('AddInbound', data)
  }
}

module.exports = BringBackData
