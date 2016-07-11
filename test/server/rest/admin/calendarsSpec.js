'use strict';

 
describe('calendars admin rest service', function() {
    
    
    var server;
    
    var calendar;
    

    beforeEach(function(done) {
        
        var helpers = require('../mockServer');
        
        helpers.mockServer('adminCalendars', function(_mockServer) {
            server = _mockServer;
            done();
        });
    });
    

    it('verify the mock server', function(done) {
        expect(server.app).toBeDefined();
        done();
    });
    
    
    it('request calendars list as anonymous', function(done) {
        server.get('/rest/admin/calendars', {}, function(res) {
            expect(res.statusCode).toEqual(401);
            done();
        });
    });
    
    
    it('Create admin session', function(done) {
        server.createAdminSession().then(function() {
            done();
        });
    });
    
    
    it('request calendars list as admin', function(done) {
        server.get('/rest/admin/calendars', {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.length).toBeGreaterThan(0); // default calendars
            done();
        });
    });
    
    it('verify that the default workschedule calendars are locked', function(done) {
        server.get('/rest/admin/calendars', { type: 'workschedule' }, function(res, body) {

            function testASave(res, putbody) {
                expect(putbody.$outcome).toBeDefined();
                expect(putbody.$outcome.success).toBeFalsy();
                expect(res.statusCode).toEqual(403);
                done();
            }

            for(var i=0; i< body.length; i++) {
                expect(body[i].type).toEqual('workschedule');
                server.put('/rest/admin/calendars/'+body[i]._id, body[i], testASave);
                break; // Test only the first, we need promises to test more
            }
        });
    });

    
    it('create new calendar', function(done) {
        server.post('/rest/admin/calendars', {
            name: 'Calendar test',
            type: 'workschedule',
            url: 'http://www.google.com/calendar/ical/fr.french%23holiday%40group.v.calendar.google.com/public/basic.ics'
        }, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toBeDefined();
            server.expectSuccess(body);
            
            calendar = body._id;
            
            done();
        });
    });
    
    it('get the created calendar', function(done) {
        
        expect(calendar).toBeDefined();
        
        server.get('/rest/admin/calendars/'+calendar, {}, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body.name).toEqual('Calendar test');
            expect(body._id).toEqual(calendar);
            expect(body.type).toEqual('workschedule');
            expect(body.url).toEqual('http://www.google.com/calendar/ical/fr.french%23holiday%40group.v.calendar.google.com/public/basic.ics');
            done();
        });
    });
    
    it('delete the created calendar', function(done) {
        server.delete('/rest/admin/calendars/'+calendar, function(res, body) {
            expect(res.statusCode).toEqual(200);
            expect(body._id).toEqual(calendar);
            expect(body.name).toEqual('Calendar test');
            server.expectSuccess(body);
            done();
        });
    });
    
    
    it('logout', function(done) {
        server.get('/rest/logout', {}, function(res) {
            expect(res.statusCode).toEqual(200);
            done();
        });
    });
    
   
    it('close the mock server', function(done) {
        server.close(done);
    });

    
});

