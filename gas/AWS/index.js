const awsIoT = require('aws-iot-device-sdk')

const Leitura = require('./src/model/leitura')

const express = require('express')

const app = express()

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

})

app.get('/gas.csv', async (req, res)=> {
    const gas = await Leitura.find({type: 'gas'}).sort({time: 'desc'}).limit(1)
    let datagraph = `time, volume_total, pulso_gas <br>`
    gas.forEach(function(gas){

        datagraph += `${gas.time}, ${gas.volume_total}, ${gas.pulso_gas}<br>` 
    })
    res.send(datagraph)
})

  app.listen(3002,()=>{
      console.log("Servidor Gas Conectado")
  })