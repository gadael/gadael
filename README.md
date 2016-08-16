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
grunt
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
- [ ] Compulsory leaves management, fix problem when requests are deleted
- [x] Get special right infos in right.get service
- [ ] do not display quantity field if readonly by special right, because initial quantity can be variable by user
- [x] delete renewals and links to collections when delete right
- [x] Fix link from user view to the request list
- [ ] Use service.resolveSuccessGet in all save/delete services to ensure REST integrity
- [x] View one user calendar from admin
- [x] Fix totalCount property on users list, must be the number of enabled users
- [x] Save events to google calendar
- [x] Modal dialog to create a secondary calendar in google account
- [x] Create mail for the approver (validation pending)
- [x] Create mail for the appliquant (request accepted / rejected)
- [x] Use correct type and dispType in manager/waitingrequests
- [x] Do not display detail hours in planning


## Main packages used

* [Express JS](http://expressjs.com/) application REST server
* [Angular JS](https://angularjs.org/) front-end
* [Bootstrap CSS](http://getbootstrap.com/) Look and feel

Notifications:

* [Mailgen](https://github.com/eladnava/mailgen) Notification template
* [Nodemailer](https://nodemailer.com/) Send the emails using configurable transport

Interactions with other services:

* [google-calendar](https://github.com/wanasit/google-calendar) Interface to the google calendar API
* [ical.js](https://github.com/peterbraden/ical.js) Read ical format
* [ICSDB](https://github.com/gadael/icsdb) ICS files for non working days

## Licence

MIT

FSF approved, OSI approved and GPL compatible...
