const mongoose = require('../database/db')

const Schema = mongoose.Schema

const { DateTime } = require('luxon')

const leituraSchema = new Schema({
    potencia_ApaF1:{
        type: Number
    }, 
    IrmsF1: {
        type: Number
    },
    potencia_ApaF2:{
        type: Number
    }, 
    IrmsF2: {
        type: Number
    },
    potencia_ApaN:{
        type: Number
    }, 
    IrmsN: {
        type: Number
    },
    type: {
        type: String, 
    },
    time: {
        type: Date, 
        default: DateTime.local().setZone('America/Sao_Paulo')
    }
})

const Leitura = mongoose.model('Leiturasene', leituraSchema)

module.exports = Leitura