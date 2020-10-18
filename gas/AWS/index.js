const awsIoT = require('aws-iot-device-sdk')

const Leitura = require('./src/model/leitura')

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
    console.log({time,pulso_gas,volume_total})
    //console.log({leituras})
    console.log(await JSON.parse(payload))
    if (pulso_gas == undefined || volume_total == undefined)
        return false

    await Leitura.create({pulso_gas, volume_total})

})