module.exports = function gruntfile(grunt) {
  grunt.initConfig({
    eslint: {
      options: {
        configFile: '.eslintrc'
      },
      target: ['tasks/**/*.js', 'lib/**/*.js', 'Gruntfile.js', 'test/**/*.js']
    },
    mochaTest: {
      src: ['test/**/*.js'],
      options: {
        reporter: 'nyan'
      }
    }
  });

  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('test', ['eslint', 'mochaTest']);

  grunt.registerTask('default', ['eslint']);
};
