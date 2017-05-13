var chai = require('chai');
var sinon = require('sinon');
var chaiAsPromised = require('chai-as-promised');
var assert = chai.assert;
var path = require('path');
var proxyquire = require('proxyquire');
var codeCliMate = null;

chai.use(chaiAsPromised);

describe('tasks/codeclimate', function codeclimateTasktest() {
  it('throws an error if the file does not exist', function lcovFileNotExistTest() {
    codeCliMate = require('../lib/reporter');
    assert.isRejected(
      codeCliMate({ file: 'path/to/nowhere' }),
      'The lcov file "path/to/nowhere" does not exist'
    );
  });

  it('throws an error if something went wrong during the execution of codeclimate', function somethingWentWrongTest() {
    codeCliMate = require('../lib/reporter');

    assert.isRejected(
      codeCliMate({
        file: path.join(__dirname, 'coverage.lcov')
      }),
      'Something went wrong during the execution of codeclimate. ' +
      'Make sure your configuration is valid'
    );
  });

  describe('invocation of codeclimate bin', function invocationTest() {
    var fakeToken;
    var execStub;

    beforeEach(function runBeforeEach() {
      fakeToken = 'abcde';
      execStub = sinon.stub();

      codeCliMate = proxyquire('../lib/reporter', {
        'child_process': {
          exec: execStub
        }
      });
    });

    it('spawns a child process with the correct executable', function spawnCorrectTest(done) {
      var basePath = path.resolve(__dirname, '..');
      var bin = path.resolve(basePath, 'node_modules/.bin/codeclimate-test-reporter');
      var lcovFile = path.resolve(basePath, 'test/coverage.lcov');
      var command = 'CODECLIMATE_REPO_TOKEN=' + fakeToken + ' ' + bin + ' < ' + lcovFile;

      execStub.callsArg(1);

      codeCliMate({
        token: fakeToken,
        file: lcovFile
      })
        .then(function runAssertion() {
          assert.equal(execStub.getCall(0).args[0], command);
        })
        .then(done)
        .catch(done)
      ;
    });

    it('rejects with error from exec', function rejectWithErrorTest(done) {
      var fakeError = new Error('Fake');

      execStub.callsArgWith(1, fakeError);

      codeCliMate({
        token: fakeToken,
        file: path.join(__dirname, 'coverage.lcov')
      })
        .catch(function assertionTest(err) {
          assert.equal(err.message, fakeError.message);
        })
        .then(done)
      ;
    });
  });
});
