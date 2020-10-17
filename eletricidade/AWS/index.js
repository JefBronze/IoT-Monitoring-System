const awsIoT = require('aws-iot-device-sdk')

const Leitura = require('./src/model/leitura')

const device = awsIoT.device ({
    keyPath: "cert.key",
    certPath: "cert.pem",
    caPath: "ca.pem",
    ClientId: "iotconsole-1602942287939-0",
    host: "ahmwfortxjjfp-ats.iot.us-east-1.amazonaws.com"
})

function connectaws(){
    device.on("connect",()=>{
        console.log("Conectado")
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
    
    const {time,potencia_ApaF1,IrmsF1,potencia_ApaF2,IrmsF2,potencia_ApaN,IrmsN} = await JSON.parse(payload)
    //const leituras = await JSON.parse(payload.toString())
    console.log({potencia_ApaF1,IrmsF1,potencia_ApaF2,IrmsF2,potencia_ApaN,IrmsN,time})
    //console.log({leituras})
    console.log(await JSON.parse(payload))
    if (potencia_ApaF1 == undefined || IrmsF1 == undefined || potencia_ApaF2 == undefined || IrmsF2 == undefined || potencia_ApaN == undefined || IrmsN == undefined) 
        return false

    await Leitura.create({potencia_ApaF1, IrmsF1, potencia_ApaF2, IrmsF2, potencia_ApaN, IrmsN, time})

})