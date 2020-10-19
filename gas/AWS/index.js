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

const accessSheet = async(docId, time, pulso_gas, volume_total) => {
    const doc = new GoogleSpreadsheet(docId)
  
    await promisify(doc.useServiceAccountAuth)(credentials)
    const info = await promisify(doc.getInfo)()
    const worksheet = info.worksheets[0]
    await promisify(worksheet.addRow)({time, pulso_gas, volume_total})
  } 

app.use(express.static(path.join(__dirname, "public")))

app.engine('handlebars', handlebars({defaultLayout: 'main'}))
app.set('view engine', 'handlebars')


const device = awsIoT.device ({
    keyPath: "cert.key",
    certPath: "cert.pem",
    caPath: "ca.pem",
    ClientId: "iotconsole-1602213290949-0",
    host: "ahmwfortxjjfp-ats.iot.us-east-1.amazonaws.com"
})

function connectaws(){
    device.on("connect",()=>{
        console.log("Conectado AWS")
        device.subscribe("ESP1CasaTiosGas/pub")
        device.publish("ESP1CasaTiosGas/pub",JSON.stringify({ confirm: 'online' }))
    })
}

connectaws()

device.on("error",()=>{
    console.log("Erro na conexão com AWS")
    connectaws()
})


device.on("message", async(topic, payload)=>{
    
    const {time,pulso_gas,volume_total} = await JSON.parse(payload)
    //const leituras = await JSON.parse(payload.toString())
    
    //console.log({leituras})
    //console.log(await JSON.parse(payload))
    if (pulso_gas == undefined || volume_total == undefined) {
        return false
    }

    console.log({time,pulso_gas,volume_total})

    await Leitura.create({pulso_gas, volume_total, type:"gas"})

    accessSheet ('1sxa_6IHl7aQNhv_sAv_uLnaQU4BJEhAQyMrug7aL6LA', DateTime.local().setZone('America/Sao_Paulo'), pulso_gas, volume_total)

})

app.get('/gas.csv', async (req, res)=> {
    const gas = await Leitura.find({type: 'gas'}).sort({time: 'desc'}).limit(1)
    let datagraph = `time, volume_total, pulso_gas \n`
    gas.forEach(function(gas){

        datagraph += `${gas.time}, ${gas.volume_total}, ${gas.pulso_gas}\n` 
    })
    res.send(datagraph)
})

app.get('/monitorgas', async (req, res)=> {
    res.render(__dirname + '/views/layouts/grafico')
}) 

  app.listen(3003,()=>{
      console.log("Servidor Gas Conectado")
  })