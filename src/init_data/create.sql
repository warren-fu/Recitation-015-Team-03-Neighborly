DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(50) PRIMARY KEY NOT NULL,
  password CHAR(60) NOT NULL
);