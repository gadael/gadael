grunt-codeclimate-reporter
==========================
> Send your coverage to codeclimate.

[![Build Status](https://travis-ci.org/MrBoolean/grunt-codeclimate-reporter.svg)](https://travis-ci.org/MrBoolean/grunt-codeclimate-reporter)

Checkout [gulp-codeclimate-reporter](https://github.com/MrBoolean/gulp-codeclimate-reporter).

## Install
```shell
npm install grunt-codeclimate-reporter --save-dev
```

## Usage
### Load task
Once the plugin has been installed, it may be enabled inside your `Gruntfile.js` with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-codeclimate-reporter');
```

### Define your target
```js
grunt.initConfig({
  pkg: grunt.file.readJSON('package.json'),
  // ...
  codeclimate: {
    main: {
      options: {
        file: 'path/to/your/lcov.info',
        token: 'your_token',
        executable: 'path/to/executable' // leave blank to use the default executable
      }
    }
  }
  // ...
});
```

**Note** that, `grunt-codeclimate-reporter` is registered as a multi task. So it is required to define your sub task e.g. `main` (or something else).
