app.controller('SettingsModalController', ['$scope', '$uibModalInstance', '$filter', '$http','filterFilter','$mdDialog', 'HTTPFactory','filterFilter', '$window','$rootScope',
  function( $scope, $uibModalInstance, $filter, $http, filterFilter, $mdDialog, HTTPFactory, $window, $rootScope){
   $scope.users = [];
   $scope.curr_user = {};
   HTTPFactory.getAllUsers()
     .then(function(response){
       $scope.users = response.data;
       var id = getCookie('userid');
       $scope.curr_user = filterFilter($scope.users, {id : id})[0];
       $scope.firstname = $scope.curr_user.first_name;
       $scope.lastname = $scope.curr_user.last_name;
       $scope.info = $scope.curr_user.info;
       $scope.username = $scope.curr_user.username;
     }, function(response){});
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

    $scope.updateUser = function(){
    }

    $scope.checkFirstname = function(){
      if($scope.firstname.length === 0){
        $scope.firstname = $scope.curr_user.first_name;
      } 
    }
    $scope.checkLastname = function(){
      if($scope.lastname.length === 0){
        $scope.lastname = $scope.curr_user.last_name;
      } 
    }
    $scope.username_error = "";
    $scope.checkUsername = function(){
      if($scope.username.length === 0){
        $scope.username = $scope.curr_user.username;
      } else {
        var curr_user = filterFilter($scope.users, {id : getCookie('userid')})[0];
        var user = filterFilter($scope.users, {username : $scope.username})[0];
        if(user !== undefined){
          if(curr_user.username !== user.username){
             $scope.username_error = "Username already exist!";
          }
        } else {
          $scope.username_error = "";
        }
      }
    }
    $scope.checkInfo = function(){
      if($scope.info === null || $scope.info.length === 0){
        $scope.info = $scope.curr_user.info;
      }
    
    }

    $scope.clearError = function(){
      $scope.error = "";
    }
    $scope.error = "";
    $scope.error_match = "";
    $scope.error_input = "";
    $scope.sendSignup = function(){
        $http({
            method : 'POST',
            url : '/changepassword',
            data : d
        }).then(function mySuccess(response){
            $scope.error_input = response.data.error;
            if(response.data.error === undefined){
               $scope.close();
              var confirm = $mdDialog.confirm()
              .parent(angular.element(document.querySelector('#dialogContainer')))
              .clickOutsideToClose(true)
              .title('Password Successfully Changed!')
              .textContent("Please log in to continue.")
              .ariaLabel('Lucky day')
              .targetEvent(event)
              .ok('Login');
               $mdDialog.show(confirm).then(function() {
                 window.location.href = '/logout';
               });
            } 
         }, function myError(response){});
    }
    $scope.sendUserInfo = function(){
     var file = $scope.myFile;
     var uploadUrl = "/updateuserinfo";
     var data =  {
      firstname : $scope.firstname,
      lastname : $scope.lastname,
      info : $scope.info,
      username : $scope.username
     }
     var fd = new FormData();
     fd.append('pic', file);
     fd.append('firstname', data.firstname);
     fd.append('username', data.username);
     fd.append('lastname', data.lastname);
     fd.append('info', data.info);
       
       $http.post(uploadUrl, fd, {
          transformRequest: angular.identity,
          headers: {'Content-Type': undefined}
       }).then(function(response){
          $scope.close();
          $mdDialog.show(
            $mdDialog.alert()
             .parent(angular.element(document.querySelector('#dialogContainer')))
             .clickOutsideToClose(true)
             .textContent(response.data.message)
             .ok('Ok!')
             .targetEvent(event)
          );
          $scope.$emit('updateuserinfo', {});
       }, function(response){

       });
    }
    $scope.sendPassword = function(){
      if($scope.new_password1 !== $scope.new_password2){
       $scope.error_match = "Passwords do not match.";
      }  else {
        var d = {
          oldpassword : $scope.curr_password,
          newpassword1 : $scope.new_password1,
          newpassword2 : $scope.new_password2
        };
        $http({
            method : 'POST',
            url : '/changepassword',
            data : d
        }).then(function mySuccess(response){
            $scope.error_input = response.data.error;
            if(response.data.error === undefined){
               $scope.close();
              var confirm = $mdDialog.confirm()
              .parent(angular.element(document.querySelector('#dialogContainer')))
              .clickOutsideToClose(true)
              .title('Password Successfully Changed!')
              .textContent("Please log in to continue.")
              .ariaLabel('Lucky day')
              .targetEvent(event)
              .ok('Login');
               $mdDialog.show(confirm).then(function() {
                 window.location.href = '/logout';
               });
            } 


         }, function myError(response){});
      }
      
    }

    $scope.close = function() {
      $uibModalInstance.close();
    };
  }]);
