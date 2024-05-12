/** @format */

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//Middle ware
app.use(
   cors({
      origin: ["http://localhost:5173"],
      credentials: true,
   })
);

app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fjovpu5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
   serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
   },
});

async function run() {
   try {
      // Connect the client to the server	(optional starting in v4.7)
    //   await client.connect();
    const assignmentsCollection = client.db("assignMates").collection("assignments");
    const submittedCollection = client.db("assignMates").collection("submittedAssignments");

    // create assignment
    app.post('/add-assignment', async(req,res)=>{
      const assignmentData = req.body;
      const result = await assignmentsCollection.insertOne(assignmentData);
      res.send(result)
    })

    //Get all assignment

    app.get('/assignments', async(req,res)=> {
      const result = await assignmentsCollection.find().toArray();
      res.send(result);
    });
    // Get a single assignment
    app.get('/assignments/:id', async(req,res)=>{
      const id = req.params.id;
      
      const query = {_id: new ObjectId(id)};
      const result = await assignmentsCollection.findOne(query);
      res.send(result)
    })

    // update a assignment
    app.patch('/update/:id', async(req,res)=> {
      const id = req.params.id;
      const assignmentData = req.body
      const query = {_id: new ObjectId(id)};
      const updateDoc = {
         $set: {
            ...assignmentData
         }
      }
      const result = await assignmentsCollection.updateOne(query,updateDoc);
      res.send(result)
    });

    // delete a assignment
    app.delete('/delete/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await assignmentsCollection.deleteOne(query);
      res.send(result)
    });


    // Submitted assignment APIS
    //  submit a assignment
    app.post('/submit', async(req,res) => {
      const submissionData = req.body;
      const result = await submittedCollection.insertOne(submissionData);
      res.send(result)
    })

    // get all pending assignment
    app.get('/pending' , async(req,res)=>{
      const filter = {status: 'pending'} 
      const result = await submittedCollection.find(filter).toArray();
      res.send(result)
    });

    // get submitted assignment list for a specific user
    app.get('/pending/:email', async(req,res)=>{
      const email = req.params.email;
      const query = {examineeMail: email};
      const result = await submittedCollection.find(query).toArray();
      res.send(result)
    });

    //get a submitted assignment by id
    app.get('/pending/mark/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await submittedCollection.findOne(query);
      res.send(result)
    });

    // Marking a submitted assignment
    app.put('/pending/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const markedData = req.body;
      const options = { upsert: true };
      const updateDoc = {
         $set:{
            ...markedData
         }
      }
      const result = await submittedCollection.updateOne(query,updateDoc,options);
      res.send();
    })







      // Send a ping to confirm a successful connection
    //   await client.db("admin").command({ ping: 1 });
      console.log(
         "Pinged your deployment. You successfully connected to MongoDB!"
      );
   } finally {
      // Ensures that the client will close when you finish/error
    //   await client.close();
   }
}
run().catch(console.dir);

app.get("/", (req, res) => {
   res.send(`AssignMate Server is running on port ${port}`);
});

app.listen(port, () => {
   console.log(`AssignMate Server is running on port ${port}`);
});
