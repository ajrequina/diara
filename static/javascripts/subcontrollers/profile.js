

app.controller("ProfileController", ['$rootScope', '$scope', '$state', '$location', 'Flash','$http','$filter','$mdDialog','$window','filterFilter','$document','$uibModal','HTTPFactory','DataService','MiscService','ProjectService','TaskService','socket','Notification','$timeout',
  function ($rootScope, $scope, $state, $location, Flash,$http, $filter, $mdDialog,$window, filterFilter, $document, $uibModal, HTTPFactory, DataService, MiscService, ProjectService, TaskService, socket, Notification, $timeout) {
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
  $scope.user_details = {};
  $scope.order = "-create_date";
  $scope.current_filter = 'incomplete';

  ///////////////////////////////  FUNCTIONS /////////////////////////////////////////////////
  ctrl.showCreateTask = function () {
    var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: '/createtask',
        controller : 'TaskModalController',
        backdrop  : 'static',
        keyboard  : true
      });
   };
  ctrl.setListTasks = function(data){
    $http({
      url : '/listtasks',
      method : 'POST', 
      data : data
    }).then(function(response){
       list_tasks = response.data;
       ctrl.setListProjects(data);
    }, function(response){});
  } 
  ctrl.setListUsers = function(){
   DataService.initUsers()
    .then(function(data){
       list_users = data;
       ctrl.initProfileDetails();
   }, function(data){})
  }
  ctrl.setListAssignments = function(){
     DataService.initAssignments()
     .then(function(data){
     list_assignments = data;
     ctrl.setListUsers();
     }, function(data){})
  }
  ctrl.setListProjects = function(data){
    $http({
      url : '/listprojects',
      method : 'POST', 
      data : data
    }).then(function(response){
       list_projects = response.data;
       ctrl.setListCollabs();
    }, function(response){});
  }
  ctrl.setListCollabs = function(){
    DataService.initCollabs()
     .then(function(data){
      list_collabs = data;
      ctrl.setListAssignments();
    }, function(data){})
  }

   ctrl.setTaskCompletion = function(op, task){
    if(op === 'complete'){
      var proceed = true;
      task.subtask = DataService.getSubtasksById(list_tasks.related, task.id);
      for(var i = 0; i < task.subtask.length; i++){
        if(task.subtask[i].complete_date === null){
          proceed = false;
          break;
        }
      }
      if(proceed){
          var rating =  task.rating === null ? "0": task.rating;
         // rating = rating.substring(0, rating.indexOf('.'));
          task.rating = rating;
          $window.sessionStorage['task'] = JSON.stringify(task);
          $uibModal.open({
            animation: true,
            templateUrl: 'ratetask-template',
            controller : RateTaskModalController,
            controllerAs : 'ctrl',
            backdrop  : 'static',
            keyboard  : false,
            size :  'sm'
          });
        
      } else {
        var confirm = $mdDialog.confirm()
          .title("Task Completion")
          .content('Some of its subtasks are still in progress.')
          .ariaLabel('Lucky day')
          .ok('OK');
        $mdDialog.show(confirm);
      }
    } else if (op === 'incomplete') {
      $http({
        url : '/incompletetask',
        data : { taskid : task.id },
        method : 'POST'
      }).then(function(response){}, 
              function(response){})
    } 
  }
    var RateTaskModalController = function($scope, $http, $uibModalInstance, Notification){
      var ctrl = this;
      ctrl.close = function() {
        $uibModalInstance.close();
        $rootScope.$broadcast('complete_task', { id : $scope.task.id });
      };
      ctrl.setRating = function(){
       $scope.task = JSON.parse($window.sessionStorage['task']);
       $scope.rate = $scope.task.rating === null ? 0 : $scope.task.rating;
      }
      ctrl.saveRating = function(){
        var data = {
          taskid : $scope.task.id,
          rating : $scope.rate
      };
        $http({
          url : '/ratetask',
          data : data,
          method : 'POST'
        }).then(function(response){
          Notification.warning({message: response.data.message, positionY: 'top', positionX: 'right', verticalSpacing: 15});
          ctrl.close();
        }, function(response){});
      }
  }
  RateTaskModalController.inject = ['$uibModalInstance', 'Notification', '$scope', '$http']
  $scope.$on('complete_task', function(event, data){
    for(var i = 0; i < list_tasks.related.length; i++){
      if(data.id === list_tasks.related[i].id){
        var assignees = DataService.getAssignmentsById(list_assignments, list_users, list_tasks.related[i].id);
        $http({
          url : '/completetask',
          data : { 
              taskid : list_tasks.related[i].id ,
              assignees : assignees
          },
          method : 'POST'
        }).then(function(response){ 
           // $scope.tasks[i].complete_date = "Waiting for the date..";
           Notification.warning({message: response.data.message,  positionY: 'top', positionX: 'right', verticalSpacing: 15});
           if(list_tasks.related[i].project_id !== null){
             if(response.data.data !== undefined){
               var task_data = response.data.data;
               var doer =  filterFilter(list_users, {id : task_data.userid})[0];
               var arrNotif = [];
               var creator = task_data.userid;
               for(var j = 0; j < task_data.assignees.length; j++){
                  if(task_data.assignees[j].id !== getCookie('userid')){
                   if(creator === task_data.assignees[j].id){
                     creator = null;
                   }
                   var message = doer.fullname + " (@" + doer.username + ") "+ " marked the task " + list_tasks.related[i].title.replace(/^[ ]+|[ ]+$/g,'') + " as complete ";
                    var d = {
                      type : 'task',
                      message : message.replace(/\s+/g,' ').trim(),
                      typeid : task_data.taskid,
                      operation : 'update',
                      createdate : task_data.completedate,
                      userid : task_data.assignees[j].id
                    };
                    arrNotif.push(d);  
                  }
               }
               if(creator !== null){
                var message = doer.fullname + " (@" + doer.username + ") "+ " marked the task " + list_tasks.related[i].title.replace(/^[ ]+|[ ]+$/g,'') + " as complete ";
                var d = {
                  type : 'task',
                  message : message.replace(/\s+/g,' ').trim(),
                  typeid : task_data.taskid,
                  operation : 'update',
                  createdate : task_data.completedate,
                  userid : creator
                };
                arrNotif.push(d);  
               }
                $http({
                  url : '/addnotif',
                  method : 'POST', 
                  data : { arrNotif : arrNotif }
                }).then(function(response){}, 
                        function(response){})
            }
           }
        }, function(response){});
        break;
      }
    }
  });
  ctrl.setTaskListFilter = function(filter){
    if(filter === 'incomplete'){
      var id = getCookie('userid');
      var tasks = list_tasks.related;
        for(var i = 0; i < tasks.length; i++){
          if(filterFilter(list_projects.related, {id : tasks[i].project_id})[0] !== undefined){
            tasks[i].project = filterFilter(list_projects.related, {id : tasks[i].project_id})[0];
        }
      }
      tasks = tasks.filter(function(task){
        return  task.complete_date === null;
      });
      $scope.user_details.tasks = tasks;
    } else if(filter === 'complete'){
      var id = getCookie('userid');
       var tasks = list_tasks.related;
        for(var i = 0; i < tasks.length; i++){
          if(filterFilter(list_projects.related, {id : tasks[i].project_id})[0] !== undefined){
            tasks[i].project = filterFilter(list_projects.related, {id : tasks[i].project_id})[0];
        }
      }
      tasks = tasks.filter(function(task){
        return  task.complete_date !== null;
      });
      $scope.user_details.tasks = tasks;
    } else if(filter === 'unassigned'){
      var tasks = DataService.setTasks(list_projects, list_assignments, list_users, list_tasks.related);
      tasks = tasks.filter(function(task){
        return task.assignees.length === 0;
      });
    } 
    $scope.type = filter;
    $scope.tasks = tasks;
    $scope.tasks = $filter('orderBy')($scope.tasks, '-create_date');
  }
  ctrl.getProfileDetails = function(){
    var user_id = getCookie('userid');
    var data = {
      userid : user_id
    }
    ctrl.setListTasks(data);
  }
  ctrl.initProfileDetails = function(){
    user_id = getCookie('userid');
    var user = JSON.parse($window.localStorage['user']); 
    $scope.user_details = filterFilter(list_users, {id : user.id})[0];

    var tasks = list_tasks.related;
    for(var i = 0; i < tasks.length; i++){
      if(filterFilter(list_projects.related, {id : tasks[i].project_id})[0] !== undefined){
        tasks[i].project = filterFilter(list_projects.related, {id : tasks[i].project_id})[0];
      }
    }
    tasks = filterFilter(tasks, {complete_date : null});
    $scope.user_details.tasks = tasks;
    $scope.user_details._upper = $scope.user_details.first_name.charAt(0).toUpperCase() + $scope.user_details.first_name.slice(1);
    $scope.user_details._upperfull = $scope.user_details.first_name.charAt(0).toUpperCase() + $scope.user_details.first_name.slice(1) + ' ' + $scope.user_details.last_name.charAt(0).toUpperCase() + $scope.user_details.last_name.slice(1);
  }
  ctrl.setNeededData = function(){
    ctrl.getProfileDetails();
  } 
  ctrl.setNeededData();
  ctrl.initProjectDetails = function(){
    ctrl.setProjectTasks();
    if($scope.project_details.deadline_time !== null){
     var time = $scope.project_details.deadline_time.split(":");
     var x = new Date();
     x.setHours(time[0]);
     x.setMinutes(time[1]);
     $scope.project_details.deadline_time = $filter('date')(x.getTime(), 'hh:mm a');
    }

  }
  ctrl.setProjectTasks = function(){
    ctrl.setTaskListFilter('incomplete');
  }
  ctrl.setProjectTaskDetails = function(task){
    $window.localStorage['task'] = JSON.stringify(task);
  }

  
  $scope.$on('/deleteproject', function(event, data){
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
     $scope.projects = projects;
  })
  $scope.$on('/completetask', function(event, data){
    for(var i = 0; i < $scope.user_details.tasks.length; i++){
      if($scope.user_details.tasks[i].id === data.id){
        $scope.user_details.tasks[i].complete_date = data.complete_date;  
         $timeout(function(){
          $scope.user_details.tasks = $scope.user_details.tasks.filter(function(task){
            return task.id !== data.id;
          });
        }, 1000);      
        break;
      }
    } 
  }); 
  $scope.$on('/incompletetask', function(event, data){
     for(var i = 0; i < $scope.user_details.tasks.length; i++){
      if($scope.user_details.tasks[i].id === data.id){
        $scope.user_details.tasks[i].complete_date = null;
         $timeout(function(){
          $scope.user_details.tasks = $scope.user_details.tasks.filter(function(task){
            return task.id !== data.id;
          });
        }, 1000);   
        break;
      }
     }
  });
  $scope.$on('/updatetaskname', function(event, data){
    for(var i = 0; i < $scope.project_details.tasks.length; i++){
       if($scope.project_details.tasks[i].id === data.id){
         $scope.project_details.tasks[i].title = data.title;
         break;
       }
    }
  });
  $scope.$on('/updatetaskdeadline', function(event, data){
    for(var i = 0; i < $scope.project_details.tasks.length; i++){
       if($scope.project_details.tasks[i].id === data.id){
         $scope.project_details.tasks[i].deadline_date = $filter('date')(new Date(data.deadline_date), 'M/d/yy');
         break;
       }
    }
  });
  $scope.$on('/deletetask', function(event, data){
   $scope.project_details.tasks = $scope.project_details.tasks.filter(function(task){
    return task.id !== data.id;
   });
   var task = filterFilter(list_tasks, {id : data.id})[0];
   var lower_tasks = DataService.getRelatedLowerTasks(list_tasks, task);
   for(var i = 0; i < lower_tasks.length; i++){
     $scope.project_details.tasks = $scope.project_details.tasks.filter(function(task){
      return task.id !== lower_tasks[i].id;
     });
   }
  });
  $scope.$on('/updatetaskassignee', function(event, data){
    for(var i = 0; i < $scope.project_details.tasks.length; i++){
     var exist = filterFilter(data.subtasks, { id : $scope.project_details.tasks[i].id })[0];
      if(data.id === $scope.project_details.tasks[i].id || exist != undefined){
        if(data.project_id !== $scope.project_details.id){
          $scope.project_details.tasks = $scope.project_details.tasks.filter(function(task){
            return task.id !== data.id;
          });
          break;
        } else {
          $scope.project_details.tasks[i].assignees = $scope.project_details.tasks[i].assignees.filter(function(user){
             var exist_user = filterFilter(data.del_users, {id : user.id})[0];
             return exist_user === undefined;
          });
          for(var j = 0; j < data.add_users.length; j++){
           var exist_user = filterFilter($scope.project_details.tasks[i].assignees, {id : data.add_users[j].id})[0];
           if(exist_user === undefined){
             $scope.project_details.tasks[i].assignees.push(data.add_users[j]);
           }
          }
        }
        break;
      }
    }
  });
  $scope.$on('/createtask', function(event, data){
    if(data.user_id === $scope.user_details.id){
       data.create_date = new Date(data.create_date);
       data.edit_date = new Date(data.create_date);
       data.assignees = data.assigned_users;
       if($scope.current_filter === 'incomplete'){
         $scope.project_details.tasks.push(data);
         $scope.project_details.tasks = $filter('orderBy')($scope.project_details.tasks, $scope.order);
       } else if($scope.current_filter === 'unassigned'){
          if(data.assignees.length === 0){
            $scope.project_details.tasks.push(data);
            $scope.project_details.tasks = $filter('orderBy')($scope.project_details.tasks, $scope.order);
          }
       } 
    }

    
  });
  $scope.$on('/updateprojectname', function(event, data){
    if($scope.project_details.id === data.id){
        $scope.project_details.name = data.name;
        $scope.project_title = data.name;
    }
  });
  $scope.$on('/updateprojectdesc', function(event, data){
    if($scope.project_details.id === data.id){
      $scope.project_details.description = data.description;
      $scope.project_description = data.description;
    }
  });
  $scope.$on('/updateprojectdeadline', function(event, data){
    if(data.id === $scope.project_details.id){
      $scope.project_details.deadline_date = data.deadline_date;
      $scope.project_details.deadline_time = data.deadline_time;
      if($scope.project_details.deadline_time !== null){
       var time = $scope.project_details.deadline_time.split(":");
       var x = new Date();
       x.setHours(time[0]);
       x.setMinutes(time[1]);
       $scope.project_details.deadline_time = $filter('date')(x.getTime(), 'hh:mm a');
      }
    }
  });
  $scope.$on('/updatecollaborator', function(event, data){
    var exist_user = filterFilter(data.del_users, {id : getCookie('userid')})[0];
    if(exist_user !== undefined){
     var confirm = $mdDialog.confirm()
      .title('Information')
      .textContent('You were removed from this project.')
      .ariaLabel('Lucky day')
      .targetEvent(event)
      .ok('Ok');
     $mdDialog.show(confirm).then(function(){
      $state.go('projects');
     }, function(){})
    } else {
      if(data.id === $scope.project_details.id){
        $scope.project_details.collaborators = $scope.project_details.collaborators.filter(function(collab){
           var exist_user = filterFilter(data.del_users, {id : collab.id})[0];
           return exist_user === undefined;
        });
        if(data.add_users.length > 0){
          for(var i = 0; i < data.add_users.length; i++){
            var test = filterFilter($scope.project_details.collaborators, {id : data.add_users[i].id})[0];
            if(test === undefined){
              $scope.project_details.collaborators.push(filterFilter(list_users , {id : data.add_users[i].id})[0]);
            }
          }
         }
        }
      }
  });
  
  $scope.$on('/deleteproject', function(event, data){
    if(data.id === $scope.project_details.id){
     var confirm = $mdDialog.confirm()
            .title('Information')
            .textContent('This project has been deleted.')
            .ariaLabel('Lucky day')
            .targetEvent(event)
            .ok('Ok');
      $mdDialog.show(confirm).then(function(){
        $state.go('projects');
      }, function(){})
    }  
  });
  $scope.$on('/updateuserinfo', function(event, data){
    if($scope.user_details.id === data.id){
      $scope.user_details._upper = data.first_name.charAt(0).toUpperCase() + data.first_name.slice(1);
      $scope.user_details._upperfull = data.first_name.charAt(0).toUpperCase() + data.first_name.slice(1) + ' ' + data.last_name.charAt(0).toUpperCase() + data.last_name.slice(1);
      if(data.profpic_path !== undefined){
        $scope.user_details.profpic_path = data.profpic_path;
      }
    }
      
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
}]);

