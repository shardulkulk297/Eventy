const express = require('express');
const app = express();
const cors = requrire('cors');
const mongoose = require('mongoose');
app.use(cors());

const User = require('./models/user.model');
const jwt = require('jsonwebtoken')

mongoose.connect('mongodb://127.0.0.1:27017/eventy')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err))

app.use(express.json());

app.get('/hello', (req, res) => {
    res.send('Hello world');
})

app.post('/api/register', async (req, res) => {
    try {
        const { displayName,
            email,
            password,
            role,
        } = req.body;

        await User.create({
            displayName, email, password, role
        })

        res.json({ status: 'ok', user: true, message: 'Registered Successfully' })

        console.log(req.body);

    }

    catch(err){

        if(err.name === 'ValidationError')
        {
            const errorMessages = Object.values(err.errors).map(error => error.message)
            res.status(400).json({status: 'error', error: errorMessages})
        }
        else if(err.code === 11000)
        {
            res.status(400).json({status: 'error', error: ['Email already exists']})
        }
        else
        {
            res.status(500).json({status: 'error', error: 'An unexpected error occurred'})
        }

    }
    
})

app.post('api/login', async (req, res)=>{
    try {

        const {email, password} = req.body;
        
        const user = await User.findOne({email, password})

        if(user)
        {
            const token = jwt.sign({
                displayName: user.displayName,
                email: user.email,

            }, 'eventy@297')

            return res.json({status: 'ok', user: token});
        }
        else
        {
            return res.json({status: 'error', user: false, message: 'User Not Found'});
        }
        
    } catch (error) {
        console.log(error);
        return res.json({status: 'error', user: false, message: 'An unexpected error occurred'});
        
    }
})

