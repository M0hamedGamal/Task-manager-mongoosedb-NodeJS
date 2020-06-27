/* 
Hint: You must executable database into another terminal in my case Type like this:
c:\Users\'NameOfPC'\mongodb\mongodb-win32-x86_64-2012plus-4.2.7\bin\mongod.exe --dbpath C:/Users/'NameOfPC'/mongodb-data 
*/

// Type into terminal -->   npm i mongoose@5.3.16
const mongoose = require('mongoose')

// mongoose.connect --> Setup connection with database 
mongoose.connect(process.env.MONGODB_URL, // URL of database / Name of table to create it for us
    {
        useNewUrlParser: true,     // useNewUrlParser --> allow us to use own url connection 
        useCreateIndex: true        // useCreateIndex  --> allow us to know when mongooseDB connect with mongoDB
    }
)
