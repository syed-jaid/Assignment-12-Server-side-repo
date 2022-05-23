const express = require('express')
const app = express()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const port = process.env.PROT || 5000


app.use(express.json())
app.use(cors())

function verifyJWT(req, res, next) {
    const authorization = req.headers.authorization
    if (!authorization) {
        res.status(401).send({ message: 'UnAuthorized access' })
    }
    const token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next()
    })
}


const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASS_WORD}@final-assignment-12.jqhcf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const ItemsCollocetion = client.db('items').collection('data')
        const userCollection = client.db('users').collection('data')
        const reviewCollection = client.db('review').collection('data')
        const orderCollection = client.db('Order').collection('data')

        // puting user info 
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
        })
        // getting all the items 
        app.get('/items', async (req, res) => {
            const result = await ItemsCollocetion.find().toArray();
            res.send(result)
        })

        // updateing the user profile 
        app.put('/userUpdate', async (req, res) => {
            const user = req.body;
            const email = user.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { user },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        // updateing the user review 
        app.post('/review', async (req, res) => {
            const user = req.body;
            const result = await reviewCollection.insertOne(user);
            res.send(result);
        })

        // post the user order
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        // getting the user profile data
        app.get('/userProfile/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await userCollection.findOne(filter);
            res.send(result);
        })

        // getting the user order data
        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            console.log(email, query)
            const result = await orderCollection.find(query).toArray();
            console.log(result)
            res.send(result);
        })
        // getting the item data
        app.get('/item/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const quary = { _id: ObjectId(id) }
            const result = await ItemsCollocetion.findOne(quary)
            res.send(result)
        })

    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello world msi')
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})