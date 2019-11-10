define(['q'], function (Q) {
	'use strict';

    var deferred = Q.defer();

    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {

        if (httpRequest.readyState === XMLHttpRequest.DONE && httpRequest.status === 200) {
            var common = JSON.parse(httpRequest.responseText);
            deferred.resolve(common);
        }


    };
    httpRequest.open('GET', 'rest/common', true);
    httpRequest.send();


    return deferred.promise;

});
