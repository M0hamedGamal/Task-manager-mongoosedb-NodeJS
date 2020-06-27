// Type into terminal -->   npm i mongoose@5.3.16
const mongoose = require('mongoose')

const Task = require('./task')

// Type into terminal -->   npm i validator@10.9.0
const validator = require('validator')

// Type into terminal -->   npm i jsonwebtoken@8.4.0
const jwt = require('jsonwebtoken') // Generate token for every user

// Type into terminal -->   npm i bcryptjs@2.4.3
const bCrypt = require('bcryptjs')  // Use it For hashing items like password

// mongoose.Schema --> take one arg [Object] & allow us to use methods like pre & post  to make some operation on new data
const userSchema = new mongoose.Schema({
    name: { //Name of column

        type: String,   // Type of column
        trim: true,     // Remove spaces before & after name  
        required: true, // Name is required for us

    },
    email: {

        type: String,       // Type of column
        unique: true,       // Make email is unique
        trim: true,         // Remove spaces before & after name  
        required: true,     // Name is required for us
        lowercase: true,   // Store email as lowercase into database
        validate(value) {    // Customize own validation on the value
            if (!validator.isEmail(value)) {  // Check validation of this value as email
                throw new Error('Email is invalid!')
            }
        }
    },
    password: {

        type: String,       // Type of column
        trim: true,         // Remove spaces before & after name  
        required: true,     // Name is required for us
        minlength: 7,       // minimum length is 7
        validate(value) {    // Customize own validation on the value
            if (value.toLowerCase().includes('password')) {   // Check if password of user dosn't contain word of password
                throw new Error('Password cannot contain word of password!')
            }
        }
    },
    age: { // Name of column

        type: Number,   // Type of column
        default: 0      // If user didn't enter his age.. make the default value is 0
    },
    tokens: [{
        token: {    // Token for Authontication of user
            type: String,
            required: true
        }
    }],
    avatar: {           // It's for images
        type: Buffer    // Buffer to store binary data
    }
}, {    // second Object for timestamps  [Create two columns [CreatedAt & UpdatedAt] when create new user or update him]
    timestamps: true    // default value is false
})

// userSchema.virtual --> just virtual storage that means tasks not stored into real database it's relationship between two models (User & Task) 
userSchema.virtual('tasks', {   // tasks --> just name of this virtual collection
    ref: 'Task',    // reference of name of another model
    localField: '_id',  // Property that relationship between ref & foreignField
    foreignField: 'owner'   // the field that want to access with
})

// toJSON --> convert String of Json to Object  [ Calling automatically ]
userSchema.methods.toJSON = function() {    // Regular funtion to able to use this keyword
    const user = this // this has the current user from using 'userSchema'

    const userObject = user.toObject()  // convert to Object

    delete userObject.password  // delete password from appearing to users but still into database
    delete userObject.tokens  // delete tokens from appearing to users but still into database

    return userObject
}

// userSchema.methods -->  Allow us to use this method by Calling it from ObjectOfModelName.NameOfFunction [user.generateAuthToken]   where user =  User(args)
userSchema.methods.generateAuthToken = async function() {   // Regular funtion to able to use this keyword
    const user = this   // this means all data of the user cause we send it into user.js into routers folder
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET) // jwt.sign --> Generate token, takes two args [Object of What we want to token it, Any of secret word] but remember this secret to use it to verify this token to return the original data

    user.tokens = user.tokens.concat({token}) // concat Object of token to store all of new tokens

    await user.save()   // Save user with new token into database

    return token    // return token
}

// userSchema.statics --> Allow us to use this method by Calling it from ModelName.NameOfFunction [User.findByCredentials]
userSchema.statics.findByCredentials = async (email, password) => {  // Method to check success login

    const user = await User.findOne({ email })  // Find single user by his email

    // check if there's user has this email
    if (!user) {
        throw new Error('Unable to fetch this email!')
    }

    // bCrypt.compare(Plain Password from user , Hash Password stored into database)
    // bCrypt.compare --> Hash the plain password & Check if is it matched with hashed password or not
    const isMatched = await bCrypt.compare(password, user.password)

    // check if plain password & hash password are matched
    if (!isMatched) {
        throw new Error('Check your password!')
    }

    return user
}

// userSchema.pre --> make some operation before saving data  |  'save' --> name of event [We need to do some operation before saving]
userSchema.pre('save', async function (next) {
    const userData = this   // Get all data of user to make some operation on what we want

    if (userData.isModified('password')) { // isModified --> built in method to check if arg has been changed or new one

        // 8 --> number of hashing function will be work on plain password [it's suitable for security & speed operation]
        userData.password = await bCrypt.hash(userData.password, 8) // Hash password
    }

    next()  // Tell the function that I'm done with this function.. you can move on. [Make sure this arg in the last of function to stop it]
})

// Auto calling when user is remove himself to delete his tasks too |  'remove' --> name of event [We need to do some operation before removing]
userSchema.pre('remove', async function (next) {
    const user = this

    await Task.deleteMany({ owner: user._id })  // Delete all tasks that the owner has this ID

    next()  // Tell the function that I'm done with this function.. you can move on. [Make sure this arg in the last of function to stop it]
})

// mongoose.model takes two args    (name of collection, userSchema --> object of name & validation columns)
const User = mongoose.model('User', userSchema)

module.exports = User
