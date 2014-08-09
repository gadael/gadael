define([], function() {
	return [
		'$scope', 
		'loadCollectionsOptions', 
		'loadDepartmentsOptions', 
		function($scope, loadCollectionsOptions, loadDepartmentsOptions) {

			loadCollectionsOptions($scope);
			loadDepartmentsOptions($scope);
			
			
			
			// name='+search.name+'&department='+search.department+'&collection='+search.collection
		}
	];
});
