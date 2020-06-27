const express = require('express')

require('./mongoosedb/mongoosedb')  // connect with file that has connect with database

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(userRouter) // app.use take one arg (Router) --> Register Router function to work with express application   Check user.js into routers folder 
app.use(taskRouter)

app.listen(port, () => {
    console.log('Server is up on port: ' + port)
})
