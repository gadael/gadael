define(['momentDurationFormat'], function(moment) {

    'use strict';

    // Service to edit an absence, 
    // shared by account/request/absence-edit and admin/request/absence-edit
    
    return {
        
        /**
         * Set scope delfault values
         * @param {Object} $scope
         */
        initScope: function initScope($scope) {
            // default values
            $scope.periodSelection = true;
            $scope.assignments = false;
            $scope.newRequest = false;
            $scope.editRequest = false;

            // list of beneficiaries objects, populated once period set
            $scope.accountRights = [];

            $scope.selection = {
                begin: undefined,
                end: undefined,
                isValid: false,
                duration: undefined,
                days: undefined,
                hours: undefined
            };
        },
        
        
        
        getNextButtonJob: function getNextButtonJob($scope, accountCollection, accountRights) {
            return function() {

                // hide the period selection
                $scope.periodSelection = false;

                // show the right assignement
                $scope.assignments = true;

                if ($scope.user) {

                    /**
                     * Load collection
                     * The collection available on the selected period
                     */

                    $scope.collection = accountCollection.get({
                        user: $scope.user.id,
                        dtstart: $scope.selection.begin,
                        dtend: $scope.selection.end
                    });


                    /**
                     * Load accountRights
                     * the list of rights accessible on the selected period
                     */

                    $scope.accountRights = accountRights.query({
                        user: $scope.user.id,
                        dtstart: $scope.selection.begin,
                        dtend: $scope.selection.end
                    });


                }
            };
        },
        
        
        /**
         * Process scope once the user document is available
         * @param   {Object}   $scope         
         * @param   {Object}   user           user document as object
         * @param   {Resource} calendarEvents
         * 
         */
        onceUserLoaded: function onceUserLoaded($scope, user, calendarEvents)
        {
            /**
             * get the onUpdateInterval function
             * @param   {Object}   $scope         
             * @param   {Object}   account        object from the Account schema (vacation account)
             * @param   {Resource} calendarEvents Resource for the REST service (user and admin will have differents resources)
             * @returns {function}
             */
            function getOnUpdateInterval($scope, account, calendarEvents) {


                /**
                 * Set a duration visible to the final user
                 *
                 * @param {Int} duration Number of miliseconds
                 */
                function setDuration(duration)
                {
                    var interval = moment.duration(duration, "milliseconds");

                    $scope.selection.duration = interval.format("d [days], h [hours], m [minutes]");
                    $scope.selection.days = interval.format("d [days]", 2);
                    $scope.selection.hours = interval.format("h [hours]", 2);

                    $scope.selection.isValid = duration > 0;
                }



                /**
                 * Get notified if interval is modified
                 * @param {Date} begin 
                 * @param {Date} end   
                 */
                return function onUpdateInterval(begin, end)
                {
                    if (!begin || !end) {
                        return setDuration(0);
                    }

                    if (begin >= end) {
                        return setDuration(0);
                    }

                    calendarEvents.query({ 
                        calendar: account.currentScheduleCalendar._id, 
                        dtstart: begin, 
                        dtend: end 
                    }).$promise.then(function(periods) {
                        var duration = 0;
                        var p;

                        for(var i=0; i<periods.length; i++) {

                            p = {
                                dtstart: new Date(periods[i].dtstart),
                                dtend: new Date(periods[i].dtend)
                            };

                            duration += p.dtend.getTime() - p.dtstart.getTime();
                        }

                        return setDuration(duration);
                    });  
                };
            }
            
            
            if (!user.roles.account) {
                throw new Error('the user must have a vacation account'); 
            }

            var onUpdateInterval = getOnUpdateInterval($scope, user.roles.account, calendarEvents);
            
            $scope.$watch(function() { return $scope.selection.begin; }, function(begin) {
                onUpdateInterval(begin, $scope.selection.end);
            });

            $scope.$watch(function() { return $scope.selection.end; }, function(end) {
                onUpdateInterval($scope.selection.begin, end);
            });
        }
    };
});
