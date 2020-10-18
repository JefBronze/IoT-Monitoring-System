const mongoose = require('../database/db')

const Schema = mongoose.Schema

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
        default: Date.now
    }
})

const Leitura = mongoose.model('Leiturasagua', leituraSchema)

module.exports = Leitura