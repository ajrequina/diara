

app.controller("ProjectsController", ['$rootScope', '$scope', '$state', '$location', 'Flash','$http','$filter','$mdDialog','$window','filterFilter','$document','$uibModal','HTTPFactory','DataService','MiscService','ProjectService','TaskService','socket','Notification',
  function ($rootScope, $scope, $state, $location, Flash,$http, $filter, $mdDialog,$window, filterFilter, $document, $uibModal, HTTPFactory, DataService, MiscService, ProjectService, TaskService, socket, Notification) {
  var ctrl = this;
  $document.title = "Diara - Projects";
  $scope.parentState = {};
  $scope.assignments = [];
  $scope.users = [];
  $scope.projects = [];
  $scope.collab = [];
  $scope.tasks = [];
 
  $scope.initAssignments = function(){
    DataService.initAssignments2()
     .then(function(data){
       $scope.assignments = data;
     }, function(data){})
  }

  $scope.initUsers = function(){
    DataService.initUsers2()
     .then(function(data){
       $scope.users = data;
       console.log(' I am here ... ');

    }, function(data){})
  }
  $scope.initProjects = function(){
    DataService.initProjects2().then(function(data){
       $scope.projects = data.related;
    }, function(data){})
  }
  $scope.initCollabs = function(){
    DataService.initCollabs2()
     .then(function(data){
       $scope.collab = data;
    }, function(data){})
  }

  $scope.dateOptions = {
    minDate: new Date(),
    startingDay: 7
  };

  $scope.open2 = function() {
    $scope.opened = !$scope.opened;
  };
 $scope.openConfirmModal = function () {
  var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: '/createtask',
      controller : modalController
  });
 };
  ///// CREATE PROJECT /////
  self.modalInstance;
 
  $scope.today = new Date();
  $scope.minDate = new Date(
   $scope.today.getFullYear(),
   $scope.today.getMonth(),
   $scope.today.getDate());

  $scope.setProjectDue = "No Project Deadline";
  $scope.onSetDueChange = function(state){
    if(state){
      $scope.setProjectDue = "Set Project Deadline";
    } else {
      $scope.data.date = null;
      $scope.data.time = null;
      $scope.setProjectDue = "No Project Deadline";
    }
  }

  $scope.showCreateTask = function () {
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
    
    $scope.setUserSelection = function(){
      console.log('I am here... ');
      var rem_users = [];
      for(var i = 0; i < $scope.users.length; i++){
        var test = filterFilter($scope.projectDetails.collaborators, {id : $scope.users[i].id})[0];
        if(test === undefined){
          rem_users.push($scop.users[i]);
        }
      }
      $scope.users = rem_users;
      console.log(rem_users);
    }
    $scope.loadUsers = function(query){
      var users = $scope.projectDetails.collaborators;
      console.log($scope.projectDetails.collaborators);
      return $scope.users.filter(function(user) {
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
    
    $scope.setAssignment = "No Task Assignment";
    $scope.onSetAssignmentChange = function(state){
      if(state){
        $scope.setAssignment = "Set Task Assignment";
      } else {
        $scope.assignedUser = [];
        $scope.userTest = [];
        $scope.setAssignment = "No Task Assignment";
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
       console.log(task);
      TaskService.save(task)
        .then(function(response){
          $mdDialog.show(
            $mdDialog.alert()
             .parent(angular.element(document.querySelector('#dialogContainer')))
             .clickOutsideToClose(true)
             .textContent(response.data.message)
             .ok('Ok!')
             .targetEvent(event)
          );
          socket.emit('TASK ADDED');
          socket.emit('PROJECT TASK ADDED');
          $rootScope.$broadcast('PROJECT TASK ADDED');
          if(response.data.data !== undefined){
               DataService.initUsers2()
               .then(function(data){
                 var users = data;
                 var task_data = response.data.data;
                 var assigner = filterFilter(users, {id : task_data.userid})[0];
                 console.log(assigner);
                 console.log(task_data); 
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
                 console.log(arrNotif);
                $http({
                  url : '/addnotif',
                  method : 'POST', 
                  data : data
                }).then(function(response){
                  console.log(response.data);
                  //io.emit('/addnotif', response.data.data);
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
  
  socket.on('PROJECT TASK ADDED', function(){
      $scope.initUsers();
      $scope.initCollabs();
      $scope.initAssignments();
      $scope.initProjects();
      $http({
         method : 'GET',
         url : '/listtasks'
      }).then(function(response){
           DataService.initAssignments2()
           .then(function(data){
             $scope.assignments = data;
             var tasks = response.data.related;
             console.log(tasks);
             tasks = $filter('orderBy')(tasks, '-edit_date');
             tasks = DataService.setTasks($scope.projects, $scope.assignments, $scope.users, tasks);
             $scope.projectDetails.tasks = filterFilter(tasks, {project_id : $scope.projectDetails.id});
             $window.sessionStorage['project'] = JSON.stringify($scope.projectDetails);
             $scope.getProjectDetails();
           }, function(data){})
          
       }, function(response){});
  });
  $scope.$on('PROJECT TASK ADDED', function(){
      $scope.initUsers();
      $scope.initCollabs();
      $scope.initAssignments();
      $scope.initProjects();
      $http({
         method : 'GET',
         url : '/listprojecttasks'
      }).then(function(response){
           DataService.initAssignments2()
           .then(function(data){
             $scope.assignments = data;
             var tasks = response.data;
             tasks = $filter('orderBy')(tasks, '-edit_date');
             tasks = DataService.setTasks($scope.projects,$scope.assignments, $scope.users, tasks);
             $scope.projectDetails.tasks = filterFilter(tasks, {project_id : $scope.projectDetails.id});
             $window.sessionStorage['project'] = JSON.stringify($scope.projectDetails);
             $scope.getProjectDetails();
           }, function(data){})
          
       }, function(response){});
  });

  $scope.setProjectTasks = function(){
    var project = JSON.parse($window.sessionStorage['project']);
    var tasks = DataService.getProjectTasksById($scope.tasks, project.id);
    console.log($scope.tasks);
    project.tasks = tasks;
    $scope.projectDetails = project;
    $window.sessionStorage['project'] = JSON.stringify(project);
    $scope.getProjectDetails();
  }
  TaskModalController.$inject = [
         '$scope', '$uibModalInstance', 
         '$filter', '$http', 
         'HTTPFactory', 'filterFilter',
         '$mdDialog', 'TaskService', 'socket', 'DataService'
  ];
  $scope.showCreateProject = function() {
    var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: '/createproject',
        controller : projectModalController,
        backdrop  : 'static',
        keyboard  : false
    });
  }
  var projectModalController = function ($scope, $uibModalInstance, $filter, $http, HTTPFactory, filterFilter, $mdDialog, DataService) {
    $scope.collaborators = [];
    $scope.assignedUser = [];
    $scope.projects = [];
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
      console.log($scope.users);
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
    $scope.loadUsers = function(query){
      var id = getCookie('userid');
      return $scope.users.filter(function(user) {
        return (user._lowerTitle.indexOf(query.toLowerCase()) != -1 || 
               user.email.indexOf(query) != -1 ||
               user.username.indexOf(query) != -1) &&
               user.id.indexOf(id) == -1;
      });
    }; 
    $scope.setCollaborator = "No Project Collaborators";
    $scope.onSetCollabChange = function(state){
      if(state){
          $scope.setCollaborator = "Add Project Collaborators";
      } else {
          $scope.collaborators = [];
          $scope.setCollaborator = "No Project Collaborators";
      } 
    }
    $scope.saveProject = function(){
    if($scope.data.title !== undefined && $scope.data.title !== null && $scope.data.title !== ''){

      // Description //
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
   //   console.log($scope.collaborators);
      var b = getCookie('userid');
      var a = filterFilter($scope.users, {id: b});
      console.log(a);
      $scope.collaborators.push(a[0]);
    //  console.log($scope.collaborators);
      var project = {'title' : $scope.data.title,
                      'description' : $scope.data.description,
                      'deadlinedate' : $scope.data.deadlinedate,
                      'deadlinetime' : $scope.data.deadlinetime,
                      'collaborators' : $scope.collaborators
                    }
      console.log(project);  
      $scope.cancel();    
      $http({
        method : 'POST',
        url : '/createproject',
        data : project
      }).then(function mySuccess(response){
          $scope.cancel();
          $mdDialog.show(
            $mdDialog.alert()
             .parent(angular.element(document.querySelector('#dialogContainer')))
             .clickOutsideToClose(true)
             .textContent(response.data.message)
             .ok('Ok!')
             .targetEvent(event)
          );
          $rootScope.$broadcast('PROJECT ADDED');
          if(response.data.data !== undefined){
               DataService.initUsers2()
               .then(function(data){
                 var users = data;
                 var project_data = response.data.data;
                 var assigner = filterFilter(users, {id : project_data.userid})[0];
                 var arrNotif = [];
                 for(var i = 0; i < project_data.collaborators.length; i++){
                  if(project_data.collaborators[i].id !== getCookie('userid')){
                   var message = assigner.fullname + " (@" + assigner.username + ") "+ " added you as collaborator to " + project_data.title.replace(/^[ ]+|[ ]+$/g,'');  
                    var d = {
                      type : 'project',
                      message : message.replace(/\s+/g,' ').trim(),
                      typeid : project_data.projectid,
                      operation : 'add',
                      createdate : project_data.createdate,
                      userid : project_data.collaborators[i].id
                    };
                    arrNotif.push(d);  
                  }
                 }
                 var data = {
                   arrNotif : arrNotif
                 };
                 console.log(arrNotif);
                $http({
                  url : '/addnotif',
                  method : 'POST', 
                  data : data
                }).then(function(response){
                  console.log(response.data);
                  //io.emit('/addnotif', response.data.data);
                }, function(response){})
              }, function(data){})
              }
       }, function myError(response){});
    }};
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
  projectModalController.$inject = [
       '$scope', '$uibModalInstance', 
       '$filter', '$http', 
       'HTTPFactory', 'filterFilter',
       '$mdDialog', 'DataService'
  ];

  
  $scope.close = function(){
    // self.modalInstance.dismiss('cancel');
  }


  var tasks = [];
 
  //////////////////////////
  ////// RETRIEVE /////////
  $scope.projects = [];
  $scope.listProjects = [];
  $scope.order = "";
  $scope.projectDetails = {};
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
  $scope.getListProjects = function(){
   $scope.initUsers();
   $scope.initCollabs();
   $scope.initAssignments();
   $scope.initProjects();
   $http({
     method : 'GET',
     url : '/listtasks'
   }).then(function(response){
      $scope.tasks = response.data.related;
      console.log($scope.tasks);
      $scope.tasks = $filter('orderBy')($scope.tasks, '-edit_date');
      $scope.tasks = DataService.setTasks($scope.projects, $scope.assignments, $scope.users, $scope.tasks);
      console.log($scope.tasks);
      $scope.setProjectList();
   }, function(response){}); 
  }

  $scope.setProjectList = function(){
    $http({
     method : 'GET',
     url : '/listprojects'
    }).then(function(response){
      console.log(response.data);
      $scope.projects = response.data.related;
      $scope.projects = $filter('orderBy')($scope.projects, '-edit_date');
      var userid = getCookie('userid');
      $scope.projects = DataService.setProjects($scope.users,$scope.tasks, $scope.collab, $scope.projects, userid);
    }, function(response){});
  }
  $scope.projectDetails = {};


  $scope.parentState = {
    path : 'projects',
    content : 'Projects'
  };
  $scope.getProjectDetails = function(){
    if($window.sessionStorage['project']){
      $scope.projectDetails = JSON.parse( $window.sessionStorage['project']);
      $scope.initUsers();
      $scope.initCollabs();
      $scope.initAssignments();
      $scope.initProjects();
      $http({
         method : 'GET',
         url : '/listprojecttasks'
      }).then(function(response){
           DataService.initAssignments2()
           .then(function(data){
             $scope.assignments = data;
             var tasks = response.data;
             console.log(tasks);
             tasks = $filter('orderBy')(tasks, '-edit_date');
             tasks = $filter('orderBy')(tasks, 'complete_date');
             console.log(tasks);
             console.log($scope.assignments);
             tasks = DataService.setTasks($scope.projects, $scope.assignments, $scope.users, tasks);
             $scope.projectDetails.tasks = filterFilter(tasks, {project_id : $scope.projectDetails.id});
             if($scope.projectDetails.description){
               $scope.projectDetails.description = MiscService.cleanText($scope.projectDetails.description);
             }
             var a = $scope.projectDetails.collaborators;
             var collab = [];
             var id = getCookie('userid');
             for(var i = 0; i < a.length; i++){
               if(a[i].id !== id){
                 collab.push(a[i]);
              }
             }
             console.log(collab);
             $window.sessionStorage['old-collab'] = JSON.stringify($scope.projectDetails.collaborators);
             console.log(JSON.parse($window.sessionStorage['old-collab']));
             console.log($scope.projectDetails);
             $scope.assignedUser = $scope.projectDetails.collaborators;
             console.log($scope.projectDetails);
           }, function(data){})
       }, function(response){});
   }  
  }
  $scope.setProjectDetails = function(project){
     $window.sessionStorage['project'] = JSON.stringify(project);
     console.log(project);
     $scope.getProjectDetails();
  }
  $scope.showRateTask = function (idx) {
    var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'ratetask-template',
        controller : RateTaskModalController,
        backdrop  : 'static',
        keyboard  : false,
        size :  'sm'
    });
    $window.sessionStorage['item-task-project'] = JSON.stringify($scope.projectDetails.tasks[idx]);
    $window.sessionStorage['index'] = JSON.stringify(idx);
  };
  $scope.$on('SET TO COMPLETE', function(pevent, padata){
     var idx = JSON.parse($window.sessionStorage['index']);
     var date = new Date();
     $scope.projectDetails.tasks[idx].complete_date = "1999-99-99";
     var data = padata.task;
     var d = {
      taskid : data.id
     }
     $http({
      url : '/completetask',
      data : d,
      method : 'POST'
    }).then(function(response){
       //$scope.initTasks();
    }, function(response){});
  })
  var RateTaskModalController = function($scope, $http, $uibModalInstance, Notification){
    $scope.close = function() {
      $uibModalInstance.close();
      var task = JSON.parse($window.sessionStorage['item-task-project']);
      var data = {
         task : task
      };
      $rootScope.$broadcast('SET TO COMPLETE', data);
    };
    $scope.saveRatingOnList = function(){
      
      var data = {
        taskid : $scope.taskDetails.id,
        rating : $scope.rate
      };
      $http({
        url : '/ratetask',
        data : data,
        method : 'POST'
      }).then(function(response){
        console.log(response);
        Notification.warning({message: response.data.message, positionY: 'bottom', positionX: 'left', verticalSpacing: 15});
        $scope.close();
      }, function(response){});
    }

    $scope.setRatingOnDetails = function(){
     $scope.taskDetails = JSON.parse($window.sessionStorage['item-task-project']);
      console.log($scope.taskDetails);
    }

    $scope.setRatingOnList = function(){
      $scope.taskDetails = JSON.parse($window.sessionStorage['item-task']);
      $scope.rate = $scope.taskDetails.rating === null ? 0 : $scope.taskDetails.rating;       
      console.log($scope.taskDetails);
    }
     $scope.saveRatingOnDetails = function(){
      var data = {
        taskid : $scope.taskDetails.id,
        rating : $scope.rate
      };
      $http({
        url : '/ratetask',
        data : data,
        method : 'POST'
      }).then(function(response){
        Notification.warning({message: response.data.message, positionY: 'top', positionX: 'right', verticalSpacing: 15});
        $scope.close();
      }, function(response){
        
      });
      //$uibModalInstance.close();
    }
  }

  RateTaskModalController.inject = ['$uibModalInstance', 'Notification', '$scope', '$http']
  $scope.incompletetaskFromList = function(idx){
    var data = {
        taskid : $scope.projectDetails.tasks[idx].id
    };
    $http({
      url : '/incompletetask',
      data : data,
      method : 'POST'
    }).then(function(response){
        $scope.projectDetails.tasks[idx].complete_date = null;
    }, function(response){});
  }

  $scope.$on('SET PROJECT DETAILS', function(pevent, padata){
     //console.log(padata);
     var id = padata.notifid;
    $scope.initCollabs();
    $scope.initUsers();
    DataService.initProjects2().then(function(data){
       var projects = data.related;
       var proj = filterFilter(projects, {id : id})[0];
       var collab = filterFilter($scope.collab, {project_id : proj.id});
       proj.collaborators = [];
       for(var i = 0; i < collab.length; i++){
        var user = filterFilter($scope.users, {id : collab[i].person_id})[0];
        proj.collaborators.push(user);
       }
       $window.sessionStorage['project'] = JSON.stringify(proj);
       console.log(proj);
       $scope.getProjectDetails();
       $state.go('projectdetails', {}, {reload : true});
    }, function(data){})
  });
  $scope.$on('set_project_details', function(event, data){
    console.log('I am here');
    $scope.setProjectDetailsById(data.id);
  })
  $scope.setProjectDetailsById = function(id){
    $scope.initCollabs();
    $scope.initUsers();
    DataService.initProjects2().then(function(data){
       var projects = data.related;
       var proj = filterFilter(projects, {id : id})[0];
       var collab = filterFilter($scope.collab, {project_id : proj.id});
       proj.collaborators = [];
       for(var i = 0; i < collab.length; i++){
        var user = filterFilter($scope.users, {id : collab[i].person_id})[0];
        proj.collaborators.push(user);
       }
       $window.sessionStorage['project'] = JSON.stringify(proj);
       console.log(proj);
       $scope.getProjectDetails();
       $state.go('projectdetails', {}, {reload : true});
    }, function(data){})
  }

  $scope.getProjectDetails();
  $scope.deleteProject = function(project, event){
    var d = {
      projectid : project.id,
      tasks : project.tasks
    };

    var confirm = $mdDialog.confirm()
        .parent(angular.element(document.querySelector('#dialogContainer')))
        .clickOutsideToClose(true)
        .title('Warning')
        .textContent('All tasks and subtasks will also be deleted.')
        .ariaLabel('Lucky day')
        .targetEvent(event)
        .cancel('Cancel')
        .ok('Continue');
        $mdDialog.show(confirm).then(function() {
          $http({
            method : "POST",
            url : "/deleteproject",
            data : d
          }).then(function (response) {
            console.log(response.data);
            $mdDialog.show(
              $mdDialog.alert()
               .parent(angular.element(document.querySelector('#dialogContainer')))
               .clickOutsideToClose(true)
               .textContent(response.data.message)
               .ok('Ok!')
               .targetEvent(event)
            );
            $scope.getListProjects();
          }, function (response) {});

        }, function() { });

  }
  
  $scope.getProjectDetails = function(){
    $scope.projectDetails = JSON.parse($window.sessionStorage['project']);
  }
  $scope.$on("PROJECT ADDED",function(pevent,padata){
    $scope.getListProjects();
  });

  ///// UPDATE //////////
   $scope.updateProjectTitle = function(event){
    if(event.which === 13){
      event.preventDefault();
      $scope.projectDetails.name = MiscService.cleanText($scope.projectDetails.name);
      if($scope.project_title !== undefined && $scope.project_title !== null){
       $scope.project_title = MiscService.cleanText($scope.project_title);
      }
      if($scope.project_title !== null && $scope.project_title !== undefined && 
         $scope.project_title !== ''   && $scope.project_title.indexOf('{{projectDetails.name}}') < 0){
          var oldTitle = $scope.projectDetails.name;
          var old =  $scope.projectDetails.name;
          $scope.projectDetails.name = $scope.project_title;
          $scope.projectDetails.name = MiscService.cleanText($scope.projectDetails.name);
          $scope.setProjectDetails($scope.projectDetails);
          console.log($scope.project_title);
          var data = {
            projectid : $scope.projectDetails.id,
            name : $scope.projectDetails.name,
            collaborators : $scope.projectDetails.collaborators
          };
          ProjectService.updateProjectName(data)
            .then(function mySuccess(response) {
               if(response.data.data !== undefined && old !== $scope.projectDetails.name){
               DataService.initUsers2()
               .then(function(data){
                 var users = data;
                 var project_data = response.data.data;
                 var assigner = filterFilter(users, {id : project_data.userid})[0];
                 // console.log(assigner);
                 console.log(project_data); 

                 var arrNotif = [];
                 for(var i = 0; i < project_data.collaborators.length; i++){
                  if(project_data.collaborators[i].id !== getCookie('userid')){

                   var message = assigner.fullname + " (@" + assigner.username + ") "+ " changed the TITLE of project " + oldTitle.replace(/^[ ]+|[ ]+$/g,'') + " TO " + $scope.projectDetails.name.replace(/^[ ]+|[ ]+$/g,'');  
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
                 console.log(arrNotif);
                $http({
                  url : '/addnotif',
                  method : 'POST', 
                  data : data
                }).then(function(response){
                  console.log(response.data);
                  //io.emit('/addnotif', response.data.data);
                }, function(response){})
              }, function(data){})
              }
              $scope.getProjectDetails();
            }, function myError(response) {
          });
          
      } else {
        $scope.project_title = $scope.projectDetails.name;
      }
      if($scope.project_title !== undefined && $scope.project_title !== null){
        $scope.project_title = MiscService.cleanText($scope.project_title);
      }    
    }
      
    }

  $scope.updateProjectDescription= function(){
    if($scope.project_description !== undefined && $scope.project_description !== null){
       $scope.project_description = MiscService.cleanText($scope.project_description);
    }
    console.log($scope.project_description);
    if($scope.project_description !== null && $scope.project_description !== undefined 
          && $scope.project_description.indexOf('{{projectDetails.description}}') < 0){
          console.log($scope.project_description);
          var old = $scope.projectDetails.description;
          $scope.projectDetails.description = $scope.project_description;
          $scope.projectDetails.description = MiscService.cleanText($scope.projectDetails.description);
          console.log($scope.projectDetails);
          $scope.setProjectDetails($scope.projectDetails);
          var data = {
            projectid : $scope.projectDetails.id,
            description : $scope.projectDetails.description,
            collaborators : $scope.projectDetails.collaborators
          };

          ProjectService.updateProjectDescription(data)
            .then(function mySuccess(response) {
            if(response.data.data !== undefined && old !== $scope.projectDetails.description){
                 DataService.initUsers2()
                 .then(function(data){
                   var users = data;
                   var project_data = response.data.data;
                   var assigner = filterFilter(users, {id : project_data.userid})[0];
                   console.log(assigner);
                   console.log(project_data); 
                   var arrNotif = [];
                   for(var i = 0; i < project_data.collaborators.length; i++){
                    if(project_data.collaborators[i].id !== getCookie('userid')){

                     var message = assigner.fullname + " (@" + assigner.username + ") "+ " made changes to project " + $scope.projectDetails.name.replace(/^[ ]+|[ ]+$/g,'');  
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
                   console.log(arrNotif);
                  $http({
                    url : '/addnotif',
                    method : 'POST', 
                    data : data
                  }).then(function(response){
                    console.log(response.data);
                    //io.emit('/addnotif', response.data.data);
                  }, function(response){})
                }, function(data){})
              }
              $scope.getProjectDetails();
            }, function myError(response) {
          });
      } else {
        $scope.project_description = $scope.projectDetails.description;
        $scope.project_description = MiscService.cleanText($scope.project_description);
      }
  }

  $scope.time = null;
  $scope.updateProjectDueTime = function(time){
     $scope.time = time;
     console.log($scope.projectDetails);
     if(time !== undefined && time !== null &&  $scope.projectDetails.deadline_date !== null){
      var old = $filter('date')( $scope.projectDetails.deadline_time, "h:mm a");
      $scope.projectDetails.deadline_time = $filter('date')(time, "h:mm a");
      var date = $scope.projectDetails.deadline_date;
      if($scope.project_date){
        date = $filter('date')($scope.project_date, "dd-MM-yyyy");
      }
      date = $filter('date')(date, "dd-MM-yyyy");
      var t = $filter('date')(time, "HH:mm:ss");
      var data = {
        projectid : $scope.projectDetails.id,
        deadlinedate: date,
        deadlinetime: t,
        collaborators : $scope.projectDetails.collaborators
      };
      
      ProjectService.updateProjectDeadline(data)
        .then(function (response) {
           if(response.data.conf){
             if(response.data.data !== undefined && old !== $scope.projectDetails.deadline_time){
                 DataService.initUsers2()
                 .then(function(data){
                   var users = data;
                   var project_data = response.data.data;
                   var assigner = filterFilter(users, {id : project_data.userid})[0];
                   console.log(assigner);
                   console.log(project_data); 
                   var arrNotif = [];
                   for(var i = 0; i < project_data.collaborators.length; i++){
                    if(project_data.collaborators[i].id !== getCookie('userid')){

                     var message = assigner.fullname + " (@" + assigner.username + ") "+ " made changes to project " + $scope.projectDetails.name.replace(/^[ ]+|[ ]+$/g,'');  
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
                   console.log(arrNotif);
                  $http({
                    url : '/addnotif',
                    method : 'POST', 
                    data : data
                  }).then(function(response){
                    console.log(response.data);
                    //io.emit('/addnotif', response.data.data);
                  }, function(response){})
                }, function(data){})
              }
             $scope.setProjectDetails($scope.projectDetails);
           }
        }, function (response) {
      });
     }
     
     $scope.isOpen = false;
    }
    $scope.updateProjectDueDate = function(){
     console.log($scope.project_date);
      if($scope.project_date !== undefined){
        var old = $scope.projectDetails.deadline_date;
        $scope.projectDetails.deadline_date = $scope.project_date;
        var time = $scope.projectDetails.deadline_time;
        if($scope.time){
         time = $filter('date')($scope.time, "HH:mm:ss");
        }

        var d = $filter('date')($scope.project_date, "dd-MM-yyyy");
        var data = {
            projectid : $scope.projectDetails.id,
            deadlinedate: d,
            deadlinetime: time,
            collaborators : $scope.projectDetails.collaborators
        };
        ProjectService.updateProjectDeadline(data)
          .then(function (response) {
           if(response.data.conf){
              if(response.data.data !== undefined && old !== $scope.projectDetails.deadline_date){
                 DataService.initUsers2()
                 .then(function(data){
                   var users = data;
                   var project_data = response.data.data;
                   var assigner = filterFilter(users, {id : project_data.userid})[0];
                   console.log(assigner);
                   console.log(project_data); 
                   var arrNotif = [];
                   for(var i = 0; i < project_data.collaborators.length; i++){
                    if(project_data.collaborators[i].id !== getCookie('userid')){

                     var message = assigner.fullname + " (@" + assigner.username + ") "+ " made changes to project " + $scope.projectDetails.name.replace(/^[ ]+|[ ]+$/g,'');  
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
                   console.log(arrNotif);
                  $http({
                    url : '/addnotif',
                    method : 'POST', 
                    data : data
                  }).then(function(response){
                    console.log(response.data);
                    //io.emit('/addnotif', response.data.data);
                  }, function(response){})
                }, function(data){})
              }
             $scope.setProjectDetails($scope.projectDetails);
           }
          }, function (response) {
        });
      }
    }

    $scope.updateCollaborators = function(){
      var id = $scope.projectDetails.id;
      var old_collabs = JSON.parse($window.sessionStorage['old-collab']);
      var new_collabs = $scope.assignedUser;

      var del_collabs = [];
      var add_collabs = [];

      for(var i = 0; i < old_collabs.length; i++){
       var collab = filterFilter(new_collabs, {id : old_collabs[i].id})[0];
       if(collab === undefined){
         del_collabs.push(old_collabs[i]);
       }
      }
      if(old_collabs !== undefined){
        for(var i = 0; i < new_collabs.length; i++){
         var collab = filterFilter(old_collabs, {id : new_collabs[i].id})[0];
         if(collab === undefined){
           add_collabs.push(new_collabs[i]);
         }
        }
      } else {
        add_collabs = new_collabs;
      }
      var updated_collab = {
        prev : del_collabs,
        new  : add_collabs,
        projectid : id
      }
      console.log(updated_collab);
      $http({
        url : '/updatecollaborator',
        method : 'POST',
        data : updated_collab
      }).then(function(response){
         // Notification.warning({message: response.data.message, positionY: 'top', positionX: 'right', verticalSpacing: 15});
          var notifresponse = response;
          $scope.initUsers();
            $scope.initCollabs();
            $scope.initAssignments();
            $http({
               method : 'GET',
               url : '/listtasks'
            }).then(function(response){
                 $scope.initProjects();
                 DataService.initAssignments2()
                 .then(function(data){
                  console.log('I am here');
                   var project = JSON.parse($window.sessionStorage['project']);
                   $scope.assignments = data;
                   var tasks = response.data.related;
                   tasks = $filter('orderBy')(tasks, '-edit_date');
                   $scope.projectDetails.tasks = DataService.setTasks($scope.projects, $scope.assignments, $scope.users, tasks);
                   $scope.projectDetails.collaborators = $scope.assignedUser;
                   $window.sessionStorage['old-collab'] = JSON.stringify($scope.assignedUser);
                   $window.sessionStorage['project'] = JSON.stringify($scope.projectDetails);
                   $scope.getProjectDetails();
                    if(notifresponse.data.data !== undefined){
                       DataService.initUsers2()
                       .then(function(data){
                         var users = data;
                         var project_data = notifresponse.data.data;
                         var assigner = filterFilter(users, {id : project_data.userid})[0];
                         var arrNotif = [];
                         for(var i = 0; i < project_data.newUsers.length; i++){
                          if(project_data.newUsers[i].id !== getCookie('userid')){
                           var message = assigner.fullname + " (@" + assigner.username + ") "+ " added you as collaborator on  " + $scope.projectDetails.name.replace(/^[ ]+|[ ]+$/g,'');  
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
                         for(var i = 0; i < project_data.prevUsers.length; i++){
                          if(project_data.prevUsers[i].id !== getCookie('userid')){

                           var message = assigner.fullname + " (@" + assigner.username + ") "+ " removed you as collaborator on  " + $scope.projectDetails.name.replace(/^[ ]+|[ ]+$/g,'');  
                            var d = {
                              type : 'project',
                              message : message.replace(/\s+/g,' ').trim(),
                              typeid : project_data.projectid,
                              operation : 'delete',
                              createdate : project_data.assigndate,
                              userid : project_data.prevUsers[i].id
                            };
                            arrNotif.push(d);  
                          }
                         }

                         var data = {
                           arrNotif : arrNotif
                         };
                         console.log(arrNotif);
                        $http({
                          url : '/addnotif',
                          method : 'POST', 
                          data : data
                        }).then(function(response){
                          console.log(response.data);
                          //io.emit('/addnotif', response.data.data);
                        }, function(response){})
                      }, function(data){})
                      }
                   
                 }, function(data){})
                
             }, function(response){});
      }, function(response){})
      
    //  $window.sessionStorage['old-project'] = JSON.stringify($scope.data.project);
      
    }
    $scope.assignedUser = [];
    $scope.users = [];
    
    $scope.userTest = [];
     $scope.setUsers = function(){
       DataService.initUsers2()
      .then(function(data){
         var a =  $scope.projectDetails.collaborators;
         if(a){
           var id = getCookie('userid');
           var collab = [];
           for(var i = 0; i < a.length; i++){
             if(a[i].id !== id){
              collab.push(a[i]);
             }
           }
           $scope.assignedUser = collab;
           $scope.users = data;
           $scope.userTest = $scope.users;
         }
      }, function(data){})
    }
    $scope.setUsers();
    $scope.deleteCollaborator = function(user){
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
            projectid : $scope.projectDetails.id
          }
           $http({
             url : '/updatecollaborator',
             data : data,
             method : 'POST'
           }).then(function(response){
              if(response.data.data !== undefined){
                $scope.projectDetails.collaborators.pop(user);
              }
           }, function(response){})
        }, function(){});
    }
    $scope.addCollaborator = function(user){
      var test = filterFilter($scope.projectDetails.collaborators, { id : user.id})[0];
      if(test === undefined){
        var data = {
            prev : [],
            new : [user],
            projectid : $scope.projectDetails.id
        }
           $http({
             url : '/updatecollaborator',
             data : data,
             method : 'POST'
           }).then(function(response){
              if(response.data.data !== undefined){
                $scope.projectDetails.collaborators.push(user);
            var notifresponse = response;
            $scope.initUsers();
              $scope.initCollabs();
              $scope.initAssignments();
              $http({
                 method : 'GET',
                 url : '/listtasks'
              }).then(function(response){
                   $scope.initProjects();
                   DataService.initAssignments2()
                   .then(function(data){
                     var project = JSON.parse($window.sessionStorage['project']);
                     $scope.assignments = data;
                     var tasks = response.data.related;
                     tasks = $filter('orderBy')(tasks, '-edit_date');
                     $scope.projectDetails.tasks = DataService.setTasks($scope.projects, $scope.assignments, $scope.users, tasks);
                     $scope.projectDetails.collaborators = $scope.assignedUser;
                     $window.sessionStorage['old-collab'] = JSON.stringify($scope.assignedUser);
                     $window.sessionStorage['project'] = JSON.stringify($scope.projectDetails);
                     $scope.getProjectDetails();
                      if(notifresponse.data.data !== undefined){
                         DataService.initUsers2()
                         .then(function(data){
                           var users = data;
                           var project_data = notifresponse.data.data;
                           var assigner = filterFilter(users, {id : project_data.userid})[0];
                           var arrNotif = [];
                           for(var i = 0; i < project_data.newUsers.length; i++){
                            if(project_data.newUsers[i].id !== getCookie('userid')){
                             var message = assigner.fullname + " (@" + assigner.username + ") "+ " added you as collaborator on  " + $scope.projectDetails.name.replace(/^[ ]+|[ ]+$/g,'');  
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
                           for(var i = 0; i < project_data.prevUsers.length; i++){
                            if(project_data.prevUsers[i].id !== getCookie('userid')){

                             var message = assigner.fullname + " (@" + assigner.username + ") "+ " removed you as collaborator on  " + $scope.projectDetails.name.replace(/^[ ]+|[ ]+$/g,'');  
                              var d = {
                                type : 'project',
                                message : message.replace(/\s+/g,' ').trim(),
                                typeid : project_data.projectid,
                                operation : 'delete',
                                createdate : project_data.assigndate,
                                userid : project_data.prevUsers[i].id
                              };
                              arrNotif.push(d);  
                            }
                           }

                           var data = {
                             arrNotif : arrNotif
                           };
                           console.log(arrNotif);
                          $http({
                            url : '/addnotif',
                            method : 'POST', 
                            data : data
                          }).then(function(response){
                            console.log(response.data);
                            //io.emit('/addnotif', response.data.data);
                          }, function(response){})
                        }, function(data){})
                        }
                     
                   }, function(data){})
                
             }, function(response){});
              }
           }, function(response){})
      }
    }
    $scope.loadUsers = function(query){
      $scope.userTest = $scope.users;
      var id = getCookie('userid');
      var b = $scope.userTest.filter(function(user) {
             return user._lowerTitle.indexOf(query.toLowerCase()) != -1 || 
               user.email.indexOf(query) != -1 ||
                user.username.indexOf(query) != -1 
      });
      return b;
    }
    $scope.selectedDelete = [];
    $scope.selectToDeleteTask = function(task, index){
      if(task.selected){
        $scope.selectedDelete.push(task);
      } else {
        $scope.selectedDelete.pop(task);  
        
      }
    }
    $scope.deleteSelectedTasks = function(){
      if($scope.selectedDelete.length > 0){
        // var subtask_no = 0;
        // var task_no = $scope.selectedDelete.length === undefined ? 0 : $scope.selectedDelete.length;
        // if(!$scope.select_all){
        //  for(var i = 0; i < $scope.selectedDelete.length; i++){
        //   var subtasks = DataService.getSubtasksById($scope.tasks, $scope.selectedDelete[i].id);
        //   subtask_no += subtasks.length;
        //   for(var j = 0; j < subtasks.length; j++){
        //     $scope.selectedDelete.push(subtasks[j]);
        //   } 
        //  }
        // }
        console.log($scope.selectedDelete.length);
        var content = null;
        if($scope.selectedDelete.length > 1){
          content = $scope.selectedDelete.length + ' tasks will be deleted.'
        } else {
          content = $scope.selectedDelete.length + ' task will be deleted.'
        }
        var confirm = $mdDialog.confirm()
            .parent(angular.element(document.querySelector('#dialogContainer')))
            .clickOutsideToClose(false)
            .title('Are you sure?')
            .textContent(content)
            .ariaLabel('Lucky day')
            .targetEvent(event)
            .cancel('Cancel')
            .ok('Continue');
        $mdDialog.show(confirm).then(function() {
         for(var i = 0; i < $scope.selectedDelete.length; i++){
          $scope.deleteSelectedTask($scope.selectedDelete[i]);
         }
         console.log($scope.selectedDelete);
         var b = [];
         for(var i = 0; i < $scope.projectDetails.tasks.length; i++){
          var a = filterFilter($scope.selectedDelete, {id : $scope.projectDetails.tasks[i].id})[0];
          if(a === undefined){
            b.push($scope.projectDetails.tasks[i]);
          }
         }
         $scope.projectDetails.tasks = b;
         $window.sessionStorage['project'] = JSON.stringify($scope.projectDetails);
         console.log($scope.projectDetails);
         $scope.getProjectDetails();   
        }, function() { 
          $scope.selectedDelete = [];
          for(var i = 0; i < $scope.projectDetails.tasks.length; i++){
            $scope.projectDetails.tasks[i].selected = false;
          }
        });
      }

    }

    $scope.deleteSelectedTask = function(task){
      var data = {
        taskid : task.id
      };
      TaskService.deleteTask(data)
        .then(function(response){
           var result = response.data.message;
        }, function(response){});
    }
}]);

