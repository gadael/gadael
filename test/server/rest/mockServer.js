'use strict';



/**
 * The mock server object
 * @param {String} dbname
 * @param {Integer} port
 * @param {Function} readyCallback
 */
function mockServer(dbname, port, readyCallback) {

    var api = require('../../../api/Company.api.js');
    var headless = require('../../../api/Headless.api.js');

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
            port: port 
        };
        
        api.createDb(headless, serverInst.dbname, company, function() {

            var config = require('../../../config')();
            var models = require('../../../models');
            
            config.port = company.port;
            config.companyName = company.name;
            config.mongodb.dbname = serverInst.dbname;

            var app = api.getExpress(config, models);
            
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
                
                try {
                    done(res, JSON.parse(body));
                } catch(e) {
                    console.log(e);
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
    
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': postStr.length
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
 * Do not stop the server if needed by another test
 * stop the server ony if no use after lastuse + timeout
 */
mockServer.prototype.closeOnFinish = function(doneExit) {
    

    var server = this;

    server.requireCloseOn = Date.now();
    var closeTimout = 4000; // close server after this timeout in ms if no use in that period


    
    function closeLoop() {


        if (server.lastUse > server.requireCloseOn) {

            if (server.isValid) {
                console.log('closeLoop '+server.dbname);
                server.timeoutID = setTimeout(closeLoop, closeTimout);
                server.requireCloseOn = Date.now();
            }
            return;
        }
    
        console.log('close '+server.dbname);
        server.isValid = false;
        server.close();

    }
    

    if (undefined !== server.timeoutID) {
        clearTimeout(server.timeoutID);
        // console.log('clearTimeout '+server.dbname);
    }

    server.timeoutID = setTimeout(closeLoop, closeTimout);
    doneExit();
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

    var Q = require('q');

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
    
    var Q = require('q');
    
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
                    admin.saveAdmin(function(err, user) {
                        
                        if (err) {
                            deferred.reject(new Error(err));
                            return;
                        }
                        
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








/**
 * Create account in database and login with it
 * Set the account property on the mockServer object
 *
 * @return {Promise}
 */
mockServer.prototype.createAccountSession = function() {

    var Q = require('q');

    var deferred = Q.defer();
    var userModel = this.app.db.models.User;
    var server = this;
    var password = 'secret';

    // get account document
    var getAccount = function() {
        var deferred = Q.defer();

        userModel.find({ email: 'mockaccount@example.com' }).exec(function (err, users) {
            if (err) {
                deferred.reject(new Error(err));
                return;
            }

            if (1 === users.length) {
                deferred.resolve(users[0]);
            } else {

                var account = new userModel();

                userModel.encryptPassword(password, function(err, hash) {

                    if (err) {
                        deferred.reject(new Error(err));
                        return;
                    }

                    account.password = hash;
                    account.email = 'mockaccount@example.com';
                    account.lastname = 'mockaccount';
                    account.saveAccount(function(err, user) {

                        if (err) {
                            deferred.reject(new Error(err));
                            return;
                        }

                        Object.defineProperty(server, 'account', { value: user, writable: true });


                        deferred.resolve(user);
                    });
                });
            }
        });

        return deferred.promise;
    };


    // login as admin
    getAccount().then(function(account) {

        server.post('/rest/login', {
            'username': account.email,
            'password': password
        }, function(res, body) {

            if (res.statusCode !== 200 || !body.$outcome.success) {
                deferred.reject(new Error('Error while login with admin account'));
                return;
            }



            deferred.resolve(account);
        });
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
