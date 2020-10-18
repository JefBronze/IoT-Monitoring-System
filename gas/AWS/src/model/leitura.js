const mongoose = require('../database/db')

const Schema = mongoose.Schema

const { DateTime } = require('luxon')

const leituraSchema = new Schema({
    pulso_gas:{
        type: Number
    }, 
    volume_total: {
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

const Leitura = mongoose.model('Leiturasgas', leituraSchema)

module.exports = Leitura