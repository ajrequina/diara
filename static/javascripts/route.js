var route = angular.module('route', ['ui.router', 'ngAnimate','ngMaterial','ui.bootstrap']);

route.config(['$stateProvider', '$locationProvider', '$urlRouterProvider', 
    function ($stateProvider, $locationProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('tasks');
    
    $stateProvider.state('dashboard', {
        url: '/dashboard',
        templateUrl: '/dashboard',
        controller: 'DashboardController',
        controllerAs: 'ctrl',
        data: {
            pageTitle: 'Dashboard '
        }
    });

    $stateProvider.state('tasks', {
        url: '/tasks',
        templateUrl: '/tasks',
        controller: 'TasksController',
        controllerAs: 'ctrl',
        data: {
            pageTitle: 'Tasks'
        }
    });

    $stateProvider.state('projects', {
        url: '/projects',
        templateUrl: '/projects',
        controller: 'ProjectController',
        controllerAs: 'ctrl',
        data: {
            pageTitle: 'Projects'
        }
    });

    $stateProvider.state('teams', {
        url: '/teams',
        templateUrl: '/teams',
        controller: 'TeamsController',
        controllerAs: 'ctrl',
        data: {
            pageTitle: 'Teams'
        }
    });

    $stateProvider.state('archive', {
        url: '/archive',
        templateUrl: '/archive',
        controller: 'ArchiveController',
        controllerAs: 'ctrl',
        data: {
            pageTitle: 'Archive'
        }
    });

    $stateProvider.state('teamthreads', {
        url: '/project-threads',
        templateUrl: '/teamthreads',
        controller: 'TeamThreadsController',
        controllerAs: 'ctrl',
        data: {
            pageTitle: 'Project Threads'
        }
    });

    $stateProvider.state('taskdetails', {
        url: '/task-details',
        templateUrl: '/taskdetails',
        controller: 'TaskDetailsController',
        controllerAs: 'ctrl',
        data: {
            pageTitle: 'Task Details'
        }
    });

    $stateProvider.state('projectdetails', {
        url: '/project-details',
        templateUrl: '/projectdetails',
        controller: 'ProjectDetailsController',
        controllerAs: 'ctrl',
        data: {
            pageTitle: 'Project Details'
        }
    });
    
    $stateProvider.state('settings', {
        url: '/settings',
        templateUrl: '/settings',
        data: {
            pageTitle : 'Settings'
        }
    });
    
    $stateProvider.state('notifications', {
        url: '/notifications',
        templateUrl: '/notifications',
        data: {
            pageTitle : 'Notifications'
        }
    });
    $stateProvider.state('profile', {
        url: '/profile',
        templateUrl: '/profile',
        controller: 'ProfileController',
        controllerAs: 'ctrl',
        data: {
            pageTitle : 'Profile'
        }
    });

}]);

route.run([ '$rootScope', '$state', '$stateParams',
function ($rootScope, $state, $stateParams) {
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
}])