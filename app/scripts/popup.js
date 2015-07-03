'use strict';

Object.prototype.has_key = function (key) {
  return Object.keys(this).indexOf(key) >= 0;
};

var app = angular.module('restriccionSclApp', ['ngMaterial']);

app.controller('AppCtrl', ['$scope', '$http', function ($scope, $http) {
  moment.locale('es');
  $scope.today = moment();

  $scope.data = {};

  $http.get(CONFIG.API_URL + '/0/restricciones?fecha=' + $scope.today.format('YYYY-MM-DD')).
    success(function (data) {
      if (data.length < 1) {
        return;
      }

      $scope.data = data[0];
    });
}]);
