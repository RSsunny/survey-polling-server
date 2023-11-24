const express = require("express");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8eq7kh0.mongodb.net/?retryWrites=true&w=majority`;
// parser
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5174"],
    credentials: true,
    optionSuccessStatus: 200,
  })
);

// data base conection
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
    await client.connect();
    // Send a ping to confirm a successful connection
    const usersCollection = client.db("surveyDB").collection("users");

    // jwt api
    app.post("/api/v1/jwt", async (req, res) => {
      try {
        const data = req.body;
        const token = jwt.sign(data, process.env.TOKEN_SECRET_KEY, {
          expiresIn: "2h",
        });
        res.send(token);
      } catch (error) {
        console.log(error);
      }
    });

    // users Collection CURD
    app.get("/api/v1/users", async (req, res) => {
      try {
        const result = await usersCollection.find().toArray;
        res.send(result);
      } catch (error) {
        res.send([]);
      }
    });
    app.get("/api/v1/users/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const result = await usersCollection.findOne(query);
        res.send(result);
      } catch (error) {
        res.send({});
      }
    });
    app.post("/api/v1/users", async (req, res) => {
      try {
        const data = req.body;
        const result = await usersCollection.insertOne(data);
        res.send({ message: "success" });
      } catch (error) {
        res.send({ message: "faild" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("surver running.....");
});
app.listen(port, () => {
  console.log("server running ", port);
});
