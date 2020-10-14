const mongoose = require('../database/db')

const Schema = mongoose.Schema

const leituraSchema = new Schema({
    pulso_gas:{
        type: Number
    }, 
    volume_total: {
        type: Number
    },
    time: {
        type: Date, 
        default: Date.now
    }
})

const Leitura = mongoose.model('Leiturasgas', leituraSchema)

module.exports = Leitura