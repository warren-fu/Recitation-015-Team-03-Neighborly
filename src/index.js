// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require("express"); // To build an application server or API
const app = express();
<<<<<<< HEAD
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.
const { json } = require('body-parser');
const fs = require('fs');
const busboy = require('connect-busboy');

=======
const pgp = require("pg-promise")(); // To connect to the Postgres DB from the node server
const bodyParser = require("body-parser");
const session = require("express-session"); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require("bcrypt"); //  To hash passwords
const axios = require("axios"); // To make HTTP requests from our server. We'll learn more about it in Part B.
const { json } = require("body-parser");
const fs = require("fs");
const busboy = require("connect-busboy");
>>>>>>> main

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

// TODO - Include your API routes here

app.get("/get_user", (req, res) => {
  const query = "SELECT * FROM users WHERE username = $1;";

  db.one(query, [req.query.username])
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
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

app.get("/get_search", async (req, res) => {
  const axios = require('axios');

  const searchCity = req.query.city; // get the city from the query parameters

  const options = {
    method: 'GET',
    url: 'https://realty-in-us.p.rapidapi.com/properties/v2/list-for-rent',
    params: {
      city: searchCity,
      state_code: 'CA',
      limit: '10',
      offset: '0',
      sort: 'relevance'
    },
    headers: {
      'X-RapidAPI-Key': process.env.RapidAPI_Key,
      'X-RapidAPI-Host': 'realty-in-us.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    const listings = response.data.data;
    res.send(listings); // send the listings data as the response
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error'); // return a 500 error if something goes wrong
  }
});

app.get("/get_reviews", (req, res) => {
  const property_id = req.query.property_id;
  const query =
    "SELECT subject, description, rating FROM reviews WHERE property_id = $1;";

  db.any(query, [property_id])
    .then(data => {
      res.status(200).json(data);
    })
    .catch(err => {
      res.status(404).json(err);
    });
});

app.post("/add_review", (req, res) => {
  const username = req.query.username;
  const subject = req.query.subject;
  const description = req.query.description;
  const rating = req.query.rating;
  const query =
    "INSERT INTO reviews (username, property_id, subject, description, rating) VALUES ($1, $2, $3, $4, $5) returning *;";

  db.task((task) => {
    return task.batch([
      task.one("SELECT property_id FROM users WHERE username = $1", [username]),
    ]);
  })
    .then((data) => {
      db.any(query, [
        username,
        parseInt(data[0].property_id),
        subject,
        description,
        parseInt(rating),
      ])
        .then((res) => {
          res.status(200).json(res);
        })
        .catch((err) => {
          res.status(404).json(err);
        });
    })
    .catch((err) => {
      res.status(404).json(err);
    });
});

const test_data = {
  listing: {
    prop_type: "single family",
    move_in_date: null,
    data_source_name: "mls",
    price: 95000,
    year_built: 1938,
    permalink: "3093-Fulton-St_Brooklyn_NY_11208_M45994-50556",
    address: {
      city: "Brooklyn",
      line: "3093 Fulton St",
      postal_code: "11208",
      address_validation_code: "121",
      state_code: "NY",
      state: "New York",
      county: "Kings",
      fips_code: "36047",
      county_needed_for_uniq: false,
      time_zone: "America/New_York",
      lat: 40.681295,
      neighborhood_name: "Highland Park",
      neighborhoods: [
        {
          name: "Highland Park",
          city: "Brooklyn",
          state_code: "NY",
          level: "sub_neighborhood",
          id: null,
        },
        {
          name: "Cypress Hills",
          city: "Brooklyn",
          state_code: "NY",
          level: "neighborhood",
          id: "4",
        },
        {
          name: "Eastern Brooklyn",
          city: "New York",
          state_code: "NY",
          level: "macro_neighborhood",
          id: null,
        },
      ],
      long: -73.880769,
    },
    beds: 0,
    baths_full: 2,
    baths: 2,
    sqft: 1600,
    lot_sqft: null,
    hoa_fee: 0,
    hoa_historic_fee: null,
    neighborhood: "Highland Park",
    neighborhoods: [
      {
        name: "Highland Park",
        city: "Brooklyn",
        state_code: "NY",
        level: "sub_neighborhood",
        id: null,
      },
      {
        name: "Cypress Hills",
        city: "Brooklyn",
        state_code: "NY",
        level: "neighborhood",
        id: "4",
      },
      {
        name: "Eastern Brooklyn",
        city: "New York",
        state_code: "NY",
        level: "macro_neighborhood",
        id: null,
      },
    ],
    raw_prop_type: "Single Family Home",
    photo_count: 1,
    status: "Pending",
    list_date: "2018-05-05T02:17:29Z",
    last_update: "2022-02-11T10:56:57Z",
    mls_id: "201818281",
    photos: [
      {
        description: "",
        href: "https://ap.rdcpix.com/9e6c24a10028e42651d866306062a3e8l-m3734405187x.jpg",
        tags: [
          {
            label: "other_unknowns",
            probability: null,
          },
        ],
        type: "realtordotcom_mls_listing_image",
      },
    ],
    photo: {
      description: "",
      href: "https://ap.rdcpix.com/9e6c24a10028e42651d866306062a3e8l-m3734405187x.jpg",
      tags: [
        {
          label: "other_unknowns",
          probability: null,
        },
      ],
      type: "realtordotcom_mls_listing_image",
    },
    features: [
      {
        category: "Bedrooms",
        parent_category: "Interior",
        text: ["Bedrooms: 0"],
      },
      {
        category: "Other Rooms",
        parent_category: "Interior",
        text: ["Total Rooms: 4", "Basement Features: Full"],
      },
      {
        category: "Bathrooms",
        parent_category: "Interior",
        text: ["Total Bathrooms: 2.00", "Full Bathrooms: 2"],
      },
      {
        category: "Heating and Cooling",
        parent_category: "Interior",
        text: ["Heating Features: Steam"],
      },
      {
        category: "Kitchen and Dining",
        parent_category: "Interior",
        text: [
          "Dining Area Features: Combined DR/LR",
          "Kitchen Features: Eat-in Kitchen",
        ],
      },
      {
        category: "Homeowners Association",
        parent_category: "Community",
        text: [
          "Association: No",
          "Calculated Total Monthly Association Fees: 0",
        ],
      },
      {
        category: "Other Property Info",
        parent_category: "Listing",
        text: [
          "Source Listing Status: Pending",
          "County: Kings",
          "Directions: Atlantic to Fulton",
          "Source Property Type: Single Family Residence",
          "Parcel Number: 610000 3945-3945-4",
          "Source System Name: C2C",
        ],
      },
      {
        category: "Utilities",
        parent_category: "Features",
        text: ["Sewer: Public Sewer", "Water Source: Public"],
      },
      {
        category: "Building and Construction",
        parent_category: "Features",
        text: [
          "Construction Materials: Brick",
          "Property Age: 84",
          "Architectural Style: 2 Story",
        ],
      },
      {
        category: "Legal and finance",
        text: ["HOA Frequency: Monthly/0", "HOA fee: $0"],
      },
    ],
    heating: null,
    cooling: null,
    web_url:
      "https://www.realtor.com/realestateandhomes-detail/3093-Fulton-St_Brooklyn_NY_11208_M45994-50556",
    prop_status: "for_sale",
    property_id: "4599450556",
    listing_id: "608763437",
    is_showcase: false,
    reduced: false,
    description:
      "Drive by only , house is in major disrepair unsafe for entry . Please submit offers",
    pending: true,
    pending_date: "2018-05-21T16:48:28",
    advertiser_type: "agent"
  }
};

app.post("/listing", async (req, res) => {
  var data = test_data.listing;
  res.render("pages/listing", {data});

  // const query = `SELECT list.listing_id, prop.address_line1, prop.city, prop.state, prop.zipcode FROM listing AS list LEFT JOIN properties AS prop ON list.property_id = "${req.body.property_id}";`;
  // console.log(res.listing_id )
  // console.log(req.body.listing_id )
  //The get photos API doesn't work for some reason.
  // axios({
  //   method: 'GET',
  //   url: 'https://realty-in-us.p.rapidapi.com/properties/v3/get-photos',
  //   params: {
  //     property_id: '1109448061'
  //   },
  //   headers: {
  //     'content-type': 'application/octet-stream',
  //     'X-RapidAPI-Key': '51110bf831mshd401637aba1666dp184555jsnf920fb6f82f1',
  //     'X-RapidAPI-Host': 'realty-in-us.p.rapidapi.com'
  //   }
  // })
  //   .then(results => {
  //     console.log(results.data); // the results will be displayed on the terminal if the docker containers are running // Send some parameters
  //     var data = results.data._embedded.events;
  //     res.render('pages/discover',{ data });
  //   })
  //   .catch(error => {
  //     console.log("ERROR");
  //   });
  // const options = {
  //   method: 'GET',
  //   url: 'https://realty-in-us.p.rapidapi.com/properties/v3/get-photos',
  //   params: {
  //     property_id: '1109448061'
  //   },
  //   headers: {
  //     'content-type': 'application/octet-stream',
  //     'X-RapidAPI-Key': '51110bf831mshd401637aba1666dp184555jsnf920fb6f82f1',
  //     'X-RapidAPI-Host': 'realty-in-us.p.rapidapi.com'
  //   }
  // };
  // try {
  //   const response = await axios.request(options);
  //   console.log(response.data);
  // } catch (error) {
  //   console.error(error);
  // }
  // const axios = require('axios');
  // const options = {
  //   method: 'POST',
  //   url: 'https://realty-in-us.p.rapidapi.com/properties/v3/list',
  //   headers: {
  //     'content-type': 'application/json',
  //     'X-RapidAPI-Key': '51110bf831mshd401637aba1666dp184555jsnf920fb6f82f1',
  //     'X-RapidAPI-Host': 'realty-in-us.p.rapidapi.com'
  //   },
  //   data: {
  //     limit: 1,
  //     offset: 0,
  //     postal_code: '80305',
  //     status: [
  //       'for_sale',
  //       'ready_to_build'
  //     ],
  //     sort: {
  //       direction: 'desc',
  //       field: 'list_date'
  //     }
  //   }
  // };
  // try {
  // 	const response = await axios.request(options);
  // 	console.log(response.data.data.home_search.results);
  // } catch (error) {
  // 	console.error(error);
  // }
});

// TODO - Login and Register

app.get("/register", (req, res) => {
  return res.render("pages/register");
});

// Register
app.post("/register", async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    username,
    password,
    confirm_password,
    phone_number,
    gender,
    birthdate,
  } = req.body;
  if (password != confirm_password) {
    return res.render("pages/register", {
      error: "danger",
      message: "Passwords do not match",
    });
  }
  //hash the password using bcrypt library
  const hash = await bcrypt.hash(password, 10);
  // To-DO: Insert username and hashed password into 'users' table
  const query =
    "INSERT INTO users (username, first_name, last_name, property_id, status_id, password, email, phone_number, gender, birthdate) VALUES ($1, $2, $3, NULL, NULL, $4, $5, $6, $7, $8) returning *;";
  db.any(query, [
    username,
    first_name,
    last_name,
    hash,
    email,
    phone_number,
    gender,
    birthdate,
  ])
    .then((data) => {
      return res.redirect("/login");
    })
    .catch(function () {
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

app.get("/get_userAddress", (req, res) => {
  const query =
    "SELECT prop.address_line1, prop.city, prop.state, prop.zipcode FROM users JOIN properties AS prop ON prop.property_id = users.property_id WHERE users.username = $1;";

  db.any(query, [user.username])
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      res.status(404).json(err);
    });
});

//TODO - Everything that you need to be logged in for

app.get("/explore", (req, res) => {
  const query =
    "SELECT list.listing_id, prop.address_line1, list.price, list.description FROM listing AS list LEFT JOIN properties AS prop ON list.property_id = prop.property_id;";

  db.any(query)
    .then((data) => {
      res.render("pages/explore", {
        fixed_navbar: true,
        username: req.session.user.username,
        api_key: process.env.API_KEY,
        listings: data,
      });
    })
    .catch((err) => {
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

  const query = 'SELECT prop.address_line1, prop.address_line2, prop.city, prop.state, prop.zipcode FROM users JOIN properties AS prop ON prop.property_id = users.property_id WHERE users.username = $1;';

  db.oneOrNone(query, [req.session.user.username])
      .then(data => {
        if(data){
          res.render('pages/profile', {
            fixed_navbar: true,
            propertyId: req.session.user.property_id,
            username: req.session.user.username,
            first_name: req.session.user.first_name,
            last_name: req.session.user.last_name,
            email: req.session.user.email,
            phone_number: req.session.user.phone_number,
            gender: req.session.user.gender,
            birthdate: req.session.user.birthdate,
            status: req.session.user.status_id,
            address_line1: data.address_line1,
            address_line2: data.address_line2,
            city: data.city,
            state: data.state,
            zipcode: data.zipcode
          });
        }else{
          res.render('pages/profile', {
            fixed_navbar: true,
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
            zipcode: ''
          });
        }
      })
      .catch(err => {
        res.status(404).json(err);
      });
  
});

//TODO Work on for recieving address data and place into the tables accordingly
app.post('/profile', (req,res) => {
  // const userToListQuery = 'INSERT INTO ';
  // const listingQuery = 'INSERT INTO listing (listing_id, username, property_id, price, description) VALUES ($1, $2, $3, $4, $5);';

  const address1 = req.body.address_1;
  const address2 = req.body.address_2;
  const city = req.body.city;
  const state = req.body.state;
  const zip = req.body.zip;

  const propertyQuery = 'INSERT INTO properties (property_id, neighborhood_id, address_line1, address_line2, city, state, zipcode) VALUES ($1, $2, $3, $4, $5, $6, $7);';
  db.any(propertyQuery, [1234, 1, address1, address2, city, state, zip])
  .then(data =>{
    req.session.user.property_id = 1234;
    console.log(req.session.user.property_id);
    return res.render('pages/profile', {
            fixed_navbar: true,
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
  .catch(err =>{
    return res.render('pages/profile', {
            fixed_navbar: true,
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
            zipcode: ''
          }, 
          { error: 'danger', message: 'Invalid address has been inputed' });
  })
});


app.get("/feed", (req, res) => {
  const query =
    "SELECT posts.username, posts.datetime, posts.post_id, posts.subject, posts.description, posts.votes FROM posts WHERE posts.neighborhood_id = $1 ORDER BY posts.datetime DESC;";
  const neighborhood_id_query =
    "SELECT prop.neighborhood_id FROM properties AS prop JOIN users ON prop.property_id = users.property_id WHERE users.username = $1;";

  db.any(neighborhood_id_query, [user.username])
    .then((data) => {
      db.any(query, [parseInt(data.neighborhood_id)])
        .then((results) => {
          res.render("pages/feed", {
            fixed_navbar: false,
            username: req.session.user.username,
            posts: results,
            comments: null,
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
  const query =
    "INSERT INTO posts(datetime, username, neighborhood_id, subject, description, votes) VALUES (to_timestamp($1 / 1000.0), $2, $3, $4, $5, $6) returning *;";
  const neighborhood_id_query =
    "SELECT prop.neighborhood_id FROM properties AS prop JOIN users ON prop.property_id = users.property_id WHERE users.username = $1;";

  db.any(neighborhood_id_query, [user.username])
    .then((data) => {
      db.any(query, [
        Date.now(),
        user.username,
        parseInt(data.neighborhood_id),
        subject,
        description,
        0,
      ])
        .then(() => {
          res.redirect("/feed");
        })
        .catch(() => {
          res.render("pages/feed", {
            fixed_navbar: false,
            username: req.session.user.username,
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
    })
    .catch((err) => {
      res.render("pages/feed", {
        fixed_navbar: false,
        username: req.session.user.username,
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
