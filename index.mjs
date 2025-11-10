import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({extended:true}));

//setting up database connection pool
const pool = mysql.createPool({
    host: "hcm4e9frmbwfez47.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "sbtq0b7f6bgv0cya",
    password: "utexorj9riujhvqk",
    database: "f0nkjhgad3dw5qim",
    connectionLimit: 10,
    waitForConnections: true
});

//routes
app.get('/', async (req, res) => {
   let sql = `SELECT authorId, firstName, lastName
              FROM authors
              ORDER BY lastName`;
   const [rows] = await pool.query(sql);  
   console.log(rows);        
   res.render('home.ejs', {rows})
});

app.get('/searchByAuthor', async (req, res) => {
   let authorId = req.query.authorId;
   let sql = `SELECT authorId, firstName, lastName, quote
              FROM authors
              NATURAL JOIN quotes
              WHERE authorId = ?`;
   let sqlParams = [authorId];
   const [rows] = await pool.query(sql, sqlParams);
   // write SQL to retreive quotes based on authorId 
   res.render('results.ejs', {rows})
});
// how does this get api?
app.get('/api/authors/:authorId', async(req, res) => {
   let authorId = req.params.authorId;
   let sql = `SELECT *
              FROM authors
              WHERE authorId = ?`;
  const [rows] = await pool.query(sql, [authorId]);          
  res.send(rows[0]);
});
//When using the GET method, all values are stored in the req.query object  
app.get('/searchByKeyword', async(req, res) => {
   let keyword = req.query.keyword;
   let sql = `SELECT authorId, firstName, lastName, quote
              FROM authors
              NATURAL JOIN quotes
              WHERE quote LIKE ?`;
    let sqlParams = [`%${keyword}%`];
    const [rows] = await pool.query(sql, sqlParams);
    console.log(rows);
   res.render('results.ejs', {rows})
});

app.get("/dbTest", async(req, res) => {
   try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});//dbTest

app.listen(3000, ()=>{
    console.log("Express server running")
})