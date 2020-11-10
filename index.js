const express = require('express')
const db = require('./dbConnectExec.js')
const app = express();
const jwt = require('jsonwebtoken')
const config = require('./config.js')
const bcrypt = require('bcryptjs')
app.use(express.json())
const auth = require('./middleware/authenticate');
const { request, query } = require('express');


app.get("/hi", (req, res)=> {
    res.send("hello world")
})

app.post('/contacts/logout', auth, (req, res) => {
    var query = `Update Contact set Token = NULL where ContactPK = ${req.contact.ContactPK}`

    db.executeQuery(query)
    .then(() => {res.status(200).send()})
    .catch((error)=>{
        console.log("error in POST /contacts/logout", error)
        res.status(500).send()
    })
})

// app.get('/reviews/me',  auth, async (req, res) => {
//     let contactPK = req.contact.ContactPK;
//     //run query to get all records of transaction from a user
// })

app.get("/", (req, res) => {res.send("Hello World")})

app.post("/reviews", auth, async (req, res) => {

    try{
        var movieFK = req.body.movieFK;
        var summary = req.body.summary;
        var rating = req.body.rating;
    
        if(!movieFK || !summary || !rating){
            res.status(400).send("bad request")
        }
        summary = summary.replace("'", "''")

        let insertQuery = `Insert into Review(Summary, Rating, MovieFK, ContactFK) 
        output inserted.ReviewPK, inserted.Summary, inserted.Rating, inserted.MovieFK
        values (${summary}, ${rating}, ${movieFK}, ${req.ContactPK})`

        let insertedReview = await db.executeQuery(insertQuery)

        res.status(200).send(insertedReview[0])
    }
    catch(error){
        console.log("error in POST /review", error);
        res.status(500).send()
    }
   
})

app.get('/contacts/me', auth, (req, res) => {
    res.send(req.contact)
})

app.post("/contacts/login", async (req, res) => {
    // console.log(req.body)

    var email = req.body.email;
    var password = req.body.password;

    if(!email || !password){
        return res.status(400).send('bad request')
    }

    var query = `Select * from contact where email = '${email}'`

    let result;
    try{
        result = await db.executeQuery(query);
    }
    catch(myError){
        console.log("error in contact login", myError)
        return res.status(500).send();
    }

    // console.log(result)

    if(!result[0]){
        return res.status(400).send('Invalid credentials')
    }

    let user = result[0];

    if(!bcrypt.compareSync(password, user.Password)){
        return res.status(400).send('Invalid credentials')
    }

    let token = jwt.sign({pk: user.ContactPK}, config.JWT, {expiresIn: '60 minutes'})

    // console.log(token)

    let setTokenQuery = `update contact set token = '${token}' where ContactPK = ${user.ContactPK}`

    try{
        await db.executeQuery(setTokenQuery)

        res.status(200).send({
            token: token,
            user: {
                NameFirst: user.NameFirst,
                NameLast: user.NameLast,
                Email: user.Email,
                ContactPK: user.ContactPK
            }
        })
    }
    catch(myError){
        console.log("error setting user token ", myError);
        res.status(500).send()
    }


})

app.post("/contacts", async (req, res) => {
    // res.send("creating user")
    // console.log("body", req.body)

    var nameFirst = req.body.nameFirst;
    var nameLast = req.body.nameLast;
    var email = req.body.email;
    var password = req.body.password; 

    if (!nameFirst || !nameLast || !email || !password){
        return res.status(400).send("bad request")
    }

    nameFirst = nameFirst.replace("'", "''")

    nameLast = nameLast.replace("'", "''")

    var emailCheckQuery = `Select email
    from contact
    where email = '${email}'`

   var exsistingUser = await db.executeQuery(emailCheckQuery)

   if( exsistingUser[0]){
    return res.status(409).send('Please enter a different email.')
   }

   var hashedPassword = bcrypt.hashSync(password)
   var insertQuery = `Insert into Contact(NameFirst, NameLast, Email, Password)
   values ('${nameFirst}', '${nameLast}', '${email}', '${hashedPassword}')`

   db.executeQuery(insertQuery).then(()=> {
       res.status(201).send()
   })
   .catch((err) => {
       console.log("error in POST /contacts", err)
       res.status(500).send()
   })

})
// app.post()
// app.put()
// app.delete()

app.get("/movies", (req, res) => {
    //get data from database
    db.executeQuery(
        `SELECT * from movie 
        left join Genre 
        on Genre.GenrePK = Movie.GenreFK`)
        .then( (result) => {
            res.status(200).send(result)
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send()
        })
})

app.get("/movies/:pk", (req, res) => {
    var pk = req.params.pk
    // console.log("pk:", pk)
    var myQuery = `SELECT * from movie left join Genre on Genre.GenrePK = Movie.GenreFK
    WHERE moviePK = ${pk}`

    db.executeQuery(myQuery)
        .then((movies) => {
            // console.log("movies: " + movies)
            if(movies[0]){
                res.send(movies[0])
            }else{
                res.status(404).send('bad request')
            }
        })
        .catch((err) => {
            console.log("Error in /movies/pk", err)
            res.status(500).send()
        })
})

app.listen(5000, () => {
    console.log("app is running on port 5000")
})