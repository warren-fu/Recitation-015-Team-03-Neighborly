DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(50) PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  property_id NUMERIC,
  password VARCHAR(60) NOT NULL,
  email VARCHAR(60) NOT NULL,
  phone_number VARCHAR(60),
  gender VARCHAR(60),
  birthdate DATE,
  interests VARCHAR(100) []
);

DROP TABLE IF EXISTS applications CASCADE;

CREATE TABLE IF NOT EXISTS applications (
  application_id SERIAL NOT NULL,
  listing_id NUMERIC NOT NULL,
  property_id NUMERIC NOT NULL,
  datetime TIMESTAMP NOT NULL,
  username VARCHAR(50) NOT NULL,
  prompt_1 VARCHAR(65535) NOT NULL,
  prompt_2 VARCHAR(65535) NOT NULL,
  prompt_3 VARCHAR(65535) NOT NULL
);

DROP TABLE IF EXISTS listing CASCADE;

CREATE TABLE IF NOT EXISTS listing (
  listing_id SERIAL primary key,
  username VARCHAR(50) NOT NULL,
  property_id NUMERIC NOT NULL,
  price DECIMAL NOT NULL,
  description VARCHAR(65535),
  question_1 VARCHAR(65535) NOT NULL,
  question_2 VARCHAR(65535) NOT NULL,
  question_3 VARCHAR(65535) NOT NULL,
  images VARCHAR(690) []
);

DROP TABLE IF EXISTS properties CASCADE;

CREATE TABLE IF NOT EXISTS properties (
  property_id SERIAL primary key,
  neighborhood VARCHAR(150) NOT NULL,
  address_line1 VARCHAR(150) NOT NULL,
  address_line2 VARCHAR(150),
  city VARCHAR(150) NOT NULL,
  state VARCHAR(20) NOT NULL,
  zipcode VARCHAR(5) NOT NULL
);

DROP TABLE IF EXISTS replies CASCADE;

CREATE TABLE IF NOT EXISTS replies (
  reply_id SERIAL primary key,
  username VARCHAR(50) NOT NULL,
  reply_value VARCHAR(10000) NOT NULL
);

DROP TABLE IF EXISTS post_to_replies CASCADE;

CREATE TABLE IF NOT EXISTS post_to_replies (
  post_id NUMERIC NOT NULL,
  reply_id NUMERIC NOT NULL
);

DROP TABLE IF EXISTS posts CASCADE;

CREATE TABLE IF NOT EXISTS posts (
  post_id SERIAL primary key,
  datetime TIMESTAMP NOT NULL,
  username VARCHAR(50) NOT NULL,
  neighborhood VARCHAR(150) NOT NULL,
  subject VARCHAR(690) NOT NULL,
  description VARCHAR(65535) NOT NULL,
  votes NUMERIC NOT NULL
);

DROP TABLE IF EXISTS interests CASCADE;

CREATE TABLE IF NOT EXISTS interests (
  interests_id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  education VARCHAR(25),
  job VARCHAR(25),
  hobby VARCHAR(25)
);

DROP TABLE IF EXISTS hobbies CASCADE;

CREATE TABLE IF NOT EXISTS hobbies (
  hobby_id SERIAL primary key,
  hobby VARCHAR(100) NOT NULL
);

DROP TABLE IF EXISTS tv_shows CASCADE;

CREATE TABLE IF NOT EXISTS tv_shows (
  show_id SERIAL primary key,
  show VARCHAR(100) NOT NULL
);

DROP TABLE IF EXISTS movies CASCADE;

CREATE TABLE IF NOT EXISTS movies (
  movie_id SERIAL primary key,
  movie VARCHAR(100) NOT NULL
);

DROP TABLE IF EXISTS artists CASCADE;

CREATE TABLE IF NOT EXISTS artists (
  artist_id SERIAL primary key,
  artist VARCHAR(100) NOT NULL
);