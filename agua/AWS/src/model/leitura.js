const mongoose = require('../database/db')

const Schema = mongoose.Schema

const { DateTime } = require('luxon')

const leituraSchema = new Schema({
    fluxoAgua:{
        type: Number
    }, 
    volumeTotal: {
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

const Leitura = mongoose.model('Leiturasagua', leituraSchema)

module.exports = Leitura