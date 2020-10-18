const mongoose = require('../database/db')

const Schema = mongoose.Schema

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
        default: Date.now
    }
})

const Leitura = mongoose.model('Leiturasene', leituraSchema)

module.exports = Leitura