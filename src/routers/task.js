const express = require('express')

const auth = require('../middleware/auth')

const Task = require('../models/task')

const router = new express.Router()


router.post('/tasks', auth, async (req, res) => { // async await

    const task = new Task({
        ...req.body,            // ... --> Get all of propreties of Task models like [description & compeleted] without typing all of them in seperated key
        owner: req.user._id     // get id of user from auth middleware function
    })

    try {

        // task.save() --> save it into database
        await task.save()       // async await
        res.status(201).send(task)

    } catch (e) {

        res.status(400).send(e)
    }
})

// GET /tasks?completed=true
// GET /tasks?limit=3&skip=3            -->     Get 3 of results only but skip the first 3 of results
// GET /tasks?sortBy=createdAt:desc     --> Sort by CreatedAt
// Also Try GET /tasks?sortBy=createdAt:desc&completed=true
router.get('/tasks', auth, async (req, res) => {
    const match = {} // init empty object
    const sort = {}  // init empty object

    // if req.query.completed is exists get specific data |  Otherwise  get all tasks 
    if(req.query.completed){    // Always enter into 'if statement' cause [ true OR false ] is string value not boolean
        // req.query.completed === 'true'  short of 'if statement'
        // if it true make [match.completed = true] Otherwise make [match.completed = false]
        match.completed = req.query.completed === 'true'
        console.log(match)
    }

    if(req.query.sortBy){    // Always enter into 'if statement' cause [ asc OR desc ] is string value
    // parts = createdAt:desc  |  parts[0] = createdAt  |  parts[1] = desc
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1   //  parts[1] === 'desc' ? -1 : 1 short of 'if statement'
    }

    try {
        // First solution to get all tasks of specific user
        // const task = await Task.find({ 'owner': req.user._id })       // Task --> The main model | find --> read all |   {userId} --> get all tasks of this user
        // res.send(task)

        // Second solution to get all tasks of specific user
        await req.user.populate({   // populate is relationship between Task model & User model takes object...
            path: 'tasks',  // path --> name or path of virtual function into user.js model
            match: match,    // match --> to get specific data from match variable |  for short you can just type 'match' & remove ': match' cause it has the same name of key & value
            options: {
                limit: parseInt(req.query.limit),   // Limit of results | parseInt To convert from String to Integer
                skip: parseInt(req.query.skip),     // Skip number of results.
                sort: sort                          // Sort by asc --> equal value [1] Or desc --> equal value [-1]
            }

        }).execPopulate()   // execute the populate  
        res.send(req.user.tasks)    // req.user.tasks --> virtual function into user.js model

    } catch (error) {

        res.status(500).send(error)        // 500 --> Failed from server
    }
})


router.get('/tasks/:id', auth, async (req, res) => {   //      /:id --> This is a param. You can type it into url of postman 
    //   console.log(req.params)   // req.params --> Try this URL --> http://localhost:3000/tasks/5ecf6d29e3f27a2d84c972cd
    const _id = req.params.id

    try {

        const task = await Task.findOne({ _id, 'owner': req.user._id })          // Find task by ID & its own user

        if (!task) {
            return res.status(404).send()   // Send nothing with status 404 --> NOT Found
        }

        res.send(task)

    } catch (error) {

        res.status(500).send(e)
    }
})


// router.patch --> update data |  CRUD --> Create Read [Update] Delete
router.patch('/tasks/:id', auth, async (req, res) => {   //      /:id --> This is a param. You can type it into url of postman 
    /*
    - Hint: To avoid user type something like that {"hight": 50} into req.body that is not into for our keys. Must make check for it
    */
    const updates = Object.keys(req.body)   // Get Key of req.body that user need to update it
    const allowedUpdates = ['description', 'compeleted']     // Keys that allow to updates
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))  // Check if every key from the user allow to update or not

    if (!isValidOperation) {
        return res.status(404).send({ Error: 'Invalid updates!' })    // routerear error into postman to task & stop here
    }

    //Otherwise

    //   console.log(req.params)   // req.params --> Try this URL --> http://localhost:3000/tasks/5ecf6d29e3f27a2d84c972cd

    const _id = req.params.id   // Get id from param

    try {

        const task = await Task.findOne({ _id, 'owner': req.user._id })          // Find task by ID & its own user

        if (!task) {
            return res.status(404).send()   // Send nothing with status 404 --> NOT Found
        }

        updates.forEach((update) => task[update] = req.body[update])

        // task.save() --> save it into database
        await task.save()       // async await

        res.send(task)

    } catch (e) {

        res.status(500).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {

    //   console.log(req.params)   // req.params --> Try this URL --> http://localhost:3000/tasks/5ecf6d29e3f27a2d84c972cd

    const _id = req.params.id

    try {

        const task = await Task.findByIdAndDelete({ _id, 'owner': req.user._id })  // Find task by ID & owner ID to Delete it

        if (!task) {
            return res.status(404).send({ error: 'task is not found' })
        }

        res.send(task)

    } catch (error) {

        return res.status(500).send()

    }

})

module.exports = router