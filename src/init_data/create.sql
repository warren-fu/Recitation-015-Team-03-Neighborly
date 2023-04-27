DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(50) PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  property_id NUMERIC,
  status_id NUMERIC,
  password VARCHAR(60) NOT NULL,
  email VARCHAR(60) NOT NULL,
  phone_number VARCHAR(60),
  gender VARCHAR(60),
  birthdate DATE
);

DROP TABLE IF EXISTS user_to_listing CASCADE;

CREATE TABLE IF NOT EXISTS users_to_listing (
  username VARCHAR(50) NOT NULL,
  listing_id NUMERIC NOT NULL
);

DROP TABLE IF EXISTS listing CASCADE;

CREATE TABLE IF NOT EXISTS listing (
  listing_id SERIAL primary key,
  username VARCHAR(50) NOT NULL,
  property_id NUMERIC NOT NULL,
  price DECIMAL NOT NULL,
  description VARCHAR(65535)
);

DROP TABLE IF EXISTS properties CASCADE;

CREATE TABLE IF NOT EXISTS properties (
  property_id NUMERIC primary key,
  neighborhood_id NUMERIC NOT NULL,
  address_line1 VARCHAR(150) NOT NULL,
  address_line2 VARCHAR(150),
  city VARCHAR(150) NOT NULL,
  state VARCHAR(20) NOT NULL,
  zipcode NUMERIC NOT NULL
);

DROP TABLE IF EXISTS reviews CASCADE;

CREATE TABLE IF NOT EXISTS reviews (
  review_id SERIAL primary key,
  username VARCHAR(50) NOT NULL,
  property_id NUMERIC NOT NULL,
  subject VARCHAR(690) NOT NULL,
  description VARCHAR(65535) NOT NULL,
  rating NUMERIC NOT NULL
);

DROP TABLE IF EXISTS prompts CASCADE;

CREATE TABLE IF NOT EXISTS prompts (
  prompt_id SERIAL primary key,
  prompt_value VARCHAR(65535) NOT NULL
);

DROP TABLE IF EXISTS info CASCADE;

CREATE TABLE IF NOT EXISTS info (
  username VARCHAR(50) NOT NULL,
  prompt_id NUMERIC NOT NULL,
  answer VARCHAR(10000) NOT NULL
);
DROP TABLE IF EXISTS status CASCADE;

CREATE TABLE IF NOT EXISTS status (
  status_id NUMERIC primary key,
  status_value VARCHAR(65535) NOT NULL
);

DROP TABLE IF EXISTS neighborhood CASCADE;

CREATE TABLE IF NOT EXISTS neighborhood (
  neighborhood_id NUMERIC primary key,
  neighborhood_value VARCHAR(65535) NOT NULL
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
  neighborhood_id NUMERIC NOT NULL,
  subject VARCHAR(690) NOT NULL,
  description VARCHAR(65535) NOT NULL,
  votes NUMERIC NOT NULL
);