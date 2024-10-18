const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();
require('./helpers/githubAuth'); // Load GitHub OAuth strategy

const githubRoutes = require('./routes/githubRoutes');

const app = express();
app.use(cors({
    origin: 'http://localhost:4200' ,
    credentials: true 
}));
// MongoDB connection
mongoose.connect(`${process.env.MONGO_URI}/integrations`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected...');
}).catch(err => {
    console.log('Error connecting to MongoDB:', err);
});

app.use(session({
    secret: 'githubOAuthSecret', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false,
        maxAge: 1000 * 60 * 60 * 24 
     } 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', githubRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
