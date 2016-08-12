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

open http://localhost:3000 in your browser

Application listen on localhost only, an https reverse proxy will be necessary to open access to users.

The file config.example.js can be copied to config.js for futher modifications.


## Tests

```bash
grunt test
```

## TODO

- [x] Request modification from user
- [ ] Edit request from admin
- [ ] Delete requests from admin
- [ ] Balance export: add missing quantities
- [x] Sage Export
- [ ] Decrease RTT depending on the illness leaves
- [ ] ICSDB integration for non working days calendars
- [ ] Set right duration in weeks
- [ ] ICS Export
- [x] Page for custom quantities accout-renewalquantity controller
- [ ] Emails notifications
- [ ] Compulsory leaves management, fix problem when requests are deleted
- [x] Create a test to check if leave request creation fail if the consumed quantity is greater than available quantity but the duration quantity is lower
- [x] Get special right infos in right.get service
- [ ] do not display quantity field if readonly by special right, because initial quantity can be variable by user
- [x] delete renewals and links to collections when delete right
- [x] Fix link from user view to the request list
- [ ] Use service.resolveSuccessGet in all save/delete services to ensure REST integrity
- [x] View one user calendar from admin
- [x] Fix totalCount property on users list, must be the number of enabled users
- [x] Save events to google calendar
- [x] Modal dialog to create a secondary calendar in google account
- [ ] Remove modules/sendmail.js Mailgen is used instead


## Technical features

* [Express JS](http://expressjs.com/) application
* [Angular JS](https://angularjs.org/) front-end
* [Bootstrap CSS](http://getbootstrap.com/) Look and feel



## Licence

MIT

FSF approved, OSI approved and GPL compatible...
