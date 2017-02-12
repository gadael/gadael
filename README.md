# ![Gadael](public/images/logoText256.png)

[![Build Status](https://travis-ci.org/gadael/gadael.svg)](https://travis-ci.org/gadael/gadael)
[![Code Climate](https://codeclimate.com/github/gadael/gadael/badges/gpa.svg)](https://codeclimate.com/github/gadael/gadael)
[![Test Coverage](https://codeclimate.com/github/gadael/gadael/badges/coverage.svg)](https://codeclimate.com/github/gadael/gadael/coverage)

nodejs leaves management application

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
```


A script in provided to initialize the database:

```bash
node install.js gadael "Your company name" FR
```
First argument is the database name, default is gadael.
Second argument is your company name, default is "Gadael".
Third argument is the country code used to initialize the database, if not provided the leave rights list will be empty.

Run server

```bash
node app.js 3000 gadael
```

First argument is the http port
second argument is the database name

open http://localhost:3000 in your browser, you will be required to create an admin account on the first page.

Application listen on localhost only, an https reverse proxy will be necessary to open access to users.

The file config.example.js can be copied to config.js for futher modifications.


## Developpement

Install grunt as root
```bash
npm install -g grunt-cli
```

List of supported commands for developpement:
```bash
grunt --help
```

## TODO

- [x] Update absence of a user by admin, consuption is not loading
- [x] Translate choose amoung the following, days, hours on right edit
- [ ] Better error message if email allready used
- [x] Saving managed account does not work
- [x] After password reset, go to home page or login page
- [x] Fix creation of all request types by admin
- [x] Bug, comsuption on absence created by admin on a user
- [ ] Application need to be reloaded if company doc is modified
- [x] Working time recovery option in company doc
- [x] After user or right creation, redirect to visualisation
- [ ] Verify that the mail "usercreated" is received by admin when a google account is created by login
- [ ] Account initialization by google login, copy google image if google+ available
- [ ] Get managed services on home page
- [ ] ICSDB integration for non working days calendar
- [ ] ICS Export
- [ ] Right collection modification (report quantity on new rights)
- [ ] Manager substitute one of his subordinates to create request
- [ ] Add checkbox on absence creation to bypass approval when the admin create the request on behalf
- [ ] Hide time saving account option if not available


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
