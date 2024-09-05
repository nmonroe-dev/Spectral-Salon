require("dotenv").config()


const MongoClient = require("mongodb").MongoClient;
mongoUrl = process.env.mongoUrl;
const { error } = require("console");
const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 2008;
const app = express();


app.use(express.json());
app.use(express.urlencoded({extended: true}));


MongoClient.connect(mongoUrl)
.then(client => {
    console.log("Connected to Mongo");
    const db = client.db("HS2");
    const collections = db.collection("bookings");


    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "..", "public", "index.html"))
    });


    app.get("/bookings", (req, res) => {
        collections.find().toArray()
          .then((results) => {
            const clanderFormat = results.map(booking => ({
                title: `${booking.name} - ${booking.service}`,
                start: booking.date,
                allDay: true

            }))
            
            res.json(clanderFormat); 
          })
          .catch((error) => {
            console.error("Error fetching bookings", error);
            res.status(500).send("Error fetching bookings");
          });
      });

    app.post("/bookings", (req, res) => {
        console.log("Atemping to POST....")
        const data = req.body;

        if (!data.name || !data.email || !data.service || !data.date) {
            return res.status(400).json("Name, Email, Service, and Date are required.");
        }

        collections.findOne({ date: data.date, stylist: data.stylist })
       
      .then(existingBooking => {
        if(existingBooking) {
            return res.status(400).json("This time slot is already booked.");
        }

      })




        
        collections.insertOne(data)
        .then(result => {
            console.log(result)
            res.redirect("/")
        })
        .catch(error => {
            console.error("Error adding booking",error)
            res.status(505)
        })
        
    });

    app.listen(PORT, ()=> {
        console.log(`Running at http://localhost:${PORT}`)
    });


    app.use(express.static(path.join(__dirname, "..", "public")))

})
.catch(error => {
    console.error("Error unable to connect to Mongo");
});