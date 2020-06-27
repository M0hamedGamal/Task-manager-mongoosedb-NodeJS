// Type into terminal -->   npm i mongoose@5.3.16
const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    description: {

        type: String,
        trim: true,
        required: true,

    },

    completed: {

        type: Boolean,
        default: false
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,   // Get Owner of task by his ID
        required: true,
        ref: 'User'     // reference of name of another model
    }
}, {    // seond Object for timestamps  [Create two columns [CreatedAt & UpdatedAt] when create new task or update him]
    timestamps: true    // default value is false
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task