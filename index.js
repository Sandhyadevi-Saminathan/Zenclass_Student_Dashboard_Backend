const express = require("express");
const dotenv = require("dotenv").config();
const mongodb = require("mongodb")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoclient = mongodb.MongoClient;
const URL = process.env.Db

const cors = require("cors")
const app = express();
const SECRET = process.env.Secret;

const nodemailer = require('nodemailer');
const rn = require('random-number');


const options = {
    min: 1000,
    max: 9999,
    integer: true
}
app.use(cors({
    origin: "*"
}))
app.use(express.json());

const authorize = (req, res, next) => {
    if (req.headers.authorization) {
        try {
            const verify = jwt.verify(req.headers.authorization, SECRET);
            if (verify) {
                next();
            }
        } catch (error) {
            res.status(401).json({ message: "Unauthorized" });
        }
    } else {
        res.status(401).json({ message: "Unauthorized" });
    }
}

//Register
app.post('/register', async (req, res) => {

    try {

        let connection = await mongoclient.connect(URL);
        let db = connection.db('zen');
        const collection = db.collection("register")
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req.body.password, salt);
        req.body.password = hash;
        const operations = await collection.insertOne({ ...req.body, isDeleted: false })
        await connection.close();
        res.json({ message: "User Registered" })
    } catch (error) {
        console.log(error)
    }

})

//Login
app.post('/login', async (req, res) => {
    try {
        let connection = await mongoclient.connect(URL);
        let db = connection.db('zen');
        const collection = db.collection("register");
        const user = await collection.findOne({ email: req.body.email });

        if (user) {
            let passwordResult = await bcrypt.compare(req.body.password, user.password);
            if (passwordResult) {
                const token = jwt.sign({ userid: user._id }, SECRET, { expiresIn: '1h' })
                console.log(token)
                console.log(user)
                res.json({ message: "Login Success", token, user })

            }
            else {
                res.json({ message: "Email id or password do not match" })
            }
        } else {
            res.json({ message: "Email id or password donot match" });
        }
    } catch (error) {
        console.log(error)
    }
})

//Profile
app.get('/profile/:id', authorize, async (req, res) => {
    try {
        let connection = await mongoclient.connect(URL);
        let db = connection.db('zen');
        let objId = new mongodb.ObjectId(req.params.id)
        let users = await db.collection("register").findOne({ _id: objId });
        res.json(users);
        await connection.close()
    } catch (error) {
        console.log('User Not Found')
    }
})

//Update the profile
app.put('/update/:id', authorize,
    async function (req, res) {
        console.log(req.body)
        try {
            let connection = await mongoclient.connect(URL);
            let db = connection.db('zen');
            let objId = new mongodb.ObjectId(req.params.id);

            let user = await db.collection('register').findOneAndUpdate({ _id: objId }, {
                $set: {
                    fname: req.body.fname,
                    lname: req.body.lname,
                    email: req.body.email,
                    phone: req.body.phone
                }
            },
                { upsert: false });

            res.json({ message: 'user updated' }
            )

        } catch (error) {
            console.log(error)
            console.log('user update error')
        }
    })

//get the class details
app.get("/class/:id", authorize, async (req, res) => {

    try {

        const connection = await mongoclient.connect(URL)

        const db = connection.db("zen")
        const collection = db.collection("class")
        const operation = await collection.find({ name: req.params.id }).toArray();

        console.log(operation)
        await connection.close()



        res.json(operation)

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

//get the task questions
app.get("/activity/:id", authorize, async (req, res) => {
    console.log("hi")
    try {

        const connection = await mongoclient.connect(URL)

        const db = connection.db("zen")
        const collection = db.collection("activity")
        const operation = await collection.find({ name: req.params.id }).toArray();

        console.log(operation)
        await connection.close()



        res.json(operation)

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})


//submit the task
app.post("/task/:id", authorize, async (req, res) => {

    try {

        const connection = await mongoclient.connect(URL)


        const db = connection.db("zen")
        const collection = db.collection("task")
        const operation = await collection.findOneAndUpdate(
            { state: req.params.id },
            { $set: req.body },
            { upsert: true }

        );
        console.log(operation)
        await connection.close()


    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

// get the submitted task details
app.get("/task/:id", authorize, async (req, res) => {

    try {

        const connection = await mongoclient.connect(URL)

        const db = connection.db("zen")
        const collection = db.collection("task")
        const operation = await collection.find({ id: (req.params.id) }).toArray();

        console.log(operation)
        await connection.close()



        res.json(operation)

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

//get the webcode question
app.get("/webcode", authorize, async (req, res) => {

    try {

        const connection = await mongoclient.connect(URL)

        const db = connection.db("zen")
        const collection = db.collection("webcode")
        const operation = await collection.find({}).toArray();

        console.log(operation)
        await connection.close()



        res.json(operation)

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

//Submit the webcode
app.post("/webcodedet/:id", authorize, async (req, res) => {
    try {

        const connection = await mongoclient.connect(URL)


        const db = connection.db("zen")
        const collection = db.collection("webcodedet")
        const operation = await collection.findOneAndUpdate(
            { _id: new mongodb.ObjectId(req.params.id) },
            { $set: req.body },
            { upsert: true }

        );
        await connection.close()
        res.json({ message: "Webcode Submitted" })

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

//get the submitted webcode details
app.get("/webcodedet/:id", authorize, async (req, res) => {

    try {

        const connection = await mongoclient.connect(URL)

        const db = connection.db("zen")
        const collection = db.collection("webcodedet")
        const operation = await collection.find({ _id: new mongodb.ObjectId(req.params.id) }).toArray();

        console.log(operation)
        await connection.close()



        res.json(operation)

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

//post the query
app.post("/query", authorize, async (req, res) => {
    try {

        const connection = await mongoclient.connect(URL)


        const db = connection.db("zen")
        const collection = db.collection("query")
        const operation = await collection.insertOne(req.body);
        await connection.close()
        res.json({ message: "Query Submitted" })

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

//get the query details
app.get("/query/:id", authorize, async (req, res) => {

    try {

        const connection = await mongoclient.connect(URL)

        const db = connection.db("zen")
        const collection = db.collection("query")
        const operation = await collection.find({ id: req.params.id }).toArray();

        console.log(operation)
        await connection.close()


        res.json(operation)

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

//submit the portfolio
app.post("/portfolio/:id", authorize, async (req, res) => {
    try {

        const connection = await mongoclient.connect(URL)


        const db = connection.db("zen")
        const collection = db.collection("portfolio")
        const operation = await collection.findOneAndUpdate(
            { _id: new mongodb.ObjectId(req.params.id) },
            { $set: req.body },
            { upsert: true }

        );
        console.log(operation)
        await connection.close()
        res.json({ message: "Portfolio Submitted" })

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

//get the submitted portfolio details
app.get("/portfolio/:id", async (req, res) => {

    try {

        const connection = await mongoclient.connect(URL)

        const db = connection.db("zen")
        const collection = db.collection("portfolio")
        const operation = await collection.find({ _id: new mongodb.ObjectId(req.params.id) }).toArray();

        console.log(operation)
        await connection.close()



        res.json(operation)

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

// submit the leave
app.post("/leave", async (req, res) => {
    try {

        const connection = await mongoclient.connect(URL)


        const db = connection.db("zen")
        const collection = db.collection("leave")
        const operation = await collection.insertOne(req.body);
        await connection.close()
        res.json({ message: "Leave application Submitted" })

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

//get our leave details
app.get("/leaves/:id", authorize, async (req, res) => {

    try {

        const connection = await mongoclient.connect(URL)

        const db = connection.db("zen")
        const collection = db.collection("leave")
        const operation = await collection.find({ id: req.params.id }).toArray();

        console.log(operation)
        await connection.close()



        res.json(operation)

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

//submit the testmonial
app.post("/testmo", authorize, async (req, res) => {
    try {

        const connection = await mongoclient.connect(URL)


        const db = connection.db("zen")
        const collection = db.collection("testmonial")
        const operation = await collection.insertOne(req.body);
        await connection.close()
        res.json({ message: "Testimonial Submitted" })

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

//get the submitted testimonial details
app.get("/testmonial/:id", authorize, async (req, res) => {

    try {

        const connection = await mongoclient.connect(URL)

        const db = connection.db("zen")
        const collection = db.collection("testmonial")
        const operation = await collection.find({ id: req.params.id }).toArray();

        console.log(operation)
        await connection.close()



        res.json(operation)

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

//get the placed student details
app.get("/placement", authorize, async (req, res) => {

    try {

        const connection = await mongoclient.connect(URL)

        const db = connection.db("zen")
        const collection = db.collection("placement")
        const operation = await collection.find({}).toArray();

        console.log(operation)
        await connection.close()



        res.json(operation)

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

//forget password  
app.post('/mail', async function (req, res) {

    try {
        let connection = await mongoclient.connect(URL);
        let db = connection.db('zen');

        let user = await db.collection("register").findOne({ email: req.body.email });
        res.json(user)
        if (user) {
            let randomnum = rn(options)
            await db.collection('register').updateOne({ email: req.body.email }, { $set: { rnum: randomnum } });
            var sender = nodemailer.createTransport({

                service: "gmail",
                host: "smtp.gmail.com",
                secure: false,
                auth: {
                    user: 'sandhyadevi0229@gmail.com',
                    pass: 'guurmubpamqfohmf'
                }
            });

            var composemail = {
                from: "sandhyadevi0229@gmail.com",
                to: `${req.body.email}`,
                subject: 'Password Reset mail',
                text: `Verification code is ${randomnum}`,


            };



            sender.sendMail(composemail, function (error, info) {
                if (error) {
                    console.log(error);
                    res.json({
                        message: "Error"
                    })
                } else {
                    console.log('Email sent: ' + info.response);
                    res.json({
                        message: "Email sent"
                    })
                }
            });
        }
        else {
            res.status(400).json({ message: 'User not found' })
        }
    }
    catch (err) {
        console.log(err)
    }


})

//verification
app.post('/verification/:id', async function (req, res) {
    try {
        let connection = await mongoclient.connect(URL);
        let db = connection.db('zen');
        let objId = new mongodb.ObjectId(req.params.id)
        let user = await db.collection('register').findOne({ _id: objId });
        if (user.rnum == req.body.vercode) {
            res.status(200).json(user)
        }
        else {
            res.status(400).json({ message: "Invalid Verification Code" })
        }
    }
    catch (error) {
        console.log(error)
    }
})

//change password
app.post('/ChangePassword/:id', async function (req, res) {
    try {

        const connection = await mongoclient.connect(URL);
        const db = connection.db('zen');
        let objId = new mongodb.ObjectId(req.params.id)
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req.body.password1, salt);
        req.body.password1 = hash;
        let user = await db.collection('register').findOneAndUpdate({ _id: objId }, { $set: { "password": req.body.password1 } })
        console.log(user)
        db.collection('register').findOneAndUpdate({ _id: objId }, { $unset: { "rnum": 1 } }, false, true);
        db.collection('register').findOneAndUpdate({ _id: objId }, { $unset: { "password1": 1 } }, false, true);
        let users = await db.collection('register').findOneAndUpdate({ _id: objId }, { $unset: { "password2": 1 } }, false, true);
        console.log(users)
        res.json({ message: "Password updated successfully" })
        await connection.close();
    } catch (error) {
        console.log(error);
    }
})

//Admin side

// post the class details
app.post("/class", authorize, async (req, res) => {
    try {

        const connection = await mongoclient.connect(URL)


        const db = connection.db("zen")
        const collection = db.collection("class")
        const operation = await collection.insertOne(req.body);
        await connection.close()
        res.json({ message: "User Inserted" })

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})
//post the task questions
app.post("/activity", authorize, async (req, res) => {
    try {

        const connection = await mongoclient.connect(URL)


        const db = connection.db("zen")
        const collection = db.collection("activity")
        const operation = await collection.insertOne(req.body);
        await connection.close()
        res.json({ message: "Activity Updated" })

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})
//post the webcode question
app.post("/webcode", authorize, async (req, res) => {
    try {

        const connection = await mongoclient.connect(URL)


        const db = connection.db("zen")
        const collection = db.collection("webcode")
        const operation = await collection.insertOne(req.body);
        await connection.close()
        res.json({ message: "Webcode Assigned" })

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})

// post the placement board details
app.post("/placement", authorize, async (req, res) => {
    try {

        const connection = await mongoclient.connect(URL)


        const db = connection.db("zen")
        const collection = db.collection("placement")
        const operation = await collection.insertOne(req.body);
        await connection.close()
        res.json({ message: "User Inserted" })

    } catch (error) {
        console.log(error);
        console.log("error")
        res.status(500).json({ message: "something went wrong" })
    }

})




app.listen(process.env.PORT || 8000)