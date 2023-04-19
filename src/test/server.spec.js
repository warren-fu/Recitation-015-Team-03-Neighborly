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
  // Positive Test Case: Valid email id/username and password
  // it('Positive: /login - Valid credentials', (done) => {
  //   chai
  //     .request(server)
  //     .post('/login')
  //     .send({ email: 'validemail@example.com', password: 'validpassword' })
  //     .end((err, res) => {
  //       expect(res).to.have.status(200);
  //       expect(res.body.message).to.equal('Success');
  //       done();
  //     });
  // });

  // // Negative Test Case: Invalid email id/username or password
  // it('Negative: /login - Invalid credentials', (done) => {
  //   chai
  //     .request(server)
  //     .post('/login')
  //     .send({ email: 'invalidemail@example.com', password: 'invalidpassword' })
  //     .end((err, res) => {
  //       expect(res).to.have.status(401);
  //       expect(res.body.message).to.equal('Invalid credentials');
  //       done();
  //     });
  // });
});