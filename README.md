# ![Gadael](public/images/logoText256.png)

[![Build Status](https://travis-ci.org/gadael/gadael.svg)](https://travis-ci.org/gadael/gadael)
[![Code Climate](https://codeclimate.com/github/gadael/gadael/badges/gpa.svg)](https://codeclimate.com/github/gadael/gadael)
[![Test Coverage](https://codeclimate.com/github/gadael/gadael/badges/coverage.svg)](https://codeclimate.com/github/gadael/gadael/coverage)

nodejs leaves management application



This application help you manage presence of your employees in your company. The staff can do requests, access to their planning, the department planning, the remaining vacation rights...

* Leave requests
* Time saving deposits requests
* Work period recovery requests

Approval by managers is following hierarchical departments structure.


Video preview:

[![Video](https://img.youtube.com/vi/UFmf0DnBlDw/0.jpg)](https://www.youtube.com/watch?v=UFmf0DnBlDw)

Admin view screenshoot:

![View a right](https://www.gadael.com/fr/docs/version-master/images/right-view-annual-leave.png)

For technical details to install Gadael on your own server for production, see http://www.gadael.org

## Install on a debian system for development

As root, this commands install all required packages to use AND build gadael.

```bash
apt install mongodb nodejs git g++ gyp ruby ruby-dev rubygems gcc make
npm install -g bower
```

As a user

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

The file config.example.js can be copied to config.js for further modifications.


## Development

Install grunt as root
```bash
npm install -g grunt-cli
```

List of supported commands for development:
```bash
grunt --help
```

## TODO

- [ ] View help message if right is linked to no users and no collections
- [ ] View users list in right page if the right is linked to users
- [ ] Prevent creation of a Beneficiary with a collection if the right is linked to a user
- [ ] Add the ability to add a out of collection right to a user
- [x] The home page is not visible in screenshots
- [x] Default user from UK does not have a work schedule planning in screenshots
- [x] Use ng-bind on homepage instead of {{}}
- [x] The available quantity column must contain the quantity of the modified request
- [ ] Verify that the mail "usercreated" is received by admin when a google account is created by login
- [ ] Account initialization by google login, copy google image if google+ available
- [ ] ICSDB integration for non working days calendar
- [ ] ICS Export
- [ ] Right collection modification (report quantity on new rights)
- [x] Show the waiting quantity to the user
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

## License

MIT

FSF approved, OSI approved and GPL compatible...
