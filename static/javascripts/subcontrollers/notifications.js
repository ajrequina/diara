app.controller("NotificationsController", ['$rootScope', '$scope', '$state', '$location', 'Flash', '$mdDialog','$http','$uibModal','HTTPFactory','filterFilter','DataService','$filter',
  function ($rootScope, $scope, $state, $location, Flash, $mdDialog, $http, $uibModal, HTTPFactory, filterFilter, DataService, $filter) {  
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

  // $scope.$on('NOTIFY',  function(pevent, padata){
  //     console.log('I am here');
  //     var data = padata;
  //     DataService.initUsers2()
  //      .then(function(data){
  //        $scope.users = data;
  //        console.log($scope.users);
  //        if(padata.type === 'comment'){
  //         if(padata.operation === 'add'){
  //           var current = getCookie('userid');
  //           var test = filterFilter(padata.assignees, {id : current})[0];
  //           console.log(test);
  //           if(test !== undefined){
  //             var commenter = filterFilter($scope.users, {id : padata.userid})[0];
  //             var message = commenter.fullname + " commented on task " + padata.task.title  ;  
  //             var d = {
  //               type : 'comment',
  //               message : message,
  //               typeid : padata.commentid,
  //               operation : 'add',
  //               createdate : padata.createdate
  //             };
  //             $http({
  //               url : '/addnotif',
  //               data : d,
  //               method : 'POST'
  //             }).then(function(response){
  //               if(response.data.conf){
  //                 $scope.getNotifications();
  //               }
  //             }, function(response){});
  //           }
            
  //         }
  //       }
  //     }, function(data){})
      
  //  })

  // $scope.getNotifications = function(){
  //   $http({
  //     url : '/listnotifs',
  //     method : 'POST'
  //   }).then(function(response){
  //      $scope.notifications = response.data;
  //      $scope.notifications = $filter('orderBy')($scope.notifications, '-create_date');
       
  //   }, function(response){});
  // }
}]);
