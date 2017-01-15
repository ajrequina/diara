var app = angular.module('Diara', ['ui.router', 'ui.bootstrap', 'flash','ngMaterial', 'ngMessages','ngCookies', 'route','angularModalService', 'ngSanitize', 'ngAnimate','ngTagsInput','moment-picker','angularMoment',"xeditable", 'ui-notification','ngCookies','ngDesktopNotification', 'base64', 'ngFileSaver', "xeditable",  'zingchart-angularjs' ]);
app.config(function(NotificationProvider, $locationProvider, desktopNotificationProvider) {
        NotificationProvider.setOptions({
            delay: 10000,
            maxCount : 3
        });
        desktopNotificationProvider.config({
         autoClose: false,
         duration : 20
      });

    });
app.constant('HOST', {
  site : 'http://localhost:1532/'
});
app.run(function(editableOptions) {
  editableOptions.theme = 'bs3';
});
app.controller("MainController", ['$rootScope', '$scope', '$state', '$location', 'Flash', '$mdDialog','$http','$uibModal','HTTPFactory','filterFilter','DataService','socket','MiscService','$filter','Notification','desktopNotification','HOST','$timeout', '$q', '$log','$window',
  function ($rootScope, $scope, $state, $location, Flash, $mdDialog, $http, $uibModal, HTTPFactory, filterFilter, DataService, socket, MiscService, $filter, Notification, desktopNotification, HOST,$timeout, $q, $log, $window) {  
  socket.removeAllListeners();
  var list_users = [];
  $scope.have_unread = false;
   $scope.initNotifications = function(){
    $http({
      url : '/listnotifs',
      method : 'POST'
    }).then(function(response){
       $scope.notifications = response.data;
    }, function(response){});
   }

  $scope.initComments = function(){
    $http({
      url : '/listtaskcomments',
      method : 'POST'
    }).then(function(response){
       $scope.notifications = response.data;
    }, function(response){});
   }
   
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
  
    ctrl.sideBar = function (value) {
        if($(window).width()<=767){
          if ($("body").hasClass('sidebar-open'))
              $("body").removeClass('sidebar-open');
          else{
              $("body").addClass('sidebar-open');
              $("#profpic").removeClass('profile-img-collapsed');
              $("#profpic").addClass('profile-img');
          }
        }
        else {
            if(value==1){
              if ($("body").hasClass('sidebar-collapse')){
                  $("body").removeClass('sidebar-collapse');
                  $("#profpic").removeClass('profile-img-collapsed');
                  $("#profpic").addClass('profile-img');
                  
              }
              else{
                  $("body").addClass('sidebar-collapse');
                  $("#profpic").removeClass('profile-img');
                  $("#profpic").addClass('profile-img-collapsed');
              }
            }

        }
    };

     
    var list_comments = [];
    var list_tasks = [];
    var list_projects = [];
    ctrl.setListTasks = function(){
      DataService.initTasks2()
       .then(function(data){
        list_tasks = data.related;
       $rootScope.$broadcast('list_tasks', data);
       }, function(data){});
    } 
    ctrl.setListUsers = function(){
      DataService.initUsers2()
       .then(function(data){
         $rootScope.$broadcast('list_users', data);
      }, function(data){})
    }
    ctrl.setListAssignments = function(){
       DataService.initAssignments2()
       .then(function(data){
        $rootScope.$broadcast('list_assignments', data);
       }, function(data){})
    }
    ctrl.setListProjects = function(){
      DataService.initProjects2()
      .then(function(data){
        list_projects = data.related;
        $rootScope.$broadcast('list_projects', data);
      }, function(data){})
    }
    ctrl.setListCollabs = function(){
      DataService.initCollabs2()
       .then(function(data){
        $rootScope.$broadcast('list_collabs', data);
      }, function(data){})
    }
    ctrl.setListComments = function(){
      $http({
        url : '/listcomments',
        method : 'POST'
      }).then(function(response){
         list_comments = response.data;
      }, function(response){});
    }
    ctrl.setListUsers();
    ctrl.setListComments();
    ctrl.setListTasks();
    ctrl.setListProjects();
    $scope.$on('reset_list_comments', function(){
      ctrl.setListComments();
    });
    $scope.$on('reset_list_tasks', function(){
      ctrl.setListTasks();
    });
    $scope.$on('reset_list_users', function(){
      ctrl.setListUsers();
    });
    $scope.$on('reset_list_assignments', function(){
      ctrl.setListAssignments();
    });
    $scope.$on('reset_list_projects', function(){
      ctrl.setListProjects();
    });
    $scope.$on('reset_list_collabs', function(){
      ctrl.setListCollabs();
    }); 
    $scope.$on('get_list_tasks', function(){
      ctrl.setListTasks();
    });
    $scope.$on('get_list_users', function(){
      ctrl.setListUsers();
    });
    $scope.$on('get_list_assignments', function(){
      ctrl.setListAssignments();
    })
    $scope.$on('get_list_projects', function(){
      ctrl.setListProjects();
    });
    $scope.$on('get_list_collabs', function(){
      ctrl.setListCollabs();
    }); 
    $scope.showCreateTask = function () {
    var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: '/createtask',
        controller : 'TaskModalController',
        backdrop  : 'static',
        keyboard  : true
      });
   };
   $scope.showCreateProject = function() {
    $uibModal.open({
        animation: true,
        templateUrl: '/createproject',
        controller : 'ProjectModalController',
        backdrop  : 'static',
        keyboard  : false
    });
  }
    $scope.$on('list_users', function(event, data){
      $scope.users = data;
      var user = MiscService.getUserId();
      $scope.curr_user = filterFilter($scope.users, {id : user})[0];
      $scope.name = $scope.curr_user.first_name + ' ' + $scope.curr_user.last_name; 
      $scope.username = '@' + $scope.curr_user.username;
      $scope.profpic = $scope.profpic_path;
      $('#profpic1').attr('src', $scope.curr_user.profpic_path + '?' + new Date().getTime());
      $('#profpic2').attr('src', $scope.curr_user.profpic_path + '?'  + new Date().getTime());
    }) 
    $scope.$on('/updateuserinfo', function(event, data){
      if(getCookie('userid') === data.id){
        $scope.name = data.fullname;  
        if(data.profpic_path !== undefined){
          $('#profpic1').attr('src', data.profpic_path + '?' + new Date().getTime());
          $('#profpic2').attr('src', data.profpic_path + '?'  + new Date().getTime());
        }
      }
    })
    //////  CREATE LISTENERS //////
    socket.on('/createtask', function(data){
      var id = getCookie('userid');
      var task = {
        id : data.taskid ,
        project_id : data.projectid ,
        task_id : data.parenttask ,
        title : data.title ,
        create_date : data.createdate , 
        deadline_date : data.deadlinedate ,
        deadline_time : data.deadlinetime , 
        edit_date : data.createdate , 
        complete_date : null ,
        description : data.description ,
        deleted : false ,
        user_id : data.userid ,
        assigned_users : data.assignedUsers 
      };
        $rootScope.$broadcast('/createtask', task);
    });
    socket.on('/createproject', function(data){
      var user_id = getCookie('userid');
      var project = {
        collaborators : data.collaborators ,
        create_date : data.createdate ,
        deadline_time : data.deadlinetime ,
        deadline_date : data.deadlinedate , 
        deleted : false , 
        description : data.description , 
        edit_date : data.createdate , 
        id : data.projectid ,
        name : data.title ,
        user_id : data.userid
      } 
      var user_exist = filterFilter(data.collaborators, {id : getCookie('userid')})[0];
      if(user_exist !== undefined){
        $rootScope.$broadcast('/createproject', project);
      }
    })   
    //////  UPDATE TASK LISTENERS //////
    socket.on('/updatetaskname', function(data){
      var id = getCookie('userid');
      var task = {
        id : data.taskid ,
        title : data.tasktitle ,
        edit_date : data.editdate
      };
      $rootScope.$broadcast('/updatetaskname', task);
       
    });
    socket.on('/updatetaskdesc', function(data){
      var id = getCookie('userid');
      var task = {
        id : data.taskid ,
        description : data.description ,
        edit_date : data.editdate
      }
      $rootScope.$broadcast('/updatetaskdesc', task);
    });
    socket.on('/updatetaskdeadline', function(data){
      var id = getCookie('userid');
      var task = {
        id : data.taskid ,
        edit_date : data.editdate,
        deadline_time : data.deadlinetime,
        deadline_date : data.deadlinedate
      }
      $rootScope.$broadcast('/updatetaskdeadline', task);
    });
    socket.on('/updatetaskassignee', function(data){
      var id = getCookie('userid');
      var task = {
        id : data.taskid ,
        del_users : data.oldUsers,
        add_users : data.newUsers,
        user_id : data.userid,
        project_id : data.projectid,
        subtasks : data.subtasks
      };
      $rootScope.$broadcast('/updatetaskassignee', task);
    });
    socket.on('/completetask', function(data){
      var task = {
        id : data.taskid ,
        complete_date : data.completedate
      };
      $rootScope.$broadcast('/completetask', task);
    });
    socket.on('/incompletetask', function(data){
      var task = {
        id : data.taskid
      }
      $rootScope.$broadcast('/incompletetask', task);
    });
    socket.on('/addattachment', function(data){
      var id = getCookie('userid');
      var files = [];
      for(var i = 0; i < data.pathdirs.length; i++){
        var file = {
          task_id : data.taskid,
          create_date : data.createdate,
          deleted : false,
          filename : data.pathdirs[i],
          name : data.pathdirs[i].replace(/^.*[\\\/]/, '')
        };
        files.push(file);
      }
      var task = {
        files : files,
        task_id : data.taskid
      }
      if(data.userid === id){
        $rootScope.$broadcast('/addattachment', task);
      } else {
        for(var i = 0; i < data.assignees.length; i++){
          if(JSON.parse(data.assignees[i]).id === id && data.userid !== id){
             $rootScope.$broadcast('/addattachment', task);
             break;
          }
        }
      }
    });
    socket.on('/addcomment', function(data){
      var id = getCookie('userid');
      var comment = {
        id : data.commentid ,
        task_id : data.taskid,
        user_id : data.userid,
        comment : data.comment,
        attachment : null,
        comment_date : $filter('date')(new Date(data.createdate), 'MM/dd/yy hh:mm:ss a'),
        edit_date : $filter('date')(new Date(data.createdate), 'MM/dd/yy hh:mm:ss a'),
        deleted : false,
        willEditComment : false
      };
      if(data.userid === id){
        $rootScope.$broadcast('/addcomment', comment);
      } else {
        for(var i = 0; i < data.assignees.length; i++){
          if(data.assignees[i].id === id && data.userid !== id){
             $rootScope.$broadcast('/addcomment', comment);
             break;
          }
        }
      }
    });
    socket.on('/updatecomment', function(data){
      var id = getCookie('userid');
      var comment = {
        id : data.commentid,
        task_id : data.taskid,
        comment : data.comment,
        edit_date : data.editdate
      }
      if(id === data.userid){
        $rootScope.$broadcast('/updatecomment', comment);
      }else {
        for(var i = 0; i < data.assignees.length; i++){
          if(data.assignees[i].id === id && data.userid !== id){
             $rootScope.$broadcast('/updatecomment', comment);
             break;
          }
        }
      }
    });
    socket.on('/deletecomment', function(data){
      var id = getCookie('userid');
      var comment = {
        id : data.commentid
      }
      if(id === data.userid){
        $rootScope.$broadcast('/deletecomment', comment);
      } else {
        for(var i = 0; i < data.assignees.length; i++){
          if(data.assignees[i].id === id && data.userid !== id){
             $rootScope.$broadcast('/deletecomment', comment);
             break;
          }
        }
      }
    });
    socket.on('/updateuserinfo', function(data){
      var user = {
        id : data.userid,
        first_name : data.fname,
        last_name : data.lname,
        fullname : data.fname + ' ' +data.lname,
        profpic_path : data.pathdir,
        info : data.info
      };
      $rootScope.$broadcast('/updateuserinfo', user);
    }); 
    socket.on('/deleteattachment', function(data){
      var id = getCookie('userid');
      var file = {
        task_id : data.taskid,
        filename : data.pathdir
      }
      if(id === data.userid){
        $rootScope.$broadcast('/deleteattachment', file);
      }else {
        for(var i = 0; i < data.assignees.length; i++){
          if(data.assignees[i].id === id && data.userid !== id){
             $rootScope.$broadcast('/deleteattachment', file);
             break;
          }
        }
      }
    });
    socket.on('/ratetask', function(data){
       var task = {
        id : data.taskid,
        rating : data.rate
       };
       $rootScope.$broadcast('/ratetask', task);
    });
    socket.on('/deletetask', function(data){
      var task = {
        id : data.taskid
      }
      $rootScope.$broadcast('/deletetask', task);
    })
    socket.on('/deleteproject', function(data){
      var project = {
        id : data.projectid
      };
      filterFilter(list_projects, {id : data.projectid})[0]
      $rootScope.$broadcast('/deleteproject', project);
    })
    socket.on('/addnotif', function(data){
      var userNotif = filterFilter(data, {user_id : getCookie('userid')});
      for(var i = 0; i < userNotif.length; i++){
         userNotif[i].create_date = $filter('date')(new Date(userNotif[i].create_date), 'MMM d, y hh:mm:ss a');
         $scope.notifications.push(userNotif[i]);
      }
      $scope.notifications = $filter('orderBy')($scope.notifications, '-create_date');
      $scope.showDesktopNotification(userNotif);
     });
    socket.on('/updateprojectname', function(data){
       var project = {
         id : data.projectid,
         name : data.projectname
       };
       $rootScope.$broadcast('/updateprojectname', project);
    })
    socket.on('/updateprojectdesc', function(data){
       var project = {
         id : data.projectid,
         description : data.description
       };
       $rootScope.$broadcast('/updateprojectdesc', project);
    });
    socket.on('/updateprojectdeadline',function(data){
      var project = {
        id : data.projectid,
        deadline_date : data.deadlinedate,
        deadline_time : data.deadlinetime
      }
      $rootScope.$broadcast('/updateprojectdeadline', project);
    });
    socket.on('/updatecollaborator', function(data){
      var project = {
        id : data.projectid,
        del_users : data.prevUsers,
        add_users : data.newUsers
      }
      $rootScope.$broadcast('/updatecollaborator', project);
    });
     $scope.showDesktopNotification = function(userNotif){  
         userNotif = $filter('orderBy')(userNotif, '-create_date');
      $http({
        url : '/listcomments',
        method : 'POST'
      }).then(function(response){
         list_comments = response.data;
        for(var i = 0; i < userNotif.length; i++){
           var type = userNotif[i].type;
           var operation = userNotif[i].operation;
           var task = null;
           if(type === 'comment'){
             task = filterFilter(list_comments, {id : userNotif[i].type_id})[0].task_id;
           } else if(type === 'task') {
             task = userNotif[i].type_id;
           } else if(type === 'project'){
             task = userNotif[i].type_id;
           }
          var idx = userNotif[i].message.indexOf(")");
        
          var notif = userNotif[i];
          var message = userNotif[i].message.substring(idx + 2);
          desktopNotification.show(userNotif[i].message.substring(0,idx + 1), {
            body: message.charAt(0).toUpperCase(0) + message.substring(1).replace(/\s+/g,' ').trim(),
            onClick: function () {  
             window.focus();
              if(type === 'comment'){
        var id = {id : task};
              
         DataService.initAssignments2()
         .then(function(data){
           var assign = data;
            DataService.initTasks2()
             .then(function(data){
               var task = filterFilter(data.related, { id : id.id})[0];
                if(task !== undefined){
                   $window.localStorage['task'] = JSON.stringify(task);
                   $state.go('taskdetails', {}, {reload  : true});
                 } else {
                   var task_exist = filterFilter(assign, {task_id : id.id})[0];
                   if(task_exist === undefined){
                     var confirm = $mdDialog.confirm()
                      .title('Information')
                      .textContent('This task has been deleted.')
                      .ariaLabel('Lucky day')
                      .ok('OK')
                     $mdDialog.show(confirm)
                   } else {
                     var confirm = $mdDialog.confirm()
                      .title('Information')
                      .textContent('You are removed to this task.')
                      .ariaLabel('Lucky day')
                      .ok('OK')
                     $mdDialog.show(confirm)
                   }
                   
                 }
           }, function(data){});
         }, function(data){})
             } else if(type === 'task'){
               var id = {id : task};
                DataService.initAssignments2()
                 .then(function(data){
                   var assign = data;
                    DataService.initTasks2()
                     .then(function(data){
                       var task = filterFilter(data.related, { id :id.id } )[0];
                        if(task !== undefined){
                           $window.localStorage['task'] = JSON.stringify(task);
                           $state.go('taskdetails', {}, {reload  : true});
                         } else {
                           var task_exist = filterFilter(assign, {task_id : id.id})[0];
                           if(task_exist === undefined){
                             var confirm = $mdDialog.confirm()
                              .title('Information')
                              .textContent('This task has been deleted.')
                              .ariaLabel('Lucky day')
                              .ok('OK')
                             $mdDialog.show(confirm)
                           } else {
                             var confirm = $mdDialog.confirm()
                              .title('Information')
                              .textContent('You are removed to this task.')
                              .ariaLabel('Lucky day')
                              .ok('OK')
                             $mdDialog.show(confirm)
                           }
                           
                         }
                   }, function(data){});
                 }, function(data){})
             } else if(type === 'project'){
              var id = {id : task};
              DataService.initCollabs2()
               .then(function(data){
                 var collab = data;
                DataService.initProjects2(data)
                  .then(function(data){
                 var project = filterFilter(data.related, { id : id.id})[0];

                 if(project !== undefined){
                    $window.localStorage['project'] = JSON.stringify(project);
                    $state.go('projectdetails', {}, {reload  : true});
                 } else {
                    var project_exist = filterFilter(collab, {project_id : id.id})[0];
                   if(project_exist === undefined){
                     var confirm = $mdDialog.confirm()
                      .title('Information')
                      .textContent('This project has been deleted.')
                      .ariaLabel('Lucky day')
                      .ok('OK')
                     $mdDialog.show(confirm)
                   } else {
                     var confirm = $mdDialog.confirm()
                      .title('Information')
                      .textContent('You were removed to this project.')
                      .ariaLabel('Lucky day')
                      .ok('OK')
                     $mdDialog.show(confirm)
                   }
                 }
                  }, function(data){});
              }, function(data){})

             }
          
            },
            icon : '/static/images/logo.only.final.png'
          });
       
        }
      }, function(response){});
      
     }
     socket.on('UPDATE USER INFO', function(){
        HTTPFactory.getAllUsers()
       .then(function(response){
         $scope.users = response.data;
         var user = MiscService.getUserId();
         $scope.curr_user = filterFilter($scope.users, {id : user})[0];
       }, function(response){});
     });

    $scope.showSettings= function () {
      var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: '/settings',
          controller : 'SettingsModalController', 
          backdrop  : 'static',
          keyboard  : false
      });
    };

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
  ctrl.setUserDetails = function(){
    var user = filterFilter(list_users, {id : getCookie('userid')})[0];
    $window.localStorage['user'] = JSON.stringify($scope.curr_user);
   }

  /////////////////// LISTENERS  ////////////////
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

  $scope.notificationClicked = function(notif, idx){
     var task = null;
     var type = notif.type;
     if(type === 'comment'){
       $http({
        url : '/listcomments',
        method : 'POST'
      }).then(function(response){
        list_comments = response.data;
        task = filterFilter(list_comments, {id : notif.type_id})[0];
       var d = {
         id : task.task_id
       };
        DataService.initAssignments2()
         .then(function(data){
           var assign = data;
            DataService.initTasks2()
             .then(function(data){
               var task = filterFilter(data.related, { id : d.id})[0];
                if(task !== undefined){
                   $window.localStorage['task'] = JSON.stringify(task);
                   $state.go('taskdetails', {}, {reload  : true});
                 } else {
                   var task_exist = filterFilter(assign, {task_id : d.id})[0];
                   if(task_exist === undefined){
                     var confirm = $mdDialog.confirm()
                      .title('Information')
                      .textContent('This task has been deleted.')
                      .ariaLabel('Lucky day')
                      .ok('OK')
                     $mdDialog.show(confirm)
                   } else {
                     var confirm = $mdDialog.confirm()
                      .title('Information')
                      .textContent('You are removed to this task.')
                      .ariaLabel('Lucky day')
                      .ok('OK')
                     $mdDialog.show(confirm)
                   }
                   
                 }
           }, function(data){});
         }, function(data){})
      }, function(response){});
       
     } else if(type === 'task') {
       if(notif.operation === 'delete'){
         $state.go('tasks', {}, {reload : true});
       } else {
         task = notif.type_id;
         var d = {
           id : task
         };
         DataService.initAssignments2()
         .then(function(data){
           var assign = data;
            DataService.initTasks2()
             .then(function(data){
               var task = filterFilter(data.related, { id : notif.type_id })[0];
                if(task !== undefined){
                   $window.localStorage['task'] = JSON.stringify(task);
                   $state.go('taskdetails', {}, {reload  : true});
                 } else {
                   var task_exist = filterFilter(assign, {task_id : notif.type_id})[0];
                   if(task_exist === undefined){
                     var confirm = $mdDialog.confirm()
                      .title('Information')
                      .textContent('This task has been deleted.')
                      .ariaLabel('Lucky day')
                      .ok('OK')
                     $mdDialog.show(confirm)
                   } else {
                     var confirm = $mdDialog.confirm()
                      .title('Information')
                      .textContent('You are removed to this task.')
                      .ariaLabel('Lucky day')
                      .ok('OK')
                     $mdDialog.show(confirm)
                   }
                   
                 }
           }, function(data){});
         }, function(data){})

       }
     } else if(type === 'project'){
       if(notif.operation === 'delete'){
         $state.go('projects', {}, {reload : true});
       } else {
          task = notif.type_id;
           var d = {
             notifid : task
      };
      DataService.initCollabs2()
       .then(function(data){
         var collab = data;
        DataService.initProjects2(data)
          .then(function(data){
         var project = filterFilter(data.related, { id :  notif.type_id })[0];

         if(project !== undefined){
            $window.localStorage['project'] = JSON.stringify(project);
            $state.go('projectdetails', {}, {reload  : true});
         } else {
            var project_exist = filterFilter(collab, {project_id : notif.type_id})[0];
           if(project_exist === undefined){
             var confirm = $mdDialog.confirm()
              .title('Information')
              .textContent('This project has been deleted.')
              .ariaLabel('Lucky day')
              .ok('OK')
             $mdDialog.show(confirm)
           } else {
             var confirm = $mdDialog.confirm()
              .title('Information')
              .textContent('You were removed to this project.')
              .ariaLabel('Lucky day')
              .ok('OK')
             $mdDialog.show(confirm)
           }
         }
          }, function(data){});
      }, function(data){})

        

            
       }
      
     }
     var d = {notifid : notif.id};
     $http({
       url : '/updatenotif',
       data : d,
       method : 'POST'
     }).then(function(response){
        $scope.notifications[idx].read_date = response.data.data.readdate;
         var unread = filterFilter($scope.notifications, {read_date : null})[0];
         if(unread === undefined){
          $scope.have_unread = false;
         } else {
          $scope.have_unread = true;
         }
     }, function(response){}); 
  }

  ctrl.goToTasks = function(id){

  }
  $scope.notify = function(padata){
    $http({
      url : '/listnotifs',
      method : 'POST'
    }).then(function(response){
       $scope.notifications = response.data;
       for(var i = 0; i < $scope.notifications; i++){
         $scope.notifications[i].create_date = $filter('date')($scope.notifications[i].create_date, 'MMM d, y hh:mm:ss a');
       }
       $scope.notifications = $filter('orderBy')($scope.notifications, '-create_date');
    }, function(response){});
  }
    $scope.$on('NOTIFY',  function(pevent, padata){  
  });
  $scope.getNotifications = function(){
    $http({
      url : '/listnotifs',
      method : 'POST'
    }).then(function(response){
       
       $scope.notifications = response.data;
       for(var i = 0; i < $scope.notifications; i++){
         $scope.notifications[i].create_date = $filter('date')($scope.notifications[i].create_date, 'MMM d, y hh:mm:ss a');
       }
       $scope.notifications = $filter('orderBy')($scope.notifications, '-create_date');
       var unread = filterFilter($scope.notifications, {read_date : null})[0];
       if(unread === undefined){
        $scope.have_unread = false;
       } else {
        $scope.have_unread = true;
       }

    }, function(response){});
  };
  $scope.getNotifications();

    var self = this;

    self.simulateQuery = false;
    self.isDisabled    = false;

    // list of `state` value/display objects
    self.states        = loadAll();
    self.querySearch   = querySearch;
    self.selectedItemChange = selectedItemChange;
    self.searchTextChange   = searchTextChange;

    self.newState = newState;

    function newState(state) {
      alert("Sorry! You'll need to create a Constitution for " + state + " first!");
    }

    // ******************************
    // Internal methods
    // ******************************

    /**
     * Search for states... use $timeout to simulate
     * remote dataservice call.
     */
    function querySearch (query) {
      var results = query ? self.states.filter( createFilterFor(query) ) : self.states,
          deferred;
      if (self.simulateQuery) {
        deferred = $q.defer();
        $timeout(function () { deferred.resolve( results ); }, Math.random() * 1000, false);
        return deferred.promise;
      } else {
        return results;
      }
    }

    function searchTextChange(text) {
      $log.info('Text changed to ' + text);
    }

    function selectedItemChange(item) {
      $log.info('Item changed to ' + JSON.stringify(item));
    }

    /**
     * Build `states` list of key/value pairs
     */
    function loadAll() {
      var allStates = 'Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware,\
              Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana,\
              Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana,\
              Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina,\
              North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina,\
              South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia,\
              Wisconsin, Wyoming';

      return allStates.split(/, +/g).map( function (state) {
        return {
          value: state.toLowerCase(),
          display: state
        };
      });
    }

    /**
     * Create filter function for a query string
     */
    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);

      return function filterFn(state) {
        return (state.value.indexOf(lowercaseQuery) === 0);
      };

    }
}]);

