import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";


const app = express();
const port = 3000;
const saltRounds = 10;
const API_URL = "http://localhost:4000";
env.config();

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("public"))
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized : true
}))
app.use(passport.initialize());
app.use(passport.session());


const db = new pg.Client({
    user : process.env.PG_USER,
    host : process.env.PG_HOST,
    database : process.env.PG_DATABASE,
    password : process.env.PG_PASSWORD,
    port : process.env.PG_PORT
});

db.connect()

app.get('/',(req,res)=>{
    res.render("home.ejs")
})
app.get("/register",(req,res)=>{
    res.render("signup.ejs")
})
app.get("/login",(req,res)=>{
    res.redirect('/secret')
})
app.get("/secret", async(req,res)=>{

    if (req.isAuthenticated()){
        res.render("index.ejs")
    }else{
        res.render("login.ejs")
    }       
})
app.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
});
app.get("/products",(req,res)=>{
    res.render("products.ejs")
})

app.get("/create",(req,res)=>{
    res.render("create.ejs")
})
app.get("/delete",(req,res)=>{
    res.render("delete.ejs")
})
app.get("/retrieve",async (req,res)=>{
    res.render('retrieve.ejs')
})
app.get("/update",(req,res)=>{
    res.render("update.ejs")
})

app.post("/register", async(req,res)=>{
    console.log(req.body.username)
    bcrypt.hash(req.body.password,saltRounds,async(err,hash)=>{
        if (err){
            console.log(err)
        }else{
            await db.query("INSERT INTO info (username,password) VALUES ($1,$2)",[req.body.username,hash])
            res.redirect("/")
        }
    })
})

app.post(
    "/login",
    passport.authenticate("local",{
        successRedirect : "/secret",
        failureRedirect : "/login"
    })
)

app.post('/api/retrieve',async(req,res)=>{
    console.log(req.body)
    const result = await axios.get(`${API_URL}/retrieve/${req.body.id}`)
    console.log(result)
    res.send(JSON.stringify(result.data))
})

app.post('/api/delete',async(req,res)=>{
    console.log(req.body)
    const result = await axios.delete(`${API_URL}/retrieve/${req.body.id}`)
    console.log(result)
    res.send(JSON.stringify(result.data))
})
app.post("/api/create", async(req,res)=>{
    console.log(req.body.t_id);
    const t_id = req.body.t_id;
    const c_id = req.body.c_id;
    const t_date = req.body.t_date;
    const t_amount = req.body.t_amount;
    const t_category = req.body.t_category;
    console.log(t_id)
    console.log(`${API_URL}/create/${t_id}/${c_id}/${t_date}/${t_amount}/${t_category}`)
    try{
        
        const result = await axios.post(`${API_URL}/create/${t_id}/${c_id}/${t_date}/${t_amount}/${t_category}`)
        res.send(JSON.stringify(result.data))

    }catch (err){
        console.log(err)
    }

})

app.post("/api/update", async(req,res)=>{
    const t_id = req.body.t_id;
    if (t_id){
        const entry = await axios.get(`${API_URL}/retrieve/${t_id}`)
        console.log(entry.data)
        const c_id = req.body.c_id  || entry.data[0].c_id;
        const t_date = req.body.t_date || entry.data[0].t_date;
        const t_amount = req.body.t_amount || entry.data[0].t_amount;
        const t_category = req.body.t_category || entry.data[0].t_category;
        console.log(`${API_URL}/create/${t_id}/${c_id}/${t_date}/${t_amount}/${t_category}`)
        
        
        try{
            
            const result = await axios.patch(`${API_URL}/create/${t_id}/${c_id}/${t_date}/${t_amount}/${t_category}`)
            res.send(JSON.stringify(result.data))

        }catch (err){
            console.log(err)
        }
    }else{
        res.send("t_id can not be empty")
    }
    

})

passport.use(new Strategy( async function verify(username,password,cb){
    try {
        const result = await db.query("SELECT * FROM info WHERE username = $1",[username])
        if (result.rows.length>0){
            const user = result.rows[0];
            const storedHashedPassword = user.password;
            bcrypt.compare(password,storedHashedPassword,(err,valid)=>{
                if (err){
                    // error while checking password 
                    console.log(err)
                    return cb(err)
                }else {
                    if (valid){
                        // validated user
                        return cb(null,user);
                    } else {
                        // invalid user
                        return cb(null,false)
                    }
                }
            })
        }else {
            return cb("User not registered")
        }
    } catch (err) {
        console.log(err)
    }
}))

passport.serializeUser((user,cb)=>{
    cb(null,user);
})
passport.deserializeUser((user,cb)=>{
    cb(null,user);
})
app.listen(port , ()=>{
    console.log(`listening on port ${port}`)
})

