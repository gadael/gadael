define(function() {

    'use strict';

    return function LoadRestListService(ResourceFactory, IngaResource) {
        
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
                 * using the IngaResource service
                 * @return {$resource}
                 */
                getFromUrl: function() {
                    
                    var ingaPath = path;
                    if ('/:id' === path.substr(path.length-4,4)) {
                        ingaPath = path.substr(0, path.length-4);
                    }

                    return IngaResource(ingaPath);
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
                accountrights           : init('admin/accountrights/:id'),
                accountcollections      : init('admin/accountcollections/:id'),
                accountschedulecalendars: init('admin/accountschedulecalendars/:id'),
                beneficiaries           : init('admin/beneficiaries/:id'),
                calendars               : init('admin/calendars/:id'),
                calendarevents          : init('admin/calendarevents/:id'),
                collections             : init('admin/collections/:id'),
                departments             : init('admin/departments/:id'),
                rightrenewals           : init('admin/rightrenewals/:id'),
                rightrules              : init('admin/rightrules/:id'),
                rights                  : init('admin/rights/:id'),
                types                   : init('admin/types/:id'),
                users                   : init('admin/users/:id'),
                requests                : init('admin/requests/:id')
            },
            
            account: {
                collection              : init('account/collection'),
                accountrights           : init('account/accountrights/:id'),
                calendars               : init('account/calendars/:id'),
                calendarevents          : init('account/calendarevents/:id')
            },
            
            user: {
                user                    : init('user')
            },

            anonymous: {
                createfirstadmin        : init('anonymous/createfirstadmin')
            }
        };
    };
});
