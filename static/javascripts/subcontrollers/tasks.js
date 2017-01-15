app.controller("TasksController", ['$rootScope', '$scope', '$state', '$location', 'Flash','$http','$window','filterFilter','$filter','HTTPFactory','$uibModal','TaskService','$mdDialog','DataService','MiscService','socket','$mdToast','Notification','FileSaver','$timeout','$window',
  function ($rootScope, $scope, $state, $location, Flash, $http, $window, filterFilter, $filter, HTTPFactory, $uibModal, TaskService, $mdDialog, DataService, MiscService, socket,  $mdToast, Notification, FileSaver, $timeout, $window) {
  /////////////////////////////// CONTROLLER VARIABLES /////////////////////////////////////////
  var list_tasks = [];
  var list_users = [];
  var list_collabs = [];
  var list_assignments = [];
  var list_projects = [];
  $scope.list_projects = [];
  var ctrl = this;
  $scope.tasks = [];s
  $scope.type = "incomplete";
  $scope.list_tasks = [];

  ///////////////////////////////  FUNCTIONS /////////////////////////////////////////////////
  $window.localStorage['task'] = JSON.stringify({id : 1});
  ctrl.setProjectDetails = function(id){
   var project = filterFilter(list_projects, {id : id})[0];
   $window.localStorage['project'] = JSON.stringify(project);
  }
   ctrl.showCreateTask = function () {
    var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: '/createtask',
        controller : 'TaskModalController',
        backdrop  : 'static',
        keyboard  : true
      });
   };
  ctrl.setListTasks = function(){
    DataService.initTasks2()
     .then(function(data){
       list_tasks = data;
       $window.localStorage['task'] = JSON.stringify({id : 2});
       $scope.list_tasks = data;
       ctrl.setTaskList();
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
      $scope.list_projects = data.related;
      list_projects = data.related;
      console.log(list_projects);
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
  ctrl.setTaskList = function(){
    ctrl.setTaskListFilter('incomplete');
  }
  ctrl.setTaskListFilter = function(filter){
    if(filter === 'incomplete'){

      var tasks = DataService.setTasks(list_projects, list_assignments, list_users, list_tasks.related);
      tasks = tasks.filter(function(task){
        var test = filterFilter(task.assignees, {id : getCookie('userid')})[0];
        return test !== undefined && task.complete_date === null;
      })
      console.log(tasks);
    } else if(filter === 'complete'){
      var tasks = DataService.setTasks(list_projects, list_assignments, list_users, list_tasks.related);
      tasks = tasks.filter(function(task){
        var test = filterFilter(task.assignees, {id : getCookie('userid')})[0];
        return test !== undefined && task.complete_date !== null;
      });
      console.log(tasks);
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
  ctrl.setTaskCompletion = function(op, task){
    console.log(task);
    if(op === 'complete'){
      var proceed = true;
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
        console.log('Cant be completed..');
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
  ctrl.setTaskDetails = function(task){
    $window.localStorage['task'] = JSON.stringify(task);
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
          console.log(response);
          Notification.warning({message: response.data.message, positionY: 'top', positionX: 'right', verticalSpacing: 15});
          ctrl.close();
        }, function(response){});
      }
  }
  RateTaskModalController.inject = ['$uibModalInstance', 'Notification', '$scope', '$http']
  $scope.$on('complete_task', function(event, data){
    for(var i = 0; i < $scope.tasks.length; i++){
      if(data.id === $scope.tasks[i].id){
        var assignees = DataService.getAssignmentsById(list_assignments, list_users, $scope.tasks[i].id);
        $http({
          url : '/completetask',
          data : { 
              taskid : $scope.tasks[i].id ,
              assignees : assignees
          },
          method : 'POST'
        }).then(function(response){ 
           Notification.warning({message: response.data.message,  positionY: 'top', positionX: 'right', verticalSpacing: 15});
           if($scope.tasks[i].project_id !== null){
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
                   var message = doer.fullname + " (@" + doer.username + ") "+ " marked the task " + $scope.tasks[i].title.replace(/^[ ]+|[ ]+$/g,'') + " as complete ";
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
                var message = doer.fullname + " (@" + doer.username + ") "+ " marked the subtask " + $scope.tasks[i].title.replace(/^[ ]+|[ ]+$/g,'') + " as complete ";
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
  $scope.$on('/completetask', function(event, data){
    var found = false;
    for(var i = 0; i < $scope.tasks.length; i++){
      if($scope.tasks[i].id === data.id){
        $scope.tasks[i].complete_date = data.complete_date;
        $timeout(function(){
          $scope.tasks = $scope.tasks.filter(function(task){
            return task.id !== data.id;
          });
        }, 1000); 
        found = true;  
        break;
      }
    } 
    if(!found){
      var tasks = DataService.setTasks(list_projects, list_assignments, list_users, list_tasks.related);
      var task = filterFilter(tasks, {id : data.id})[0];
      console.log(task);
      if(task !== undefined){
          task.complete_date = data.complete_date;
          $scope.tasks.push(task);
          $scope.tasks = $filter('orderBy')($scope.tasks, '-create_date');
      }
    }
      
  }); 
  $scope.$on('/incompletetask', function(event, data){
    var found = false;
     for(var i = 0; i < $scope.tasks.length; i++){
      if($scope.tasks[i].id === data.id){
        $scope.tasks[i].complete_date = null;
         $timeout(function(){
          $scope.tasks = $scope.tasks.filter(function(task){
            return task.id !== data.id;
          });
        }, 1000);
        found = true; 
        break;
      }
     }
     if(!found){
      var tasks = DataService.setTasks(list_projects, list_assignments, list_users, list_tasks.related);
      var task = filterFilter(tasks, {id : data.id})[0];
      console.log(task);
      if(task !== undefined){
          task.complete_date = null;
          $scope.tasks.push(task);
          $scope.tasks = $filter('orderBy')($scope.tasks, '-create_date');
      }
    }
 });
 $scope.$on('/createtask', function(event, data){
    var test = filterFilter(data.assigned_users, { id : getCookie('userid')})[0];
    console.log(list_tasks);
    console.log(test);
    if(test !== undefined || getCookie('userid') === data.id){
       DataService.initProjects2()
      .then(function(res){
        list_projects = res.related;
        data.project = DataService.getProjectById(list_projects, data.project_id);
        $scope.tasks.push(data);
         $scope.tasks = $filter('orderBy')($scope.tasks, '-edit_date');
      }, function(data){})  
    }
  });
  $scope.$on('/deletetask', function(event, data){
   $scope.tasks = $scope.tasks.filter(function(task){
    return task.id !== data.id;
   });
   var task = filterFilter(list_tasks, {id : data.id})[0];
   var lower_tasks = DataService.getRelatedLowerTasks(list_tasks, task);
   for(var i = 0; i < lower_tasks.length; i++){
     $scope.tasks = $scope.tasks.filter(function(task){
      return task.id !== lower_tasks[i].id;
     });
   }
  });
  $scope.$on('/updatetaskname', function(event, data){
    for(var i = 0; i < $scope.tasks.length; i++){
      if($scope.tasks[i].id === data.id){
        $scope.tasks[i].title = data.title;
        break;
      }
    }
  });
  $scope.$on('/updatetaskassignee', function(event, data){
    for(var i = 0; i < $scope.tasks.length; i++){
     var exist = filterFilter(data.subtasks, { id : $scope.tasks[i].id })[0];
      if(data.id === $scope.tasks[i].id || exist != undefined){
        var project = filterFilter(list_projects, {id : data.project_id})[0];
        if(project === undefined || project === null){
           $scope.tasks[i].project = undefined;
        } else {
          $scope.tasks[i].project = project;
        }
        var user_deleted = filterFilter(data.del_users, { id : getCookie('userid')})[0];
        if(user_deleted !== undefined){
          $scope.tasks = $scope.tasks.filter(function(task){
             return task.id !== $scope.tasks[i].id;
          });
        }
      
      }
    }
    var exist_user = filterFilter(data.add_users, { id : getCookie('userid')})[0];
    console.log(exist_user);
    if(exist_user !== undefined){
      var tasks = DataService.setTasks(list_projects, list_assignments, list_users, list_tasks.related);
      var task = filterFilter(tasks, {id : data.id})[0];
      console.log(task);
      if(task !== undefined){
          $scope.tasks.unshift(task);
      }
    }
    });
  $scope.$on('/deleteproject', function(event, data){
    $scope.tasks = $scope.tasks.filter(function(task){
      return task.project_id !== data.id;
    });
    list_tasks.related = list_tasks.related.filter(function(task){
      return task.project_id !== data.id;
    })
  });
  $scope.$on('/updateprojectname', function(event, data){
    for(var i = 0; i < $scope.tasks.length; i++){
      if($scope.tasks[i].project_id === data.id){
        $scope.tasks[i].project.name = data.name;
      }
    }
  });
  $scope.$on('/updatecollaborator', function(event, data){
    var exist_user = filterFilter(data.del_users, {id : getCookie('userid')})[0];
    if(exist_user !== undefined){
       $scope.tasks = $scope.tasks.filter(function(task){
        return task.project_id !== data.id;
      });
      list_tasks.related = list_tasks.related.filter(function(task){
        return task.project_id !== data.id;
      })
    }
  })



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

