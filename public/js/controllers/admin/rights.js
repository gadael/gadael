define([], function() {
return [
		'$scope', 
		'loadTypesOptions',
		function($scope, loadTypesOptions) {

			loadTypesOptions($scope);
			

		}
	];
});
