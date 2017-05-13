module.exports = (grunt) ->
  # load devDependency grunt tasks
  require('matchdep').filterAll('grunt-*').forEach(grunt.loadNpmTasks)

  grunt.initConfig
    jshint:
      all:
        src: 'stream-worker.js'
        options:
          eqnull: true # checking for null or undefined but not false

    simplemocha:
      test:
        src: 'test/*.test.coffee'
        options:
          compilers: 'coffee:coffee-script'


  grunt.registerTask 'test', [
    'jshint'
    'simplemocha'
  ]



