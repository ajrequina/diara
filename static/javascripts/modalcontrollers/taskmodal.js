app.controller('TaskModalController', 
	[ '$scope', '$uibModalInstance', '$filter', '$http', 'HTTPFactory', 'filterFilter', '$mdDialog', 'TaskService','$rootScope','Notification','DataService',
	  function($scope, $uibModalInstance, $filter, $http, HTTPFactory, filterFilter, $mdDialog, TaskService, $rootScope, Notification, DataService){
		  	$scope.assignedUser = [];
		    $scope.projects = [];
		    $scope.users = [];
		    $scope.collab = [];
            var ctrl = self;
            ctrl.function3 = function(){
             HTTPFactory.getAllProjects()
		    .then(function mySuccess(response) {
		       var p = response.data;
		       $scope.projects = p.related;
               ctrl.filterProjects();
		     }, function myError(response) {
		    });
            }
		    

		   ctrl.function2 = function(){
		   	 HTTPFactory.getAllCollabs()
		    .then(function mySuccess(response) {
		       $scope.collab = response.data;
		       ctrl.function3();
		     }, function myError(response) {
		    });
		   }
		   

		   ctrl.function1 = function(){
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
		      ctrl.function2();
		     }, function myError(response) {});
		   }
            ctrl.filterProjects = function(){
               for(var i = 0; i < $scope.projects.length; i++){
               	  $scope.projects[i].collaborators = DataService.getCollabById($scope.collab, $scope.users, $scope.projects[i].id);
               }
                $scope.projects = $scope.projects.filter(function(project){
			     var user_exist = filterFilter(project.collaborators, { id : getCookie('userid')})[0];
			     return user_exist !== undefined;
			   });
            }
            ctrl.setNeededData = function(){
            	ctrl.function1();
            }
            ctrl.setNeededData();
		    $scope.setUsers = function(){
		      $scope.assignedUser = [];
		      $scope.userTest = [];
		      if($scope.data.project === ''){
		        $scope.assignedUser = [];
          } else if($scope.data.project === 'none'){
              	$scope.assignedUser = [];
                $scope.assignedUser.push(filterFilter($scope.users, {id: getCookie('userid')})[0]);
                $scope.userTest = filterFilter($scope.users, {id: getCookie('userid')});
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
		        if($scope.userTest.length > 0){
		          $scope.assignedUser = $scope.assignedUser.filter(function(user){
		            var remain = {};
		            for(var i = 0; i < $scope.userTest.length; i++){
		              if(user.id === $scope.userTest[i].id){
		                return true;
		              }
		            }
		            return false;;
		           });
		        } else {
		          $scope.assignedUser = [];
		        }
		    }

		    $scope.loadUsers = function(query){
		      return $scope.userTest.filter(function(user) {
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
		      if($scope.data.date === undefined || $scope.data.time === undefined || $scope.data.time === null){
		        $scope.data.deadlinetime = null;
		      } else {
		        $scope.data.time = $filter('date')($scope.data.time, "hh:mm a");
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
		         projectid    : id,
		         ptask        : null,
		         assignedUser : $scope.assignedUser
		      };
		      
		      TaskService.save(task)
		        .then(function(response){
		        
		          Notification.warning({message: response.data.message, positionY: 'top', positionX: 'right', delay : 100000});
		          // $rootScope.$broadcast('PROJECT TASK ADDED');
		          // $rootScope.$broadcast('TASK ADDED');
		          $scope.comment = "";
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
      }])