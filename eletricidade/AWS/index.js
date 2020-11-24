const awsIoT = require('aws-iot-device-sdk')

const Leitura = require('./src/model/leitura')

const express = require('express')

const app = express()

const handlebars = require('express-handlebars')

const path = require('path')

const { DateTime } = require('luxon')

const credentials = require('./config/googlesheetseletricidade.json')

const GoogleSpreadsheet  = require('google-spreadsheet')

const { promisify } = require('util')

const accessSheet = async(docId, time, supplyVoltageF1, IrmsF1, potencia_ApaF1, supplyVoltageF2, IrmsF2, potencia_ApaF2, supplyVoltageN, Frequency) => {
    const doc = new GoogleSpreadsheet(docId)
  
    await promisify(doc.useServiceAccountAuth)(credentials)
    const info = await promisify(doc.getInfo)()
    const worksheet = info.worksheets[0]
    await promisify(worksheet.addRow)({time, supplyVoltageF1, IrmsF1, potencia_ApaF1, supplyVoltageF2, IrmsF2, potencia_ApaF2, supplyVoltageN, Frequency})
  } 

app.use(express.static(path.join(__dirname, "public")))

app.engine('handlebars', handlebars({defaultLayout: 'main'}))
app.set('view engine', 'handlebars')

const device = awsIoT.device ({
    keyPath: "cert.key",
    certPath: "cert.pem",
    caPath: "ca.pem",
    ClientId: "iotconsole-1602942287939-0",
    host: "ahmwfortxjjfp-ats.iot.us-east-1.amazonaws.com"
})

function connectaws(){
    device.on("connect",()=>{
        console.log("Conectado AWS")
        device.subscribe("ESP2CasaTiosEne/pub")
        device.publish("ESP2CasaTiosEne/pub",JSON.stringify({ confirm: 'online' }))
    })
}

connectaws()

device.on("error",()=>{
    console.log("Erro na conexão com AWS")
    connectaws()
})


device.on("message", async(topic, payload)=>{
    
    const {time, supplyVoltageF1, IrmsF1, potencia_ApaF1, supplyVoltageF2, IrmsF2, potencia_ApaF2, supplyVoltageN, Frequency} = await JSON.parse(payload)
    //const leituras = await JSON.parse(payload.toString())
    //console.log({leituras})
    //console.log(await JSON.parse(payload))
    if (supplyVoltageF1 == undefined || IrmsF1 == undefined || potencia_ApaF1 == undefined || supplyVoltageF2 == undefined || IrmsF2 == undefined || potencia_ApaF2 == undefined || supplyVoltageN == undefined || Frequency == undefined) {
        return false
    }
    console.log({supplyVoltageF1, IrmsF1, potencia_ApaF1, supplyVoltageF2, IrmsF2, potencia_ApaF2, supplyVoltageN, Frequency,time})

    await Leitura.create({supplyVoltageF1, IrmsF1, potencia_ApaF1, supplyVoltageF2, IrmsF2, potencia_ApaF2, supplyVoltageN, Frequency, type:"eletricidade", time})
  
    accessSheet ('1S1sNn8MLxH-MfGXJsKUBOCVE0f46Iop8xAPoiu3mH30', DateTime.local().setZone('America/Sao_Paulo'), supplyVoltageF1, IrmsF1, potencia_ApaF1, supplyVoltageF2, IrmsF2, potencia_ApaF2, supplyVoltageN, Frequency)

})

app.get('/eletricidade.csv', async (req, res)=> {
  const eletricidade = await Leitura.find({type: 'eletricidade'}).sort({time: 'desc'}).limit(10)
  let datagraph = `time, supplyVoltageF1, IrmsF1, potencia_ApaF1, supplyVoltageF2, IrmsF2, potencia_ApaF2, supplyVoltageN, Frequency \n`
  eletricidade.forEach(function(eletricidade){

    datagraph += `${eletricidade.time}, ${eletricidade.supplyVoltageF1}, ${eletricidade.IrmsF1}, ${eletricidade.potencia_ApaF1}, ${eletricidade.supplyVoltageF2}, ${eletricidade.IrmsF2}, ${eletricidade.potencia_ApaF2}, ${eletricidade.supplyVoltageF1}, ${eletricidade.IrmsF1}, ${eletricidade.potencia_ApaF1}, ${eletricidade.supplyVoltageN}, ${eletricidade.Frequency}\n` 

})
  res.send(datagraph)
})
 
app.get('/monitorene', async (req, res)=> {
    res.render(__dirname + '/views/layouts/grafico')
})   

app.listen(3004,()=>{
    console.log("Servidor Ene Conectado")
})

