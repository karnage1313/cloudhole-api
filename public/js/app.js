angular.module("clearancesApp", ['ngRoute'])
    .config(function($routeProvider) {
        $routeProvider
            .when("/", {
                controller: "ListController",
                templateUrl: "list.html"
            })
            .when("/new/clearance", {
                controller: "NewClearanceController",
                templateUrl: "clearance-form.html"
            })
            .when("/clearance/:clearanceId", {
                controller: "EditClearanceController",
                templateUrl: "clearance.html"
            })
            .otherwise({
                redirectTo: "/"
            })
    })
    .service("Clearances", function($http) {
        this.getClearances = function(key) {
            var config = {headers: {"Authorization": key}};
            return $http.get("/clearances", config).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error finding clearances.");
                });
        }
        this.createClearance = function(clearance) {
            var config = {headers: {"Authorization": clearance.key}};
            return $http.post("/clearances", clearance, config).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error creating clearance.");
                });
        }
        this.getClearance = function(clearanceId) {
            var url = "/clearances/" + clearanceId;
            return $http.get(url).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error finding this clearance.");
                });
        }
        this.editClearance = function(clearance) {
            var url = "/clearances/" + clearance._id;
            var config = {headers: {"Authorization": clearance.key}};
            return $http.put(url, clearance, config).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error editing this clearance.");
                });
        }
        this.deleteClearance = function(clearanceId, key) {
            var url = "/clearances/" + clearanceId;
            var config = {headers: {"Authorization": key}};
            return $http.delete(url, config).
                then(function(response) {
                    return response;
                }, function(response) {
                    alert("Error deleting this clearance.");
                });
        }
    })
    .controller("ListController", function($scope, $location, Clearances) {
        var key = $location.search().key;
        Clearances.getClearances(key).then(function(doc) {
          $scope.clearances = doc.data;
        }, function(response) {
          alert(response);
        });
    })
    .controller("NewClearanceController", function($scope, $location, Clearances) {
        $scope.back = function() {
            $location.path("#/");
        }

        $scope.saveClearance = function(clearance) {
            Clearances.createClearance(clearance).then(function(doc) {
                var clearanceUrl = "/clearance/" + doc.data._id;
                $location.path(clearanceUrl);
            }, function(response) {
                alert(response);
            });
        }
    })
    .controller("EditClearanceController", function($scope, $routeParams, Clearances) {
        Clearances.getClearance($routeParams.clearanceId).then(function(doc) {
            $scope.clearance = doc.data;
        }, function(response) {
            alert(response);
        });

        $scope.toggleEdit = function() {
            $scope.editMode = true;
            $scope.clearanceFormUrl = "clearance-form.html";
        }

        $scope.back = function() {
            $scope.editMode = false;
            $scope.clearanceFormUrl = "";
        }

        $scope.saveClearance = function(clearance) {
            Clearances.editClearance(clearance);
            $scope.editMode = false;
            $scope.clearanceFormUrl = "";
        }

        $scope.deleteClearance = function(clearanceId, key) {
            Clearances.deleteClearance(clearanceId, key);
        }
    });
