// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.
const { json } = require('body-parser');


const user = {
  username: undefined,
  password: undefined,
}
// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set('view engine', 'ejs'); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// TODO - Include your API routes here

app.get('/welcome', (req, res) => {
    res.json({status: 'success', message: 'Welcome!'});
  });

// TODO - Login and Register


app.get('/', (req, res) => {
  res.redirect('/explore');
});

app.get('/explore', (req, res) => {
  res.render('pages/explore',{});
});

app.get('/register', (req, res) => {
  res.render('pages/register',{});
});

// Register
app.post('/register', async (req, res) => {
  //hash the password using bcrypt library
  const hash = await bcrypt.hash(req.body.password, 10);

  // To-DO: Insert username and hashed password into 'users' table
  if (hash.err || req.body.username === "" || req.body.password === "" || req.body.email === ""){
    res.redirect('/register');
  }
  else{
      var query = `INSERT INTO users(username, password, email) VALUES ('${req.body.username}', '${hash}', '${req.body.email}');`;
      
      db.any(query)
      .then(function (data) {
        res.redirect('/login');
      })
      .catch(function (err) {
        console.log(err);
          res.render('pages/register',{});
      });
  }
});

app.get('/login', (req, res) => {
  // res.json({status: 'success', message: 'Works!'});
  res.render('pages/login',{});
});

app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const query = `SELECT * FROM users WHERE username = 'abcd';`;
  db.one(query)
    .then((data) => {
      user.username = data.username;
      user.password = data.password;
      if (bcrypt.compare('abcd1234', user.password)){
        req.session.user = user;
        req.session.save();
        console.log("works!", user.password); //prints works! if we are able to log in.
        res.redirect("/");
        
      }
      else{
        console.log("Incorrect username or password.");
        res.render('/views/pages/login.ejs',{})
      }
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/register');
    });
});


//TEST
app.get('/profile', async (req, res) =>{
  res.render("pages/profile")
});

//TODO
app.post('/profile', async (req, res) =>{

});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.render("pages/login");
});


const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.render("pages/login", {message: 'successfully logged out', error: false});
});

app.use(auth);



//TODO - Everything that you need to be logged in for

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');