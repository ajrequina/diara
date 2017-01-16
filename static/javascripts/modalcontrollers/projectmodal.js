app.controller('ProjectModalController', 
    [ '$scope', '$uibModalInstance',  '$filter', '$http',  'HTTPFactory', 'filterFilter','$mdDialog', 'DataService','Notification',
      function($scope, $uibModalInstance, $filter, $http, HTTPFactory, filterFilter, $mdDialog, DataService, Notification){
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
            var b = getCookie('userid');
            var a = filterFilter($scope.users, {id: b});
            $scope.collaborators.push(a[0]);
            var project = {'title' : $scope.data.title,
                            'description' : $scope.data.description,
                            'deadlinedate' : $scope.data.deadlinedate,
                            'deadlinetime' : $scope.data.deadlinetime,
                            'collaborators' : $scope.collaborators
                          }
            $scope.cancel();    
            $http({
              method : 'POST',
              url : '/createproject',
              data : project
            }).then(function mySuccess(response){
                $scope.cancel();
                Notification.warning({message: response.data.message, positionY: 'top', positionX: 'right'});
                if(response.data.data !== undefined){
                     DataService.initUsers()
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
                      $http({
                        url : '/addnotif',
                        method : 'POST', 
                        data : data
                      }).then(function(response){
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
     }]);