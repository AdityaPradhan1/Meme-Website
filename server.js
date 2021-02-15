//requirements
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
// const mongoose = require('mongoose');
const MongoClient=require('mongodb').MongoClient
var methodOverride = require('method-override')
const url = 'mongodb://127.0.0.1:27017'
const dbName='xmeme'
const connectionString='mongodb+srv://user123:user123@testcluster1.t4mwr.mongodb.net/xmeme?retryWrites=true&w=majority'
//setting db and collection
let db
let memesCollection

// MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
//     if (err) return console.log(err)
  
//     // Storing a reference to the database so you can use it later
//     db = client.db(dbName)
//     memesCollection = db.collection('meme')
//     console.log(`Connected MongoDB: ${url}`)
//     console.log(`Database: ${dbName}`)
//   })
function getNextSequence(db, name, callback) {
    db.collection("counters").findAndModify( { _id: name }, null, { $inc: { seq: 1 } }, function(err, result){
        if(err) callback(err, result);
        callback(err, result.value.seq);
    } );
}

//function to check if json object is empty
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

MongoClient.connect(connectionString, { useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to Database')
    const db = client.db('xmeme')
    memesCollection = db.collection('meme')
    app.use(methodOverride('_method'))
    //for taking url values in
    app.use(bodyParser.urlencoded({extended: true}))
    //for json type
    app.use(bodyParser.json())
    // app.get('/',(req,res)=>{
    //     res.send("Hello World")
    // })
    
    //set correct path folders for views and express
    app.set('view engine', 'ejs')
    app.use(express.static('public'))
    
    
    //paths
    
    app.get('/',(req,res)=>{
        var msg=""
        memesCollection.find().toArray()
        .then(results => {
          res.render('index.ejs', {memes:results,msg:msg})
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving memes."
            })
        })
    })
    app.get('/memes',(req,res)=>{
        memesCollection.find().toArray()
        .then(results => {
          res.json(results)
        })
        .catch(error=>console.error(error))
        
    })
    app.get('/memes/:memeId',(req,res)=>{
        memesCollection.find({ _id: parseInt(req.params.memeId)}).toArray()
        .then(results => {
        //    res.send(typeof results)
        //   res.json(results)
            if(isEmpty(results)){
                res.sendStatus(404)
            }else{
                res.json(results)
            }
        })
        .catch(error=>console.error(error))
        
    })
    app.post('/memes', (req,res)=>{
        //   getNextSequence(db, "userid", function(err, result){
        //     if(!err){
        //         db.collection('meme').insert({
        //             "_id": result,
        //             "name" : req.body.name, 
        //             "url" : req.body.url, 
        //             "caption" : req.body.caption 
        //         }).then(result=>{
        //             // console.log(req.body.name)
        //             res.redirect('/')
        //           })
        //           .catch(error=>console.error(error))
        //     }
        // })
        // memesCollection.insertOne(req.body)
        //   .then(result=>{
        //     console.log(req.body.name)
        //     res.redirect('/')
        //   })
        //   .catch(error=>console.error(error))
    
        memesCollection.find({ "name" : req.body.name, "url" : req.body.url, "caption" : req.body.caption }).toArray()
        // memesCollection.find({ "name" : req.body.name}).toArray()
        .then(docs => {
            if(isEmpty(docs)){
                getNextSequence(db, "userid", function(err, result){
                    if(!err){
                        db.collection('meme').insert({
                            "_id": result,
                            "name" : req.body.name, 
                            "url" : req.body.url, 
                            "caption" : req.body.caption 
                        }).then(result=>{
                            // console.log(req.body.name)
                            res.redirect('/')
                          })
                          .catch(error=>console.error(error))
                    }
                })
            }else{
                var msg="The meme already exists"
                memesCollection.find().toArray()
                .then(results => {
                res.status(409).render('index.ejs', {memes:results, msg:msg})
                })
                .catch(err => {
                    res.status(500).send({
                        message: err.message || "Some error occurred while retrieving memes."
                    })
                })
            }
        })
        .catch(error=>console.error(error))
    })
    app.patch('/memes/:memeId', (req, res) => {
      memesCollection.findOneAndUpdate(
        { _id: parseInt(req.params.memeId)},
        {
          $set: {
            "url": req.body.url,
            "caption": req.body.caption
          }
        },
        {
          upsert: true
        }
      )
        .then(result =>{
            //  res.json('Success')
             res.status(200).redirect('/')
        })
        .catch(error =>  res.status(400).redirect('/'))
    })
    // app.delete('/quotes', (req, res) => {
    //   memesCollection.deleteOne(
    //     { name: req.body.name }
    //   )
    //   .then(result => {
    //     if (result.deletedCount === 0) {
    //       return res.json('No quote to delete')
    //     }
    //     res.json(`Deleted Darth Vadar's quote`)
    //   })
    //   .catch(error => console.error(error))
    // })
    
    // ========================
    // Listen
    // ========================
    const isProduction = process.env.NODE_ENV === 'production'
    const port = isProduction ? 7500 : 3000
    app.listen(port, function () {
      console.log(`listening on ${port}`)
    })
    console.log("XMEME HERE IN CONSOLE")
  })
//function to make mongodb id autoincrement and start from 1





