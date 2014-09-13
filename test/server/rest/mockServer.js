'use strict';

exports = module.exports = function() {
    
    

    
    
    /**
     * The mock server object
     * 
     */
    function mockServer(port, readyCallback) {
        
        
        var api = require('../../../api/Company.api.js');
        var headless = require('../../../api/Headless.api.js');

        var mockServerDbName = 'MockServerDb'+port;
        
        
        this.dbname = mockServerDbName;
        
        this.sessionCookie = null;
        
        var serverInst = this;
        
        

        var createRestService = function() {
            
            
            var company = { 
                name: 'The Fake Company REST service',
                port: port 
            };
            
            api.createDb(headless, mockServerDbName, company, function() {

                var config = require('../../../config')();
                var models = require('../../../models');
                
                config.port = company.port;
                config.companyName = company.name;
                config.mongodb.dbname = mockServerDbName;

                var app = api.getExpress(config, models);
                
                Object.defineProperty(serverInst, 'app', { 
                    value: app
                });
                
                var server = api.startServer(app, function() {
                    readyCallback(app);
                });
                
                
                var sockets = [];

                server.on('connection', function (socket) {
                  sockets.push(socket);
                  socket.setTimeout(4000);
                  socket.once('close', function () {
                    //console.log('socket closed');
                    sockets.splice(sockets.indexOf(socket), 1);
                  });
                });

                server.on('close', function() {
                    //console.log('close event');
                    for (var i = 0; i < sockets.length; i++) {
                        //console.log('socket #' + i + ' destroyed');
                        sockets[i].destroy();
                    }
                });
            
            });
        };
        

        headless.connect(function() {
            api.isDbNameValid(headless, mockServerDbName, function(status) {
                if (!status) {
                    console.log('mock REST server: database allready exists');
                    api.dropDb(headless, mockServerDbName, createRestService);
                    return;
                }
                
                createRestService();
            });
        });
        

    };
    
    
    mockServer.prototype.request = function(method, headers, path, done) {
        
        var server = this;

        if (server.sessionCookie) {
            headers['Cookie'] = server.sessionCookie;
        } else {
            console.log('Session cookie is not set on client');
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
                    server.sessionCookie = cookieStr.split(';')[0];
                });
            }
            
            res.setEncoding('utf8');
            
            var body = '';
            
            res.on('data', function(chunk) {
                body += chunk;
            });
            
            res.on('end', function() {
                if (body) {
                    done(res, JSON.parse(body));
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
    mockServer.prototype.get = function(path, done) {
        
        var req = this.request('GET', {}, path, done);
        req.end();
    };
    
    
    /**
     * put request on server
     */
    mockServer.prototype.send = function(method, path, data, done) {
        
        var querystring = require('querystring');
        
        var postStr = JSON.stringify(data);
        
        var headers = {
            'Content-Type': 'application/json',
            'Content-Length': postStr.length
        }
        
        var req = this.request(method, headers, path, done);

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
    }


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
     * Create admin account in database and login with it
     * Set the admin property on the mockServer object
     * 
     * @return promise
     */
    mockServer.prototype.createAdminSession = function() {
        
        var Q = require('q');
        
        var deferred = Q.defer();
        var userModel = this.app.db.models.User;
        var server = this;
        var password = 'secret';

        var server = this;
        
        userModel.encryptPassword(password, function(err, hash) {
            
            if (err) {
                deferred.reject(new Error(err));
            }
            
            var admin = new userModel();
            admin.password = hash;
            admin.email = 'admin@example.com';
            admin.lastname = 'admin';
            admin.saveAdmin(function(err, user) {
                
                if (err) {
                    deferred.reject(new Error(err));
                }
                admin = user;
                
                
                server.post('/rest/login', {
                    'username': admin.email,
                    'password': password
                }, function(res, body) {
                    
                    if (res.statusCode != 200 || !body.$outcome.success) {
                        deferred.reject(new Error('Error while login with admin account'));
                    }
                    
                    Object.defineProperty(server, 'admin', { value: admin });
                    
                    deferred.resolve(admin);
                });
            });
        });
        
        return deferred.promise;
    };
    
    
    
    return mockServer;
};
