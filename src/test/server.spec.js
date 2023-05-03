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
  // it('Returns the default welcome message', done => {
  //   chai
  //     .request(server)
  //     .get('/welcome')
  //     .end((err, res) => {
  //       expect(res).to.have.status(200);
  //       expect(res.body.status).to.equals('success');
  //       assert.strictEqual(res.body.message, 'Welcome!');
  //       done();
  //     });
  // });

  // ===========================================================================
  // TO-DO: Part A Login unit test case

  // it('Redirects to the login page', done => {
  //   chai
  //     .request(server)
  //     .get('/')
  //     .end((err, res) => {
  //       expect(res.body.status).to.equals('success');
  //       assert.strictEqual(res.body.message, 'Redirecting to the login page.');
  //       done();
  //     });
  // });
  
  //Positive register test case
  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({first_name: 'test', last_name: 'case', email: 'test@test.com', username: 'test', password: 'test', confirm_password: 'test', phone_number: '1111111111', gender: 'rather_not_say', birthdate: '01/01/1999'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Success');
        done();
      });
  });

  //Negative register test case
  it('Negative : /register. Checking different passwords', done => {
    chai
      .request(server)
      .post('/register')
      .send({first_name: 'test2', last_name: 'case2', email: 'test2@test.com', username: 'test2', password: 'test2', confirm_password: 'test1', phone_number: '1111111111', gender: 'rather_not_say', birthdate: '01/01/1999'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals("Passwords do not match");
        done();
      });
  });

  //Negative login test case
  it('Negative : /login. Checking invalid name', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'User dont exist', password: 'randompassword'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('User does not exist');
        done();
      });
  });
  
  //Positive login test case
  it('positive : /login', done => {
    chai
      .request(server)
      .post('/login')
      .send({username: 'test', password: 'test'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Success');
        done();
      });
  });

  

});