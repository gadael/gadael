'use strict';

let Q = require('q');
let api = require('../../../api/Company.api.js');
let headless = require('../../../api/Headless.api.js');


/**
 * The mock server object
 * @param {String} dbname
 * @param {Integer} port
 * @param {Function} readyCallback
 */
function mockServer(dbname, port, readyCallback) {



    var mockServerDbName = dbname+port;
    
    
    this.dbname = mockServerDbName;
    
    this.sessionCookie = null;
    
    this.isValid = false;
    var serverInst = this;
    
    this.requireCloseOn = null;
    this.lastUse = Date.now();
    

    function createRestService() {
        
        
        var company = { 
            name: 'The Fake Company REST service',
            port: port,
            country: 'FR' // all tests on rest services are based on french initial data
        };
        
        api.createDb(headless, serverInst.dbname, company, function() {

            let config = require('../../../config')();
            let models = require('../../../models');
            
            config.port = company.port;
            config.companyName = company.name;
            config.mongodb.dbname = serverInst.dbname;
            config.csrfProtection = false;

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
        
        });
    }
    

    headless.connect(function() {
        api.isDbNameValid(headless, serverInst.dbname, function(status) {
            if (!status) {
                console.log('mock REST server: database '+serverInst.dbname+' allready exists');
                api.dropDb(headless, serverInst.dbname, createRestService);
                return;
            }
            
            createRestService();
        });
    });
}


mockServer.prototype.request = function(method, headers, query, path, done) {
    
    var server = this;

    this.lastUse = Date.now();

    if (server.sessionCookie) {
        headers.Cookie = server.sessionCookie;
    }
    
    if (Object.getOwnPropertyNames(query).length !== 0) {
        var qs = require('querystring');
        path += '?'+qs.stringify(query);
    }

    var urlOptions = {
        hostname: 'localhost',
        port: this.app.config.port,
        path: path,
        method: method,
        agent: false,
        headers: headers
    };
    
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
                    console.log(bodyObject, null, 4);
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
    var api = require('../../../api/Company.api.js');
    var headless = require('../../../api/Headless.api.js');
    

    app.db.close(function() {
        api.dropDb(headless, mockServerDbName, function() {
            headless.disconnect(function() {
                app.session_mongoStore.db.close(function() {
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

    return Q(userModel.remove({ email: 'admin@example.com' }).exec());
};


/**
 * Create admin account in database and login with it
 * Set the admin property on the mockServer object
 * 
 * @return {Promise}
 */
mockServer.prototype.createAdminSession = function() {

    var deferred = Q.defer();
    var userModel = this.app.db.models.User;
    var server = this;
    var password = 'secret';

    // get admin document
    var getAdmin = function() {
        var deferred = Q.defer();
        
        userModel.find({ email: 'admin@example.com' }).exec(function (err, users) {
            if (err) {
                deferred.reject(new Error(err));
                return;
            }
            
            if (1 === users.length) {
                deferred.resolve(users[0]);
            } else {
                
                var admin = new userModel();
                
                userModel.encryptPassword(password, function(err, hash) {
        
                    if (err) {
                        deferred.reject(new Error(err));
                        return;
                    }
                    
                    admin.password = hash;
                    admin.email = 'admin@example.com';
                    admin.lastname = 'admin';
                    admin.saveAdmin().then(function(user) {

                        
                        Object.defineProperty(server, 'admin', { value: user, writable: true });

                    
                        deferred.resolve(user);
                    });
                });
            }
        });
        
        return deferred.promise;
    };
    
    
    // login as admin
    getAdmin().then(function(admin) {

        server.post('/rest/login', {
            'username': admin.email,
            'password': password
        }, function(res, body) {
            

            if (res.statusCode !== 200 || !body.$outcome.success) {
                deferred.reject(new Error('Error while login with admin account'));
                return;
            }
            
            
            
            deferred.resolve(admin);
        });
    });
    
    return deferred.promise;
};




mockServer.prototype.createUserAccountRole = function(department, nickname, serverProperty) {



    var deferred = Q.defer();
    var userModel = this.app.db.models.User;
    var server = this;
    var password = 'secret';

    // get account document

    userModel.find({ email: nickname+'@example.com' }).exec(function (err, users) {
        if (err) {
            deferred.reject(new Error(err));
            return;
        }

        if (1 === users.length) {
            deferred.resolve(users[0]);
        } else {

            var userAccount = new userModel();

            userModel.encryptPassword(password, function(err, hash) {

                if (err) {
                    deferred.reject(new Error(err));
                    return;
                }

                userAccount.password = hash;
                userAccount.email = nickname+'@example.com';
                userAccount.lastname = nickname;
                userAccount.firstname = 'test';

                if (department !== undefined) {
                    userAccount.department = department._id;
                }

                userAccount.saveAccount({}).then(function(user) {

                    Object.defineProperty(server, serverProperty, { value: user, writable: true });

                    deferred.resolve({ user: user, password: password });
                }).catch(deferred.reject);
            });
        }
    });

    return deferred.promise;

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




    var deferred = Q.defer();
    var userModel = this.app.db.models.User;
    var managerModel = this.app.db.models.Manager;
    var server = this;
    var password = 'secret';

    // get account document

    userModel.find({ email: 'mockmanager@example.com' }).exec(function (err, users) {
        if (err) {
            deferred.reject(new Error(err));
            return;
        }

        if (1 === users.length) {
            deferred.resolve(users[0]);
        } else {

            var userManager = new userModel();
            userModel.encryptPassword(password, function(err, hash) {

                if (err) {
                    deferred.reject(new Error(err));
                    return;
                }

                userManager.password = hash;
                userManager.email = 'mockmanager@example.com';
                userManager.lastname = 'mockmanager';
                userManager.firstname = 'test';

                if (memberDepartment !== undefined) {
                    userManager.department = memberDepartment._id;
                }

                userManager.save(function(err, user) {

                    if (err) {
                        return deferred.reject(err);
                    }


                    var manager = new managerModel();
                    manager.user = {
                        id: user._id,
                        name: user.lastname+' '+user.firstname
                    };

                    if (managerDepartment !== undefined) {
                        manager.department = [managerDepartment._id];
                    }

                    manager.save(function(err, manager) {

                        if (err) {
                            return deferred.reject(err);
                        }

                        userManager.roles = {
                            manager: manager._id
                        };

                        userManager.save(function(err, user) {

                            if (err) {
                                return deferred.reject(err);
                            }

                            user.populate('roles.manager', function(err, user) {

                                if (err) {
                                    return deferred.reject(err);
                                }

                                Object.defineProperty(server, 'manager', { value: user, writable: true });
                                deferred.resolve({ user: user, password: password });
                            });

                        });

                    });


                });
            });
        }
    });

    return deferred.promise;
};










/**
 * authenticate a user document and password
 * @param {Object} account
 * @return {Promise} resolve to the user document
 */
mockServer.prototype.authenticateAccount = function(account) {

    var deferred = Q.defer();
    var server = this;

    server.post('/rest/login', {
        'username': account.user.email,
        'password': account.password
    }, function(res, body) {

        if (res.statusCode !== 200 || !body.$outcome.success) {
            deferred.reject(new Error('Error while login with account'));
            return;
        }

        deferred.resolve(account.user);
    });

    return deferred.promise;
};


/**
 * Create account in database and login with it
 * Set the account property on the mockServer object
 *
 * @return {Promise} resolve to the user document
 */
mockServer.prototype.createAccountSession = function() {

    var deferred = Q.defer();
    var server = this;


    // login as user account
    server.createUserAccount()
    .then(function(account) {
        server.authenticateAccount(account).then(deferred.resolve);
    });

    return deferred.promise;
};







var serverList = {};


exports = module.exports = {
    
    /**
     * Function loaded in a beforeEach to ensure the server is started for every test
     * This start only one instance
     *
     * @param {String} [dbname]     optionnal database name
     * @param {function} ready      callback
     */
    mockServer: function(dbname, ready) {
        
        if (ready === undefined && typeof(dbname) === 'function') {
            ready = dbname;
            dbname = 'MockServerDb'; // default DB name
        }

        if (!serverList[dbname]) {

            var port = (3002 + Object.keys(serverList).length);
            new mockServer(dbname, port, function(server) {
                serverList[dbname] = server;
                ready(server);
            });
            
        } else {

            ready(serverList[dbname]);
        }

        return serverList[dbname];
    }
};
