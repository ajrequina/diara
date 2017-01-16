

app.controller("ProjectDetailsController", ['$rootScope', '$scope', '$state', '$location', 'Flash','$http','$filter','$mdDialog','$window','filterFilter','$document','$uibModal','HTTPFactory','DataService','MiscService','ProjectService','TaskService','socket','Notification','$timeout',
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
  $scope.project_details = {};
  $scope.order = "-create_date";
  $scope.current_filter = 'incomplete';

  ///////////////////////////////  FUNCTIONS /////////////////////////////////////////////////
  ctrl.setListTasks = function(){
    $http({
      url : '/listprojecttasks',
      method : 'GET'
    }).then(function(response){
       list_tasks = response.data;
       $scope.users = list_users;
       ctrl.getProjectDetails();
    }, function(response){});
  } 
  ctrl.setListUsers = function(){
    DataService.initUsers()
     .then(function(data){
       list_users = data;
       ctrl.setListAssignments();
    }, function(data){})
  }
  ctrl.setListAssignments = function(){
     DataService.initAssignments()
     .then(function(data){
     list_assignments = data;
     ctrl.setListProjects();
     }, function(data){})
  }
  ctrl.setListProjects = function(){
    DataService.initProjects()
    .then(function(data){
      list_projects = data.related;
      ctrl.setListCollabs();
    }, function(data){})
  }
  ctrl.setListCollabs = function(){
    DataService.initCollabs()
     .then(function(data){
      list_collabs = data;
      ctrl.setListTasks();
    }, function(data){})
  }
  ctrl.setNeededData = function(){
    ctrl.setListUsers();
  } 
  ctrl.setNeededData();

  ctrl.getProjectDetails = function(){
    user_id = getCookie('userid');
    var project = JSON.parse($window.localStorage['project']); 
    $scope.project_details = filterFilter(list_projects, {id : project.id})[0];
    $scope.project_details.collaborators = DataService.getCollabById(list_collabs, list_users, project.id);
    ctrl.initProjectDetails();
  }
  ctrl.initProjectDetails = function(){
    ctrl.setProjectTasks();
    if($scope.project_details.deadline_time !== null){
     var time = $scope.project_details.deadline_time.split(":");
     var x = new Date();
     x.setHours(time[0]);
     x.setMinutes(time[1]);
     $scope.project_details.deadline_time = $filter('date')(x.getTime(), 'hh:mm a');
    }

    $scope.project_description = $scope.project_details.description;
    var tasks = filterFilter(list_tasks, {project_id : $scope.project_details.id});
    var count = 0;
    var total = 0;
    for(var i = 0; i < tasks.length; i++){
      if(tasks.complete_date !== null){
        if(tasks[i].rating !== null){
          count++;
          total += tasks[i].rating;
        }
        
      }
    }
    if(count === 0){
      $scope.ave_rating = 0;
    } else {
      $scope.ave_rating = Math.round(total/count);
    }

    ctrl.setStatus();
  }
  ctrl.setProjectTasks = function(){
    ctrl.setTaskListFilter('incomplete');
  }
  ctrl.setProjectTaskDetails = function(task){
    $window.localStorage['task'] = JSON.stringify(task);
  }
  ctrl.setUserDetails = function(user){
    $window.localStorage['user'] = JSON.stringify(user);
  }
  ctrl.setStatus = function(){
    var tasks = filterFilter(list_tasks, {project_id : $scope.project_details.id});
    if($scope.project_details.deadline_date !== null){
      var date = null;
      var deadline_date = $filter('date')($scope.project_details.deadline_date, 'dd-MM-yyyy');
      if($scope.project_details.deadline_time !== null){
        date = new Date($scope.project_details.deadline_date);
      } else {
        date = new Date($scope.project_details.deadline_date);
      }
      var date1 = new Date($scope.project_details.create_date);
      date1 = date1.getTime();
      var now = new Date();
      now = now.getTime();
      if(date.getTime() < now){
        // in progress
        tasks = filterFilter(tasks, {complete_date : null});
        if(tasks.length > 0){
          $scope.status = "Overdue";
        } else {
          $scope.status = "Completed";
        }
      } else {
        tasks = filterFilter(tasks, {complete_date : null});
        if(tasks.length > 0){
          $scope.status = "In Progress";
        } else {
          $scope.status = "Completed";
        }
      }
    } else {
      tasks = filterFilter(tasks, {complete_date : null});
        if(tasks.length > 0){
          $scope.status = "In Progress";
        } else {
          $scope.status = "Completed";
        }
    }
  }
  ctrl.setTaskListFilter = function(filter){
    if(filter === 'incomplete'){
       var tasks = filterFilter(list_tasks, {project_id : $scope.project_details.id});
       for(var i = 0; i < tasks.length; i++){
         tasks[i].assignees = DataService.getAssignmentsById(list_assignments, list_users, tasks[i].id, null);
       }
       tasks = tasks.filter(function(task){
        return task.complete_date === null;
       })
       $scope.current_filter = 'incomplete';
       $scope.project_details.tasks = tasks;
    } else if(filter === 'complete'){
       var tasks = filterFilter(list_tasks, {project_id : $scope.project_details.id});
       for(var i = 0; i < tasks.length; i++){
         tasks[i].assignees = DataService.getAssignmentsById(list_assignments, list_users, tasks[i].id, null);
       }
       tasks = tasks.filter(function(task){
        return task.complete_date !== null;
       })
       $scope.current_filter = 'complete';
       $scope.project_details.tasks = tasks;
    } else if(filter === 'unassigned'){
      var tasks = filterFilter(list_tasks, {project_id : $scope.project_details.id});
       for(var i = 0; i < tasks.length; i++){
         tasks[i].assignees = DataService.getAssignmentsById(list_assignments, list_users, tasks[i].id, null);
       }
      tasks = tasks.filter(function(task){
        return task.assignees.length === 0;
      });

       $scope.current_filter = 'unassigned';
       $scope.project_details.tasks = tasks;
    }
  }

  ///////////// UPDATES ////////////
 ctrl.updateProjectTitle = function(event){
    if(event.which === 13){
      event.preventDefault();
      $scope.project_details.name = MiscService.cleanText($scope.project_details.name);
      if($scope.project_title !== undefined && $scope.project_title !== null){
       $scope.project_title = MiscService.cleanText($scope.project_title);
      }
      if($scope.project_title !== null && $scope.project_title !== undefined && 
         $scope.project_title !== ''   && $scope.project_title.indexOf('{{project_details.name}}') < 0){
          var oldTitle = $scope.project_details.name;
          var old =  $scope.project_details.name;
          $scope.project_details.name = $scope.project_title;
          $scope.project_details.name = MiscService.cleanText($scope.project_details.name);
          var data = {
            projectid : $scope.project_details.id,
            name : $scope.project_details.name.replace(/\s+/g,' ').trim(),
            collaborators : $scope.project_details.collaborators
          };
          ProjectService.updateProjectName(data)
            .then(function mySuccess(response) {
               if(response.data.data !== undefined && old !== $scope.project_details.name){
               DataService.initUsers()
               .then(function(data){
                 var users = data;
                 var project_data = response.data.data;
                 var assigner = filterFilter(users, {id : project_data.userid})[0];
                 var arrNotif = [];
                 for(var i = 0; i < project_data.collaborators.length; i++){
                  if(project_data.collaborators[i].id !== getCookie('userid')){
                   var message = assigner.fullname + " (@" + assigner.username + ") "+ " changed the TITLE of project " + oldTitle.replace(/^[ ]+|[ ]+$/g,'') + " TO " + $scope.project_details.name.replace(/^[ ]+|[ ]+$/g,'');  
                    var d = {
                      type : 'project',
                      message : message.replace(/\s+/g,' ').trim(),
                      typeid : project_data.projectid,
                      operation : 'update',
                      createdate : project_data.editdate,
                      userid : project_data.collaborators[i].id
                    };
                    arrNotif.push(d);  
                  }
                 }
                 var data = {
                   arrNotif : arrNotif
                 };
                $http({
                  url : '/addnotif',
                  method : 'POST', 
                  data : data
                }).then(function(response){
                }, function(response){})
              }, function(data){})
              }
              $scope.getProjectDetails();
            }, function myError(response) {
          });
          
      } else {
        $scope.project_title = $scope.project_details.name;
      }
      if($scope.project_title !== undefined && $scope.project_title !== null){
        $scope.project_title = MiscService.cleanText($scope.project_title);
      }    
    }    
  }
  ctrl.updateProjectDescription= function(text){
    $scope.project_description = text;
    var old = $scope.project_details.description;
    $scope.project_details.description = $scope.project_description;
    var data = {
      projectid : $scope.project_details.id,
      description : $scope.project_details.description,
      collaborators : $scope.project_details.collaborators
    };
    
    ProjectService.updateProjectDescription(data)
      .then(function mySuccess(response) {
      if(response.data.data !== undefined && old !== $scope.project_details.description){
           DataService.initUsers()
           .then(function(data){
             var users = data;
             var project_data = response.data.data;
             var assigner = filterFilter(users, {id : project_data.userid})[0];
             var arrNotif = [];
             for(var i = 0; i < project_data.collaborators.length; i++){
              if(project_data.collaborators[i].id !== getCookie('userid')){
               var message = assigner.fullname + " (@" + assigner.username + ") "+ " made changes to the description of project " + $scope.project_details.name.replace(/^[ ]+|[ ]+$/g,'');  
                var d = {
                  type : 'project',
                  message : message.replace(/\s+/g,' ').trim(),
                  typeid : project_data.projectid,
                  operation : 'update',
                  createdate : project_data.editdate,
                  userid : project_data.collaborators[i].id
                };
                arrNotif.push(d);  
              }
             }
             var data = {
               arrNotif : arrNotif
             };
            $http({
              url : '/addnotif',
              method : 'POST', 
              data : data
            }).then(function(response){}, 
               function(response){})
          }, function(data){})
        }
      }, function myError(response) {
    });
  }

  $scope.time = null;
  ctrl.updateProjectDueTime = function(time){
     $scope.time = time;
     if(time !== undefined && time !== null &&  $scope.project_details.deadline_date !== null){
      var old = $filter('date')( $scope.project_details.deadline_time, "h:mm a");
      $scope.project_details.deadline_time = $filter('date')(time, "h:mm a");
      var date = $scope.project_details.deadline_date;
      if($scope.project_date){
        date = $filter('date')($scope.project_date, "dd-MM-yyyy");
      }
      date = $filter('date')(date, "dd-MM-yyyy");
      var t = $filter('date')(time, "HH:mm:ss");
      var data = {
        projectid : $scope.project_details.id,
        deadlinedate: date,
        deadlinetime: t,
        collaborators : $scope.project_details.collaborators
      };
      
      ProjectService.updateProjectDeadline(data)
        .then(function (response) {
           if(response.data.conf){
             if(response.data.data !== undefined && old !== $scope.project_details.deadline_time){
                 DataService.initUsers()
                 .then(function(data){
                   var users = data;
                   var project_data = response.data.data;
                   var assigner = filterFilter(users, {id : project_data.userid})[0]; 
                   var arrNotif = [];
                   for(var i = 0; i < project_data.collaborators.length; i++){
                    if(project_data.collaborators[i].id !== getCookie('userid')){
                     var message = assigner.fullname + " (@" + assigner.username + ") "+ " made changes to the deadline of project " + $scope.project_details.name.replace(/^[ ]+|[ ]+$/g,'');  
                      var d = {
                        type : 'project',
                        message : message.replace(/\s+/g,' ').trim(),
                        typeid : project_data.projectid,
                        operation : 'update',
                        createdate : project_data.editdate,
                        userid : project_data.collaborators[i].id
                      };
                      arrNotif.push(d);  
                    }
                   }
                   var data = {
                     arrNotif : arrNotif
                   };;
                  $http({
                    url : '/addnotif',
                    method : 'POST', 
                    data : data
                  }).then(function(response){
                  }, function(response){})
                }, function(data){})
              }
           }
        }, function (response) {
      });
     }
     
     $scope.isOpen = false;
  }
  ctrl.updateProjectDueDate = function(){
      if($scope.project_date !== undefined){
        var old = $scope.project_details.deadline_date;
        $scope.project_details.deadline_date = $scope.project_date;
        var time = $scope.project_details.deadline_time;
        if($scope.time){
         time = $filter('date')($scope.time, "HH:mm:ss");
        }

        var d = $filter('date')($scope.project_date, "dd-MM-yyyy");
        var data = {
            projectid : $scope.project_details.id,
            deadlinedate: d,
            deadlinetime: time,
            collaborators : $scope.project_details.collaborators
        };
        ProjectService.updateProjectDeadline(data)
          .then(function (response) {
           if(response.data.conf){
              if(response.data.data !== undefined && old !== $scope.project_details.deadline_date){
                 DataService.initUsers()
                 .then(function(data){
                   var users = data;
                   var project_data = response.data.data;
                   var assigner = filterFilter(users, {id : project_data.userid})[0]; 
                   var arrNotif = [];
                   for(var i = 0; i < project_data.collaborators.length; i++){
                    if(project_data.collaborators[i].id !== getCookie('userid')){
                     var message = assigner.fullname + " (@" + assigner.username + ") "+ " made changes to the deadline of project " + $scope.project_details.name.replace(/^[ ]+|[ ]+$/g,'');  
                      var d = {
                        type : 'project',
                        message : message.replace(/\s+/g,' ').trim(),
                        typeid : project_data.projectid,
                        operation : 'update',
                        createdate : project_data.editdate,
                        userid : project_data.collaborators[i].id
                      };
                      arrNotif.push(d);  
                    }
                   }
                   var data = {
                     arrNotif : arrNotif
                   };
                  $http({
                    url : '/addnotif',
                    method : 'POST', 
                    data : data
                  }).then(function(response){
                  }, function(response){})
                }, function(data){})
              }
           }
          }, function (response) {
        });
      }
  }
  $scope.dateOptions = {
    minDate: new Date(),
    startingDay: 7
  };
  $scope.open2 = function() {
    $scope.opened = !$scope.opened;
  };
  ctrl.updateProjectTaskCompletion = function(op, task){
    if(op === 'complete'){
      var proceed = true;
      var subtasks = DataService.getSubtasksById(list_tasks, task.id);
      for(var i = 0; i < subtasks.length; i++){
        if(subtasks[i].complete_date === null){
          proceed = false;
          break;
        }
      }

      if(proceed){
          var rating =  task.rating === null ? "0": task.rating;
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
  ctrl.deleteCollaborator = function(user){
   var confirm = $mdDialog.confirm()
          .title('Warning!')
          .textContent("The task assignments of the collaborator will be also deleted.")
          .ariaLabel('Lucky day')
          .ok('Continue')
          .cancel('Cancel');
    $mdDialog.show(confirm).then(function(){
      var data = {
        prev : [user],
        new : [],
        projectid : $scope.project_details.id
      }
       $http({
         url : '/updatecollaborator',
         data : data,
         method : 'POST'
       }).then(function(response){
          var tasks = filterFilter(list_tasks, {project_id : $scope.project_details.id});
          
          for(var i = 0; i < tasks.length; i++){
            var data = {
              prev : [user],
              new : [],
              projectid : $scope.project_details.id,
              taskid : tasks[i].id,
              subtasks : []
            }
            $http({
              url : '/updateassignee',
              method : 'POST',
              data : data
            }).then(function(response){
            }, function(response){});
          }
          if(response.data.data !== undefined){
             DataService.initUsers()
             .then(function(data){
               var users = data;
               var project_data = response.data.data;
               var assigner = filterFilter(list_users, {id : project_data.userid})[0];
               var arrNotif = [];
               for(var i = 0; i < project_data.prevUsers.length; i++){
                if(project_data.prevUsers[i].id !== getCookie('userid')){
                 var message = assigner.fullname + " (@" + assigner.username + ") "+ " removed you as collaborator on project " + $scope.project_details.name.replace(/^[ ]+|[ ]+$/g,'');  
                  var d = {
                    type : 'project',
                    message : message.replace(/\s+/g,' ').trim(),
                    typeid : project_data.projectid,
                    operation : 'add',
                    createdate : project_data.assigndate,
                    userid : project_data.prevUsers[i].id
                  };
                  arrNotif.push(d);  
                }
               }
               var data = {
                 arrNotif : arrNotif
               };
              $http({
                url : '/addnotif',
                method : 'POST', 
                data : data
              }).then(function(response){
              }, function(response){})
            }, function(data){})
                    
          };
       }, function(response){})
    }, function(){});
  }
  ctrl.addCollaborator = function(user){
      var test = filterFilter($scope.project_details.collaborators, { id : user.id})[0];
      if(test === undefined){
        var data = {
            prev : [],
            new : [user],
            projectid : $scope.project_details.id
        }
           $http({
             url : '/updatecollaborator',
             data : data,
             method : 'POST'
           }).then(function(response){
              if(response.data.data !== undefined){
                 DataService.initUsers()
                 .then(function(data){
                   var users = data;
                   var project_data = response.data.data;
                   var assigner = filterFilter(list_users, {id : project_data.userid})[0];
                   var arrNotif = [];
                   for(var i = 0; i < project_data.newUsers.length; i++){
                    if(project_data.newUsers[i].id !== getCookie('userid')){
                     var message = assigner.fullname + " (@" + assigner.username + ") "+ " added you as collaborator on  " + $scope.project_details.name.replace(/^[ ]+|[ ]+$/g,'');  
                      var d = {
                        type : 'project',
                        message : message.replace(/\s+/g,' ').trim(),
                        typeid : project_data.projectid,
                        operation : 'add',
                        createdate : project_data.assigndate,
                        userid : project_data.newUsers[i].id
                      };
                      arrNotif.push(d);  
                    }
                   }

                   var data = {
                     arrNotif : arrNotif
                   };
                  $http({
                    url : '/addnotif',
                    method : 'POST', 
                    data : data
                  }).then(function(response){
                  }, function(response){})
                }, function(data){})
                        
              }
           }, function(response){})
      }
  }
  var RateTaskModalController = function($scope, $http, $uibModalInstance, Notification){
      var ctrl = this;
      ctrl.close = function() {
        $uibModalInstance.close();
        $rootScope.$broadcast('complete_project_task', { id : $scope.task.id });
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
   ctrl.showCreateTask = function () {
    $window.sessionStorage['project'] = JSON.stringify($scope.project_details);
    var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: '/createprojecttask',
        controller : TaskModalController,
        backdrop  : 'static',
        keyboard  : false
      });
   };
   var TaskModalController = function ($scope, $uibModalInstance, $filter, $http, HTTPFactory, filterFilter, $mdDialog, TaskService, socket, DataService) {
    $scope.assignedUser = [];
    $scope.projects = [];
    $scope.projectDetails = JSON.parse($window.sessionStorage['project']);
    HTTPFactory.getAllProjects()
    .then(function mySuccess(response) {
       var p = response.data;
       $scope.projects = p.related;
     }, function myError(response) {
    });
  
    $scope.collab = [];
    HTTPFactory.getAllCollabs()
    .then(function mySuccess(response) {
       $scope.collab = response.data;
     }, function myError(response) {
    });

    $scope.users = [];
    HTTPFactory.getAllUsers()
     .then(function mySuccess(response) {
      $scope.users = response.data;
      $scope.users.map(function(user){
        var fullname  = user.first_name + ' ' + user.last_name;
        if(!(fullname === null || fullname === undefined )){
          user.fullname = fullname;
          user._lowerTitle = fullname.toLowerCase();
          return user;  
        } else {
          user._lowerTitle = "";
          return user;
        }
      });
     }, function myError(response) {});
    
    
    
    $scope.setUsers = function(){
      $scope.assignedUser = [];
      $scope.userTest = [];
      if($scope.data.project === 'none' || $scope.data.project === ''){
        $scope.assignedUser = [];
      } else {
        $scope.assignedUser = [];
        var b = JSON.parse($scope.data.project);
        var a = filterFilter($scope.collab, {project_id: b.id});
        var d = [];
        for(var i = 0; i < a.length; i++){
          var c = filterFilter($scope.users, {id: a[i].person_id});
          var e = JSON.stringify(c[0]);
          d.push(JSON.parse(e));
        }
        $scope.userTest = d;
      }
    }

    $scope.loadUsers = function(query){
      var users = $scope.projectDetails.collaborators;
      return users.filter(function(user) {
      return user._lowerTitle.indexOf(query.toLowerCase()) != -1 || 
             user.email.indexOf(query) != -1 ||
             user.username.indexOf(query) != -1;
      });

    }

    $scope.setProjectDue = "No Task Deadline";
    $scope.onSetDueChange = function(state){
      if(state){
        $scope.setProjectDue = "Set Task Deadline";
      } else {
        $scope.data.date = null;
        $scope.data.time = null;
        $scope.setProjectDue = "No Task Deadline";
      }
    }
    
    $scope.setAssignment = "No Project Assignment";
    $scope.onSetAssignmentChange = function(state){
      if(state){
        $scope.setAssignment = "Set Project Assignment";
      } else {
        $scope.assignedUser = [];
        $scope.userTest = [];
        $scope.setAssignment = "No Project Assignment";
      }
    }
    $scope.saveTask = function(event) {
     
     if($scope.data.title) {
      if($scope.data.description === undefined || $scope.data.description === null){
        $scope.data.description = "";
      }
      // Date //
      if($scope.data.date === undefined || $scope.data.date === null){
        $scope.data.deadlinedate = null;
      } else {
        $scope.data.date = $filter('date')($scope.data.date, "dd-MM-yyyy");
        $scope.data.deadlinedate = $scope.data.date;
      }
      // Time //
      if($scope.data.time === undefined || $scope.data.time === null){
        $scope.data.deadlinetime = null;
      } else {
        $scope.data.time = $filter('date')($scope.data.time, "HH:mm");
        $scope.data.deadlinetime = $scope.data.time;
      }
      var id = null;
      if($scope.data.project != undefined && $scope.data.project != 'none'){
        var a = JSON.parse($scope.data.project);
        id = a.id;
      }

      var task = {
         title        : $scope.data.title,
         description  : $scope.data.description,
         deadlinedate : $scope.data.deadlinedate,
         deadlinetime : $scope.data.deadlinetime,
         projectid    : $scope.projectDetails.id,
         ptask        : null,
         assignedUser : $scope.assignedUser
      };
      TaskService.save(task)
        .then(function(response){
          $Notification.warning({message: response.data.message, positionY: 'top', positionX: 'right', verticalSpacing: 15});
          if(response.data.data !== undefined){
               DataService.initUsers()
               .then(function(data){
                 var users = data;
                 var task_data = response.data.data;
                 var assigner = filterFilter(users, {id : task_data.userid})[0];
                 var arrNotif = [];
                 for(var i = 0; i < task_data.assignedUsers.length; i++){
                  if(task_data.assignedUsers[i].id !== getCookie('userid')){
                   var message = assigner.fullname + " (@" + assigner.username + ") "+ " assigned you on task " + task_data.title.replace(/^[ ]+|[ ]+$/g,'');  
                    var d = {
                      type : 'task',
                      message : message.replace(/\s+/g,' ').trim(),
                      typeid : task_data.taskid,
                      operation : 'add',
                      createdate : task_data.createdate,
                      userid : task_data.assignedUsers[i].id
                    };
                    arrNotif.push(d);  
                  }
                 }
                 var data = {
                   arrNotif : arrNotif
                 };
                $http({
                  url : '/addnotif',
                  method : 'POST', 
                  data : data
                }).then(function(response){
                }, function(response){})
              }, function(data){})
              }
        },function(response){})
        $uibModalInstance.close();
     }
    };
    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.dateOptions = {
      minDate: new Date(),
      startingDay: 7
    };

    $scope.open2 = function() {
      $scope.opened = !$scope.opened;

    };
    $scope.close2 = function(){
    }
    $scope.setTime = function(str){
      if(str != null){
        str = $filter('date')(str, "h:mm a");
        $scope.data.time = str;
      }
    }

  };
    TaskModalController.$inject = [
         '$scope', '$uibModalInstance', 
         '$filter', '$http', 
         'HTTPFactory', 'filterFilter',
         '$mdDialog', 'TaskService', 'socket', 'DataService'
  ];
  ////////////////// LISTENERS ///////////////////
  $scope.$on('complete_project_task', function(event, data){
    for(var i = 0; i < $scope.project_details.tasks.length; i++){
      if(data.id === $scope.project_details.tasks[i].id){
        var assignees = DataService.getAssignmentsById(list_assignments, list_users, $scope.project_details.tasks[i].id);
        $http({
          url : '/completetask',
          data : { 
              taskid : $scope.project_details.tasks[i].id ,
              assignees : assignees
          },
          method : 'POST'
        }).then(function(response){ 
           Notification.warning({message: response.data.message,  positionY: 'top', positionX: 'right', verticalSpacing: 15});
           if($scope.project_details.tasks[i].project_id !== null){
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
                   var message = doer.fullname + " (@" + doer.username + ") "+ " marked the task " + $scope.project_details.tasks[i].title.replace(/^[ ]+|[ ]+$/g,'') + " as complete ";
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
               // if(creator !== null){
               //  var message = doer.fullname + " (@" + doer.username + ") "+ " marked the subtask " + $scope.tasks[i].title.replace(/^[ ]+|[ ]+$/g,'') + " as complete ";
               //  var d = {
               //    type : 'task',
               //    message : message.replace(/\s+/g,' ').trim(),
               //    typeid : task_data.taskid,
               //    operation : 'update',
               //    createdate : task_data.completedate,
               //    userid : creator
               //  };
               //  arrNotif.push(d);  
               // }
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
     // projects = $filter('orderBy')(projects, '-create_date');
     $scope.projects = projects;
  })
  $scope.$on('/completetask', function(event, data){
    for(var i = 0; i < $scope.project_details.tasks.length; i++){
      if($scope.project_details.tasks[i].id === data.id){
        $scope.project_details.tasks[i].complete_date = data.complete_date; 
        if($scope.current_filter === 'incomplete'){
          $timeout(function(){
            $scope.project_details.tasks = $scope.project_details.tasks.filter(function(task){
              return task.id !== data.id;
            });
          }, 1000);
        }       
        break;
      }
    }

    var tasks = filterFilter(list_tasks, {project_id : $scope.project_details.id});
    for(var j = 0; j < tasks.length; j++){
      if(tasks[i].id === data.id){
        tasks[i].complete_date = data.complete_date;
        break;
      }
    } 
    var count = 0;
    var total = 0;
    for(var i = 0; i < tasks.length; i++){
      if(tasks.complete_date !== null){
        
        if(tasks[i].rating !== null){
          count++;
          total += tasks[i].rating;
        }
        
      }
    }
    if(count === 0){
      $scope.ave_rating = 0;
    } else {
      $scope.ave_rating = Math.round(total/count);
    }
    ctrl.setStatus();
  }); 
  $scope.$on('/incompletetask', function(event, data){
     for(var i = 0; i < $scope.project_details.tasks.length; i++){
      if($scope.project_details.tasks[i].id === data.id){
        $scope.project_details.tasks[i].complete_date = null;
        $timeout(function(){
          $scope.project_details.tasks = $scope.project_details.tasks.filter(function(task){
              return task.id !== data.id;
            });
        }, 1000);
        break;
      }
     }
    var tasks = filterFilter(list_tasks, {project_id : $scope.project_details.id});
    for(var j = 0; j < tasks.length; j++){
      if(tasks[i].id === data.id){
        tasks[i].complete_date = null;
        break;
      }
    } 
    var count = 0;
    var total = 0;
    for(var i = 0; i < tasks.length; i++){
      if(tasks.complete_date !== null){
        
        if(tasks[i].rating !== null){
          count++;
          total += tasks[i].rating;
        }
        
      }
    }
    if(count === 0){
      $scope.ave_rating = 0;
    } else {
      $scope.ave_rating = Math.round(total/count);
    }
     ctrl.setStatus();
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
    if(data.project_id === $scope.project_details.id){
       data.create_date = new Date(data.create_date);
       data.edit_date = new Date(data.create_date);
       data.assignees = data.assigned_users;
       if($scope.current_filter === 'incomplete'){
         $scope.project_details.tasks.push(data);
         $scope.project_details.tasks = $filter('orderBy')($scope.project_details.tasks, $scope.order);
       }
    }
    ctrl.setStatus();
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
      if(data.deadline_time !== null){
        $scope.project_details.deadline_time = data.deadline_time;
        var time = $scope.project_details.deadline_time;
        
        if(time.indexOf('PM') !== -1){
          time = time.substring(0, time.indexOf('PM'));
        } else if(time.indexOf('AM') !== -1){
          time = time.substring(0, time.indexOf('AM'));
        }
        time = time.split(':');
        var x = new Date();
        x.setHours(time[0]);
        x.setMinutes(time[1]);
        $scope.project_details.deadline_time = $filter('date')(x.getTime(), 'hh:mm a');
      }
    }
    ctrl.setStatus();
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
  })
  $scope.$on('/ratetask', function(event, data){
    var tasks = filterFilter(list_tasks, {project_id : $scope.project_details.id});
    var task_exist = filterFilter(tasks, {id : data.id})[0];
    if(task_exist !== undefined){
     $scope.ave_rating += data.rating;
     $scope.ave_rating = Math.round($scope.ave_rating / 2);
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
  //ctrl.setProjects();
}]);

