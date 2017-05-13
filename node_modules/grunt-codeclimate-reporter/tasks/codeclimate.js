var reporter = require('../lib/reporter');

module.exports = function task(grunt) {
  grunt.registerMultiTask('codeclimate', 'Send your coverage to codeclimate.', function codeclimate() {
    var done = this.async();
    var options = this.options({
      token: false,
      file: '',
      executable: null
    });

    reporter(options)
      .then(function respondWithRes(res) {
        grunt.log.ok(res);
        done();
      })
      .catch(function catchErr(err) {
        console.error(err);
        done(false);
      })
    ;
  });
};
