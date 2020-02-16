/**
 * convert json dates to date objects
 * for all requests using the $http service
 *
 * @return callback for app.config()
 */
define([], function () {
	'use strict';


    var regexIso8601 = /^(\d{4}|\+\d{6})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})\.(\d{1,})(Z|([\-+])(\d{2}):(\d{2}))?)?)?)?$/;

    function convertDateStringsToDates(input) {
        // Ignore things that aren't objects.
        if (typeof input !== "object") {
            return input;
        }

        for (var key in input) {
            if (!input.hasOwnProperty(key)) {
                continue;
            }

            var value = input[key];
            var match;
            // Check for string properties which look like dates.
            if (typeof value === "string" && (match = value.match(regexIso8601))) {
                if (!match[1] || !match[2] || !match[3] || !match[4] || !match[5] || !match[6]) {
                    // Require at least year mont day hour minute second
                    continue;
                }
                var milliseconds = Date.parse(match[0]);
                if (!isNaN(milliseconds)) {
                    input[key] = new Date(milliseconds);
                }
            } else if (typeof value === "object") {
                // Recurse into object
                convertDateStringsToDates(value);
            }
        }
    }

	return function($httpProvider) {
         $httpProvider.defaults.transformResponse.push(function(responseData) {
            convertDateStringsToDates(responseData);
            return responseData;
        });
    };
});
