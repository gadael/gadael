'use strict';

exports = module.exports = function(readyCallback) {

    var api = require('../../../api/Company.api.js');
    var headless = require('../../../api/Headless.api.js');

    var mockServerDbName = 'MockServerDb';

    var company = { 
        name: 'The Fake Company REST service',
        port: 3002 
    };
    
    
    var createRestService = function() {
        api.createDb(headless, mockServerDbName, company, function() {
            
            headless.disconnect();
                
            var config = require('../../../config');
            var models = require('../../../models');
            
            config.port = company.port;
            config.companyName = company.name;
            config.mongodb.dbname = mockServerDbName;
            
            var app = api.getExpress(config, models);
            
            var server = api.startServer(app, function() {
                readyCallback(app);
            });
            
            /*    
            server.on('request', function(req, res) {
                
                req.shouldKeepAlive = false;
                res.set("Connection", "close");
                
                // warning! are we after the express response?
                setTimeout(function() {
                    res.end();
                    req.connection.destroy();
                },100);
            });
            */
            
            var sockets = [];

            server.on('connection', function (socket) {
              sockets.push(socket);
              socket.setTimeout(4000);
              socket.once('close', function () {
                console.log('socket closed');
                sockets.splice(sockets.indexOf(socket), 1);
              });
            });

            server.once('close', function() {
                console.log('close event');
                for (var i = 0; i < sockets.length; i++) {
                    console.log('socket #' + i + ' destroyed');
                    sockets[i].destroy();
                }
                
                app.db.close();
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
