app.controller('TaskDetailsController', 
	['$rootScope', '$scope', '$state', '$location', 'Flash','$http','$window','filterFilter','$filter','HTTPFactory','$uibModal','TaskService','$mdDialog','DataService','MiscService','socket','$mdToast','Notification','FileSaver',
	 function($rootScope, $scope, $state, $location, Flash, $http, $window, filterFilter, $filter, HTTPFactory, $uibModal, TaskService, $mdDialog, DataService, MiscService, socket,  $mdToast, Notification, FileSaver) {
     
     /////////////////////////////// CONTROLLER VARIABLES /////////////////////////////////////////
    var list_tasks = [];
    var list_users = [];
    var list_collabs = [];
    var list_assignments = [];
    var list_projects = [];
    var user_id = null;
    var task_users = [];
    var ctrl = this;
    ctrl.list_projects = [];
    /////////////////////////////// VIEW VARIABLES //////////////////////////////////////////////
    $scope.task_details = {};
    $scope.assigned_users = [];
    $scope.user = {};
    $scope.task_description = "";
    $scope.task_comments = []; 
    $scope.open_time = false;

     ///////////////////////////////  FUNCTIONS /////////////////////////////////////////////////
    ctrl.setListTasks = function(){
      $http({
        url : '/listprojecttasks',
        method : 'GET'
      }).then(function(response){
         list_tasks = response.data;
          ctrl.getTaskDetails();
      }, function(response){});
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
      $http({
        url : '/listallprojects',
        method : 'GET'
      }).then(function(response){
         list_projects = response.data;
        ctrl.list_projects = response.data;
         ctrl.setListCollabs();
          // ctrl.getTaskDetails();
      }, function(response){});
      // DataService.initProjects2()
      // .then(function(data){
      //   list_projects = data.related;
       

        
      // }, function(data){})
    }
    ctrl.setListCollabs = function(){
      DataService.initCollabs2()
       .then(function(data){
        list_collabs = data;
        ctrl.setListTasks();
      }, function(data){})
    }
    ctrl.setUserDetails = function(user){
    $window.localStorage['user'] = JSON.stringify(user);
   }
    ctrl.setNeededData = function(){
      ctrl.setListUsers();
    }
    ctrl.resetTaskDetails = function(task){
      $window.localStorage['task'] = {};
      $window.localStorage['task'] = JSON.stringify(task);
      ctrl.getTaskDetails();
    }
    ctrl.changeTaskDetails = function(task){
      $window.localStorage['task'] = {};
      $window.localStorage['task'] = JSON.stringify(task);
      $state.go('taskdetails', {}, { reload : true }); 
      ctrl.getTaskDetails();
    } 
    ctrl.getTaskDetails = function(){
      user_id = getCookie('userid');
      var task = JSON.parse($window.localStorage['task']); 
      $scope.task_details = filterFilter(list_tasks, {id : task.id})[0];
      $scope.task_details.subtasks = DataService.getSubtasksById(list_tasks, $scope.task_details.id);
      $scope.task_details.higher_tasks = DataService.getRelatedTasksById(list_tasks, $scope.task_details);
      $scope.task_details.lower_tasks = DataService.getRelatedLowerTasks(list_tasks, $scope.task_details);
      for(var i = 0; i < ctrl.list_projects.length; i++){
        
      }
      $scope.task_details.subtasks = $scope.task_details.subtasks.filter(function(subtask){
        return $scope.task_details.project_id === subtask.project_id;
      });
      $scope.task_details.subtasks = $filter('orderBy')($scope.task_details.subtasks, 'createdate');
      $window.sessionStorage['task'] = null;
      $window.sessionStorage['task'] = JSON.stringify($scope.task_details);
      ctrl.initTaskDetails();
    }
    ctrl.initTaskDetails = function(){
      $window.sessionStorage['old-assignee'] = [];
      $window.sessionStorage['old-project'] = [];
      $scope.user = filterFilter(list_users, {id : user_id})[0];
      $scope.task_description = $scope.task_details.description;

      task_users = DataService.getCollabById(list_collabs, list_users, $scope.task_details.project_id);
      $scope.users = task_users;
      if($scope.task_details.deadline_time !== null){
         var time = $scope.task_details.deadline_time.split(":");
         var x = new Date();
         x.setHours(time[0]);
         x.setMinutes(time[1]);
         $scope.task_details.deadline_time = $filter('date')(x.getTime(), 'hh:mm a');
      }
     
      ctrl.setTaskAssignees();
      ctrl.setTaskRating();
      ctrl.setTaskProject();
      ctrl.setTaskAttachments();
      ctrl.setTaskComments();
    }
    ctrl.setTaskAssignees = function(){
    	var assignees = DataService.getAssignmentsById(list_assignments, list_users, $scope.task_details.id);
	    $scope.task_details.assignees = assignees;
	    $scope.assigned_users = assignees;
      $window.sessionStorage['old-assignee'] = JSON.stringify(assignees);
    }
    ctrl.setTaskComments = function(){
      var data = { taskid : $scope.task_details.id };
       $http({
         method : 'POST',
         data : data ,
         url : '/listtaskcomments'
       }).then(function(response){
          $scope.task_comments = response.data;
          $scope.task_comments = DataService.setTaskComments($scope.task_comments, list_users);
          $scope.task_comments = $filter('orderBy')($scope.task_comments, '-comment_date');
       }, function(response){});
    }
    ctrl.setTaskProject = function(){
    	var project = DataService.getProjectById(list_projects, $scope.task_details.project_id);
    	$window.sessionStorage['old-project'] = JSON.stringify(project); 
	    if(project !== null && project !== undefined){
	      $scope.project_title = project.name;
        $scope.data = {};
	      $scope.data.project = project;
	    } else {
        $scope.data = {};
        $scope.data.project = null;
        $scope.project_title = "Project unspecified";
      }
    }
    ctrl.setTaskAttachments = function(){
    	var data = { taskid : $scope.task_details.id };
     	$http({
        url : '/listattachments',
        data : data,
        method : 'POST'
      }).then(function(response){
        $scope.task_details.attachments =  DataService.setTaskAttachments($scope.task_details, response.data);   
      }, function(response){});
    }
    ctrl.setTaskRating = function(){
      $scope.task_rating =  $scope.task_details.rating === null ? "0": $scope.task_details.rating;
    }
    ctrl.loadUsers = function(query){
      return task_users.filter(function(user) {
        return user._lowerTitle.indexOf(query.toLowerCase()) != -1 || 
               user.email.indexOf(query) != -1 ||
               user.username.indexOf(query) != -1;
      });
    }
    ctrl.setUsers = function(){
      $scope.isOpen2 = true;
      $scope.popoverIsOpen = false;
      var confirm = $mdDialog.confirm()
              .title('Warning!')
              .textContent("Altering task's project will affect its subtasks and their assignees.")
              .ariaLabel('Lucky day')
              .ok('Continue')
              .cancel('Cancel');
      $mdDialog.show(confirm).then(function(){
        task_users = [];

        $scope.assigned_users = [];
        $scope.project_title = $scope.data.project.name;
        task_users = DataService.getCollabById(list_collabs, list_users, $scope.data.project.id);
        $scope.users = task_users;
        var rem_users = [];
        for(var i = 0; i < $scope.task_details.assignees.length; i++){
          var test = filterFilter(task_users, {id : $scope.task_details.assignees[i].id})[0];
          if(test === undefined){
            rem_users.push($scope.task_details.assignees[i]);
          }
        }
        var data = {
          prev : rem_users,
          new : [],
          projectid : $scope.data.project.id,
          taskid : $scope.task_details.id,
          subtasks : $scope.task_details.lower_tasks
        }
        TaskService.updateAssignee(data)
          .then(function(response){
            if(response.data.message.indexOf('error') === -1){
              $scope.task_details.project_id = id;
              if(response.data.data !== undefined){
                var task_data = response.data.data;
                var doer = filterFilter(list_users, {id : task_data.userid})[0];
                var arrNotif = [];
                for(var i = 0; i < task_data.oldUsers.length; i++){
                  if(task_data.oldUsers[i].id !== getCookie('userid')){
                   var message = doer.fullname + " (@" + doer.username + ") "+ " removed you as assignee on task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'') + ' and to its related tasks';  
                    var d = {
                      type : 'task',
                      message : message.replace(/\s+/g,' ').trim(),
                      typeid : task_data.taskid,
                      operation : 'delete',
                      createdate : task_data.assigndate,
                      userid : task_data.oldUsers[i].id
                    };
                    arrNotif.push(d);  
                  }
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
      }, function(){})
    }
    ctrl.setNeededData();   
    /////// COMMENTS ///////
    ctrl.editComment = function(idx){
      $scope.task_comments[idx].willEditComment = !$scope.task_comments[idx].willEditComment;
      if(!$scope.task_comments[idx].willEditComment){
        var data = {
         commentid : $scope.task_comments[idx].id,
         taskid : $scope.task_comments[idx].task_id,
         comment : $scope.task_comments[idx].editedComment,
         oldcomment  : $scope.task_comments[idx].comment,
         assignees : $scope.task_details.assignees
        };
        TaskService.updateComment(data)
         .then(function(response){
           if(response.indexOf('Error') === -1){
            Notification.warning({message: response, positionY: 'top', positionX: 'right', verticalSpacing: 15});
           }
         }, function(response){});
      }
    }
    ctrl.deleteComment = function(comment){
      var data = {
         commentid : comment.id,
         assignees : $scope.task_details.assignees
      };
      TaskService.deleteComment(data)
       .then(function(response){
         Notification.warning({message: response, positionY: 'top', positionX: 'right', verticalSpacing: 15});
       }, function(response){});
    }
    ctrl.addComment = function(){
      if($scope.comment !== ""){
       var data = {
         taskid : $scope.task_details.id,
         comment : $scope.comment,
         assignees : $scope.task_details.assignees
       };
       $http({
         url : '/addcomment',
         data : data,
         method : 'POST'
       }).then(function(response){
          Notification.warning({message: response.data.message, positionY: 'top', positionX: 'right', verticalSpacing: 15});
          $scope.comment = "";
          if(response.data.data !== undefined){
           var comment_data = response.data.data;
           var commentator =  filterFilter(list_users, {id : comment_data.userid})[0];
           var arrNotif = [];
           var creator = $scope.task_details.user_id;
           for(var i = 0; i < comment_data.assignees.length; i++){
              if(creator === comment_data.assignees[i].id ){
                creator = null;
              }
              if(comment_data.assignees[i].id !== getCookie('userid')){
               var message = commentator.fullname + " (@" + commentator.username + ") "+ " commented on task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
                var d = {
                  type : 'comment',
                  message : message.replace(/\s+/g,' ').trim(),
                  typeid : comment_data.commentid,
                  operation : 'add',
                  createdate : comment_data.createdate,
                  userid : comment_data.assignees[i].id
                };
                arrNotif.push(d);  
              }
           }
           if(creator !== null){
            var message = commentator.fullname + " (@" + commentator.username + ") "+ " commented on task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
            var d = {
              type : 'comment',
              message : message.replace(/\s+/g,' ').trim(),
              typeid : comment_data.commentid,
              operation : 'add',
              createdate : comment_data.createdate,
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
       }, function(response){})
      }
    }
    ////// UPDATES //////
    ctrl.updateTaskTitle = function(event){
      if(event.which === 13){
        event.preventDefault();

        $scope.task_details.title = MiscService.cleanText($scope.task_details.title);
        if($scope.task_title !== undefined && $scope.task_title !== null){
         $scope.task_title = MiscService.cleanText($scope.task_title);
        }
        if($scope.task_title !== null && $scope.task_title !== undefined && 
           $scope.task_title !== ''   && $scope.task_title.indexOf('{{task_details.title}}') < 0){
            var oldTitle = MiscService.cleanText($scope.task_details.title);
            $scope.task_details.title = $scope.task_title;
            $scope.task_details.title = MiscService.cleanText($scope.task_details.title);
            var data = {
              taskid : $scope.task_details.id,
              name : $scope.task_details.title.replace(/\s+/g,' ').trim(),
              assignees : $scope.task_details.assignees
            };

            TaskService.updateTaskName(data)
              .then(function (response) {
                if(response.data.data !== undefined){
                   var task_data = response.data.data;
                   var doer = filterFilter(list_users, {id : task_data.userid})[0];
                   var arrNotif = [];
                   for(var i = 0; i < task_data.assignees.length; i++){
                      if(task_data.assignees[i].id !== getCookie('userid')){
                       var message = doer.fullname + " (@" + doer.username + ") "+ " changed the title of task " + oldTitle + " to " + $scope.task_details.title;  
                       var d = {
                          type : 'task',
                          message : message.replace(/\s+/g,' ').trim(),
                          typeid : task_data.taskid,
                          operation : 'update',
                          createdate : task_data.editdate,
                          userid : task_data.assignees[i].id
                       };
                        arrNotif.push(d);  
                      }
                   }
                   $http({
                      url : '/addnotif',
                      method : 'POST', 
                      data : { arrNotif : arrNotif }
                   }).then(function(response){}, 
                           function(response){})
                }
              }, function (response) {});
        } else {
          $scope.task_title = $scope.task_details.title;
        }
        if($scope.task_title !== undefined && $scope.task_title !== null){
          $scope.task_title = MiscService.cleanText($scope.task_title);
        }
      }
    }
    ctrl.updateTaskDescription = function(text){
      $scope.task_description = text;
      var oldDescription = $scope.task_details.description;
      $scope.task_details.description = $scope.task_description;
      var data = {
        taskid : $scope.task_details.id,
        description : $scope.task_details.description,
        assignees : $scope.task_details.assignees
      };
      if(oldDescription !== $scope.task_details.description){
        TaskService.updateTaskDescription(data)
        .then(function (response) {
            if(response.data.data !== undefined && oldDescription !== $scope.task_details.description){
               var task_data = response.data.data;
               var doer = filterFilter(list_users, {id : task_data.userid})[0];
               var arrNotif = [];
               for(var i = 0; i < task_data.assignees.length; i++){
                if(task_data.assignees[i].id !== getCookie('userid')){
                 var message = doer.fullname + " (@" + doer.username + ") "+ " made changes on the description of task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
                  var d = {
                    type : 'task',
                    message : message.replace(/\s+/g,' ').trim(),
                    typeid : task_data.taskid,
                    operation : 'update',
                    createdate : task_data.editdate,
                    userid : task_data.assignees[i].id
                  };
                  arrNotif.push(d);  
                }
               }
              $http({
                url : '/addnotif',
                method : 'POST', 
                data : { arrNotif : arrNotif }
              }).then(function(response){}, 
                      function(response){})
            }
        }, function (response) {});
      }
    }
    ctrl.updateTaskDueDate = function(){
      if($scope.task_date !== undefined){
        var old_date =  $scope.task_details.deadline_date;
        $scope.task_details.deadline_date = $scope.task_date;
        var time = $scope.task_details.deadline_time;
        if($scope.time){
         time = $filter('date')($scope.time, "h:mm a");
        }

        var d = $filter('date')($scope.task_date, "dd-MM-yyyy");
        var data = {
            taskid : $scope.task_details.id,
            deadlinedate: d,
            deadlinetime: time,
            assignees : $scope.task_details.assignees
        };
        TaskService.updateTaskDeadline(data)
          .then(function (response) {
           var result = response.data.conf;
           if(result){
             if(response.data.data !== undefined && old_date !== $scope.task_details.deadline_date){
                   var task_data = response.data.data;
                   var doer = filterFilter(list_users, {id : task_data.userid})[0];
                   var arrNotif = [];
                   for(var i = 0; i < task_data.assignees.length; i++){
                    if(task_data.assignees[i].id !== getCookie('userid')){
                     var message = doer.fullname + " (@" + doer.username + ") "+ " made changes on the deadline of task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
                      var d = {
                        type : 'task',
                        message : message.replace(/\s+/g,' ').trim(),
                        typeid : task_data.taskid,
                        operation : 'update',
                        createdate : task_data.editdate,
                        userid : task_data.assignees[i].id
                      };
                      arrNotif.push(d);  
                    }
                   }
                  $http({
                    url : '/addnotif',
                    method : 'POST', 
                    data : {arrNotif : arrNotif}
                  }).then(function(response){}, 
                        function(response){})
              }
           }
          }, function (response) {
        });
      }
    }
    ctrl.updateTaskDueTime = function(time){
      $scope.time = time;
      $scope.open_time = !$scope.open_time;
      if(time !== undefined && time !== null &&  $scope.task_details.deadline_date !== null){
       var old_time = $filter('date')($scope.task_details.deadline_time, "h:mm a");
       $scope.task_details.deadline_time = $filter('date')(time, "h:mm a");
       var date = $scope.task_details.deadline_date;
       if($scope.task_date){
        date = $filter('date')($scope.task_date, "dd-MM-yyyy");
       }
       date = $filter('date')(date, "dd-MM-yyyy");
       var t = $filter('date')(time, "h:mm a");
       var data = {
         taskid : $scope.task_details.id,
         deadlinedate: date,
         deadlinetime: t,
         assignees : $scope.task_details.assignees
      };
      
      TaskService.updateTaskDeadline(data)
        .then(function mySuccess(response) {
           if(response.data.conf){
             if(response.data.data !== undefined && old_time !== $scope.task_details.deadline_time){
                 var task_data = response.data.data;
                 var doer = filterFilter(list_users, {id : task_data.userid})[0];
                 var arrNotif = [];
                 for(var i = 0; i < task_data.assignees.length; i++){
                  if(task_data.assignees[i].id !== getCookie('userid')){
                   var message = doer.fullname + " (@" + doer.username + ") "+ " made changes on the deadline of task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
                    var d = {
                      type : 'task',
                      message : message.replace(/\s+/g,' ').trim(),
                      typeid : task_data.taskid,
                      operation : 'update',
                      createdate : task_data.editdate,
                      userid : task_data.assignees[i].id
                    };
                    arrNotif.push(d);  
                  }
                 }
                $http({
                  url : '/addnotif',
                  method : 'POST', 
                  data : {arrNotif : arrNotif}
                }).then(function(response){}, 
                        function(response){});
              }
           }
        }, function myError(response) {
      });
     }
    }
    ctrl.deleteTaskAssignee = function(user){
      var id = $scope.data.project === null ? null : $scope.data.project.id;
      var confirm = $mdDialog.confirm()
              .title('Warning!')
              .textContent("The assignee will be also deleted to task's subtasks")
              .ariaLabel('Lucky day')
              .ok('Continue')
              .cancel('Cancel');
      $mdDialog.show(confirm).then(function(){
        var data = {
          prev : [user],
          new : [],
          projectid : id,
          taskid : $scope.task_details.id,
          subtasks : $scope.task_details.lower_tasks
        }
        TaskService.updateAssignee(data)
          .then(function(response){
            if(response.data.message.indexOf('error') === -1){
              $scope.task_details.project_id = id;
              if(response.data.data !== undefined){
                var task_data = response.data.data;
                var doer = filterFilter(list_users, {id : task_data.userid})[0];
                var arrNotif = [];
                for(var i = 0; i < task_data.oldUsers.length; i++){
                  if(task_data.oldUsers[i].id !== getCookie('userid')){
                   var message = doer.fullname + " (@" + doer.username + ") "+ " removed you as assignee on task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
                    var d = {
                      type : 'task',
                      message : message.replace(/\s+/g,' ').trim(),
                      typeid : task_data.taskid,
                      operation : 'delete',
                      createdate : task_data.assigndate,
                      userid : task_data.oldUsers[i].id
                    };
                    arrNotif.push(d);  
                  }
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
      }, function(){})
    }
    ctrl.addTaskAssignee = function(user){
      if(filterFilter($scope.task_details.assignees, { id : user.id})[0] === undefined){
        var id = $scope.data.project === null ? null : $scope.data.project.id;
        var data = {
          prev : [],
          new : [user],
          projectid : id,
          taskid : $scope.task_details.id,
          subtasks : $scope.task_details.lower_tasks
        }
        TaskService.updateAssignee(data)
          .then(function(response){
            if(response.data.message.indexOf('error') === -1){
              $scope.task_details.project_id = id;
              if(response.data.data !== undefined){
                var task_data = response.data.data;
                var doer = filterFilter(list_users, {id : task_data.userid})[0];
                var arrNotif = [];
                for(var i = 0; i < task_data.newUsers.length; i++){
                  if(task_data.newUsers[i].id !== getCookie('userid')){
                   var message = doer.fullname + " (@" + doer.username + ") "+ " assigned you on task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
                    var d = {
                      type : 'task',
                      message : message.replace(/\s+/g,' ').trim(),
                      typeid : task_data.taskid,
                      operation : 'add',
                      createdate : task_data.assigndate,
                      userid : task_data.newUsers[i].id
                    };
                    arrNotif.push(d);  
                  }
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
      }   
    }
    ctrl.updateTaskAssignees = function(){
      var id = $scope.data.project === null ? null : $scope.data.project.id;
      var old_assignees = JSON.parse($window.sessionStorage['old-assignee']);
      var del_assignees = [];
      var new_assignees = $scope.assigned_users;
      var add_assignees = [];

      for(var i = 0; i < old_assignees.length; i++){
       var assignee = filterFilter(new_assignees, {id : old_assignees[i].id})[0];
       if(assignee === undefined){
         del_assignees.push(old_assignees[i]);
       }
      }
      if(old_assignees !== undefined){
        for(var i = 0; i < new_assignees.length; i++){
         var assignee = filterFilter(old_assignees, {id :new_assignees[i].id})[0];
         if(assignee === undefined){
           add_assignees.push(new_assignees[i]);
         }
        }
      } else {
        add_assignees = new_assignees;
      }

      var data = {
        prev : del_assignees,
        new  : add_assignees,
        projectid : id,
        taskid : $scope.task_details.id,
        subtasks : []
      }
      
      if(del_assignees.length > 0){
        var confirm = $mdDialog.confirm()
              .title('Warning!')
              .textContent("The assignees will be also deleted to task's subtasks")
              .ariaLabel('Lucky day')
              .ok('Continue')
              .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
         TaskService.updateAssignee(data)
          .then(function(response){
            if(response.data.message.indexOf('error') === -1){
              $scope.task_details.project_id = id;
              $scope.task_details.assignees = $scope.assigned_users;
              $window.sessionStorage['old-project'] = JSON.stringify($scope.data.project);
              $window.sessionStorage['old-assignee'] = JSON.stringify($scope.assigned_users);
              if(response.data.data !== undefined){
                var task_data = response.data.data;
                var doer = filterFilter(list_users, {id : task_data.userid})[0];
                var arrNotif = [];
                for(var i = 0; i < task_data.newUsers.length; i++){
                  if(task_data.newUsers[i].id !== getCookie('userid')){
                   var message = doer.fullname + " (@" + doer.username + ") "+ " assigned you on task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
                    var d = {
                      type : 'task',
                      message : message.replace(/\s+/g,' ').trim(),
                      typeid : task_data.taskid,
                      operation : 'add',
                      createdate : task_data.assigndate,
                      userid : task_data.newUsers[i].id
                    };
                    arrNotif.push(d);  
                  }
                }
                for(var i = 0; i < task_data.oldUsers.length; i++){
                  if(task_data.oldUsers[i].id !== getCookie('userid')){
                   var message = doer.fullname + " (@" + doer.username + ") "+ " removed you as assignee on task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
                    var d = {
                      type : 'task',
                      message : message.replace(/\s+/g,' ').trim(),
                      typeid : task_data.taskid,
                      operation : 'delete',
                      createdate : task_data.assigndate,
                      userid : task_data.oldUsers[i].id
                    };
                    arrNotif.push(d);  
                  }
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
        }, function(){
          for(var i = 0; i < del_assignees.length; i++){
            $scope.assigned_users.push(del_assignees[i]);
          }
          for(var j = 0; j < add_assignees.length; j++){
            $scope.assigned_users.pop(add_assignees[i]);
          }
        })
      } else {
        TaskService.updateAssignee(data)
          .then(function(response){
            if(response.data.message.indexOf('error') === -1){
              $scope.task_details.project_id = id;
              $scope.task_details.assignees = $scope.assigned_users;
              $window.sessionStorage['old-project'] = JSON.stringify($scope.data.project);
              $window.sessionStorage['old-assignee'] = JSON.stringify($scope.assigned_users);
              if(response.data.data !== undefined){
                var task_data = response.data.data;
                var doer = filterFilter(list_users, {id : task_data.userid})[0];
                var arrNotif = [];
                for(var i = 0; i < task_data.newUsers.length; i++){
                  if(task_data.newUsers[i].id !== getCookie('userid')){
                   var message = doer.fullname + " (@" + doer.username + ") "+ " assigned you on task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
                    var d = {
                      type : 'task',
                      message : message.replace(/\s+/g,' ').trim(),
                      typeid : task_data.taskid,
                      operation : 'add',
                      createdate : task_data.assigndate,
                      userid : task_data.newUsers[i].id
                    };
                    arrNotif.push(d);  
                  }
                }
                for(var i = 0; i < task_data.oldUsers.length; i++){
                  if(task_data.oldUsers[i].id !== getCookie('userid')){
                   var message = doer.fullname + " (@" + doer.username + ") "+ " removed you as assignee on task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
                    var d = {
                      type : 'task',
                      message : message.replace(/\s+/g,' ').trim(),
                      typeid : task_data.taskid,
                      operation : 'delete',
                      createdate : task_data.assigndate,
                      userid : task_data.oldUsers[i].id
                    };
                    arrNotif.push(d);  
                  }
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
      } 
    }
    $scope.updateTaskRating = function(rating){
      var data = {
        taskid : $scope.task_details.id,
        rating : rating
      };
      $http({
        url : '/ratetask',
        data : data,
        method : 'POST'
      }).then(function(response){
        if($scope.task_details.rating !== rating){
          $scope.task_details.rating = rating;
        }
      }, function(response){})
    }
    ctrl.updateTaskCompletion = function(op){
      if(op === 'complete'){
        var proceed = true;
        for(var i = 0; i < $scope.task_details.subtasks.length; i++){
          if($scope.task_details.subtasks[i].complete_date === null){
            proceed = false;
            break;
          }
        }
        if(proceed){
          $http({
            url : '/completetask',
            data : { 
                taskid : $scope.task_details.id ,
                assignees : $scope.task_details.assignees 
            },
            method : 'POST'
          }).then(function(response){ 
             $scope.task_details.complete_date = "Waiting for the date..";
             Notification.warning({message: response.data.message,  positionY: 'top', positionX: 'right', verticalSpacing: 15});
             if($scope.task_details.project_id !== null){
              var collabs = filterFilter(list_collabs, { project_id : $scope.task_details.project_id });
               if(response.data.data !== undefined){
                 var task_data = response.data.data;
                 var doer =  filterFilter(list_users, {id : task_data.userid})[0];
                 var arrNotif = [];
                 for(var i = 0; i < collabs.length; i++){
                    if(collabs[i].person_id !== getCookie('userid')){
                     var message = doer.fullname + " (@" + doer.username + ") "+ " marked the task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'') + " as complete "  
                      var d = {
                        type : 'task',
                        message : message.replace(/\s+/g,' ').trim(),
                        typeid : task_data.taskid,
                        operation : 'update',
                        createdate : task_data.completedate,
                        userid : collabs[i].person_id
                      };
                      arrNotif.push(d);  
                    }
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
        } else {
          var confirm = $mdDialog.confirm()
            .title("Task Completion")
            .content('Some of its subtasks are still in progress.')
            .ariaLabel('Lucky day')
            .ok('OK')
           $mdDialog.show(confirm).then(function() {
           }, function(){});
        }

      } else if(op === 'incomplete'){
        var tasks = [];
        $http({
          url : '/incompletetask',
          data : { taskid : $scope.task_details.id },
          method : 'POST'
        }).then(function(response){
          for(var i = 0; i < $scope.task_details.higher_tasks.length; i++){
            $http({
              url : '/incompletetask',
              data : { taskid : $scope.task_details.higher_tasks[i].id },
              method : 'POST'
            }).then(function(response){}, 
                    function(response){});
          }
          $scope.task_details.complete_date = null;
          Notification.warning({message: response.data.message,  positionY: 'top', positionX: 'right', verticalSpacing: 15});
           if($scope.task_details.project_id !== null){
            var collabs = filterFilter(list_collabs, { project_id : $scope.task_details.project_id });
             if(response.data.data !== undefined){
               var task_data = response.data.data;
               var doer =  filterFilter(list_users, {id : task_data.userid})[0];
               var arrNotif = [];
               for(var i = 0; i < collabs.length; i++){
                  if(collabs[i].person_id !== getCookie('userid')){
                   var message = null;
                   message = doer.fullname + " (@" + doer.username + ") "+ " marked the task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'') + " as incomplete ";
                    var d = {
                      type : 'task',
                      message : message.replace(/\s+/g,' ').trim(),
                      typeid : task_data.taskid,
                      operation : 'update',
                      createdate : task_data.incompletedate,
                      userid : collabs[i].person_id
                    };
                    arrNotif.push(d);  
                  }
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
      }
    }
    $scope.updateTaskAttachments = function(element){
      $scope.$apply(function($scope) {
        var fd = new FormData();
        for(var k = 0; k < element.files.length; k++){
          fd.append('atts', element.files[k]);
        }
        fd.append('taskid', $scope.task_details.id);
        for(var i = 0; i < $scope.task_details.assignees.length; i++){
          fd.append('assignees', JSON.stringify($scope.task_details.assignees[i]));
        }
        $http.post('/addattachment', fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        }).then(function(response){
           Notification.warning({message: response.data.message,  positionY: 'top', positionX: 'right', verticalSpacing: 15});
           if(response.data.data !== undefined){
             var task_data = response.data.data;
             var doer = filterFilter(list_users, {id : task_data.userid})[0];
             var arrNotif = [];
             for(var i = 0; i < task_data.assignees.length; i++){
              if(JSON.parse(task_data.assignees[i]).id !== getCookie('userid')){
               var message = doer.fullname + " (@" + doer.username + ") "+ " added attachments on task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
                var d = {
                  type : 'task',
                  message : message.replace(/\s+/g,' ').trim(),
                  typeid : task_data.taskid,
                  operation : 'update',
                  createdate : task_data.createdate,
                  userid : JSON.parse(task_data.assignees[i]).id
                };
                arrNotif.push(d);  
              }
             }
            $http({
              url : '/addnotif',
              method : 'POST', 
              data : {arrNotif : arrNotif}
            }).then(function(response){}, 
                    function(response){});
          }
         }, function(response){});
      });
    }
    ctrl.setProjectDetailsId = function(id){
      $rootScope.$broadcast('set_project_details', {id : id});
    }
    ctrl.openTaskCalendar = function() {
      $scope.open_calendar = !$scope.open_calendar;
    };
    ctrl.updateSubtaskCompletion = function(op, subtask){
      if(op === 'complete'){
        var subtasks = DataService.getSubtasksById(list_tasks, subtask.id);
        var proceed = true;
        for(var i = 0; i < subtasks.length; i++){
          if(subtasks[i].complete_date === null){
            proceed = false;
            break;
          }
        }
        if(proceed){
          $http({
            url : '/rateaverage',
            method :'POST',
            data : { taskid : subtask.id }
          }).then(function(response){
            var data = response.data;
            var rating =  data[0].avg === null ? "0.0": data[0].avg;
            rating = rating.substring(0, rating.indexOf('.'));
            subtask.rating = rating;
            $window.sessionStorage['subtask'] = JSON.stringify(subtask);
            $uibModal.open({
              animation: true,
              templateUrl: 'ratesubtask-template',
              controller : RateSubTaskModalController,
              controllerAs : 'ctrl',
              backdrop  : 'static',
              keyboard  : false,
              size :  'sm'
            });
          }, function(response){});
        } else {
          var confirm = $mdDialog.confirm()
            .title("Subtask Completion")
            .content('Some of its subtasks are still in progress.')
            .ariaLabel('Lucky day')
            .ok('OK');
          $mdDialog.show(confirm);
        }
      } else if (op === 'incomplete') {
        $http({
          url : '/incompletetask',
          data : { taskid : subtask.id },
          method : 'POST'
        }).then(function(response){}, 
                function(response){})
      } 
    }
    var RateSubTaskModalController = function($scope, $http, $uibModalInstance, Notification){
      var ctrl = this;
      ctrl.close = function() {
        $uibModalInstance.close();
        $rootScope.$broadcast('complete_subtask', { id : $scope.subtask.id });
      };
      ctrl.setRating = function(){
       $scope.subtask = JSON.parse($window.sessionStorage['subtask']);
       $scope.rate = $scope.subtask.rating === null ? 0 : $scope.subtask.rating;
      }
      ctrl.saveRating = function(){
        var data = {
          taskid : $scope.subtask.id,
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
    RateSubTaskModalController.inject = ['$uibModalInstance', 'Notification', '$scope', '$http']
    ////// DELETE ///////
    ctrl.deleteTaskProject = function(){
      if($scope.task_details.project_id !== null){
        $scope.data.project = null;
        $scope.project_title = "Project unspecified";
        var add_user = [];
        var rem_user = [];
        var curr_user = filterFilter(list_users, {id : getCookie('userid')})[0];
        add_user.push(curr_user);
         for(var i = 0; i < $scope.task_details.assignees.length; i++){
            rem_user.push($scope.task_details.assignees[i]);
        }
        $scope.task_details.assignees = [];
        $scope.task_details.assignees.push(curr_user); 
        $scope.users = [];
        var data = {
          prev : rem_user,
          new  : add_user,
          projectid : null,
          taskid : $scope.task_details.id,
          subtasks : $scope.task_details.lower_tasks
        }

      TaskService.updateAssignee(data)
        .then(function(response){
          if(response.data.data !== undefined){
            $scope.task_details.project_id = null;
            $scope.task_details.assignees = [];
            $scope.task_details.assignees.push(curr_user); 
            if(response.data.data !== undefined){
              var task_data = response.data.data;
              var doer = filterFilter(list_users, {id : task_data.userid})[0];
              var arrNotif = [];
              for(var i = 0; i < task_data.newUsers.length; i++){
                if(task_data.newUsers[i].id !== getCookie('userid')){
                 var message = doer.fullname + " (@" + doer.username + ") "+ " assigned you on task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
                  var d = {
                    type : 'task',
                    message : message.replace(/\s+/g,' ').trim(),
                    typeid : task_data.taskid,
                    operation : 'add',
                    createdate : task_data.assigndate,
                    userid : task_data.newUsers[i].id
                  };
                  arrNotif.push(d);  
                }
              }
              for(var i = 0; i < task_data.oldUsers.length; i++){
                if(task_data.oldUsers[i].id !== getCookie('userid')){
                 var message = doer.fullname + " (@" + doer.username + ") "+ " removed you as assignee on task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
                  var d = {
                    type : 'task',
                    message : message.replace(/\s+/g,' ').trim(),
                    typeid : task_data.taskid,
                    operation : 'delete',
                    createdate : task_data.assigndate,
                    userid : task_data.oldUsers[i].id
                  };
                  arrNotif.push(d);  
                }
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
      }  
    }
    $scope.saveDescription = function(text){
    }

    ctrl.deleteTask = function(event){
       var content = null;
       if($scope.task_details.lower_tasks.length > 0){
         content = $scope.task_details.lower_tasks.length + " related tasks and subtasks will also be deleted."
       } else {
         content = "The task will be deleted."
       }
        var confirm = $mdDialog.confirm()
              .title('Warning!')
              .textContent(content)
              .ariaLabel('Lucky day')
              .ok('Continue')
              .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
        var data = {
          taskid : $scope.task_details.id,
          assignees : $scope.task_details.assignees
        };

        TaskService.deleteTask(data)
          .then(function(response){                
            for(var i = 0; i < $scope.task_details.lower_tasks.length; i++){
              var data = {
                taskid : $scope.task_details.lower_tasks[i].id
              }
              TaskService.deleteTask(data)
                .then(function(response){}, 
                      function(response){});
            }
            if(response.data.data !== undefined){
               var task_data = response.data.data;
               var doer = filterFilter(list_users, {id : task_data.userid})[0];
               var arrNotif = [];
               for(var i = 0; i < task_data.assignees.length; i++){
                if(task_data.assignees[i].id !== getCookie('userid')){
                 var message = doer.fullname + " (@" + doer.username + ") "+ " deleted the task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
                  var d = {
                    type : 'task',
                    message : message.replace(/\s+/g,' ').trim(),
                    typeid : task_data.taskid,
                    operation : 'delete',
                    createdate : task_data.createdate,
                    userid : task_data.assignees[i].id
                  };
                  arrNotif.push(d);  
                }
               }
              $http({
                url : '/addnotif',
                method : 'POST', 
                data : {arrNotif : arrNotif}
              }).then(function(response){}, 
                      function(response){});
            }         
          }, function(response){});
        }, function() {});
    }
    ctrl.deleteTaskAttachment = function(file){
      var data = {
        taskid : $scope.task_details.id,
        pathdir : file.filename,
        assignees : $scope.task_details.assignees
      }
      $http({
        url : '/deleteattachment',
        method : 'POST',
        data : data
      }).then(function(response){
         if(response.data.data !== undefined){
           var task_data = response.data.data;
           var doer = filterFilter(list_users, {id : task_data.userid})[0];
           var arrNotif = [];
           for(var i = 0; i < task_data.assignees.length; i++){
            if(task_data.assignees[i].id !== getCookie('userid')){
             var message = doer.fullname + " (@" + doer.username + ") "+ " deleted an attachment on task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
              var d = {
                type : 'task',
                message : message.replace(/\s+/g,' ').trim(),
                typeid : task_data.taskid,
                operation : 'update',
                createdate : task_data.deletedate,
                userid : task_data.assignees[i].id
              };
              arrNotif.push(d);  
            }
           }
          $http({
            url : '/addnotif',
            method : 'POST', 
            data : {arrNotif : arrNotif}
          }).then(function(response){}, 
                  function(response){});
        }
      }, function(response){})
    }
    ///// ADD /////
    ctrl.showAddSubtask = function () {
      if($scope.task_details.complete_date !== null){
       var confirm = $mdDialog.confirm()
        .title('Warning!')
        .content('This task will be set to incomplete.')
        .ariaLabel('Lucky day')
        .ok('OK')
       $mdDialog.show(confirm).then(function() {
         ctrl.updateTaskCompletion('incomplete');
         $uibModal.open({
          animation: true,
          templateUrl: '/addsubtask',
          controller : 'SubtaskModalController',
          controllerAs : 'ctrl',
          backdrop  : 'static',
          keyboard  : false
        });
       }, function(){});
      } else {
        $uibModal.open({
          animation: true,
          templateUrl: '/addsubtask',
          controller : 'SubtaskModalController',
          controllerAs : 'ctrl',
          backdrop  : 'static',
          keyboard  : false
        });
      }     
    };
    ctrl.downloadAllFiles = function() {
      var zip = new JSZip();
      var count = 0;
      var zipFileName = $scope.task_details.title + "-files.zip";
      $scope.task_details.attachments.forEach(function(file){
        $http({
          url : file.filename,
          method : 'GET',
          responseType : 'arraybuffer'
        }).then(function(response){
            zip.file(file.name, response.data, { binary : true });
            count++;
        }, function(response){});
        if(count === $scope.task_details.attachments.length){
          zip.generateAsync({type:'blob'}).then(function(content) {
             FileSaver.saveAs(content, zipFilename);
          });
        }
      })
    }
    ////////////////////////////////////// LISTENERS ////////////////////////////////////

    /////// LOCAL LISTENERS //////

    $scope.$on('complete_subtask', function(event, data){
      for(var i = 0; i < $scope.task_details.subtasks.length; i++){
        if(data.id === $scope.task_details.subtasks[i].id){
          var assignees = DataService.getAssignmentsById(list_assignments, list_users, $scope.task_details.subtasks[i].id);
          $http({
            url : '/completetask',
            data : { 
                taskid : $scope.task_details.subtasks[i].id ,
                assignees : assignees
            },
            method : 'POST'
          }).then(function(response){ 
             $scope.task_details.subtasks[i].complete_date = "Waiting for the date..";
             Notification.warning({message: response.data.message,  positionY: 'top', positionX: 'right', verticalSpacing: 15});
             if($scope.task_details.subtasks[i].project_id !== null){
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
                     var message = doer.fullname + " (@" + doer.username + ") "+ " marked the subtask " + $scope.task_details.subtasks[i].title.replace(/^[ ]+|[ ]+$/g,'') + " as complete under task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
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
                  var message = doer.fullname + " (@" + doer.username + ") "+ " marked the subtask " + $scope.task_details.subtasks[i].title.replace(/^[ ]+|[ ]+$/g,'') + " as complete under task " + $scope.task_details.title.replace(/^[ ]+|[ ]+$/g,'');  
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
    $scope.$on('set_task_details', function(event, data){
      var task = filterFilter(list_tasks, { id  : data.id})[0];
      ctrl.changeTaskDetails(task);
    })
    /////// WEB LISTENERS ///////
    $scope.$on('/createtask', function(event, data){
      if(data.task_id !== null && data.task_id === $scope.task_details.id){
        $scope.task_details.subtasks.push(data);
        $scope.task_details.subtasks = $filter('orderBy')($scope.task_details.subtasks, 'createdate');
        $scope.task_details.lower_tasks.push(data);
      }
    });
    $scope.$on('/updatetaskname', function(event, data){
      if(data.id === $scope.task_details.id){
        $scope.task_details.title = data.title;
        $scope.task_title = data.title;
      } else {
        for(var i = 0; i < $scope.task_details.subtasks.length; i++){
          if($scope.task_details.subtasks[i].id === data.id){
            $scope.task_details.subtasks[i].title = data.title;
            break;
          }
        }
      }
    });
    $scope.$on('/updatetaskdesc', function(event, data){
      if(data.id === $scope.task_details.id){
        $scope.task_details.description = data.description;
        $scope.task_description = data.description;
      } 
    });
    $scope.$on('/updatetaskdeadline', function(event, data){
      if(data.id === $scope.task_details.id){
        $scope.task_details.deadline_date = data.deadline_date;
        $scope.task_details.deadline_time = data.deadline_time;
      } 
    });
    $scope.$on('/updatetaskassignee', function(event, data){
      var exist = filterFilter(data.subtasks, { id : $scope.task_details.id })[0];
      if(data.id === $scope.task_details.id || exist != undefined){
        var project = filterFilter(list_projects, {id : data.project_id})[0];
        if(project === undefined || project === null){
          $scope.users = filterFilter(list_users, {id : getCookie('userid')});
          $scope.project_title = "Project unspecified";
        } else {
          $scope.project_title = project.name;
        }
        for(var i = 0; i < data.del_users.length; i++){
          $scope.task_details.assignees = $scope.task_details.assignees.filter(function(user){
            return user.id !== data.del_users[i].id;
          });
         if(data.del_users[i].id === getCookie('userid')){
           if(getCookie('userid') !== data.user_id){
            var confirm = $mdDialog.confirm()
              .title('Information')
              .content('You were removed as assignee to this task')
              .ariaLabel('Lucky day')
              .ok('OK')
             $mdDialog.show(confirm).then(function() {
               $state.go('tasks');
             }, function(){});
           } else {
             if(data.project_id !== null){
                var confirm = $mdDialog.confirm()
                .title('Information')
                .content('You removed yourself to this task')
                .ariaLabel('Lucky day')
                .ok('OK')
               $mdDialog.show(confirm).then(function() {
                 $state.go('tasks');
               }, function(){});
             }
           }
        }
      }
      for(var j = 0; j < data.add_users.length; j++){
        if(filterFilter( $scope.task_details.assignees, { id : data.add_users[j].id})[0] === undefined){
           $scope.task_details.assignees.push(data.add_users[j]);
        }
      }
      ctrl.setNeededData();
    }});
    $scope.$on('/completetask', function(event, data){
      if(data.id === $scope.task_details.id){
        $scope.task_details.complete_date = data.complete_date;
      } else {
        for(var i = 0; i < $scope.task_details.subtasks.length; i++){
          if($scope.task_details.subtasks[i].id === data.id){
            $scope.task_details.subtasks[i].complete_date = data.complete_date;
            break;
          }
        }
      }
    });   
    $scope.$on('/incompletetask', function(event, data){
      if(data.id === $scope.task_details.id){
        $scope.task_details.complete_date = null;
      } 
        for(var i = 0; i < $scope.task_details.subtasks.length; i++){
          if($scope.task_details.subtasks[i].id === data.id){
            $scope.task_details.subtasks[i].complete_date = null;
            ctrl.updateTaskCompletion('incomplete');
            break;
          }
      }
    });
    $scope.$on('/addattachment', function(event, data){
      if($scope.task_details.id === data.task_id){
        for(var i = 0; i < data.files.length; i++){
          $scope.task_details.attachments.push(data.files[i]);
        }
      }
    });
    $scope.$on('/addcomment', function(event, data){
      if(data.task_id === $scope.task_details.id){
        var user = filterFilter(list_users, { id : data.user_id })[0];
        data.user = user;
        data.editedComment = data.comment;
        $scope.task_comments.unshift(data);
      }
    });
    $scope.$on('/updatecomment', function(event, data){
      if(data.task_id === $scope.task_details.id){
        for(var i = 0; i < $scope.task_comments.length; i++){
          if(data.id === $scope.task_comments[i].id){
            $scope.task_comments[i].editedComment = data.comment;
            $scope.task_comments[i].comment = data.comment;
          }
        }
      }
    });
    $scope.$on('/deletecomment', function(event, data){
      $scope.task_comments = $scope.task_comments.filter(function(comment){
        return comment.id !== data.id
      });
    });
    $scope.$on('/updateuserinfo', function(event, data){
        for(var i = 0; i < $scope.assigned_users.length; i++){
          if($scope.assigned_users[i].id === data.id){
            $scope.assigned_users[i].first_name = data.first_name;
            $scope.assigned_users[i].last_name = data.last_name;
            $scope.assigned_users[i].fullname = data.fullname;
            $scope.assigned_users[i]._lowerTitle = data.fullname.toLowerCase();
            $scope.assigned_users[i].info = data.info;
            if(data.profpic_path !== undefined){
              $scope.assigned_users[i].profpic_path = data.profpic_path;
            }
            break;
          }
          
        }
        for(var i = 0; i < task_users.length; i++){
          if(task_users[i].id === data.id){
            task_users[i].first_name = data.first_name;
            task_users[i].last_name = data.last_name;
            task_users[i].fullname = data.fullname;
            task_users[i]._lowerTitle = data.fullname.toLowerCase();
            task_users[i].info = data.info;
            if(data.profpic_path !== undefined){
              task_users[i].profpic_path = data.profpic_path;
            }
            break;
          }
          
        }
    });
    $scope.$on('/deleteattachment', function(event, data){
      if(data.task_id === $scope.task_details.id){
        $scope.task_details.attachments = $scope.task_details.attachments.filter(function(file){
           return file.filename !== data.filename;
        });
      }
    });
    $scope.$on('/ratetask', function(event, data){
      if($scope.task_details.id === data.id){
        $scope.task_details.rating = data.rating;
        $scope.task_rating = data.rating;
      }
    });
    $scope.$on('/deletetask', function(event, data){
      if($scope.task_details.id === data.id){
        var confirm = $mdDialog.confirm()
              .title('Information')
              .textContent('This task has been deleted.')
              .ariaLabel('Lucky day')
              .targetEvent(event)
              .ok('Ok');
        $mdDialog.show(confirm).then(function(){
          $state.go('tasks');
        }, function(){})
      } else {
        var task = filterFilter(list_tasks, {id : data.id})[0];
        var lower_tasks = DataService.getRelatedLowerTasks(list_tasks, task);
        var test = filterFilter(lower_tasks, {id : $scope.task_details.id})[0];
        if(test !== undefined){
          var confirm = $mdDialog.confirm()
                .title('Information')
                .textContent('This task has been deleted.')
                .ariaLabel('Lucky day')
                .ok('Ok');
          $mdDialog.show(confirm).then(function(){
            $state.go('tasks');
          }, function(){})
        }
      }
    });
    $scope.$on('/deleteproject', function(event, data){
      if($scope.task_details.project_id === data.id){
        var confirm = $mdDialog.confirm()
              .title('Information')
              .textContent('This task has been deleted.')
              .ariaLabel('Lucky day')
              .targetEvent(event)
              .ok('Ok');
        $mdDialog.show(confirm).then(function(){
          $state.go('tasks');
        }, function(){})
      } else {
        $scope.task_details.subtasks = $scope.task_details.subtasks.filter(function(subtask){
           return subtask.project_id !== data.id;
        });
      }
    })
    $scope.$on('/updateprojectname', function(event, data){
        if($scope.task_details.project_id === data.id){
          $scope.project_title = data.name;
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