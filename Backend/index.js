const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
app.use(cors());
const bcrypt = require('bcrypt');

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

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            displayName, email, password: hashedPassword, role
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

app.post('/api/login', async (req, res)=>{
    try {

        const {email, password} = req.body;
        
        const user = await User.findOne({email})

        if(!user)
        {
          return res.status(401).json({status: 'error', user: false, message: 'User Not Found'});
        }
        
        const isValid = await bcrypt.compare(password, user.password)

        if(!isValid)
        {
           return res.status(401).json({status: 'error', user: false, message: 'Invalid Credentials'})
        }

        const token = jwt.sign({
            displayName: user.displayName,
            email: user.email,
        }, 'eventy@297')

        return res.json({status: 'ok', user: token, message: 'Logged in Successfully'})
        
    } catch (error) {
        console.log(error);
        return res.json({status: 'error', user: false, message: 'An unexpected error occurred'});
        
    }
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server is running on http://localhost:${PORT}`))