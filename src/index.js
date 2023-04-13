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
  return res.redirect('/login');
});

app.get('/register', (req, res) => {
  return res.render('pages/register');
});

// Register
app.post('/register', async (req, res) => {
  //hash the password using bcrypt library
  const hash = await bcrypt.hash(req.body.password, 10);
  // To-DO: Insert username and hashed password into 'users' table
  const query = "INSERT INTO users (username, password) VALUES ($1, $2);";
  db.any(query, [
    req.body.username,
    hash,
  ])
    .then(function () {
      return res.redirect('/login');
    })
    .catch(function () {
      return res.render('pages/register', { message: 'This account has already been registered' });
    });
});

app.get("/login", (req, res) => {
  return res.render("pages/login");
});

app.post('/login', async (req, res) => {
  const pwInDB = await db.any('SELECT * FROM users WHERE users.username = $1', [
    req.body.username])
    .catch(function () {
      return res.render('pages/login', { message: 'Database request failed' });
    });
  if (pwInDB.length > 0) {
    const match = await bcrypt.compare(req.body.password, pwInDB[0].password);
    if (match) {
      req.session.user = {
        api_key: process.env.API_KEY,
      };
      req.session.save();
      return res.redirect('/discover');
    }
    else {
      return res.render('pages/login', { message: 'Incorrect username or password' });
    }
  }
  else {
    return res.redirect('/register');
  }
});

const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

app.use(auth);

//TODO - Everything that you need to be logged in for

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');