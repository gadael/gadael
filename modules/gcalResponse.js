'use strict';

/**
 * Create a callback for google response used in services
 * push errors to service if necessary
 * call done on success
 * refresh token if not logged in
 *
 *
 * @param {apiService} service
 * @param {Function}   getUserResponse A function with the user object as parameter, the function do the google api request
 *                                     and use gcalResponse as callback, this is needed if access token is refreshed
 * @param {User}       user            the user object to give to getUserResponse where refresh token is stored
 * @param {Function}   done            Success callback for the data object from google
 */
exports = module.exports = function(service, getUserResponse, user, done) {


    function errorToAlerts(err) {

        if (undefined !== err.errors) {
            err.errors.forEach(gErr => {
                // This is the error format from passport+google
                service.addAlert('danger', gErr.message);
            });
            return;
        }

        if (undefined !== err.data) {
            let data = JSON.parse(err.data);
            if (undefined !== data.error_description) {
                // This is the error format given by passport-oauth2-refresh+google
                service.addAlert('danger', data.error_description);
            }
            return;
        }

        if (undefined !== err.message) {
            service.addAlert('danger', err.message);
            return;
        }

        console.error(err);
    }


    function reject(err) {
        service.httpstatus = 500;
        service.outcome.success = false;

        if (service.outcome.alert.length > 0) {
            service.deferred.reject(service.outcome.alert[0].message);
        } else {
            service.deferred.reject(new Error('Unexpected'));
        }
    }


    return user.createGoogleCallback(getUserResponse, done, reject, errorToAlerts);

};
