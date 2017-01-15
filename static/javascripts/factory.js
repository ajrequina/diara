app.factory('HTTPFactory', ['$http','$window', function($http, $window){

  var factory = {};

  factory.get = function(url){
    return $http({
      url : url,
      method : 'GET'
    });
  }
  factory.post = function(url, data){
    return $http({
      url : url,
      method : 'POST',
      data : data
    });
  }
  factory.getAllAssignments = function(){
   return $http({
      url: '/listassignment',
      method: 'GET'
   });
  };

  factory.getAllUsers = function(){
    return $http({
      url: '/listpersons',
      method: 'GET'
    });
  }
  
  factory.getAllTasks = function(){
    return $http({
      url: '/listtasks',
      method: 'GET'
    });
  }

  factory.getAllCollabs = function(){
    return $http({
      url: '/listcollabs',
      method: 'GET'
    });
  }

  factory.getAllProjects = function(){
    return $http({
      url : '/listprojects',
      method : 'GET'
    });
  }

  factory.getAllProjectTasks = function(project_id){
    return $http({
      url : '/listprojecttasks',
      method : 'GET',
      data : {'projectid' : project_id}
    });
  };

  return factory;
}])

app.service('socket', function($rootScope){
  var socket = io.connect();
    return {
      on: function (eventName, callback) {
        socket.on(eventName, function () {  
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      },
       emit: function (eventName, callback) {
        socket.emit(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      },
       removeAllListeners: function (eventName, callback) {
         socket.removeAllListeners();
       }
    };
})
