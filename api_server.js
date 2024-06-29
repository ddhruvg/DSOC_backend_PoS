import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import env from "dotenv";
import {alert} from 'node-popup';

const port = 4000;
const app = express();

env.config();

const db = new pg.Client({
    user : process.env.PG_USER,
    host : process.env.PG_HOST,
    database : process.env.PG_DATABASE,
    password : process.env.PG_PASSWORD,
    port : process.env.PG_PORT
});

db.connect();





app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(bodyParser.json());


app.get("/",(req,res)=>{
    alert('Hello World!');
})
app.get('/retrieve/:id', async (req,res)=>{
    const id = req.params.id;
    console.log(id)
    try{
        const result = await db.query("SELECT * FROM transaction WHERE t_id = $1",[parseInt(id)])
        console.log(result.rows)
        res.json(result.rows)
    } catch (err){
        console.log(err)

    }
    
})

app.delete('/retrieve/:id', async (req,res)=>{
    const id = req.params.id;
    console.log(id)
    try{
        const result = await db.query("DELETE FROM transaction WHERE t_id = $1 RETURNING *;",[parseInt(id)])
        console.log(result.rows)
        res.json(result.rows)
    } catch (err){
        console.log(err)
    }
    
})

app.post('/create/:t_id/:c_id/:t_date/:t_amount/:t_category',async(req,res)=>{
    const t_id = req.params.t_id
    const c_id = req.params.c_id
    const t_date = req.params.t_date
    const t_amount = req.params.t_amount
    const t_category = req.params.t_category
    console.log(t_id,c_id,t_date,t_amount,t_category)
    try{
        const result = await db.query("INSERT INTO transaction(t_id, c_id, t_date, t_amount, t_category) VALUES($1, $2, $3, $4, $5) RETURNING *;",[parseInt(t_id),parseInt(c_id),t_date,parseFloat(t_amount),t_category])
        res.json(result.rows)
    } catch (err){
        res.send(err)

    } 
})

app.patch('/create/:t_id/:c_id/:t_date/:t_amount/:t_category',async(req,res)=>{
    const t_id = req.params.t_id
    const c_id = req.params.c_id
    const t_date = req.params.t_date
    const t_amount = req.params.t_amount
    const t_category = req.params.t_category
    console.log(t_id,c_id,t_date,t_amount,t_category)
    try{
        const result = await db.query("UPDATE transaction SET  c_id=$2, t_date=$3, t_amount=$4, t_category=$5 WHERE t_id= $1 RETURNING *;",[parseInt(t_id),parseInt(c_id),t_date,parseFloat(t_amount),t_category])
        res.json(result.rows)
    } catch (err){
        res.send(err)

    } 
})

app.listen(port,()=>{
    console.log(`API running on ${port}`)
})