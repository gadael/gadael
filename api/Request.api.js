'use strict';

var api = {};
exports = module.exports = api;

var Q = require('q');


/**
 * Create random absence request for one user
 * using the user/requests service
 *
 * @param 	object		app			Express app or headless mock app
 */
api.createRandomAbsence = function(app, user) {

    if (!user.roles.account) {
        return Q.fcall(function () {
            throw new Error('This user is not an account');
        });
    }

    if (!user.roles.account._id) {
        return Q.fcall(function () {
            throw new Error('Account must be populated');
        });
    }

    var account = user.roles.account;

    var deferred = Q.defer();
	var save = app.getService('user/requests/save');


    account.getRights().then(function(rights) {

        if (rights.length < 1) {
            return deferred.reject(new Error('No rights associated to the user'));
        }

        var today = new Date();
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate()+1);

        rights[0].getPeriodRenewal(today, tomorrow).then(function(renewal) {

            if (!renewal) {
                return deferred.reject('No renewal on this period');
            }


            var params = { // parameters given to the service
                user: user._id,
                createdBy: user,
                absence: {
                    distribution: [
                        {
                            events: [{
                                dtstart: today,
                                dtend: tomorrow
                            }],
                            quantity: 1,
                            right: {
                                id: rights[0]._id,
                                renewal:renewal._id
                            }
                        }
                    ]
                }
            };

            deferred.resolve(save.getResultPromise(params));

        }, deferred.reject);




    }, deferred.reject);

    return deferred.promise;
};

