const express = require('express')
//  Type in terminal --> npm i multer@1.4.1
const multer = require('multer')            // For uploading files
//  Type in terminal --> npm i sharp@0.25.3
const sharp = require('sharp')            // To modify image

const auth = require('../middleware/auth')
const User = require('../models/user')

const router = new express.Router()


// router.post --> send data to server |  CRUD --> [Create] Read Update Delete
// don't forget to change GET to POST cause you use 'router.post'
// Sign up user
router.post('/users', async (req, res) => {   // /user --> is a route     | async await

    // console.log(req.body)   // req.body --> get data from body of postman   

    // Create collection by sending object of data to constructor of User as a param 
    const user = new User(req.body)    // req.body --> get data from body of postman

    try {
        // user.save() --> save it into database
        await user.save()       // async await
        const token = await user.generateAuthToken()   // get token of the user by calling method
        res.status(201).send({ user, token })  // status(201) --> Created 'Check status of postman' | send --> Send back data to user from server


    } catch (e) {
        res.status(400).send(e)  // status(400) --> Bad Request 'Check status of postman'
    }
})

router.post('/users/login', async (req, res) => {   // Login user

    try {

        // findByCredentials is Own method into User model to open specific user by email & password
        const userLogin = await User.findByCredentials(req.body.email, req.body.password)
        const token = await userLogin.generateAuthToken()   // get token of the user by calling method
        res.send({ userLogin, token })

    } catch (error) {

        res.status(404).send(error)

    }
})

router.post('/users/logout', auth, async (req, res) => { // Logout of this user from single account [Single Pc or mobile].
    try {

        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token    // token has {_id & token} so we type token.token to return the token
        })

        await req.user.save()   // Save new data into database

        res.status(200).send({ logOut: 'Logout correctly from this Pc or labtop or even mobile' })

    } catch (error) {

        res.status(500).send()
    }

})

router.post('/users/logoutAll', auth, async (req, res) => { // Logout all of accounts of this user [All of Pcs or mobiles].
    try {

        req.user.tokens = []    // Delete all tokens

        await req.user.save()

        res.status(200).send({ logOut: 'Logout correctly from all your accounts ' })

    } catch (error) {

        res.status(500).send()
    }

})



// router.get --> get data from server |  CRUD --> Create [Read] Update Delete
// don't forget to change POST to GET cause you use 'router.get'
router.get('/users/me', auth, async (req, res) => { // auth is middleware function.

    res.send(req.user) // req.user --> get data of single user check auth.js file into middleware folder   

})

router.get('/users/:id', async (req, res) => {   //      /:id --> This is a param. You can type it into url of postman 
    //   console.log(req.params)   // req.params --> Try this URL --> http://localhost:3000/users/5ecf6d29e3f27a2d84c972cc
    const _id = req.params.id

    try {

        const user = await User.findById(_id)          // Find user by ID

        if (!user) {

            return res.status(404).send()   // Send nothing with status 404 --> NOT Found
        }

        res.send(user)

    } catch (error) {

        res.status(500).send(e)
    }
})

// router.patch --> update data |  CRUD --> Create Read [Update] Delete
router.patch('/users/me', auth, async (req, res) => {   //      /:id --> This is a param. You can type it into url of postman 
    /*
    - Hint: To avoid user type something like that {"hight": 50} into req.body that is not into for our keys. Must make check for it
    */
    const updates = Object.keys(req.body)   // Get Key of req.body that user need to update it
    const allowedUpdates = ['name', 'email', 'password', 'age']     // Keys that allow to updates
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))  // Check if every key from the user allow to update or not

    if (!isValidOperation) {
        return res.status(404).send({ Error: 'Invalid updates!' })    // routerear error into postman to user & stop here
    }

    //Otherwise

    //   console.log(req.user)   // req.user --> Coming from auth [middleware function]
    try {
        updates.forEach((update) => req.user[update] = req.body[update])   // Update user data by entering new data from user into body of postman  

        // req.user.save() --> save it into database
        await req.user.save()       // async await

        res.send(req.user)  // Appear data to user from server

    } catch (e) {

        res.status(500).send(e)
    }
})


// router.delete --> update data |  CRUD --> Create Read Update [Delete]
router.delete('/users/me', auth, async (req, res) => {

    //   console.log(req.user)   // req.user --> Coming from auth [middleware function]
    try {

        await req.user.remove() // Remove it from database
        res.send(req.user)

    } catch (error) {

        return res.status(500).send()

    }

})

// Store the uploading files into folder.
const upload = multer({
    // by comment 'dest: 'avatars'' , I able to store image into database as a binary.
    // dest: 'avatars',         // dest --> Destination for creating folder called 'avatars' automatically.
    limits: {                // limits --> Limit the upload size to 1Mb
        fileSize: 1000000    // 1,000,000 = 1Mb
    },
    fileFilter(req, file, callback) {
        // file.originalname --> Name of file into user's pc
        // /\.(jpg|jpeg|png)$/ --> Regex | / / --> use regex | \. --> looking for string of .(extension) | $ --> in the end of name
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {  // file.originalname.match() return true or false
            return callback(new Error('Please provide an image has extension JPG or JPEG or PNG'))
        }

        callback(undefined, true)

    }
})

// post to upload files into this path '/users/me/avatar'
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {  // upload.single('avatar') is middleware too | avatar --> Key of value of files into body/form-data of postman
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()  // modify the image
    req.user.avatar = buffer       // Store buffer of image into avatar column

    await req.user.save()                   // Save buffer of image into database

    res.send()

}, (error, req, res, next) => {         // Handle the error of upload.single
    res.status(400).send({ error: error.message })
})

// get --> to get uploaded image
router.get('/users/:id/avatar', async (req, res) => {

    const user = await User.findById(req.params.id) // find user by ID
   
    // Check if no user or no image
    if(!user || !user.avatar){
       return res.status(404).send({ error: 'User/Image not found' })
    }

    res.set('Content-Type','image/png') // key value pair to tell the server the type of this data [in this case it's image.png]
    res.send(user.avatar)               // send the image from server to user

})

// delete  uploaded image
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined       // Clear avatar column

    await req.user.save()                   // Save user data into database

    res.send()

})

module.exports = router     // Share router var to other files.