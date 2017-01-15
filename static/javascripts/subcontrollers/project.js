app.controller("ProjectController", ['$rootScope', '$scope', '$state', '$location', 'Flash','$http','$filter','$mdDialog','$window','filterFilter','$document','$uibModal','HTTPFactory','DataService','MiscService','ProjectService','TaskService','socket','Notification',
  function ($rootScope, $scope, $state, $location, Flash,$http, $filter, $mdDialog,$window, filterFilter, $document, $uibModal, HTTPFactory, DataService, MiscService, ProjectService, TaskService, socket, Notification) {
   /////////////////////////////// CONTROLLER VARIABLES /////////////////////////////////////////
  var ctrl = this;
  var list_tasks = [];
  var list_users = [];
  var list_collabs = [];
  var list_assignments = [];
  var list_projects = [];
  var user_id = null;
  var task_users = [];
  /////////////////////////////// VIEW VARIABLES //////////////////////////////////////////////
  $scope.projects = [];
  
  ///////////////////////////////  FUNCTIONS /////////////////////////////////////////////////
  ctrl.setListTasks = function(){
    DataService.initTasks2()
     .then(function(data){
       list_tasks = data.related;
       console.log(list_tasks);
       ctrl.setProjects();
     }, function(data){});
  } 
  ctrl.setListUsers = function(){
    DataService.initUsers2()
     .then(function(data){
       list_users = data;
       ctrl.setListAssignments();
    }, function(data){})
  }
  ctrl.setListAssignments = function(){
     DataService.initAssignments2()
     .then(function(data){
     list_assignments = data;
     ctrl.setListProjects();
     }, function(data){})
  }
  ctrl.setListProjects = function(){
    DataService.initProjects2()
    .then(function(data){
      list_projects = data.related;
      console.log(list_projects);
      ctrl.list_projects = data.related;
      ctrl.setListCollabs();
    }, function(data){})
  }
  ctrl.setListCollabs = function(){
    DataService.initCollabs2()
     .then(function(data){
      list_collabs = data;
      ctrl.setListTasks();
    }, function(data){})
  }
  ctrl.setNeededData = function(){
    ctrl.setListUsers();
  } 
  ctrl.setNeededData();

  ctrl.setProjects = function(){
   console.log(list_projects);
   var projects = list_projects;
   for(var i = 0; i < projects.length; i++){
     projects[i].collaborators = DataService.getCollabById(list_collabs, list_users, projects[i].id);
   }
   projects = $filter('orderBy')(projects, '-create_date');
   projects = projects.filter(function(project){
     var user_exist = filterFilter(project.collaborators, { id : getCookie('userid')})[0];
     return user_exist !== undefined;
   });
   $scope.projects = projects;
  }
  ctrl.setProjectDetails = function(project){
    $window.localStorage['project'] = JSON.stringify(project);
  }
  ctrl.deleteProject = function(project){
    console.log(project);
    var d = {
      projectid : project.id,
      tasks : [],
      collaborators : project.collaborators
    };

    var confirm = $mdDialog.confirm()
        .parent(angular.element(document.querySelector('#dialogContainer')))
        .clickOutsideToClose(true)
        .title('Warning')
        .textContent('All tasks and subtasks will also be deleted.')
        .ariaLabel('Lucky day')
        .cancel('Cancel')
        .ok('Continue');
        $mdDialog.show(confirm).then(function() {
          $http({
            method : "POST",
            url : "/deleteproject",
            data : d
          }).then(function (response) {
              Notification.warning({message: response.data.message, positionY: 'top', positionX: 'right'});
              if(response.data.data !== undefined){
                 var project_data = response.data.data;
                 console.log(project_data);
                 var doer = filterFilter(list_users, {id : project_data.userid})[0];
                 var arrNotif = [];
                 for(var i = 0; i < project_data.collaborators.length; i++){
                  if(project_data.collaborators[i].id !== getCookie('userid')){
                   var message = doer.fullname + " (@" + doer.username + ") "+ " deleted the project " + project.name.replace(/^[ ]+|[ ]+$/g,'');  
                    var d = {
                      type : 'project',
                      message : message.replace(/\s+/g,' ').trim(),
                      typeid : project_data.projectid,
                      operation : 'delete',
                      createdate : project_data.createdate,
                      userid : project_data.collaborators[i].id
                    };
                    arrNotif.push(d);  
                  }
                 }
                $http({
                  url : '/addnotif',
                  method : 'POST', 
                  data : { arrNotif : arrNotif }
                }).then(function(response){}, 
                        function(response){});
              }
          }, function (response) {});
        }, function() { });
  }
  

  ////////////////// LISTENERS ///////////////////
  $scope.$on('/deleteproject', function(event, data){
    console.log(data);
    var coll = [];
    for(var i = 0; i < $scope.projects.length; i++){
      if($scope.projects[i].id !== data.id){
        coll.push($scope.projects[i]);
      }
    }
    $scope.projects = coll;
  });

  $scope.$on('/createproject', function(event, data){
     var projects = $scope.projects;
     data.create_date = $filter('date')(new Date(data.create_date), 'MMMM d, y');
     projects.unshift(data);
     // projects = $filter('orderBy')(projects, '-create_date');
     $scope.projects = projects;
  })
  $scope.$on('/updateprojectname', function(event, data){
    for(var i = 0; i < $scope.projects.length; i++){
      if($scope.projects[i].id === data.id){
        $scope.projects[i].name = data.name;
        break;
      }
    }
  });
  $scope.$on('/updatecollaborator', function(event, data){
    ctrl.setNeededData();
    // var exist_user = filterFilter(data.del_users, {id : getCookie('userid')})[0];
    // if(exist_user !== undefined){
    //  var confirm = $mdDialog.confirm()
    //   .title('Information')
    //   .textContent('You were removed from this project.')
    //   .ariaLabel('Lucky day')
    //   .targetEvent(event)
    //   .ok('Ok');
    //  $mdDialog.show(confirm).then(function(){
    //   $state.go('projects');
    //  }, function(){})
    // } else {
    //   if(data.id === $scope.project_details.id){
    //     $scope.project_details.collaborators = $scope.project_details.collaborators.filter(function(collab){
    //        var exist_user = filterFilter(data.del_users, {id : collab.id})[0];
    //        return exist_user === undefined;
    //     });
    //     if(data.add_users.length > 0){
    //       for(var i = 0; i < data.add_users.length; i++){
    //         var test = filterFilter($scope.project_details.collaborators, {id : data.add_users[i].id})[0];
    //         if(test === undefined){
    //           $scope.project_details.collaborators.push(filterFilter(list_users , {id : data.add_users[i].id})[0]);
    //         }
    //       }
    //      }
    //     }
    //   }
    

  });
  ////// OTHER FUNCTIONS //////
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
  //ctrl.setProjects();
}]);

