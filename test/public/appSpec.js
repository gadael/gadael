'use strict';

define(['app'], function(app) {

    describe('Gadael application', function () {

        it('got a name', function() {
            expect(app.name).toBe('gadael');
        });
    });


});
