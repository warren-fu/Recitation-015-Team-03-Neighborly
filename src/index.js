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
const fs = require('fs');
const busboy = require('connect-busboy');


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

app.use('/public', express.static('public'));
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
      url: `https://maps.googleapis.com/maps/api/geocode/json?address=` + data.address_line1.replaceAll(' ', '\+') + '+' + data.city + '+' + data.state + '&key=' + process.env.API_KEY,
      method: 'GET'
    }).then(results => {
      results.data.results[0].address_components.forEach(elem => {
        if (elem.types.includes('neighborhood')) {
          res.status(200).json({ neighborhood: elem.long_name });
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
      db.any(query, [username, parseInt(data[0].property_id), subject, description, parseInt(rating)])
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

app.get('/get_listings', (req, res) => {
  const query = 'SELECT list.listing_id, prop.address_line1, prop.city, prop.state, prop.zipcode FROM listing AS list LEFT JOIN properties AS prop ON list.property_id = prop.property_id;';

  db.any(query)
    .then(data => {
      res.status(200).json(data);
    })
    .catch(err => {
      res.status(404).json(err);
    });
});

// TODO - Login and Register

app.get('/register', (req, res) => {
  return res.render('pages/register');
});

// Register
app.post('/register', async (req, res) => {
  const { first_name, last_name, email, username, password, confirm_password, phone_number, gender, birthdate } = req.body;
  if (password != confirm_password) {
    return res.render('pages/register', { error: 'danger', message: 'Passwords do not match' });
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
      return res.render('pages/register', { error: 'danger', message: 'This account has already been registered' });
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
      user.first_name = data.first_name;
      user.last_name = data.last_name;
      user.email = data.email;
      user.phone_number = data.phone_number;
      user.gender = data.gender;
      user.birthdate = data.birthdate;

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

//TODO - API Calls you need to be logged in for

app.get('/get_userAddress', (req, res) => {
  const query = 'SELECT prop.address_line1, prop.city, prop.state, prop.zipcode FROM users JOIN properties AS prop ON prop.property_id = users.property_id WHERE users.username = $1;';

  db.any(query, [user.username])
    .then(data => {
      res.status(200).json(data);
    })
    .catch(err => {
      res.status(404).json(err);
    });
});

//TODO - Everything that you need to be logged in for

app.get('/explore', (req, res) => {
  const query = 'SELECT list.listing_id, prop.address_line1, list.price, list.description FROM listing AS list LEFT JOIN properties AS prop ON list.property_id = prop.property_id;';

  db.any(query)
    .then(data => {
      res.render('pages/explore', {
        fixed_navbar: true,
        username: req.session.user.username,
        api_key: process.env.API_KEY,
        listings: data
      });
    })
    .catch(err => {
      res.render('pages/explore', {
        fixed_navbar: true,
        username: req.session.user.username,
        api_key: process.env.API_KEY,
        listings: [{
          listing_id: null,
          address_line1: 'Error',
          price: null,
          description: 'Error'
        }],
        message: err
      });
    });

});

app.get('/profile', (req, res) => {
  res.render('pages/profile', {
    fixed_navbar: true,
    username: req.session.user.username,
    first_name: req.session.user.first_name,
    last_name: req.session.user.last_name,
    email: req.session.user.email,
    phone_number: req.session.user.phone_number,
    gender: req.session.user.gender,
    birthdate: req.session.user.birthdate,
    status: req.session.user.status,
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zipcode: ''
  });
});

//TODO Work on for recieving address data and place into the tables accordingly
// app.post('/profile', (req,res) => {
  
// });

app.get('/feed', (req, res) => {
  const query = 'SELECT posts.username, posts.datetime, posts.post_id, posts.subject, posts.description, posts.votes FROM posts;';
  const neighborhood_id_query = 'SELECT prop.neighborhood_id FROM properties AS prop JOIN users ON prop.property_id = users.property_id WHERE users.username = $1;';
  const posts_to_replies_query = 'SELECT * FROM post_to_replies;';
  const replies_query = 'SELECT * FROM replies;';

  db.any(neighborhood_id_query, [user.username])
  .then(data => {
    db.any(query, [parseInt(data.neighborhood_id)])
    .then(results => {
      db.any(posts_to_replies_query)
      .then(results2 => {
        db.any(replies_query)
        .then(results3 => {
          res.render('pages/feed', {
            fixed_navbar: false,
            username: req.session.user.username,
            posts: results,
            post_to_replies: results2,
            replies: results3
          });
        })
      })
    })
    .catch(err => {
      res.render('pages/feed', {
        fixed_navbar: false,
        username: req.session.user.username,
        posts: [{
          subject: 'Error',
          description: 'Error',
          votes: 0
        }]
      });
    });
  })
  .catch(err => {
    res.render('pages/feed', {
      fixed_navbar: false,
      username: req.session.user.username,
      posts: [{
        subject: 'Error',
        description: 'Error',
        votes: 0
      }]
    });
  });
});

app.post('/feed', (req, res) => {
  const { subject, description } = req.body;
  const query = 'INSERT INTO posts(datetime, username, neighborhood_id, subject, description, votes) VALUES (to_timestamp($1 / 1000.0), $2, $3, $4, $5, $6) returning *;';
  const neighborhood_id_query = 'SELECT prop.neighborhood_id FROM properties AS prop JOIN users ON prop.property_id = users.property_id WHERE users.username = $1;';

  db.any(neighborhood_id_query, [user.username])
    .then(data => {
      db.any(query, [Date.now() ,user.username, parseInt(data.neighborhood_id), subject, description, 0])
        .then(() => {
          res.redirect('/feed');
        })
        .catch(() => {
          res.render('pages/feed', {
            fixed_navbar: false,
            username: req.session.user.username,
            error: 'danger',
            message: 'Post failed to upload',
            posts: [{
              subject: 'Error',
              description: 'Error',
              votes: 0
            }]
          });
        });
    })
    .catch(err => {
      res.render('pages/feed', {
        fixed_navbar: false,
        username: req.session.user.username,
        error: 'danger',
        message: 'Post failed to upload',
        posts: [{
          subject: 'Error',
          description: 'Error',
          votes: 0
        }]
      });
    });
});

app.post('/reply', (req, res) => {
  const { reply, post_id } = req.body;
  const query = 'INSERT INTO replies (username, reply_value) VALUES ($1, $2) returning reply_id;';
  const post_to_reply_query = 'INSERT INTO post_to_replies (post_id, reply_id) VALUES ($1, $2);';

  db.any(query, [user.username, reply])
    .then(data => {
      db.any(post_to_reply_query, [post_id, parseInt(data[0].reply_id)])
        .then(() => {
          res.redirect('/feed');
        })
        .catch(() => {
          res.render('pages/feed', {
            fixed_navbar: false,
            username: req.session.user.username,
            error: 'danger',
            message: 'Reply failed to upload',
            posts: [{
              subject: 'Error',
              description: 'Error',
              votes: 0,
            }]
          });
        });
    })
    .catch(err => {
      res.render('pages/feed', {
        fixed_navbar: false,
        username: req.session.user.username,
        error: 'danger',
        message: 'Reply failed to upload',
        posts: [{
          subject: 'Error',
          description: err,
          votes: 0,
        }]
      });
    });
});


app.post('/upvote', (req, res) => {
  const pid = req.query.p;
  const curr_votes = req.query.v;
  const query = 'UPDATE posts SET votes = $1 WHERE post_id = $2 RETURNING *;';
  db.any(query, [parseInt(curr_votes) + 1, parseInt(pid)])
  .then(() => {
    res.redirect("/feed");
  })
  .catch(err => {
    res.render('pages/feed', {
      fixed_navbar: false,
      username: req.session.user.username,
      error: 'danger',
      message: 'Post failed to upload',
      posts: [{
        subject: 'Error',
        description: 'Error',
        votes: 0
      }]
    });
  })
});

app.post('/downvote', (req, res) => {
  const pid = req.query.p;
  const curr_votes = req.query.v;
  const query = 'UPDATE posts SET votes = $1 WHERE post_id = $2 RETURNING *;';
  db.any(query, [parseInt(curr_votes) - 1, pid])
  .then(() => {
    res.redirect("/feed");
  })
  .catch(err => {
    res.render('pages/feed', {
      fixed_navbar: false,
      username: req.session.user.username,
      error: 'danger',
      message: 'Post failed to upload',
      posts: [{
        subject: 'Error',
        description: 'Error',
        votes: 0
      }]
    });
  })
});



app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});
// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');