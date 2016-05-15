# ![Gadael](public/images/logoText256.png)

[![Build Status](https://travis-ci.org/gadael/gadael.svg)](https://travis-ci.org/gadael/gadael)
[![Code Climate](https://codeclimate.com/github/gadael/gadael/badges/gpa.svg)](https://codeclimate.com/github/gadael/gadael)
[![Test Coverage](https://codeclimate.com/github/gadael/gadael/badges/coverage.svg)](https://codeclimate.com/github/gadael/gadael/coverage)

nodejs absences management application

In developpement, not ready for production




This application help you manage presence of your employees in your company. The staff can do requests, access to their planning, the department planning, the remaining vacation rights...

* Leave requests
* Time saving deposits requests
* Workperiod recovery requests

Approval by managers is following hierachical departments structure.


## Install on a debian system

As root

```bash
apt-get install mongodb nodejs git g++ gyp
npm install -g grunt-cli
```

As user

```bash
git clone https://github.com/gadael/gadael
cd gadael
npm install
bower install
grunt build

node app.js
```

open http://localhost:3000

Application listen on localhost only, an https reverse proxy will be necessary to open access to users.

## Technical features

* [Express JS](http://expressjs.com/) application
* [Angular JS](https://angularjs.org/) front-end
* [Bootstrap CSS](http://getbootstrap.com/) Look and feel



## Licence

MIT

FSF approved, OSI approved and GPL compatible...