const express = require('express');
require('dotenv').config();
const path = require('path');
const userRouter = require('./routers/users');
const adminRouter = require('./routers/admin');
const connectDB = require('./db/connectDB');
const session = require('express-session');
const nocache = require('nocache');
const cors = require('cors');

// Connect to the database
connectDB();

const app = express();


require('./config/passport')



// Apply middlewares
app.use(nocache()); // Disable caching
app.use(cors());    // Enable CORS

// Setup session
app.use(session({
    secret: 'mysecretkey', // Use a strong, secret key for session security
    resave: false,         // Don't save session if it hasn't been modified
    saveUninitialized: true, // Save session even if it's not modified
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 day session expiry
    }
}));


// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
// app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));



// Parse incoming request data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(require('./middleware/authMiddleware'))
app.use(require('./middleware/ban'))


// Use the userRouter to handle routes
app.use('/', userRouter);
app.use('/admin', adminRouter);




app.get('/*',(req,res)=>{
    res.render('error/erroralert')
    console.log("server: page not found ")
  })

// Start the server
app.listen(3000, () =>{ 
    console.log('Server running on http://localhost:3000/home')
    console.log('Server running on http://localhost:3000/admin/login')
});
