const jwt = require('jsonwebtoken')
const config = require('../config.js')
const db = require('../dbConnectExec')

const auth = async(req, res, next)=> {
    // console.log(req.header('Authorization'))
    try{
        // decode token
        let myToken = req.header('Authorization').replace('Bearer ', '')
        //compare token with db token
        let decodedToken  = jwt.verify(myToken, config.JWT)

        let contactPK = decodedToken.pk;

        let query = `SELECT ContactPK, NameFirst, NameLast, Email from Contact where ContactPK = ${contactPK} and Token = ${myToken}`

        let returnedUser = await db.executeQuery(query)
        // console.log(returnedUser)
        //save info in request
        if(returnedUser[0]){
            req.contact = returnedUser[0];
            next()
        }else{
            res.status(401).send('Authentication failed.')
        }

    }catch(myError){
        res.status(401).send("Authentication failed.")
    }
}

module.exports = auth