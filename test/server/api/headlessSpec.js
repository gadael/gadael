'use strict';

let api = {
    headless: require('../../../api/Headless.api.js')
};

/**
 * Open 1s connexion
 * @return {Promise}
 */
function loadHeadlessConnexion() {
    return new Promise(resolve => {
        api.headless.linkdb().then(() => {
            setTimeout(() => {
                api.headless.disconnect(resolve);
            }, 1000);
        });
    });

}


describe("Headless API", function HeadlessTestSuite() {


    it("Open one connexion", function(done) {
        loadHeadlessConnexion()
        .then(() => {
            done();
        })
        .catch(done);
	});


    it("Open two connexions", function(done) {
        Promise.all([
            loadHeadlessConnexion(),
            loadHeadlessConnexion()
        ])
        .then(() => {
            done();
        })
        .catch(done);
	});


    it("Open 8 connexions", function(done) {
        Promise.all([
            loadHeadlessConnexion(),
            loadHeadlessConnexion(),
            loadHeadlessConnexion(),
            loadHeadlessConnexion(),
            loadHeadlessConnexion(),
            loadHeadlessConnexion(),
            loadHeadlessConnexion(),
            loadHeadlessConnexion()
        ])
        .then(() => {
            done();
        })
        .catch(done);
	});
});
