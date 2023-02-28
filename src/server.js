import fs from 'fs'
import admin from 'firebase-admin'
import express from 'express'
// import { MongoClient } from "mongodb"
import { db, connectToDb}  from './db.js'
import cors from "cors";

const credentials = JSON.parse(
    fs.readFileSync('./credentials.json')
)
admin.initializeApp({
    credential: admin.credential.cert(credentials)
})


const app = express();
app.use(express.json())

app.options("*", cors({ origin: 'http://localhost:3000', optionsSuccessStatus: 200 }));
app.use(cors({ origin: "http://localhost:3000", optionsSuccessStatus: 200 }));

app.use(async(req, res, next) => {
    const { authtoken } = req.headers;

    if(authtoken){
        try{
            req.user = await admin.auth().verifyIdToken(authtoken)
        } catch (e) {
            res.sendStatus(400)
        }
    }
    next()
})

// app.post('/hello', (req, res) => {
//     console.log(req.body)
//     res.send(`Hello ${req.body.name}`)
// })

// app.get('/hello/:name', (req, res) => {
//     // const name = req.params.name
//     const {name} = req.params
//     res.send(`Hello ${name}!!`)
// })

//fake database
// let articlesInfo = [
//     {id: 1, name: 'tui', likes: 0, comments: []},
//     {id: 2, name: 'kiwi', likes: 0, comments: []}
// ]
// const uri = "mongodb+srv://curious-earthworm:GrowGarlic@byo-cup-corner.sqa3qxz.mongodb.net/?retryWrites=true&w=majority";

app.get('/api/articles/:name', async(req, res) => {
  const {name} = req.params;
    const {uid} = req.user;
//   const client = new MongoClient(uri, { useNewUrlParser: true });
//   await client.connect();
//   const db = client.db("hikoi-data");

  const article = await db.collection("articles").findOne( {name});
  if(article){
    const likeIDs = article.likeIDs || []
    article.canLike = uid && !likeIDs.include(uid);
      res.json(article);
  } else{
    res.sendStatus(404).send("Article not found")
  }
})

app.put('/api/articles/:name/likes', async(req, res) => {
    const { name } = req.params;
    // const article = articlesInfo.find(a => a.name === articleName)
    // replace the mockdata to actual database
    // const client = new MongoClient(uri); 
    // await client.connect();
    // const db = client.db("hikoi-data");


    let article = await db.collection('articles').findOne({name})

    if (!article) {
        article = {
            name,
            likes:0,
            comments:[]
        };
        await db.collection('articles').insertOne(article)
    }


    await db.collection("articles").updateOne({name}, {
        // increment function from mongodb
        $inc: { likes: 1 }
    })

    article = await db.collection('articles').findOne({name})

    if(article){
        // article.likes += 1 
        // res.send(`The ${name} article now has ${article.likes} likes` )
        res.json(article)
    } else {
        res.send('That article doesn\'t exist')
    }
})

// app.put('/api/articles/:articleId/likes', (req, res) => {
//     const articleId  = parseInt(req.params.articleId);
//     const article = articlesInfo.find(a => a.id === articleId)

//     if(article){
//         article.likes += 1 
//         res.send(`The article : ${articleId}  title: ${article.name} has ${article.likes} likes` )
//     } else {
//         res.send('That article doesn\'t exist')
//     }
// })

app.post('/api/articles/:name/comments', async(req, res) => {
    const name  = req.params.name;
    const { postedBy, text } = req.body

    // // const article = articlesInfo.find(a => a.id === articleId);
    // const client = new MongoClient(uri)
    // await client.connect()
    const exists = await db.collection('articles').countDocuments({name})

    if (!exists) {
        await db.collection('articles').insertOne({
            name,
            likes: 0,
            comments:[{postedBy, text}]
        })
    } else {
        await db.collection('articles').updateOne({name}, {$push: { comments: {postedBy, text}}})
    }

    const article = await db.collection('articles').findOne({name})

    if (article){
        // article.comments.push({ postedBy, text })
        res.json(article)
    } else{
        res.send('That article doesn\'t exist')
    }
})

connectToDb(() => {
    console.log('Succeessfully connected to database!')
    app.listen(8000, () => {
        console.log("Server is listening on port 8000");
    })
})

