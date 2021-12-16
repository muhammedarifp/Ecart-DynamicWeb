const MongoClient = require ('mongodb').MongoClient

let state={
    db:null
}

module.exports.connect=function(done){
    let url='mongodb://localhost:27017'
    let dbName = 'Ecart'

    MongoClient.connect(url, (err,data)=>{
        if(err)
            return done(err)
        state.db=data.db(dbName)
        done()
    })
}

module.exports.get=()=>{
    return state.db
}