const mongoose = require('mongoose');

const User = new mongoose.Schema({
    displayName:{
        type: String,
        required: [true, "Username is required"],
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [10, 'Username cannot be more than 10 characters'],
        trim: true,
    },
    email:{
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [  /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
            'Please provide a valid email address',]
    },
    password:{
        type: String,
        required: [true, 'Password is required'],
        minLength: [8, 'Password must be at least 8 characters long'],
        maxlength: [100, 'Password cannot be more than 100 characters long']
    },
    role:{
        type: String,
        enum: ['Student', 'Organization'],
        required: true,
        default: 'Student',
        

    },
    avatar: { type: String, default: 'https://api.dicebear.com/7.x/avatars/svg' }
},
{
    collection: 'user-data'
}

)

const model = mongoose.model('UserData', User)
module.exports = model