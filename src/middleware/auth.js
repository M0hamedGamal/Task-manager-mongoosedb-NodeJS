const jwt = require('jsonwebtoken')

const User = require('../models/user')

const auth = async (req, res, next) => {
    try {
        // Authorization --> key of req.header of postman & i need its value [token] without 'Bearer ' so we used replace function
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)   // Get original data that lives into token by own secret word that i used it before to sign the token
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token})  // Find the user by _id & this active token  [will be in until user sign up]

        // if user not found Or sign up
        if(!user){
            throw new Error()
        }
        // otherwise

        // req.token OR req.user Means that send these data to server until I call them
        req.token = token   // Store token of this user into req.token
        req.user = user     // Store data of this user into req.user
        next()  // Go to next function check it... [ New request to route (Get Post Update Delete) /user --> Middleware function to do something (Authorization) --> run route handler (req, res)]

    } catch (e) {
        res.status(401).send({ error: 'Please authenticate!' })

    }
}

module.exports = auth