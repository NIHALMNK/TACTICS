const express = require('express');
require('dotenv').config();
const path = require('path');
//===admin-routers=====================>
const adminRouter = require('./routers/adminRouters/adminRouter.js');
const CategoryRouter = require('./routers/adminRouters/CategoryRouter.js');
const productRouter = require('./routers/adminRouters/ProductRouter.js');
const UserManegementRouter = require('./routers/adminRouters/UserManegementRouter.js');
const orderRouter=require('./routers/adminRouters/orderRouter.js');
const couponRouter=require('./routers/adminRouters/couponRouter.js');
const dashboardRouter=require('./routers/adminRouters/dashboardRouter.js')


//=======user-routers============>
const userRouter = require('./routers/users');
const connectDB = require('./db/connectDB');
const session = require('express-session');
const nocache = require('nocache');
const cors = require('cors');

connectDB();

const app = express();


require('./config/passport')



app.use(nocache()); 
app.use(cors());   

app.use(session({
    secret: 'mysecretkey', 
    resave: false,         
    saveUninitialized: true, 
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 
    }
}));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use(express.static(path.join(__dirname, 'public')));




app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(require('./middleware/authMiddleware'))
app.use(require('./middleware/ban'))



app.use('/', userRouter);


app.use('/admin', adminRouter);
app.use('/admin', CategoryRouter);
app.use('/admin', productRouter);
app.use('/admin', UserManegementRouter);
app.use('/admin', orderRouter);
app.use('/admin', couponRouter);
app.use('/admin', dashboardRouter);






app.get('/demo',(req,res)=>{
    res.render('user/demo')
})

app.get('/*',(req,res)=>{
    res.render('error/erroralert')
  })

const PORT=process.env.PORT ;


app.listen(PORT, () =>{ 
    console.log(`Server running on http://localhost:${PORT}/home`)
    console.log(`Server running on http://localhost:${PORT}/admin/login`)
});
