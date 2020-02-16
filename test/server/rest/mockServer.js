'use strict';

const api = require('../../../api/Company.api.js');
const headless = require('../../../api/Headless.api.js');
const models = require('../../../models');
let config = require('../../../config')();
const querystring = require('querystring');

/**
 * The mock server object
 * @param {String} dbname
 * @param {Integer} port
 * @param {Function} readyCallback
 * @param {Object} [company]              Company settings
 * @param {String} [languageCode]         Language code (the mo file to use)
 *
 */
function mockServer(dbname, port, readyCallback, company, languageCode, timeCreated) {

    var mockServerDbName = dbname+port;

    this.dbname = mockServerDbName;

    this.sessionCookie = null;

    this.isValid = false;
    var serverInst = this;

    this.requireCloseOn = null;
    this.lastUse = Date.now();

    if (undefined === company) {
        company = {};
    }

    if (undefined !== languageCode) {
        config.language = languageCode;
    }

    // overwrite default config
    headless.config = config;

    function createRestService() {

        company = Object.assign({
            name: 'The Fake Company REST service',
            port: port,
            country: 'FR',
            timeCreated: timeCreated
        }, company);

        api.createDb(headless, serverInst.dbname, company)
        .then(() => {
            config.port = company.port;
            config.companyName = company.name;
            config.mongodb.dbname = serverInst.dbname;
            config.csrfProtection = false;
            config.postpone = false;
            config.useSchudeledRefreshStat = false;

            let app = api.getExpress(config, models);

            Object.defineProperty(serverInst, 'app', {
                value: app
            });

            serverInst.server = api.startServer(app, function() {
                serverInst.isValid = true;
                readyCallback(serverInst);
            });


            serverInst.sockets = [];

            serverInst.server.on('connection', function (socket) {
                serverInst.sockets.push(socket);
                socket.setTimeout(4000);
                socket.once('close', function () {
                    //console.log('socket closed');
                    serverInst.sockets.splice(serverInst.sockets.indexOf(socket), 1);
                });
            });

            serverInst.server.on('close', function() {
                //console.log('close event');
                for (var i = 0; i < serverInst.sockets.length; i++) {
                    //console.log('socket #' + i + ' destroyed');
                    serverInst.sockets[i].destroy();
                }
            });

        })
        .catch(err => {
            console.error(err.stack);
        });
    }

    headless.linkdb().then(() => {
        api.isDbNameValid(headless, serverInst.dbname, function(status) {
            if (!status) {
                console.log('mock REST server: database '+serverInst.dbname+' already exists');
                api.dropDb(headless, serverInst.dbname, createRestService);
                return;
            }

            createRestService();
        });
    });
}


mockServer.prototype.getUrlOptions = function(method, headers, query, path) {

    let server = this;

    if (undefined === method) {
        method = 'GET';
    }

    if (undefined === headers) {
        headers = {};
    }

    if (undefined === query) {
        query = {};
    }

    if (undefined === path) {
        path = '';
    }

    if (server.sessionCookie) {
        headers.Cookie = server.sessionCookie;
    }

    if (Object.getOwnPropertyNames(query).length !== 0) {
        var qs = require('querystring');
        path += '?'+qs.stringify(query);
    }

    return {
        hostname: 'localhost',
        port: server.app.config.port,
        path: path,
        method: method,
        agent: false,
        headers: headers
    };

};


mockServer.prototype.request = function(method, headers, query, path, done) {

    var server = this;

    this.lastUse = Date.now();


    var urlOptions = server.getUrlOptions(method, headers, query, path);

    var http = require('http');

    var req = http.request(urlOptions, function(res) {

        // grab session cookie to set in browser
        if (res.headers['set-cookie']) {
            res.headers['set-cookie'].forEach(function(cookieStr) {
                //console.log('Raw set-cookie '+cookieStr);
                server.sessionCookie = cookieStr.split(';')[0];
                //console.log('Set new session cookie '+server.sessionCookie);
            });
        }

        res.setEncoding('utf8');

        var body = '';

        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function() {

            if (body) {

                var bodyObject;

                try {
                    bodyObject = JSON.parse(body);
                } catch(e) {
                    console.log('Failed to parse JSON in mockServer');
                    console.log(e);
                    console.log(body);
                }


                try {
                    done(res, bodyObject);
                } catch(e) {

                    Error.captureStackTrace(done);

                    console.log('\nresponse from '+path);
                    console.log(e.stack);
                    console.log('------------');
                    console.log(body);
                    done(res, {});
                }

            } else {
                done(res, null);
            }
        });
    });

    return req;
};


/**
 * get request on server
 */
mockServer.prototype.get = function(path, data, done) {

    var req = this.request('GET', {}, data, path, done);
    req.end();
};


/**
 * put request on server
 */
mockServer.prototype.send = function(method, path, data, done) {

    var postStr = JSON.stringify(data);

    // Content-Length is wrong with UTF-8 strings

    var headers = {
        'Content-Type': 'application/json'
    //   , 'Content-Length': postStr.length
    };

    var req = this.request(method, headers, {}, path, done);

    req.write(postStr);

    req.end();
};


/**
 * put request on server
 */
mockServer.prototype.put = function(path, data, done) {

    this.send('PUT', path, data, done);
};


/**
 * Post request on server
 */
mockServer.prototype.post = function(path, data, done) {

    this.send('POST', path, data, done);
};

/**
 * Post url encoded data on server
 */
mockServer.prototype.postUrlEncoded = function(path, data, done) {
    const postStr = querystring.stringify(data);
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postStr.length
    };
    const req = this.request('POST', headers, {}, path, done);
    req.write(postStr);
    req.end();
};


/**
 * delete request on server
 */
mockServer.prototype.delete = function(path, done) {

    var req = this.request('DELETE', {}, {}, path, done);
    req.end();
};




/**
 * close all connexions to database and stop http server
 */
mockServer.prototype.close = function(doneExit) {

    var mockServerDbName = this.dbname;
    var app = this.app;

    app.db.close(function() {
        api.dropDb(headless, mockServerDbName, function() {
            headless.disconnect(function() {
                app.session_mongoStore.clear(function(err) {
                    app.server.close(doneExit);
                });
            });
        });
    });
};



/**
 * @return {Promise}
 */
mockServer.prototype.deleteAdminAccountIfExists = function() {

    var userModel = this.app.db.models.User;

    return userModel.remove({ email: 'admin@example.com' }).exec();
};




/**
 * [[Description]]
 * @returns {Promise} [[Description]]
 */
mockServer.prototype.createAdminUser = function() {

    let userModel = this.app.db.models.User;
    let server = this;
    let password = 'secret';

    // get admin document
    function getAdmin() {

        return userModel.find({ email: 'admin@example.com' })
        .exec()
        .then(users => {

            if (1 === users.length) {
                return users[0];
            } else {

                var admin = new userModel();

                return userModel.encryptPassword(password)
                .then(hash => {

                    admin.password = hash;
                    admin.email = 'admin@example.com';
                    admin.lastname = 'admin';

                    return admin.saveAdmin()
                    .then(function(user) {

                        Object.defineProperty(server, 'admin', { value: user, writable: true });
                        return user;
                    });
                });
            }
        });


    }


    // login as admin
    return getAdmin()
    .then(function(admin) {

        return {
            password: password,
            user: admin
        };
    });

};



/**
 * Create admin account in database and login with it
 * Set the admin property on the mockServer object
 *
 * @return {Promise}
 */
mockServer.prototype.createAdminSession = function() {

    let server = this;
    return server.createAdminUser()
    .then(appliquant => {
        return server.authenticateUser(appliquant);
    });
};




mockServer.prototype.createUserAccountRole = function(department, nickname, serverProperty) {


    var userModel = this.app.db.models.User;
    var server = this;
    var password = 'secret';

    // get account document

    return userModel.find({ email: nickname+'@example.com' })
    .exec()
    .then(users => {


        if (1 === users.length) {
            return users[0];
        } else {

            var userAccount = new userModel();

            return userModel.encryptPassword(password)
            .then(hash => {

                userAccount.password = hash;
                userAccount.email = nickname+'@example.com';
                userAccount.lastname = nickname;
                userAccount.firstname = 'test';

                if (department !== undefined) {
                    userAccount.department = department._id;
                }

                return userAccount.saveAccount({})
                .then(user => {

                    Object.defineProperty(server, serverProperty, { value: user, writable: true });

                    return { user: user, password: password };
                });
            });
        }
    });
};



/**
 * Create account in database
 * promise resolve to two properties "user" (the user document) and "password" (string)
 * @return {Promise}
 */
mockServer.prototype.createUserAccount = function(department) {

    let app = this.app;

    return this.createUserAccountRole(department, 'mockaccount', 'account')
    .then(userAccount => {

        let nonworkingdaysCalendar = new app.db.models.AccountNWDaysCalendar();
        nonworkingdaysCalendar.account = userAccount.user.roles.account;
        nonworkingdaysCalendar.calendar = '5740adf51cf1a569643cc100'; // france metropolis
        nonworkingdaysCalendar.from = new Date(2000,0,1,0,0,0,0);

        return nonworkingdaysCalendar.save()
        .then(() => {
            return userAccount;
        });

    });
};



/**
 * Create stranger account in database, used to test non accessible items
 * promise resolve to two properties "user" (the user document) and "password" (string)
 * @return {Promise}
 */
mockServer.prototype.createUserStranger = function(department) {

    return this.createUserAccountRole(department, 'mockstranger', 'stranger');

};







/**
 * Create a manager in database
 * promise resolve to two properties "user" (the user document) and "password" (string)
 * @return {Promise}
 */
mockServer.prototype.createUserManager = function(memberDepartment, managerDepartment) {


    var userModel = this.app.db.models.User;
    var managerModel = this.app.db.models.Manager;
    var server = this;
    var password = 'secret';

    // get account document

    return userModel.find({ email: 'mockmanager@example.com' })
    .exec()
    .then(users => {


        if (1 === users.length) {
            return users[0];
        } else {

            var userManager = new userModel();

            return userModel.encryptPassword(password)
            .then(hash => {

                userManager.password = hash;
                userManager.email = 'mockmanager@example.com';
                userManager.lastname = 'mockmanager';
                userManager.firstname = 'test';

                if (memberDepartment !== undefined) {
                    userManager.department = memberDepartment._id;
                }

                return userManager.save()
                .then(user => {

                    var manager = new managerModel();
                    manager.user = {
                        id: user._id,
                        name: user.lastname+' '+user.firstname
                    };

                    if (managerDepartment !== undefined) {
                        manager.department = [managerDepartment._id];
                    }

                    return manager.save();

                })
                .then(manager => {

                    userManager.roles = {
                        manager: manager._id
                    };

                    return userManager.save();
                })
                .then(user => {

                    return user.populate('roles.manager')
                    .execPopulate();
                })
                .then(user => {

                    Object.defineProperty(server, 'manager', { value: user, writable: true });
                    return { user: user, password: password };
                });

            });
        }
    });
};


/**
 * Add jasmine expectation for the rest service output
 * @param {object} body HTTP body from the rest service
 */
mockServer.prototype.expectSuccess = function(body) {

    expect(body.$outcome).toBeDefined();
    if (undefined !== body.$outcome) {
        expect(body.$outcome.success).toBeTruthy();

        if (!body.$outcome.success) {
            if (body.$outcome.alert.length > 0) {
                console.trace(body.$outcome.alert);
            }

            if (Object.keys(body.$outcome.errfor).length > 0) {
                console.log('Missing mandatory fields:');
                console.trace(body.$outcome.errfor);
            }
        }
    }
};







/**
 * authenticate a user document and password
 * @param {Object} account
 * @return {Promise} resolve to the user document
 */
mockServer.prototype.authenticateUser = function(account) {

    var server = this;

    return new Promise((resolve, reject) => {
        server.post('/rest/anonymous/formlogin', {
            'username': account.user.email,
            'password': account.password
        }, function(res, body) {

            if (res.statusCode !== 200 || !body.$outcome.success) {
                reject(new Error('Error while login'));
                return;
            }

            resolve(account.user);
        });
    });
};


/**
 * Create account in database and login with it
 * Set the account property on the mockServer object
 *
 * @return {Promise} resolve to the user document
 */
mockServer.prototype.createAccountSession = function() {

    var server = this;


    // login as user account
    return server.createUserAccount()
    .then(server.authenticateUser);
};







var serverList = {};


exports = module.exports = {

    /**
     * Function loaded in a beforeEach to ensure the server is started for every test
     * This start only one instance
     *
     * @param {String} [dbname]     optionnal database name
     * @param {function} ready      callback
     * @param {Object} company
     * @param {String} languageCode
     */
    mockServer: function(dbname, ready, company, languageCode, timeCreated) {

        if (ready === undefined && typeof(dbname) === 'function') {
            ready = dbname;
            dbname = 'MockServerDb'; // default DB name
        }

        if (!serverList[dbname]) {

            var port = (3002 + Object.keys(serverList).length);
            new mockServer(dbname, port, function(server) {
                serverList[dbname] = server;
                ready(server);
            }, company, languageCode, timeCreated);

        } else {

            ready(serverList[dbname]);
        }

        return serverList[dbname];
    }
};
