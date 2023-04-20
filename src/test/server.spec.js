// Imports the index.js file to be tested.
const server = require('../index'); //TO-DO Make sure the path to your index.js is correctly added
// Importing libraries

// Chai HTTP provides an interface for live integration testing of the API's.
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });

  // ===========================================================================
  // TO-DO: Part A Login unit test case

  it('Redirects to the login page', done => {
    chai
      .request(server)
      .get('/')
      .end((err, res) => {
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Redirecting to the login page.');
        done();
      });
  });
  
  //Positive login test case
  it('positive : /login', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'ryan', password: '$2b$10$a4qvrY8R6g.Z3SX/DfjyleN9RoX4PnXCGG226.h5rXIHmtzDPfd0i'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Success');
        done();
      });
  });

  //Negative login test case
  it('Negative : /login. Checking invalid name', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'Not John Doe', password: 'randompassword'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Invalid input');
        done();
      });
  });

  //Positive register test case
  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'John Doe', password: 'randompassword',  email: 'a@email.com'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Success');
        done();
      });
  });

  //Negative register test case
  it('Negative : /register. Checking invalid name', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'John Doe', password: 'randompassword'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Invalid input');
        done();
      });
  });

  
});