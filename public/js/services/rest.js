define(function() {

    'use strict';

    return function LoadRestListService(ResourceFactory, RestResource) {

        /**
         * the returned object will be the one used in controller
         * to create the resource from url or create a new one
         * @return {object}
         */
        function init(path) {

            path = 'rest/'+path;

            return {

                /**
                 * Create resource using the path in URL
                 * using the RestResource service
                 * @return {$resource}
                 */
                getFromUrl: function() {

                    var restUrlPath = path;
                    if ('/:id' === path.substr(path.length-4,4)) {
                        restUrlPath = path.substr(0, path.length-4);
                    }

                    return RestResource(restUrlPath);
                },


                /**
                 * Create resource from the resource factory service
                 * @return {$resource}
                 */
                getResource: function() {
                    return ResourceFactory(path);
                }
            };
        }

        return {

            admin: {
                accountbeneficiaries    : init('admin/accountbeneficiaries/:id'),
                accountrights           : init('admin/accountrights/:id'),
                accountcollections      : init('admin/accountcollections/:id'),
                accountschedulecalendars: init('admin/accountschedulecalendars/:id'),
                accountnwdayscalendars  : init('admin/accountnwdayscalendars/:id'),
                beneficiaries           : init('admin/beneficiaries/:id'),
                calendars               : init('admin/calendars/:id'),
                calendarevents          : init('admin/calendarevents/:id'),
                personalevents          : init('admin/personalevents/:id'),
                unavailableevents       : init('admin/unavailableevents/:id'),
                collection              : init('admin/collection'),
                collections             : init('admin/collections/:id'),
                departments             : init('admin/departments/:id'),
                adjustments             : init('admin/adjustments/:id'),
                rightrenewals           : init('admin/rightrenewals/:id'),
                rightrules              : init('admin/rightrules/:id'),
                rights                  : init('admin/rights/:id'),
                specialrights           : init('admin/specialrights'),
                types                   : init('admin/types/:id'),
                users                   : init('admin/users/:id'),
                usersstat               : init('admin/usersstat'),
                requests                : init('admin/requests/:id'),
                compulsoryleaves        : init('admin/compulsoryleaves/:id'),
                recoverquantities       : init('admin/recoverquantities/:id'),
                timesavingaccounts      : init('admin/timesavingaccounts/:id'),
                collaborators           : init('admin/collaborators/:id'),
                export                  : init('admin/export'),
                consumption             : init('admin/consumption'),
                invitations             : init('admin/invitations/:id'),
                apitokens               : init('admin/apitokens/:id'),
                overtimes               : init('admin/overtimes/:id'),
                overtimesummary         : init('admin/overtimesummary')
            },

            account: {
                collection              : init('account/collection'),
                accountrights           : init('account/accountrights/:id'),
                calendars               : init('account/calendars/:id'),
                personalevents          : init('account/personalevents/:id'),
                unavailableevents       : init('account/unavailableevents/:id'),
                requests                : init('account/requests/:id'),
                beneficiaries           : init('account/beneficiaries/:id'),
                adjustments             : init('account/adjustments/:id'),
                recoverquantities       : init('account/recoverquantities/:id'),
                timesavingaccounts      : init('account/timesavingaccounts/:id'),
                collaborators           : init('account/collaborators/:id'),
                consumption             : init('account/consumption')
            },

            manager: {
                waitingrequests         : init('manager/waitingrequests/:id'),
                collaborators           : init('manager/collaborators/:id'),
                departments             : init('manager/departments/:id')
            },

            user: {
                user                    : init('user'),
                settings                : init('user/settings'),
                calendarevents          : init('user/calendarevents/:id'),
                googlecalendars         : init('user/googlecalendars/:id')
            },

            anonymous: {
                createfirstadmin        : init('anonymous/createfirstadmin'),
                invitation              : init('anonymous/invitation/:emailToken')
            }
        };
    };
});
