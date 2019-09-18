# ![Gadael](public/images/logoText256.png)

[![CircleCI](https://circleci.com/gh/gadael/gadael.svg?style=svg)](https://circleci.com/gh/gadael/gadael)

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

There is also a dockerfile here https://hub.docker.com/r/webinage/gadael

## Install on a debian system for development

As root, this commands install all required packages to use AND build gadael.

```bash
apt install mongodb nodejs-legacy git g++ gyp gcc make
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
node app.js
```

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

### Languages

French, english, spanish


## License

MIT

FSF approved, OSI approved and GPL compatible...
