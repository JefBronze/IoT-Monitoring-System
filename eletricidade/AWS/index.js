const awsIoT = require('aws-iot-device-sdk')

const Leitura = require('./src/model/leitura')

const express = require('express')

const app = express()

const handlebars = require('express-handlebars')

const path = require('path')

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
    
    const {time,potencia_ApaF1,IrmsF1,potencia_ApaF2,IrmsF2,potencia_ApaN,IrmsN} = await JSON.parse(payload)
    //const leituras = await JSON.parse(payload.toString())
    //console.log({leituras})
    //console.log(await JSON.parse(payload))
    if (potencia_ApaF1 == undefined || IrmsF1 == undefined || potencia_ApaF2 == undefined || IrmsF2 == undefined || potencia_ApaN == undefined || IrmsN == undefined) {
        return false
    }
    console.log({potencia_ApaF1,IrmsF1,potencia_ApaF2,IrmsF2,potencia_ApaN,IrmsN,time})

    await Leitura.create({potencia_ApaF1, IrmsF1, potencia_ApaF2, IrmsF2, potencia_ApaN, IrmsN, type:"eletricidade", time})

})

app.get('/eletricidade.csv', async (req, res)=> {
  const eletricidade = await Leitura.find({type: 'eletricidade'}).sort({time: 'desc'}).limit(10)
  let datagraph = `time, potencia_ApaF1, IrmsF1, potencia_ApaF2, IrmsF2, potencia_ApaN, IrmsN \n`
  eletricidade.forEach(function(eletricidade){

    datagraph += `${eletricidade.time}, ${eletricidade.potencia_ApaF1}, ${eletricidade.IrmsF1}, ${eletricidade.potencia_ApaF2}, ${eletricidade.IrmsF2}, ${eletricidade.potencia_ApaN}, ${eletricidade.IrmsN}\n` 
})
  res.send(datagraph)
})
 
app.get('/monitorene', async (req, res)=> {
    res.render(__dirname + '/views/layouts/grafico')
})   

app.listen(3001,()=>{
    console.log("Servidor Ene Conectado")
})