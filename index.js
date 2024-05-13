/** @format */

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//Middle ware
const corsOptions = {
   origin: ["http://localhost:5173", "https://assignmates-5c335.web.app", "https://assignmates-5c335.firebaseapp.com"],
   credentials: true,
   optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Verify JWT middleware
const verifyToken = (req, res, next) => {
   const token = req.cookies?.token;
   if(!token) return res.status(401).send({message: 'Unauthorized access'});

   if (token) {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
         if (err) {
             return res.status(401).send({message: 'Unauthorized access'});
         }
         console.log(decoded);
         req.user = decoded;
         next();
      });
   }
   // console.log(token);
};

//cookieOptions
const cookieOptions = {
   httpOnly: true,
   secure: process.env.NODE_ENV === "production",
   sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
 };
 //localhost:5000 and localhost:5173 are treated as same site.  so sameSite value must be strict in development server.  in production sameSite will be none
 // in development server secure will false .  in production secure will be true

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
      const assignmentsCollection = client
         .db("assignMates")
         .collection("assignments");
      const submittedCollection = client
         .db("assignMates")
         .collection("submittedAssignments");

      // JWT  API
      app.post("/jwt", async (req, res) => {
         console.log('logging in');
         const user = req.body;
         const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "2h",
         });
         res.cookie("token", token,cookieOptions).send({ success: true });
      });

      //clear token after logout
      app.get("/logout", async (req, res) => {
         // const user = req.body;
         console.log('logging out');
         res.clearCookie("token", {...cookieOptions, maxAge:0, expiresIn: new Date()}).send({ success: true });
      });

      // create assignment
      app.post("/add-assignment", verifyToken, async (req, res) => {
         const assignmentData = req.body;
         const result = await assignmentsCollection.insertOne(assignmentData);
         res.send(result);
      });

   //    app.get("/assignments", async (req, res) => {
   //       const sortBy = req.query.sortBy;
   //       console.log(sortBy);
   //       try {
   //           let filter = {};
   //           if (sortBy === 'Easy') {
   //               filter = { difficulty_level: 'Easy' };
   //           } else if (sortBy === 'Medium') {
   //               filter = { difficulty_level: 'Medium' };
   //           } else if (sortBy === 'Hard') {
   //               filter = { difficulty_level: 'Hard' };
   //           }
   //           const result = await assignmentsCollection.find(filter).toArray();
   //           res.send(result);
   //       } catch (err) {
   //           console.log(err.message);
   //           res.status(500).send('Internal Server Error');
   //       }
   //   });
     

      app.get("/assignments", async (req, res) => {
         const query = req.query;
         console.log(query);
         if(query){
            console.log('inside if');
            if(query.sortBy === 'Easy') {
               const filter = {difficulty_level: 'Easy' }
               const result = await assignmentsCollection.find(filter).toArray();
               res.send(result);
            } else if (query.sortBy === 'Medium'){
               const {filter} = {difficulty_level: 'Medium' }
               const result = await assignmentsCollection.find(filter).toArray();
               res.send(result);
            } else if (query.sortBy === 'Hard'){
               const filter = {difficulty_level: 'Hard' }
               const result = await assignmentsCollection.find(filter).toArray();
               res.send(result);
            } else if (query.sortBy === 'All'){
               const filter = {level: 'Hard' }
               const result = await assignmentsCollection.find().toArray();
               res.send(result);
            }
         } else{
            console.log('inside else');
            const result = await assignmentsCollection.find().toArray();
            res.send(result);
         }


        
      });
      // Get a single assignment
      app.get("/assignments/:id", async (req, res) => {
         const id = req.params.id;
         const query = { _id: new ObjectId(id) };
         const result = await assignmentsCollection.findOne(query);
         res.send(result);
      });

      // update a assignment
      app.patch("/update/:id", async (req, res) => {
         const id = req.params.id;
         const assignmentData = req.body;
         const query = { _id: new ObjectId(id) };
         const updateDoc = {
            $set: {
               ...assignmentData,
            },
         };
         const result = await assignmentsCollection.updateOne(query, updateDoc);
         res.send(result);
      });

      // delete a assignment
      app.delete("/delete/:id", async (req, res) => {
         const id = req.params.id;
         const query = { _id: new ObjectId(id) };
         const result = await assignmentsCollection.deleteOne(query);
         res.send(result);
      });

      // Submitted assignment APIS
      //  submit a assignment
      app.post("/submit", async (req, res) => {
         const submissionData = req.body;
         const result = await submittedCollection.insertOne(submissionData);
         res.send(result);
      });

      // get all pending assignment
      app.get("/pending", verifyToken, async (req, res) => {
         // const tokenData = req.user.email;
         // console.log( 'pending', tokenData);
         const filter = { status: "pending" };
         const result = await submittedCollection.find(filter).toArray();
         res.send(result);
      });

      // get submitted assignment list for a specific user
      app.get("/pending/:email", verifyToken, async (req, res) => {
         const tokenEmail = req.user.email
         const email = req.params.email;
         if(tokenEmail!== email ) return res.status(403).send({message: 'Forbidden access'});
         const query = { examineeMail: email};
         const result = await submittedCollection.find(query).toArray();
         res.send(result);
      });

      //get a submitted assignment by id
      app.get("/pending/mark/:id", async (req, res) => {
         const id = req.params.id;
         const query = { _id: new ObjectId(id) };
         const result = await submittedCollection.findOne(query);
         res.send(result);
      });

      // Marking a submitted assignment
      app.put("/pending/:id", async (req, res) => {
         const id = req.params.id;
         const query = { _id: new ObjectId(id) };
         const markedData = req.body;
         const options = { upsert: true };
         const updateDoc = {
            $set: {
               ...markedData,
            },
         };
         const result = await submittedCollection.updateOne(
            query,
            updateDoc,
            options
         );
         res.send();
      });

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
