app.controller('SubtaskModalController', 
	['$scope', '$uibModalInstance', '$filter', '$http', 'HTTPFactory', 'filterFilter','$mdDialog', 'DataService', 'socket','$window','$rootScope','Notification',
	  function($scope, $uibModalInstance, $filter, $http, HTTPFactory, filterFilter, $mdDialog, DataService, socket, $window, $rootScope, Notification){
      //// CONTROLLER VARIABLES ////
      var ctrl = this; 
      var list_assignments = [];
      var list_users = [];
      var mother_task = {};

      //// VIEW VARIABLES ////
      $scope.assigned_user = [];
      $scope.subtask_assignees = [];


	   ctrl.initUsers = function(){
	      DataService.initUsers2()
	       .then(function(data){
	         list_users = data;
	      }, function(data){})
	    }

	    ctrl.initSubtaskAssignees = function(){
	      ctrl.initUsers();
	      DataService.initAssignments2()
	       .then(function(data){
	         list_assignments = data;
	         ctrl.setInitSubtaskAssignees();
	       }, function(data){})
	    }
	    ctrl.initSubtaskAssignees();

	    ctrl.setInitSubtaskAssignees = function(){
	      mother_task = JSON.parse($window.sessionStorage['task']);
	      var assignees = DataService.getAssignmentsById(list_assignments, list_users, mother_task.id);
	      $scope.subtask_assignees = assignees;
	    }

	    ctrl.loadSubtaskAssignee = function(query){
	      return $scope.subtask_assignees.filter(function(user) {
	        return user._lowerTitle.indexOf(query.toLowerCase()) != -1 || 
	               user.email.indexOf(query) != -1 ||
	               user.username.indexOf(query) != -1;
	        }
	      );
	    }


      ctrl.saveSubtask = function(){
	      if($scope.data.title !== undefined && $scope.data.title !== null && $scope.data.title !== ''){
	        var data = mother_task;
	        if($scope.data.description === undefined){
	           $scope.data.description = "";
	         }
	         var subtask = {
	          'projectid' : data.project_id,
	          'ptask' : data.id,
	          'deadlinedate' : data.deadline_date,
	          'deadlinetime' : data.deadline_time,
	          'title' : $scope.data.title,
	          'description' : $scope.data.description,
	          'assignedUser' : $scope.assigned_user
	         }
	      
	        if(subtask.deadlinedate !== undefined && subtask.deadlinedate !== null){
	          subtask.deadlinedate = $filter('date')(subtask.deadlinedate, "dd-MM-yyyy");
	        } 

	        $http({
	            method : 'POST',
	            url : '/createtask',
	            data : subtask
	        }).then(function mySuccess(response){
	            ctrl.close();
	            Notification.warning({message: response.data.message, positionY: 'top', positionX: 'right', verticalSpacing: 15});

	            //// FOR NOTIFICATIONS ////
	            if(response.data.data !== undefined){
	               DataService.initUsers2()
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
	                 console.log(arrNotif);
	                $http({
	                  url : '/addnotif',
	                  method : 'POST', 
	                  data : data
	                }).then(function(response){
	                }, function(response){})
	              }, function(data){})
	              }
	         }, function myError(response){});
	      }
      }
      
      ctrl.close = function() {
	      $uibModalInstance.close();
	    };
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