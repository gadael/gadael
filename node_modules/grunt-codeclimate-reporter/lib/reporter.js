var Promise = require('bluebird');
var spawnProcess = Promise.promisify(require('child_process').exec);
var util = require('util');
var path = require('path');
var fs = require('mz/fs');
var defaultExecutable = path.join(__dirname, '..', 'node_modules', '.bin', 'codeclimate-test-reporter');

/**
 * @param  {object}  options
 * @return {Promise} A bluebird promise
 */
module.exports = function reporter(options) {
  var executable = options.executable || defaultExecutable;

  return fs.exists(options.file)
    .then(function isFilePresent(isPresent) {
      if (!isPresent) {
        return Promise.reject(new Error(util.format('The lcov file "%s" does not exist', options.file)));
      }

      return spawnProcess('CODECLIMATE_REPO_TOKEN=' + options.token + ' ' + executable + ' < ' + options.file);
    })
    .then(function resolveWithResult(res) {
      return res;
    })
    .catch(function catchError(err) {
      if (err) {
        return Promise.reject(err);
      }

      return Promise.reject(new Error(
        'Something went wrong during the execution of codeclimate. ' +
        'Make sure your configuration is valid'
      ));
    })
  ;
};
