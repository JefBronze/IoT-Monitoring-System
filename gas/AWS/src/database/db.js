const mongoose = require('mongoose')

mongoose.connect("mongodb://localhost/ProGrid",{
    useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, useUnifiedTopology: true,
}).then(()=>{
    console.log('Conectado Gas')
}).catch((err)=>{
    console.log('Erro '+err)
})
mongoose.Promise = global.Promise

module.exports = mongoose