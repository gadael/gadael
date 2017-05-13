# grunt-jasmine-node-coverage

> Runs jasmine-node with Istanbul code coverage

[![Dependency Status](https://david-dm.org/jribble/grunt-jasmine-node-coverage.svg)](https://david-dm.org/jribble/grunt-jasmine-node-coverage)
[![devDependency Status](https://david-dm.org/jribble/grunt-jasmine-node-coverage/dev-status.svg)](https://david-dm.org/jribble/grunt-jasmine-node-coverage#info=devDependencies)
[![Build Status](https://travis-ci.org/jribble/grunt-jasmine-node-coverage.svg)](https://travis-ci.org/jribble/grunt-jasmine-node-coverage)
[![Built with Grunt](http://img.shields.io/badge/Grunt-0.4-blue.svg?style=flat-square)](http://gruntjs.com/)
[![Analytics](https://ga-beacon.appspot.com/UA-2643697-15/grunt-jasmine-node-coverage/index?flat)](https://github.com/igrigorik/ga-beacon)

A [Grunt](http://gruntjs.com/) task to run your [Jasmine](http://jasmine.github.io/)
feature suite using [jasmine-node][]
and [Istanbul](https://github.com/gotwarlost/istanbul) for code coverage reports.

## Getting Started

Install this grunt plugin next to your project's `Gruntfile.js` with:

```sh
npm install grunt-jasmine-node-coverage --save-dev
```

Then add these lines to your project's `Gruntfile.js` configuration file:

```javascript
grunt.initConfig({
  jasmine_node: {
    task_name: {
      options: {
        coverage: {},
        forceExit: true,
        match: '.',
        matchAll: false,
        specFolders: ['tests'],
        extensions: 'js',
        specNameMatcher: 'spec',
        captureExceptions: true,
        junitreport: {
          report: false,
          savePath : './build/reports/jasmine/',
          useDotNotation: true,
          consolidate: true
        }
      },
      src: ['**/*.js']
    }
  }
});

grunt.loadNpmTasks('grunt-jasmine-node-coverage');

grunt.registerTask('default', 'jasmine_node');
```

## Configuring tasks

Grunt tasks should be configured by following
[the multi task configuration](http://gruntjs.com/creating-tasks#multi-tasks)
form, thus wrapping each configuration in an object inside the `jasmine_node` root object.

### Task configuration options

Most of the options are passed throught to [jasmine-node][].


#### options.projectRoot

Type: `string`

Default: `process.cwd()`

See http://nodejs.org/api/process.html#process_process_cwd


#### options.specFolders

Type: `array`

Default: `[options.projectRoot]`

List of folders in which any specs are looked for.


#### options.useHelpers

Type: `boolean`

Default: `false`


#### options.coverage

Type: `boolean|object`

Default: `false`

Istanbul specific configuration. Use empty object,
`{}` to use the defaults that are shown below.

```js
{
  reportFile: 'coverage.json',
  print: 'summary', // none, summary, detail, both
  relativize: true,
  thresholds: {
    statements: 0,
    branches: 0,
    lines: 0,
    functions: 0
  },
  reportDir: 'coverage',
  report: [
    'lcov'
  ],
  collect: [ // false to disable, paths are relative to 'reportDir'
    '*coverage.json'
  ],
  excludes: []
}
```

Please note that `excludes` list will always be added `'**/node_modules/**'` internally.


#### options.showColors

Type: `boolean`

Default: `false`


#### options.isVerbose

Type: `boolean`

Default: `true`

When `true` and `options.teamcity` is `false`, will use
`TerminalVerboseReporter`, else `TerminalReporter`.


#### options.forceExit

Type: `boolean`

Default: `false`

Exit on failure by skipping any asyncronous tasks pending.


#### options.match

Type: `string`

Default: `'.'`

used in the beginning of regular expression


#### options.matchAll

Type: `boolean`

Default: `false`

When true, `options.specFolders` and `options.specNameMatcher` are
ignored while building the `options.regExpSpec` which is then
handed down to jasmine-node.


#### options.specNameMatcher

Type: `string`

Default: `'spec'`

filename expression


#### options.extensions

Type: `string`

Default: `'js'`

Used in regular expressions after dot, inside (), thus | could be used


#### options.captureExceptions

Type: `boolean`

Default: `false`


#### options.junitreport

```js
{
  report: false,
  savePath: './reports/',
  useDotNotation: true,
  consolidate: true
}
```

#### options.teamcity

Type: `boolean`

Default: `false`

If `true`, will be using `TeamcityReporter` instead of possible `isVerbose` option

http://gotwarlost.github.io/istanbul/public/apidocs/classes/TeamcityReport.html


#### options.growl

Type: `boolean`

Default: `false`

When `true` will be adding `GrowlReporter`.

See https://github.com/mhevery/jasmine-node#growl-notifications


#### options.useRequireJs

Type: `boolean`

Default: `false`


#### options.onComplete

Type: `function`

Default: `null`

Will be called on Terminal and Teamcity reporters and on RequireJS runner.


#### options.includeStackTrace

Type: `boolean`

Default: `false`

Used only in `TerminalReporter`.


#### options.coffee

Type: `boolean`

Default: `false`

Seems to be currently (1.4.3) only supported in the command line options of [jasmine-node][].


## Bugs

Help us to squash them by submitting an issue that describes how you encountered it;
please be as specific as possible including operating system, `node`, `grunt`, and
`grunt-jasmine-node-coverage` versions.

```sh
npm --versions
```

## Release History

* v0.4.1  (2015-02-27)  Reports should be collected from where they were written #42
* v0.4.0  (2015-02-19)  Other Grunt tasks were not ran when this failed, #40
* v0.3.2  (2015-02-04)  Fixes for failure cases and documentation, #33, #36, #37 and #38
* v0.3.1  (2014-11-21)  Installation failed. Should fix #30
* v0.3.0  (2014-11-09)  Grunt usage as multi task. Fixes #12 and #18
* v0.2.0  (2014-11-03)  Better Grunt API usage. Fixes #10, #13, #14, #16, #19 and #20
* v0.1.11  (2014-05-15)  Task name fix for `grunt.renametask` use case
* v0.1.10  (2014-04-07)  JSHint configuration and task exit fixes
* v0.1.9  (2014-04-02)  `jasmine_node.options.isVerbose` was not working
* v0.1.8  (2014-03-03)  Add captureExceptions support and quit on exception
* v0.1.7  (2013-12-13)  Istanbul update, threshold configuration and JUNit output
* v0.1.6  (2013-07-26)  Change `isVerbose` option to `verbose`
* v0.1.5  (2013-07-15)  Initial coverage with Istanbul release, originally forked from `grunt-jasmine-node`


## License

Copyright (c) 2013 "jribble" Jarrod Ribble & contributors.
Based on [grunt-jasmine-node](https://github.com/jasmine-contrib/grunt-jasmine-node).

Copyright (c) 2012 "s9tpepper" Omar Gonzalez & contributors.
Licensed under the MIT license.

[jasmine-node]: https://github.com/mhevery/jasmine-node "Integration of Jasmine Spec framework with Node.js"
