'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'myApp.controllers', 'ui.bootstrap']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {templateUrl: 'partials/no-pac.html', controller: 'GameCtrl'});
    $routeProvider.when('/trellorss', {templateUrl: 'partials/trellorss.html', controller: 'GameCtrl'});
    $routeProvider.when('/steamapi', {templateUrl: 'partials/steamapi.html', controller: 'GameCtrl'});
    $routeProvider.when('/udacity-blog', {templateUrl: 'partials/udacityblog.html', controller: 'GameCtrl'});
    $routeProvider.when('/udacity-wiki', {templateUrl: 'partials/udacitywiki.html', controller: 'GameCtrl'});
    $routeProvider.when('/steamplaytime', {templateUrl: 'partials/steamplaytime.html', controller: 'GameCtrl'});
    $routeProvider.when('/oss', {templateUrl: 'partials/oss.html', controller: 'GameCtrl'});
    $routeProvider.when('/udacity-searchengine', {templateUrl: 'partials/udacitysearchengine.html', controller: 'GameCtrl'});
    $routeProvider.when('/tech', {templateUrl: 'partials/tech.html', controller: 'GameCtrl'});
    $routeProvider.when('/resume', {templateUrl: 'partials/resume.html', controller: 'GameCtrl'});
    $routeProvider.when('/games', {templateUrl: 'partials/games.html', controller: 'GameCtrl'});
    $routeProvider.otherwise({redirectTo: '/'});
  }]);

/* Controllers */

angular.module('myApp.controllers', []);

function GameCtrl($scope) {
  
}

/* Directives */

angular.module('myApp.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]);

/* Filters */

angular.module('myApp.filters', []).
  filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    };
  }]);

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', []).
  value('version', '0.1');
