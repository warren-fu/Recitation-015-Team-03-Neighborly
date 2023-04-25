INSERT INTO users(username,first_name,last_name, property_id, status_id, password, email, phone_number, gender, birthdate) VALUES ( 'abcd','ab', 'cd', 1, 1, '$2b$10$a4qvrY8R6g.Z3SX/DfjyleN9RoX4PnXCGG226.h5rXIHmtzDPfd0i', 'a@b.com', 1111111111, 'male', '2000-02-22');
INSERT INTO users(username,first_name,last_name, property_id, status_id, password, email, phone_number, gender, birthdate) VALUES ( 'will','ab', 'cd', 2, 1, '$2y$10$3cK3fVwGuGzEvixqalB.Oeq8X2UNxctQBz2tGAlJUHW63xOt3eYnW', 'a@b.com', 1111111111, 'male', '2000-02-22');
INSERT INTO users(username,first_name,last_name, property_id, status_id, password, email, phone_number, gender, birthdate) VALUES ( 'evan','ab', 'cd', 2, 1, '$2b$10$a4qvrY8R6g.Z3SX/DfjyleN9RoX4PnXCGG226.h5rXIHmtzDPfd0i', 'a@b.com', 1111111111, 'male', '2000-02-22');
INSERT INTO users(username,first_name,last_name, property_id, status_id, password, email, phone_number, gender, birthdate) VALUES ( 'warren','ab', 'cd', 3, 1, '$2b$10$a4qvrY8R6g.Z3SX/DfjyleN9RoX4PnXCGG226.h5rXIHmtzDPfd0i', 'a@b.com', 1111111111, 'male', '2000-02-22');
INSERT INTO users(username,first_name,last_name, property_id, status_id, password, email, phone_number, gender, birthdate) VALUES ( 'juno','ab', 'cd', 4, 1, '$2b$10$a4qvrY8R6g.Z3SX/DfjyleN9RoX4PnXCGG226.h5rXIHmtzDPfd0i', 'a@b.com', 1111111111, 'male', '2000-02-22');
INSERT INTO users(username,first_name,last_name, property_id, status_id, password, email, phone_number, gender, birthdate) VALUES ( 'ryan','ab', 'cd', 5, 1, '$2b$10$a4qvrY8R6g.Z3SX/DfjyleN9RoX4PnXCGG226.h5rXIHmtzDPfd0i', 'a@b.com', 1111111111, 'male', '2000-02-22');
INSERT INTO users(username,first_name,last_name, property_id, status_id, password, email, phone_number, gender, birthdate) VALUES ( 'james','ab', 'cd', 1, 1, '$2b$10$a4qvrY8R6g.Z3SX/DfjyleN9RoX4PnXCGG226.h5rXIHmtzDPfd0i', 'a@b.com', 1111111111, 'male', '2000-02-22');

INSERT INTO properties (property_id, neighborhood_id, address_line1, address_line2, city, state, zipcode) VALUES (1, 1, '120 S 34th St', NULL, 'Boulder', 'CO', 80304);
INSERT INTO properties (property_id, neighborhood_id, address_line1, address_line2, city, state, zipcode) VALUES (2, 1, '8101 KINCROSS WAY', NULL, 'Boulder', 'CO', 80301);
INSERT INTO properties (property_id, neighborhood_id, address_line1, address_line2, city, state, zipcode) VALUES (3, 1, '3400 MADISON AVE', NULL, 'Boulder', 'CO', 80303);
INSERT INTO properties (property_id, neighborhood_id, address_line1, address_line2, city, state, zipcode) VALUES (4, 1, '3300 BLUFF ST', NULL, 'Boulder', 'CO', 80301);
INSERT INTO properties (property_id, neighborhood_id, address_line1, address_line2, city, state, zipcode) VALUES (5, 1, '1300 5TH ST', NULL, 'Boulder', 'CO', 80302);

INSERT INTO listing (listing_id, username, property_id, price, description) VALUES (1,'will', 1, 800, 'Great place to live!');
INSERT INTO listing (listing_id, username, property_id, price, description) VALUES (2,'warren', 2, 900, 'Awesome place to live!');
INSERT INTO listing (listing_id, username, property_id, price, description) VALUES (3,'juno', 3, 1200, 'Sweet place to live!');

INSERT INTO posts (datetime, username, neighborhood_id, subject, description, votes) VALUES ('2023-04-25 07:52:48.090 UTC', 'ryan', 1, 'Looking for Roomate!', 'Looking for roomate to sublease this summer, 120 S 34th St, $1200 a month', 0);
INSERT INTO posts (datetime, username, neighborhood_id, subject, description, votes) VALUES ('2023-04-24 07:52:48.090 UTC', 'james', 1, 'Need a place to stay this summer', 'Looking to rent a place out this summer, if anyone has a spare room let me know', 0);
INSERT INTO posts (datetime, username, neighborhood_id, subject, description, votes) VALUES ('2023-04-23 07:52:48.090 UTC', 'ryan', 1, 'Homeless setting off the fire alarm', 'Anyone know why four star is letting homeless people live in the basement of my apartment', 0);

INSERT INTO replies (username, reply_value) VALUES ('will', 'Im looking for a place to stay the summer');
INSERT INTO replies (username, reply_value) VALUES ('evan', 'I am too if it is still available');

INSERT INTO post_to_replies (post_id, reply_id) VALUES (1, 1);
INSERT INTO post_to_replies (post_id, reply_id) VALUES (1, 2);