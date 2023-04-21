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
  property_id: undefined,
  status_id: undefined,
  password: undefined,
  first_name: undefined, 
  last_name: undefined, 
  email: undefined, 
  phone_number: undefined,
  gender: undefined,
  birthdate: undefined
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
app.get("/get_user", (req, res) => {
  const query = 'SELECT * FROM users WHERE username = $1;';

  db.one(query, [req.query.username]).then(data => {
    res.status(200).json(data);
  }).catch(err => {
    res.status(404).json(err);
  });
});

app.get("/get_neighborhood", (req, res) => {
  db.one(query, [req.query.username]).then(async data => {
    console.log(`https://maps.googleapis.com/maps/api/geocode/json?address=` + data.address_line1.replaceAll(' ', '\+') + ',+' + data.city + ',+' + data.state + '+' + data.zipcode + '&key=' + process.env.API_KEY);
    await axios({
      url: `https://maps.googleapis.com/maps/api/geocode/json?address=` + data.address_line1.replaceAll(' ','\+') + '+' + data.city + '+' + data.state + '&key=' + process.env.API_KEY,
      method: 'GET'
    }).then(results => {
      results.data.results[0].address_components.forEach(elem => {
        if(elem.types.includes('neighborhood')){
          res.status(200).json({neighborhood: elem.long_name});
        } 
      });
    }).catch(err => {
      res.status(404).json(err);
    });
  }).catch(err => {
    res.status(404).json(err);
  }); 
});

app.get('/get_reviews', (req, res) => {
  const property_id = req.query.property_id;
  const query = 'SELECT subject, description, rating FROM reviews WHERE property_id = $1;';

  db.any(query, [property_id])
  .then(data => {
    res.status(200).json(data);
  })
  .catch(err => {
    res.status(404).json(err);
  });
});

app.post('/add_review', (req, res) => {
  const username = req.query.username;
  const subject = req.query.subject;
  const description = req.query.description;
  const rating = req.query.rating;
  const query = 'INSERT INTO reviews (username, property_id, subject, description, rating) VALUES ($1, $2, $3, $4, $5) returning *;'

  db.task(task => {
    return task.batch([
      task.one('SELECT property_id FROM users WHERE username = $1', [username]),
    ]);
  })
  .then(data => {
    db.any(query, [username,parseInt(data[0].property_id),subject,description,parseInt(rating)])
    .then(res => {
      res.status(200).json(res);
    })
    .catch(err => {
      res.status(404).json(err);
    });
  })
  .catch(err => {
    res.status(404).json(err);
  });
});

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
  const { first_name, last_name, email, username, password, confirm_password, phone_number, gender, birthdate } = req.body;
  if(password != confirm_password) {
    return res.render('pages/register', {error: 'danger', message: 'Passwords do not match' });
  }
  //hash the password using bcrypt library
  const hash = await bcrypt.hash(password, 10);
  // To-DO: Insert username and hashed password into 'users' table
  const query = "INSERT INTO users (username, first_name, last_name, property_id, status_id, password, email, phone_number, gender, birthdate) VALUES ($1, $2, $3, NULL, NULL, $4, $5, $6, $7, $8) returning *;";
  db.any(query, [username, first_name, last_name, hash, email, phone_number, gender, birthdate])
    .then(data => {
      return res.redirect('/login');
    })
    .catch(function () {
      return res.render('pages/register', {error: 'danger', message: 'This account has already been registered' });
    });
});

app.get("/login", (req, res) => {
  return res.render("pages/login");
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const query = "select * from users where users.username = $1";

  // get the student_id based on the emailid
  db.one(query, [username])
    .then((data) => {
      user.username = data.username;
      user.property_id = data.property_id;
      user.status_id = data.status_id;
      user.password = data.password;
      user.first_name= data.first_name; 
      user.last_name = data.last_name;
      user.email = data.email;
      user.phone_number = data.phone_number;
      user.gender = data.gender;
      user.birthdate = data.gender;

      req.session.user = user;
      req.session.save();

      res.redirect("/explore");
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/login");
    });
});

const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

app.use(auth);

//TODO - Everything that you need to be logged in for

app.get('/explore', (req, res) => {
  res.render('pages/explore', {username: req.session.user.username});
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("pages/login");
});
// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');