const express = require('express')
const db = require('./dbConnectExec.js')
const app = express();
app.use(express.json())

app.get("/hi", (req, res)=> {
    res.send("hello world")
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