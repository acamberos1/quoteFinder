import express from 'express';
import mysql from 'mysql2/promise';
import session from 'express-session';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({extended:true}));


// Session configuration
app.use(session({
    secret: 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));

function isAuthenticated(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
}
// Make session available to all views
app.use((req, res, next) => {
    res.locals.isLoggedIn = req.session.authenticated || false;
    res.locals.username = req.session.username || '';
    next();
});


// Display login form
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Process login
app.post('/login', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    // Check credentials against database
    let sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
    const [rows] = await pool.query(sql, [username, password]);

    if (rows.length > 0) {
        req.session.authenticated = true;
        req.session.username = username;
        req.session.userId = rows[0].userId;
        res.redirect('/admin');
    } else {
        res.render('login', { error: 'Invalid username or password' });
    }
});


// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        res.redirect('/');
    });
});

// =====================
// ADMIN ROUTES (Protected)
// =====================

// Admin dashboard
app.get('/admin', isAuthenticated, (req, res) => {
    res.render('admin');
});


// List all authors
app.get('/authors', isAuthenticated, async (req, res) => {
    let sql = `SELECT * FROM authors ORDER BY lastName`;
    const [rows] = await pool.query(sql);
    res.render('authorList', { authors: rows });
});

// Display form to add new author
app.get('/author/new', isAuthenticated, async (req, res) => {
    res.render('newAuthor', { message: null });
});


// Process adding new author
app.post('/author/new', isAuthenticated, async (req, res) => {
    let { fName, lName, birthDate, deathDate, country, sex, profession, portrait, biography } = req.body;

    let sql = `INSERT INTO authors 
               (firstName, lastName, dob, dod, country, sex, profession, portrait, biography)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    let params = [fName, lName, birthDate || null, deathDate || null, country, sex, profession, portrait, biography];
    
    try {
        await pool.query(sql, params);
        res.render('newAuthor', { message: 'Author added successfully!' });
    } catch (err) {
        console.error(err);
        res.render('newAuthor', { message: 'Error adding author: ' + err.message });
    }
});


// Process updating author
app.post('/author/edit', isAuthenticated, async (req, res) => {
    let { authorId, fName, lName, birthDate, deathDate, country, sex, profession, portrait, biography } = req.body;

    let sql = `UPDATE authors
               SET firstName = ?,
                   lastName = ?,
                   dob = ?,
                   dod = ?,
                   country = ?,
                   sex = ?,
                   profession = ?,
                   portrait = ?,
                   biography = ?
               WHERE authorId = ?`;
    
    let params = [fName, lName, birthDate || null, deathDate || null, country, sex, profession, portrait, biography, authorId];
    
    try {
        await pool.query(sql, params);
        res.redirect('/authors');
    } catch (err) {
        console.error(err);
        res.redirect('/authors');
    }
});


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