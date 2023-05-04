// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require("express"); // To build an application server or API
const app = express();
const pgp = require("pg-promise")(); // To connect to the Postgres DB from the node server
const bodyParser = require("body-parser");
const session = require("express-session"); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require("bcrypt"); //  To hash passwords
const axios = require("axios"); // To make HTTP requests from our server. We'll learn more about it in Part B.
const { json } = require("body-parser");
const fileUpload = require('express-fileupload');
const fs = require("fs");
const busboy = require("connect-busboy");
const { errorMonitor } = require("events");

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
  birthdate: undefined,
};
// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// database configuration
const dbConfig = {
  host: "db", // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then((obj) => {
    console.log("Database connection successful"); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch((error) => {
    console.log("ERROR:", error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set("view engine", "ejs"); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// // for file uploading
app.use(fileUpload());

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

app.use("/public", express.static("public"));
// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// TODO - Login and Register

app.get("/register", (req, res) => {
  return res.render("pages/register");
});

// Register
app.post("/register", async (req, res) => {
  const { first_name, last_name, email, username, password, confirm_password, phone_number, gender, birthdate } = req.body;
  if (password != confirm_password) {
    // res.json({message: 'Passwords do not match'});
    return res.render("pages/register", {
      error: "danger",
      message: "Passwords do not match",
    });
  }
  //hash the password using bcrypt library
  const hash = await bcrypt.hash(password, 10);
  // To-DO: Insert username and hashed password into 'users' table
  const query_user = "INSERT INTO users (username, first_name, last_name, property_id, password, email, phone_number, gender, birthdate, interests) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, \'{}\');";
  const query_prop = "INSERT INTO properties (neighborhood, address_line1, address_line2, city, state, zipcode) VALUES (\'\', \'\', \'\', \'\', \'\', \'\') RETURNING properties.property_id;"

  db.one(query_prop)
    .then(data => {
      db.any(query_user, [username, first_name, last_name, data.property_id, hash, email, phone_number, gender, birthdate])
        .then((data) => {
          // res.json({message: 'Success'});
          return res.redirect("/login");
        })
        .catch(function () {
          return res.render("pages/register", {
            error: "danger",
            message: "This account has already been registered",
          });
        });
    })
    .catch(err => {
      return res.render("pages/register", {
        error: "danger",
        message: "This account has already been registered",
      });
    });

});

app.get("/login", (req, res) => {
  return res.render("pages/login");
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const query = "select * from users where users.username = $1";

  db.one(query, [username])
    .then(async (data) => {
      const match = await bcrypt.compare(password, data.password);
      if (match) {
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
        // res.json({message: 'Success'});
        res.redirect("/explore");
      } else {
        res.render("pages/login", {
          error: "danger",
          message: "Incorrect username or password",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      // res.json({message: 'User does not exist'});
      res.render("pages/login", {
        error: "danger",
        message: "Incorrect username or password",
      });
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

  app.get("/explore", (req, res) => {
    const query = "SELECT list.listing_id, prop.address_line1, list.price, list.description, list.images, users.interests FROM listing AS list LEFT JOIN properties AS prop ON list.property_id = prop.property_id LEFT JOIN users ON list.property_id = users.property_id WHERE ARRAY_LENGTH(users.interests, 1) > 0;";
    const user_query = "SELECT interests FROM users WHERE username = $1;";

    db.task(task => {
      return task.batch([
        db.any(query),
        db.one(user_query, [user.username])
      ])
    })
      .then(data => {
        res.render("pages/explore", {
          fixed_navbar: true,
          username: user.username,
          listings: data[0],
          user: data[1]
        });
      })
      .catch(err => {
        res.render("pages/explore", {
          fixed_navbar: true,
          username: req.session.user.username,
          api_key: process.env.API_KEY,
          listings: [
            {
              listing_id: null,
              address_line1: "Error",
              price: null,
              description: "Error",
            },
          ],
          message: err,
        });
      });
  });

  app.get('/profile', (req, res) => {
    const property_query = 'SELECT users.interests, prop.address_line1, prop.address_line2, prop.city, prop.state, prop.zipcode FROM users JOIN properties AS prop ON prop.property_id = users.property_id WHERE users.username = $1;';
    const hobby_query = 'SELECT hobby FROM hobbies;';
    const tv_query = 'SELECT show FROM tv_shows;';
    const movie_query = 'SELECT movie FROM movies;';
    const artist_query = 'SELECT artist FROM artists;';
    const major_query = 'SELECT major FROM majors;';
    const job_query = 'SELECT job FROM jobs;';
    db.task(task => {
      return task.batch([
        task.one(property_query, [user.username]),
        task.any(hobby_query),
        task.any(tv_query),
        task.any(movie_query),
        task.any(artist_query),
        task.any(major_query),
        task.any(job_query)
      ]);
    })
      .then(data => {
        res.render('pages/profile', {
          fixed_navbar: false,
          propertyId: user.property_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          gender: user.gender,
          birthdate: user.birthdate,
          status: user.status_id,
          address_line1: data[0].address_line1,
          address_line2: data[0].address_line2,
          interests: data[0].interests,
          city: data[0].city,
          state: data[0].state,
          zipcode: data[0].zipcode,
          hobbies: data[1],
          tv_shows: data[2],
          movies: data[3],
          artists: data[4],
          majors: data[5],
          jobs: data[6],
        });
      })
      .catch(err => {
        res.render('pages/profile', {
          fixed_navbar: false,
          propertyId: user.property_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          gender: user.gender,
          birthdate: user.birthdate,
          message: err,
        });
      });
  });

  //TODO Work on for recieving address data and place into the tables accordingly
  app.post('/profile', (req, res) => {
    // const userToListQuery = 'INSERT INTO ';
    // const listingQuery = 'INSERT INTO listing (listing_id, username, property_id, price, description) VALUES ($1, $2, $3, $4, $5);';

    const address1 = req.body.address_1;
    const address2 = req.body.address_2;
    const city = req.body.city;
    const state = req.body.state;
    const zip = req.body.zip;

    const propertyQuery = 'INSERT INTO properties (neighborhood_id, address_line1, address_line2, city, state, zipcode) VALUES ($1, $2, $3, $4, $5, $6) returning property_id;';
    db.any(propertyQuery, [1, address1, address2, city, state, zip])
      .then(data => {
        console.log('Data: ', data);
        console.log('Data: ', data);
        // Update the user's property_id in the users table
        const updateUserQuery = 'UPDATE users SET property_id = $1 WHERE username = $2';
        return db.none(updateUserQuery, [data[0].property_id, req.session.user.username])
          .then(() => {
            // Update the property_id in the session
            req.session.user.property_id = data[0].property_id;
            console.log(req.session.user.property_id);
            return res.render('pages/profile', {
              fixed_navbar: false,
              propertyId: req.session.user.property_id,
              username: req.session.user.username,
              first_name: req.session.user.first_name,
              last_name: req.session.user.last_name,
              email: req.session.user.email,
              phone_number: req.session.user.phone_number,
              gender: req.session.user.gender,
              birthdate: req.session.user.birthdate,
              status: req.session.user.status_id,
              address_line1: address1,
              address_line2: address2,
              city: city,
              state: state,
              zipcode: zip
            });
          });
      })
      .catch(err => {
        console.log(err);
        return res.render('pages/profile', {
          fixed_navbar: false,
          propertyId: req.session.user.property_id,
          username: req.session.user.username,
          first_name: req.session.user.first_name,
          last_name: req.session.user.last_name,
          email: req.session.user.email,
          phone_number: req.session.user.phone_number,
          gender: req.session.user.gender,
          birthdate: req.session.user.birthdate,
          status: req.session.user.status_id,
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          zipcode: '',
          error: 'danger',
          message: 'Invalid address has been inputed'
        });
      })
  });

  app.post('/updateProfile', (req, res) => {
    const address1 = req.body.address_1;
    const address2 = req.body.address_2;
    const city = req.body.city;
    const state = req.body.state;
    const zip = req.body.zip;
    const query = 'UPDATE properties SET address_line1 = $1, address_line2 = $2, city = $3, state = $4, zipcode = $5 WHERE property_id = $6 returning property_id;';
    db.one(query, [address1, address2, city, state, zip, req.session.user.property_id])
      .then(() => {
        // console.log("It should pass");
        return res.render('pages/profile', {
          fixed_navbar: false,
          propertyId: req.session.user.property_id,
          username: req.session.user.username,
          first_name: req.session.user.first_name,
          last_name: req.session.user.last_name,
          email: req.session.user.email,
          phone_number: req.session.user.phone_number,
          gender: req.session.user.gender,
          birthdate: req.session.user.birthdate,
          status: req.session.user.status_id,
          address_line1: address1,
          address_line2: address2,
          city: city,
          state: state,
          zipcode: zip
        });
      })
      .catch(err => {
        // console.log(err);
        return res.render('pages/profile', {
          fixed_navbar: false,
          propertyId: req.session.user.property_id,
          username: req.session.user.username,
          first_name: req.session.user.first_name,
          last_name: req.session.user.last_name,
          email: req.session.user.email,
          phone_number: req.session.user.phone_number,
          gender: req.session.user.gender,
          birthdate: req.session.user.birthdate,
          status: req.session.user.status_id,
          address_line1: address1,
          address_line2: address2,
          city: city,
          state: state,
          zipcode: zip,
          error: 'danger',
          message: 'Invalid address to update to'
        });
      })
  });

  app.post('/add_interests', (req, res) => {
    const query = 'UPDATE users SET interests = $1 WHERE username = $2;';

    var pg_arr = '{';
    Object.keys(req.body).forEach((key, index, arr) => {
      if (index == arr.length - 1) pg_arr += key + '}'
      else pg_arr += key + ', ';
    });

    db.none(query, [pg_arr, user.username])
      .then(() => {
        res.redirect('/profile');
      })
      .catch(err => {
        res.redirect('/profile');
      });
  });


  app.get("/feed", (req, res) => {
    const query =
      "SELECT posts.username, posts.datetime, posts.post_id, posts.subject, posts.description, posts.votes FROM posts WHERE posts.neighborhood = $1 ORDER BY posts.datetime DESC;";
    const neighborhood_query =
      "SELECT prop.neighborhood FROM properties AS prop WHERE prop.property_id = (SELECT property_id FROM users WHERE username = $1);";

    db.one(neighborhood_query, [user.username])
      .then((data) => {
        db.any(query, [data.neighborhood])
          .then((results) => {
            res.render("pages/feed", {
              fixed_navbar: false,
              username: user.username,
              posts: results,
              neighborhood: data.neighborhood,
              comments: null,
            });
          })
          .catch((err) => {
            res.render("pages/feed", {
              fixed_navbar: false,
              username: user.username,
              posts: [
                {
                  subject: "Error",
                  description: "Error",
                  votes: 0,
                },
              ],
              comments: null,
            });
          });
      })
      .catch((err) => {
        res.render("pages/feed", {
          fixed_navbar: false,
          username: req.session.user.username,
          posts: [
            {
              subject: "Error",
              description: "Error",
              votes: 0,
            },
          ],
          comments: null,
        });
      });
  });

  app.post("/feed", (req, res) => {
    const { subject, description } = req.body;
    const query = "INSERT INTO posts(datetime, username, neighborhood, subject, description, votes) VALUES (to_timestamp($1 / 1000.0), $2, $3, $4, $5, $6) returning *;";
    const neighborhood_query =
      "SELECT prop.neighborhood FROM properties AS prop WHERE prop.property_id = (SELECT property_id FROM users WHERE username = $1);";

    db.one(neighborhood_query, [user.username])
      .then((data) => {
        db.any(query, [
          Date.now(),
          user.username,
          data.neighborhood,
          subject,
          description,
          0,
        ])
          .then(() => {
            res.redirect("/feed?page=n");
          })
          .catch(() => {
            res.render("pages//feed?page=n", {
              fixed_navbar: false,
              username: user.username,
              error: "danger",
              message: "Post failed to upload",
              posts: [
                {
                  subject: "Error",
                  description: "Error",
                  votes: 0,
                },
              ],
              comments: null,
              neighborhood: data.neighborhood
            });
          });
      })
      .catch((err) => {
        res.render("pages//feed?page=n", {
          fixed_navbar: false,
          username: user.username,
          error: "danger",
          message: "Post failed to upload",
          posts: [
            {
              subject: "Error",
              description: "Error",
              votes: 0,
            },
          ],
          comments: null,
        });
      });
  });

  app.get("/feed/p/:pid", (req, res) => {
    const post_id = req.params.pid;
    const query_replies =
      "SELECT r.username, r.reply_value FROM replies AS r JOIN post_to_replies AS p_to_r ON r.reply_id = p_to_r.reply_id JOIN posts ON posts.post_id = p_to_r.post_id WHERE posts.post_id = $1;";
    const query_post = "SELECT * FROM posts where post_id = $1;";

    db.task((task) => {
      return task.batch([
        task.any(query_replies, [post_id]),
        task.one(query_post, [post_id]),
      ]);
    })
      .then((data) => {
        res.render("partials/post", {
          replies: data[0],
          post: data[1],
          user: user
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });

  app.post("/reply/:pid", (req, res) => {
    const value = req.body.value;
    const pid = req.params.pid;
    const query_replies =
      "INSERT INTO replies (username, reply_value) VALUES ($1, $2) RETURNING *;";
    const query_ptor =
      "INSERT INTO post_to_replies (post_id, reply_id) VALUES ($1, $2) RETURNING *;";

    db.one(query_replies, [user.username, value])
      .then((data) => {
        db.one(query_ptor, [pid, data.reply_id])
          .then((data) => {
            res.redirect("/feed");
          })
          .catch((err) => {
            res.end();
          });
      })
      .catch((err) => {
        res.end();
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

  app.post("/deletePost", (req, res) =>{
    const reply = req.body.reply;
    const queryReply = "DELETE FROM replies WHERE reply_value = $1 returning *;"
    const queryPostToReply = "DELETE FROM post_to_replies WHERE reply_id = $1 returning *;"

    db.one(queryReply, [reply])
      .then((data1) => {
        db.one(queryPostToReply, [data1.reply_id])
          .then((data2) => {
            res.redirect("/feed");
          })
          .catch((err) => {
            res.end();
          });
      })
      .catch((err) => {
        res.end();
      });
  });

  app.get("/editPost", (res, req) =>{

  });


  app.get('/interests', (req, res) => {
    const username = req.session.user.username;
    const query = 'SELECT interests.interests_id, interests.education, interests.job, interests.hobby FROM interests JOIN users ON interests.username = users.username WHERE users.username = $1 ORDER BY interests.interests_id DESC LIMIT 1;';

    db.any(query, [username])
      .then(data => {
        // console.log(data);
        res.render('pages/interests', {
          fixed_navbar: false,
          propertyId: user.property_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          gender: user.gender,
          birthdate: user.birthdate,
          status: user.status_id,
          interests_id: data[0].interests_id,
          education: data[0].education,
          job: data[0].job,
          hobby: data[0].hobby
        });
      })
      .catch(err => {
        res.render('pages/interests', {
          fixed_navbar: false,
          propertyId: user.property_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          gender: user.gender,
          birthdate: user.birthdate,
          status: user.status_id,
          interests_id: '',
          education: '',
          job: '',
          hobby: ''
        });
      });
  });

  app.post('/addInterests', (req, res) => {
    const username = req.session.user.username, education = req.body.education, job = req.body.job, hobby = req.body.hobby;
    const query = 'INSERT INTO interests (username, education, job, hobby) VALUES ($1, $2, $3, $4) RETURNING *;';

    db.any(query, [username, education, job, hobby])
      .then(data => {
        res.render('pages/interests', {
          fixed_navbar: false,
          propertyId: user.property_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          gender: user.gender,
          birthdate: user.birthdate,
          status: user.status_id,
          interests_id: data[0].interests_id,
          education: data[0].education,
          job: data[0].job,
          hobby: data[0].hobby
        });
      })
      .catch(err => {
        res.render('pages/interests', {
          fixed_navbar: false,
          propertyId: user.property_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          gender: user.gender,
          birthdate: user.birthdate,
          status: user.status_id,
          interests_id: '',
          education: '',
          job: '',
          hobby: ''
        });
      });
  })
  app.get('/applications', (req, res) => {
    const query_users = 'SELECT a.application_id, p.address_line1, l.price, a.datetime FROM applications AS a RIGHT JOIN listing AS l ON a.listing_id = l.listing_id INNER JOIN properties AS p ON a.property_id = p.property_id WHERE a.username = $1';
    const query_listing = 'SELECT a.application_id, users.first_name, users.last_name, users.email, a.datetime FROM listing AS l LEFT JOIN applications AS a ON l.listing_id = a.listing_id INNER JOIN users ON users.username = a.username WHERE l.username = $1';

    db.task(task => {
      return task.batch([
        task.any(query_users, [user.username]),
        task.any(query_listing, [user.username])
      ]);
    })
      .then(data => {
        res.render('pages/applications', {
          fixed_navbar: false,
          username: user.username,
          applications: data[0],
          listing_applications: data[1],
        });
      })
      .catch(err => {
        res.render('pages/applications', {
          fixed_navbar: false,
          username: user.username,
          message: err
        });
      });
  });

  app.get('/applications/:user/:aid', (req, res) => {
    const app_id = req.params.aid;
    var query;
    if (req.params.user == 'o') {
      query = 'SELECT a.application_id, a.prompt_1, a.prompt_2, a.prompt_3, l.question_1, l.question_2, l.question_3, l.price, l.images, l.description, p.address_line1, users.interests FROM applications AS a INNER JOIN listing AS l ON a.listing_id = l.listing_id INNER JOIN properties AS p ON a.property_id = p.property_id INNER JOIN users ON l.username = users.username WHERE a.application_id = $1;';
    } else {
      query = 'SELECT a.application_id, a.prompt_1, a.prompt_2, a.prompt_3, l.question_1, l.question_2, l.question_3, l.price, l.images, l.description, p.address_line1, users.interests FROM applications AS a INNER JOIN listing AS l ON a.listing_id = l.listing_id INNER JOIN properties AS p ON a.property_id = p.property_id INNER JOIN users ON a.username = users.username WHERE a.application_id = $1;';
    }

    const user_query = 'SELECT interests FROM users WHERE username = $1;';

    db.task(task => {
      return task.batch([
        task.one(query, [app_id]),
        task.one(user_query, [user.username])
      ]);
    })
      .then(data => {
        console.log(data);
        res.render('pages/application', {
          fixed_navbar: false,
          username: user.username,
          application: data[0],
          user: data[1]
        });
      })
      .catch(err => {
        res.render('pages/application', {
          fixed_navbar: false,
          username: user.username,
          message: err
        });
      });
  });

  app.post('/applications/:lid/:pid', (req, res) => {
    const { question_1, question_2, question_3 } = req.body;
    const list_id = req.params.lid;
    const prop_id = req.params.pid;
    const query = 'INSERT INTO applications (listing_id, property_id, datetime, username, prompt_1, prompt_2, Prompt_3) VALUES ($1, $2, to_timestamp($3 / 1000.0), $4, $5, $6, $7);';

    db.none(query, [list_id, prop_id, Date.now(), user.username, question_1, question_2, question_3])
      .then(() => {
        res.redirect('/applications');
      })
      .catch(err => {
        res.redirect('/applications');
      })
  });

  app.get('/add_listing', (req, res) => {
    const query = 'SELECT prop.address_line1 FROM users JOIN properties AS prop ON prop.property_id = users.property_id WHERE users.username = $1;';

    db.one(query, [user.username])
      .then(data => {
        res.render('pages/add_listing', {
          fixed_navbar: false,
          username: user.username,
          address_line1: data.address_line1
        });
      })
      .catch(err => {
        res.render('pages/add_listing', {
          fixed_navbar: false,
          username: user.username,
          address_line1: err
        });
      });
  });

  app.post('/add_listing', (req, res) => {
    const query = 'INSERT INTO listing (username, property_id, price, description, question_1, question_2, question_3, images) VALUES ($1, $2, $3, $4, $5, $6, $7, \'{}\') RETURNING *;';

    db.one(query, [user.username, user.property_id, parseInt(req.body.price), req.body.description, req.body.question1, req.body.question2, req.body.question3])
      .then(data => {
        var folderName = '/public/img/listings/' + data.listing_id;
        if (!fs.existsSync(__dirname + folderName)) {
          fs.mkdirSync(__dirname + folderName);
        }
        const { image1, image2, image3, image4, image5 } = req.files;
        var image_urls = [];
        var url;
        if (image1) {
          url = folderName + '/' + image1.name;
          image1.mv(__dirname + url);
          image_urls.push(url);
        }
        if (image2) {
          url = folderName + '/' + image2.name;
          image2.mv(__dirname + url);
          image_urls.push(url);
        }
        if (image3) {
          url = folderName + '/' + image3.name;
          image3.mv(__dirname + url);
          image_urls.push(url);
        }
        if (image4) {
          url = folderName + '/' + image4.name;
          image4.mv(__dirname + url);
          image_urls.push(url);
        }
        if (image5) {
          url = folderName + '/' + image5.name;
          image5.mv(__dirname + url);
          image_urls.push(url);
        }

        var update_query = 'UPDATE listing SET images = \'{';
        image_urls.forEach((image_url, i, arr) => {
          if (i === arr.length - 1) update_query += '\"' + image_url + '\"';
          else update_query += '\"' + image_url + '\",';
        });
        update_query += '}\' WHERE username = $1;';

        db.none(update_query, [user.username])
          .then(() => {
            res.redirect('/applications');
          });
      })
      .catch(err => {
        res.redirect('/applications');
      });
  });

  app.get('/listing/:lid', (req, res) => {
    const list_id = req.params.lid;
    const query = 'SELECT * FROM listing JOIN properties AS prop ON listing.property_id = prop.property_id JOIN users ON users.property_id = prop.property_id WHERE listing_id = $1 AND ARRAY_LENGTH(users.interests, 1) > 0;';
    const user_query = 'SELECT interests FROM users WHERE username = $1;'; 
  
    db.task(task => {
      return task.batch([
        task.one(query, [list_id]),
        task.one(user_query, [req.session.user.username])
      ]);
    })
    .then(async data => {
      var addy = data[0].address_line1+ ", " + data[0].city+ ", " + data[0].state;
      console.log(addy);
      const zillowSearchOptions = {
        method: 'GET',
        url: 'https://zillow56.p.rapidapi.com/search',
        params: {
          location: addy
        },
        headers: {
          'content-type': 'application/octet-stream',
          'X-RapidAPI-Key': '51110bf831mshd401637aba1666dp184555jsnf920fb6f82f1',
          'X-RapidAPI-Host': 'zillow56.p.rapidapi.com'
        }
      };
      try {
        const response = await axios.request(zillowSearchOptions);
        var zpid = response.data.zpid;
        console.log(zpid);
        // console.log("zpid: " + zpid);
        const zillowGetUrl = {
          method: 'GET',
          url: 'https://zillow56.p.rapidapi.com/property',
          params: {zpid: zpid},
          headers: {
            'content-type': 'application/octet-stream',
            'X-RapidAPI-Key': '159d835589msh6a85fe63b98a800p143d40jsn27485d976825',
            'X-RapidAPI-Host': 'zillow56.p.rapidapi.com'
          }
        
        };
        try {
          const response2 = await axios.request(zillowGetUrl);
          console.log(response2.data.hdpUrl);
          res.render('pages/listing', {
            fixed_navbar: false,
            username: user.username,
            listing: data[0],
            user: data[1],
            url: response2.data.hdpUrl
          });
        } catch (error) {
          console.error(error);
        }
      } catch (error) {
        console.error(error);
      }
    })
    .catch(err => {
      res.render('pages/listing', {
        fixed_navbar: false,
        username: req.session.user.username,
        message: err
      });
    });
  });

  app.post('/change_address', async (req, res) => {
    const { address_line1, address_line2, city, state, zipcode } = req.body;
    const query = 'UPDATE properties SET address_line1 = $1, address_line2 = $2, neighborhood = $3, city = $4, state = $5, zipcode = $6 WHERE property_id = (SELECT property_id FROM users WHERE username = $7);';
    const check_query = 'SELECT * FROM properties WHERE property_id = (SELECT property_id FROM users WHERE username = $1);';

    await axios({
      url: 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + address_line1.replaceAll(' ', '%20') + '%20' + city + '%20' + state + '.json?limit=1&access_token=' + process.env.MAPBOX_ACCESS_TOKEN,
      method: 'GET'
    }).then(results => {
      db.none(query, [address_line1, address_line2, results.data.features[0].context[0].text, city, state, zipcode, user.username])
        .then(() => {
          db.one(check_query, [user.username])
            .then((data) => {
              res.redirect('/profile');
            });
        })
        .catch(() => {
          res.redirect('/profile');
        });
    }).catch(err => {
      res.redirect('/profile');
    });
  });

  app.get('/get_listings', (req, res) => {
    const query = 'SELECT listing.listing_id, prop.address_line1, prop.address_line2, prop.city, prop.state, prop.zipcode FROM listing JOIN properties AS prop ON prop.property_id = listing.property_id;';

    db.any(query)
      .then(data => {
        var result = [];
        data.forEach(property => {
          result.push({
            listing_id: property.listing_id,
            address: property.address_line1 + ' ' + property.city + ', ' + property.state + ' ' + property.zipcode
          });
        });
        res.json(result);
      })
      .catch(err => {
        res.json(err);
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
  console.log("Server is listening on port 3000");