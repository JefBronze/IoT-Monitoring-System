const awsIoT = require('aws-iot-device-sdk')

const Leitura = require('./src/model/leitura')

const express = require('express')

const app = express()

const device = awsIoT.device ({
    keyPath: "cert.key",
    certPath: "cert.pem",
    caPath: "ca.pem",
    ClientId: "iotconsole-1603056348568-14",
    host: "ahmwfortxjjfp-ats.iot.us-east-1.amazonaws.com"
})

function connectaws(){
    device.on("connect",()=>{
        console.log("Conectado AWS")
        device.subscribe("ESP3CasaTiosA/pub")
        device.publish("ESP3CasaTiosA/pub",JSON.stringify({ confirm: 'online' }))
    })
}

connectaws()

device.on("error",()=>{
    console.log("Erro na conexão com AWS")
    connectaws()
})


device.on("message", async(topic, payload)=>{
    
    const {time,fluxoAgua,volumeTotal} = await JSON.parse(payload)
    //const leituras = await JSON.parse(payload.toString())
    
    //console.log({leituras})
    //console.log(await JSON.parse(payload))
    if (fluxoAgua == undefined || volumeTotal == undefined) {
        return false
    }

    console.log({time,fluxoAgua,volumeTotal})

    await Leitura.create({fluxoAgua, volumeTotal, type:"agua"})

})

app.get('/agua.csv', async (req, res)=> {
    const gas = await Leitura.find({type: 'agua'}).sort({time: 'desc'}).limit(1)
    let datagraph = `time, fluxoAgua, volumeTotal <br>`
    gas.forEach(function(agua){

        datagraph += `${agua.time}, ${agua.fluxoAgua}, ${agua.volumeTotal}<br>` 
    })
    res.send(datagraph)
})

  app.listen(3002,()=>{
      console.log("Servidor Agua Conectado")
  })