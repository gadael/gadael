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

- [ ] Get managed services on home page
- [ ] View time saving deposit by admin
- [ ] Decrease RTT depending on the illness leaves
- [ ] ICSDB integration for non working days calendars
- [ ] ICS Export
- [ ] Compulsory leaves management, fix problem when requests are deleted
- [x] do not display quantity field if readonly by special right, because initial quantity can be variable by user
- [x] Use the requestcreated mail
- [ ] Display pending delete status on planning
- [ ] Start calendar view on current date
- [ ] Right collection modification (report quantity on new rights)
- [ ] After first admin created, redirect to login form

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
