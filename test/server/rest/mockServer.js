'use strict';

exports = module.exports = function() {
    
    var api = require('../../../api/Company.api.js');
    var headless = require('../../../api/Headless.api.js');

    var mockServerDbName = 'MockServerDb';

    var company = { 
        name: 'The Fake Company REST service',
        port: 3002 
    };
    
    function mockServer(readyCallback) {

        var createRestService = function() {
            api.createDb(headless, mockServerDbName, company, function() {

                var config = require('../../../config');
                var models = require('../../../models');
                
                config.port = company.port;
                config.companyName = company.name;
                config.mongodb.dbname = mockServerDbName;
                
                mockServer.app = api.getExpress(config, models);
                
                var server = api.startServer(mockServer.app, function() {
                    readyCallback(mockServer.app);
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
    
    
    /**
     * get request on server
     */
    mockServer.prototype.get = function(path, done) {
        
        
        this.clientCookies = [];
        
        var urlOptions = {
            hostname: 'localhost',
            port: mockServer.app.config.port,
            path: path,
            method: 'GET',
            agent: false,
            headers: { 'Connection': 'Close' }
        };
        
        var http = require('http');

        http.request(urlOptions, function(res) {
            
            // grab session cookie to set in browser
            this.clientCookies = res.headers['set-cookie'];
            done(res);
        }).end();
    };
    


    /**
     * close all connexions to database and stop http server
     */
    mockServer.prototype.close = function(doneExit) {
        mockServer.app.db.close(function() {
            api.dropDb(headless, mockServerDbName, function() {
                headless.disconnect(function() {
                    mockServer.app.session_mongoStore.db.close(function() {
                        mockServer.app.server.close(doneExit);
                    });
                });
            });
        });
    };
    
    
    
    return mockServer;
};
