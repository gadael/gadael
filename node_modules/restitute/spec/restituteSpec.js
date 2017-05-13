
var http = require('http');
var url = require('url');
var restitute = require('../src/index');
var sampleController = require('./sampleController');



var express = require('express');
var app = express();


var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(require('method-override')());




for(var ctrlType in sampleController) {
    if (sampleController.hasOwnProperty(ctrlType)) {
        var controller = new sampleController[ctrlType]();
        app[controller.method](controller.path, controller.onRequest);
    }
}


app.getService = function(path) {
    var apiservice = require('../src/service');
    var serviceLoader = require('./services/'+path);
    return serviceLoader(apiservice, app);
};


var server = http.createServer(app);

server.listen(3000);



describe('restitute', function RestituteTestSuite() {

    'use strict';



    function retrieveTest(path, next)
    {
        http.get('http://localhost:3000'+path+'?readonly=2&modifiable=1&empty=', function(response) {
			expect(response.statusCode).toBe(200);

            var output = '';

            response.setEncoding('utf8');
            response.on('data', function (chunk) {

                output += chunk;


            });

            response.on('end', function() {

                var json;

                try {
                    json = JSON.parse(output);
                } catch(e) {

                    console.log(output);
                    console.log(e);
                    return next({});
                }

                next(json);
            });
		});
    }

    

    function submitTest(method, path, expectedReadonlyParam, next)
    {

        var input = JSON.stringify({ readonly: '2', modifiable: '1' });
        var output = '';


        var req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': input.length
            }},
            function(response) {

                expect(response.statusCode).toBe(200);


                response.setEncoding('utf8');
                response.on('data', function (chunk) {
                    output += chunk;

                });

                response.on('end', function() {
                    var json;

                    try {
                        json = JSON.parse(output);
                    } catch(e) {

                        console.log(output);
                        console.log(e);
                        return next();
                    }

                    expect(json.name).toBe('TEST');
                    expect(json.readonly).toBe(expectedReadonlyParam);

                    next();
                });
            }
        );

        req.write(input);
        req.end();
    }




    it('Verify service loader', function(done) {

        var service = restitute.service.load(app, 'get');
        expect(service.app).toBeDefined();
        done();
    });


    it('receive an array from a list controller', function(done){
        retrieveTest('/rest/listTestController', function(result) {
            expect(result.length).toBe(1);
            expect(result[0].name).toBe('TEST');
            expect(result[0].readonly).toBe('2');
            expect(result[0].empty).toBeUndefined(); // default ignore empty strings
            done();
        });
	});


    it('receive empty value if set in controller', function(done){
        retrieveTest('/rest/listTestWithEmptyController', function(result) {
            expect(result.length).toBe(1);
            expect(result[0].empty).toBe('');
            done();
        });
	});


    // test with request parameters forwared to the service


    it('receive an object from a get controller', function(done){
        retrieveTest('/rest/getTestController/666', function(result) {
            expect(result.name).toBe('TEST');
            expect(result.readonly).toBe('2');
            expect(result.id).toBe('666');
            expect(result.empty).toBe('');
            done();
        });
	});


    it('receive an object from a delete controller', function(done){
        submitTest('DELETE', '/rest/deleteTestController', '2', done);
    });


    it('receive an object from a save controller via PUT (edit)', function(done){
		submitTest('PUT', '/rest/updateTestController', '2', done);
	});


    it('receive an object from a save controller via POST (create)', function(done){
		submitTest('POST', '/rest/createTestController', '2', done);
	});


    // test with parameter overloaded by the controller


    it('receive an array from a list controller', function(done){
        retrieveTest('/rest/listParamTestController', function(result) {
            expect(result.length).toBe(1);
            expect(result[0].name).toBe('TEST');
            expect(result[0].readonly).toBe(1);
            done();
        });
	});



    it('receive an object from a get controller', function(done){
        retrieveTest('/rest/getParamTestController', function(result) {
            expect(result.name).toBe('TEST');
            expect(result.readonly).toBe(1);
            done();
        });
	});


    it('receive an object from a delete controller', function(done){
        submitTest('DELETE', '/rest/deleteParamTestController', 1, done);
    });


    it('receive an object from a save controller via PUT (edit)', function(done){
		submitTest('PUT', '/rest/updateParamTestController', 1, done);
	});


    it('receive an object from a save controller via POST (create)', function(done){
		submitTest('POST', '/rest/createParamTestController', 1, done);
	});



    it('Test server should close', function (done){
        server.close();
        done();
	});


});
