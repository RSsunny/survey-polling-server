const express = require("express");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.PAYMENT_SECRET_SK);
const port = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8eq7kh0.mongodb.net/?retryWrites=true&w=majority`;

// parser
app.use(express.json());
app.use(
  cors({
    // origin: ["https://marvelous-squirrel-2e9a26.netlify.app"],
    origin: ["http://localhost:5173"],
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
    // await client.connect();
    // Send a ping to confirm a successful connection
    const usersCollection = client.db("surveyDB").collection("users");
    const surveyCollection = client.db("surveyDB").collection("survey");

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

    // payment
    app.post("/create-payment-intent", async (req, res) => {
      try {
        const { price } = req.body;

        const dollar = parseInt(price) * 100;
        console.log(dollar);

        const paymentIntent = await stripe.paymentIntents.create({
          amount: dollar,
          currency: "usd",
          payment_method_types: ["card"],
        });
        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        {
          message: "data not found";
        }
      }
    });
    // admin

    app.get("/api/v1/usersroll/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const user = await usersCollection.findOne(query);
        const roll = user?.roll;
        res.send(roll);
      } catch (error) {
        res.send({ message: "user not found" });
      }
    });

    // users Collection CURD
    app.get("/api/v1/users", async (req, res) => {
      try {
        const result = await usersCollection.find().toArray();
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
        const user = req.body;
        const filter = { email: user?.email };
        const query = await usersCollection.findOne(filter);
        if (query) {
          return res.send({ message: "all ready exist" });
        }
        const result = await usersCollection.insertOne(user);
        res.send({ message: "success" });
      } catch (error) {
        res.send({ message: "faild" });
      }
    });

    app.patch("/api/v1/users/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const filter = { email: email };
        const userinfo = req.body;

        const updateDoc = {
          $set: userinfo,
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send({ message: true });
      } catch (error) {
        res.send({ message: false });
      }
    });
    app.patch("/api/v1/usersroll/:id", async (req, res) => {
      try {
        console.log("achi");
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };

        const userinfo = req.body;
        console.log(userinfo);
        const updateDoc = {
          $set: userinfo,
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send({ message: true });
      } catch (error) {
        res.send({ message: false });
      }
    });

    // survey collection CURD Oparetion
    app.get("/api/v1/survey", async (req, res) => {
      try {
        let surveyObj = {};
        const category = req.query?.category;

        if (category) {
          surveyObj.category = category;
        }

        const result = await surveyCollection.find(surveyObj).toArray();
        res.send(result);
      } catch (error) {
        res.send([]);
      }
    });
    app.get("/api/v1/survey/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const query = { _id: new ObjectId(id) };
        const result = await surveyCollection.findOne(query);
        res.send(result);
      } catch (error) {
        res.send({});
      }
    });
    app.get("/api/v1/mysurvey", async (req, res) => {
      try {
        let surveyObj = {};
        const email = req.query?.email;
        console.log(email);
        if (email) {
          surveyObj.email = email;
        }

        const result = await surveyCollection.find(surveyObj).toArray();
        res.send(result);
      } catch (error) {
        res.send([]);
      }
    });
    app.post("/api/v1/survey", async (req, res) => {
      try {
        const data = req.body;
        const result = await surveyCollection.insertOne(data);
        res.send({ message: "success" });
      } catch (error) {
        res.send({ message: false });
      }
    });
    app.patch("/api/v1/survey/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const data = req.body;

        const updateDoc = {
          $set: data,
        };
        const result = await surveyCollection.updateOne(query, updateDoc);
        res.send({ message: "success" });
      } catch (error) {
        res.send({ message: false });
      }
    });
    app.patch("/api/v1/surveyreport/:id", async (req, res) => {
      try {
        const id = req.params.id;
        console.log(id);
        const query = { _id: new ObjectId(id) };

        const data = req.body;
        console.log(data);

        const updateDoc = {
          $set: data,
        };
        const result = await surveyCollection.updateOne(query, updateDoc);
        res.send({ message: "success" });
      } catch (error) {
        res.send({ message: "dhfhfdhf" });
      }
    });
    app.patch("/api/v1/surveydislike/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const data = req.body.disLike;
        console.log(data);
        const updateDoc = {
          $set: {
            disLike: data,
          },
        };
        const result = await surveyCollection.updateOne(query, updateDoc);
        res.send({ message: "success" });
      } catch (error) {
        res.send({ message: false });
      }
    });
    app.patch("/api/v1/surveylike/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const data = req.body.like;
        console.log(data);
        const updateDoc = {
          $set: {
            like: data,
          },
        };
        const result = await surveyCollection.updateOne(query, updateDoc);
        res.send({ message: "success" });
      } catch (error) {
        res.send({ message: false });
      }
    });
    app.patch("/api/v1/surveyvote/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const data = req.body;
        const votar = data?.votarName;
        const matchemail = { votarName: votar };
        console.log(matchemail);

        const updateDoc = {
          $set: data,
        };
        const result = await surveyCollection.updateOne(query, updateDoc);
        res.send({ message: "success" });
      } catch (error) {
        res.send({ message: false });
      }
    });

    // await client.db("admin").command({ ping: 1 });
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
