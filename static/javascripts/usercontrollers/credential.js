app.controller("CredentialController", ['$rootScope', '$scope', '$state', '$location', 'Flash', '$mdDialog','$http','$uibModal','HTTPFactory','filterFilter','DataService',
  function ($rootScope, $scope, $state, $location, Flash, $mdDialog, $http, $uibModal, HTTPFactory, filterFilter, DataService) {  
   var ctrl = this;
   
    function getCookie(cname) {
      var name = cname + "=";
      var ca = document.cookie.split(';');
      for(var i = 0; i < ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) == ' ') {
              c = c.substring(1);
          }
          if (c.indexOf(name) == 0) {
              return c.substring(name.length, c.length);
          }
      }
      return "";
    }
   $scope.error = "";
   $scope.link = "#";
   var vm = this;
   $scope.users = [];
   vm.time = new Date();
   $scope.error_login = '';
   $scope.checkLogin = function(){
     $http({
       method : 'POST',
       url : '/login',
       data : $scope.data
     }).then(function(response){
         $scope.error_login = response.data.error;
         if(response.data.error === undefined){
          window.location.href = '/home';
         } 
     }, function(response){});
   }
   $scope.checkSignUp = function(){
    HTTPFactory.getAllUsers()
     .then(function(response){
       $scope.users = response.data;
       $scope.checkNowSignUp();
     }, function(response){});

   }

   $scope.checkNowSignUp = function(){
    var hasError = false;
    $scope.error_signup = '';
    if($scope.data !== undefined){
      if($scope.data.email !== undefined){
      var user = filterFilter($scope.users, {email : $scope.data.email})[0];
      if(user !== undefined){
        $scope.error_signup = "The Email Address Already Exist!";
        hasError = true;
      } if($scope.data.email.indexOf('@up.edu.ph') === -1 && !hasError){
        $scope.error_signup = "Invalid UP Email Address!";
        hasError = true;
      } 
    } if($scope.data.username !== undefined && !hasError){
      var user = filterFilter($scope.users, {username : $scope.data.username})[0];
      if(user !== undefined){
        $scope.error_signup = "The Username Already Exists!";
        hasError = true;
      }
    } if($scope.data.password !== undefined && $scope.data.confirm !== undefined && !hasError){
       if($scope.data.password !== $scope.data.confirm){
        $scope.error_signup = "Passwords Do Not Match!";
        hasError = true;
       }
    } else if(!hasError){
      $scope.error_signup = '';
    }
    }

   }

   $scope.sendSignup = function(){
     if($scope.data !== undefined){
      if($scope.data.firstname !== undefined && $scope.data.lastname &&
         $scope.data.email !== undefined && $scope.data.username &&
         $scope.data.password !== undefined && $scope.data.confirm){
    $http({
       method : 'POST',
       url : '/signup',
       data : $scope.data
     }).then(function(response){
         if(response.data.error === undefined){
          window.location.href = '/home';
         } 
     }, function(response){})
      }
     }
     ;
   }
  ctrl.sideBar = function (value) {
        if($(window).width()<=767){
        if ($("body").hasClass('sidebar-open'))
            $("body").removeClass('sidebar-open');
        else
            $("body").addClass('sidebar-open');
        }
        else {
            if(value==1){
            if ($("body").hasClass('sidebar-collapse'))
                $("body").removeClass('sidebar-collapse');
            else
                $("body").addClass('sidebar-collapse');
            }

        }
    };
    HTTPFactory.getAllUsers()
     .then(function(response){
       $scope.users = response.data;
       var user = getCookie('userid');
       $scope.curr_user = filterFilter($scope.users, {id : user})[0];
       $scope.name = $scope.curr_user.first_name + ' ' + $scope.curr_user.last_name; 
       $scope.username = '@' + $scope.curr_user.username;
       $scope.profpic = $scope.profpic_path;
     }, function(response){});
     
     $scope.$on('/updateuserinfo', function(){
        HTTPFactory.getAllUsers()
       .then(function(response){
         $scope.users = response.data;
         var user = getCookie('userid');
         $scope.curr_user = filterFilter($scope.users, {id : user})[0];
       }, function(response){});
     });
}]);
