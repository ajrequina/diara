app.service('TaskService', ['$http', 'HTTPFactory' ,function($http, HTTPFactory) {
	var service = {};
  service.updateTaskName = function(data) {
    return  $http({
      url: '/updatetaskname',
      method: 'POST',
      data : data
    });
  }
  service.updateTaskDescription = function(data){
    return  $http({
      url: '/updatetaskdesc',
      method: 'POST',
      data : data
    });
  }
  service.updateTaskDeadline = function(data){
    return  $http({
      url: '/updatetaskdeadline',
      method: 'POST',
      data : data
    });
  }
  service.updateAssignee = function(data){
     return HTTPFactory.post('/updateassignee', data)
      .then(function(response){
        return response;
    }, function(response){});
  }
  service.deleteTask = function(data) {
    return  $http({
      url: '/deletetask',
      method: 'POST',
      data : data
    });
  }
  service.save = function(data){
   return HTTPFactory.post('/createtask', data)
     .then(function(response){
        return response;
    }, function(response){});
  }

  service.addComment = function(data){
    return HTTPFactory.post('/addcomment', data)
     .then(function(response){
        return response.data.message;
     }, function(response){});
  }
  service.deleteComment = function(data){
    return HTTPFactory.post('/deletecomment', data)
     .then(function(response){
        return response.data.message;
     }, function(response){});
  }
  service.updateComment = function(data){
    return HTTPFactory.post('/updatecomment', data)
     .then(function(response){
        return response.data.message;
     }, function(response){});
  }
  return service;
}]);

///////////////////////////////////////////////////////////////////////////////////////
app.service('ProjectService', ['$http', 'HTTPFactory' ,function($http, HTTPFactory) {
  var service = {};
  service.updateProjectName = function(data) {
    return HTTPFactory.post('/updateprojectname', data)
            .then(function(response){
              return response;
            }, function(response){});
  }
  service.updateProjectDescription = function(data){
     return HTTPFactory.post('/updateprojectdesc', data)
            .then(function(response){
              return response;
            }, function(response){});
  }
  service.updateProjectDeadline = function(data){
  return HTTPFactory.post('/updateprojectdeadline', data)
            .then(function(response){
              return response;
            }, function(response){});
  }
  service.updateCollaborator = function(data){
     console.log('I was called.. ');
     return HTTPFactory.post('/updatecollaborator', data)
      .then(function(response){
        console.log(response.data.conf);
        return response.data.conf;
    }, function(response){});
  }
  service.deleteTask = function(data) {
    return  $http({
      url: '/deletetask',
      method: 'POST',
      data : data
    });
  }
  service.save = function(data){
   return HTTPFactory.post('/createtask', data)
     .then(function(response){
        return response.data.message;
    }, function(response){});
  }
  return service;
}]);
///////////////////////////////////////////////////////////////////////////////////////

app.service('DataService',['HTTPFactory','$window','filterFilter','$filter','$q',
  function(HTTPFactory, $window, filterFilter, $filter, $q){
   var service = {};
   var self = this;
   this.data = null;
   this.done = false;
   ////////////////////////// SETTERS /////////////////////////////////
   service.initTasks = function(){

      HTTPFactory.get('/listtasks')
      .then(function(response){
         var all_tasks = response.data;
         all_tasks.created = all_tasks.created.filter(function(task) {
              return !task.deleted;
         });
         all_tasks.completed = all_tasks.completed
            .filter(function(task) {
              return !task.deleted;
            });

         all_tasks.assigned = all_tasks.assigned
            .filter(function(task) {
              return !task.deleted;
            });

         all_tasks.incomplete = all_tasks.incomplete
           .filter(function(task) {
             return !task.deleted;
         });
         all_tasks.related = all_tasks.related
            .filter(function(task) {
              return !task.deleted;
         });
         all_tasks.repeated = all_tasks.repeated
            .filter(function(task) {
             return !task.deleted;
         });
         $window.sessionStorage.setItem('all-task', JSON.stringify(all_tasks));
         this.done = true;
       }, function(response){});
  } 
   service.initTasks2 = function(type){

      return HTTPFactory.get('/listtasks')
      .then(function(response){
         var all_tasks = response.data;
         all_tasks.created = all_tasks.created.filter(function(task) {
              return !task.deleted;
         });
         all_tasks.completed = all_tasks.completed
            .filter(function(task) {
              return !task.deleted;
            });

         all_tasks.assigned = all_tasks.assigned
            .filter(function(task) {
              return !task.deleted;
            });

         all_tasks.incomplete = all_tasks.incomplete
           .filter(function(task) {
             return !task.deleted;
         });
         all_tasks.related = all_tasks.related
            .filter(function(task) {
              return !task.deleted;
         });
         all_tasks.repeated = all_tasks.repeated
            .filter(function(task) {
             return !task.deleted;
         });
          return all_tasks;
       }, function(response){});
   }
   service.initAssignments = function(){
    HTTPFactory.get('/listassignment')
     .then(function(response){
        var all_assignments = response.data;
        $window.sessionStorage['all-assignments'] = JSON.stringify(all_assignments);
     }, function(response){});
   }
   service.initAssignments2 = function(){
    return HTTPFactory.get('/listassignment')
     .then(function(response){
        return response.data;
        // var all_assignments = response.data;
        // $window.sessionStorage['all-assignments'] = JSON.stringify(all_assignments);
     }, function(response){});
   }
   service.initTaskComments = function(data){
    return HTTPFactory.post('/listtaskscomments', data)
     .then(function(response){
        return response.data;
     }, function(response){});
   }
   service.initUsers2 = function(){
     return HTTPFactory.get('/listpersons')
      .then(function(response){
       var all_users = response.data;
       all_users.map(function(user){
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
       return all_users;
     }, function(response){});
   }
   service.initUsers = function(){
   }
    service.initProjects = function(){
      HTTPFactory.get('/listprojects')
       .then(function(response){
         var all_projects = response.data;
         $window.sessionStorage['all-projects'] = JSON.stringify(all_projects);
       }, function(response){})
    }
    service.initProjects2 = function(){
      return HTTPFactory.get('/listprojects')
       .then(function(response){
         var all_projects = response.data;
         return all_projects;
       }, function(response){})
    }
    service.initCollabs = function(){
      HTTPFactory.get('/listcollabs')
       .then(function(response){
         var all_collabs = response.data;
         $window.sessionStorage['all-collabs'] = JSON.stringify(all_collabs);
      }, function(response){})
    }
    service.initCollabs2 = function(){
      return HTTPFactory.get('/listcollabs')
       .then(function(response){
         var all_collabs = response.data;
         return all_collabs;
      }, function(response){})
    }
   ///////////////////////////// BULK GETTERS ///////////////////////////////

   service.getProjects = function(type){
     service.initProjects();
     var projects = JSON.parse($window.sessionStorage['all-projects']);
     var selected_projects = [];
     if(type === 'created'){
       selected_projects = projects.created;
     } else if(type === 'collab'){
       selected_projects = projects.collab;
     } else if(type === 'repeated'){ 
       selected_projects = projects.repeated;
     } else { 
       selected_projects = projects.related;
     }
    selected_projects.map(function(project){
      var create_date =  $filter('date')(project.create_date, "MMMM d, y HH:ss");
      var fullDetail  = project.name + ' (' + create_date + ')';
      project.fullDetail = fullDetail;
      return project;
    });
    return selected_projects;
   }
   service.getUsers = function(){
     service.initUsers();
     var all_users = JSON.parse($window.sessionStorage['all-users']);
     return all_users;
   }

   service.getAssignments = function(){
     service.initAssignments();
     var assignments = JSON.parse($window.sessionStorage['all-assignments']);
     return assignments;
   }
   
   service.projects = function(collaborators, projects, tasks, users){

   }
   service.setTasks = function(projects, assignments, users, tasks){
    for(var i = 0; i < tasks.length; i++){
        var a = filterFilter(assignments, {task_id: tasks[i].id});
        var b =  [];
        for(var j = 0; j < a.length; j++){
          var c = filterFilter(users, {id: a[j].assignee_id})[0];
          b.push(c);
        }
        var e = filterFilter(tasks, {task_id: tasks[i].id});
        if(tasks[i].project_id !== null){
          var proj = filterFilter(projects, {id: tasks[i].project_id})[0];
          if(proj !== undefined){
            tasks[i].project = proj;
          }
        }

        tasks[i].subtask = [];
        tasks[i].subtask = e;
        tasks[i].taskAssignee = b;
        tasks[i].assignees = b;
        tasks[i].selected = false;
     }
     return tasks;
   }
   service.setTaskComments = function(comments, users){
     for(var i = 0; i < comments.length; i++){
       var user = filterFilter(users, {id : comments[i].user_id})[0];
       comments[i].user = user;
       comments[i].willEditComment = false;
       comments[i].editedComment = comments[i].comment;
     }
     return comments;
   }
   service.setProjects = function(users, tasks,collabs, projects, userid){

     for(var i = 0; i < projects.length; i++){
        var proj = filterFilter(collabs, {project_id : projects[i].id});
        var collaborators = [];
        projects[i].collaborators = [];
        for(var j = 0; j < proj.length; j++){
          var per = filterFilter(users, {id : proj[j].person_id})[0];
          collaborators.push(per);
        } 

        if(collaborators.length === 0){
          var pr = filterFilter(users, {id : userid})[0];
          collaborators.push(pr);
        }

        projects[i].collaborators = collaborators;
        projects[i].tasks = [];
        var tasks_assigned = filterFilter(tasks, {project_id : projects[i].id});
        projects[i].tasks = tasks_assigned;
        var date = projects[i].deadline_date +  ' ' +  projects[i].deadline_time;
        if(projects[i].deadline_date === null){
          projects[i].status = "In Progress";
        } else {
          if(projects[i].deadline_time === null){
            var now = new Date();
            var date_1 = $filter('date')(projects[i].deadline_date, "MM-dd-yyyy");
            var date_2 = $filter('date')(now, "MM-dd-yyyy");

            if( date_1 <= date_2){
             projects[i].status = "In Progress";
            } else {
              projects[i].status = "Overdue";
            }
          } else {
            var now = new Date();
            var date_1 = $filter('date')(projects[i].deadline_date, "MM-dd-yyyy");
            var date_2 = $filter('date')(now, "MM-dd-yyyy");
            if(date_1 >= date_2){
              var time_1 = $filter('date')(projects[i].deadline_date, "HH:mm:ss");
              var time_2 = $filter('date')(now, "HH:mm:ss");
              if(time_1 <= time_2){
                projects[i].status = "In Progress";
              } 
            } else {
                projects[i].status = "Overdue";
            }
          }
        }
      }
      return projects;
   }

   service.setTaskAttachments = function(task, files){
     console.log(files);
     var attach = filterFilter(files, {task_id : task.id});
     for(var i = 0; i < attach.length; i++){
       var filename = attach[i].filename;
       attach[i].name = filename.replace(/^.*[\\\/]/, '');
     }
     return attach;
   }
   service.getTasks = function(type){
      service.initTasks();
      service.initUsers();
      service.initAssignments();
      
      if(this.done){
         (JSON.parse($window.sessionStorage.getItem('all-task')));
      }
      var tasks_test = [];
      service.initTasks2()
       .then(function(data){
         tasks_test = data;
       }, function(data){});
       
      service.get('all-task')
        .then(function(data){
        }, function(data){});
      var tasks = JSON.parse($window.sessionStorage.getItem('all-task'));      
     
      var assignments = service.getAssignments();
      var users = service.getUsers();
      var selected_tasks = [];

      if(type === 'created'){
        selected_tasks =  tasks.created;
      } else if(type === 'assigned'){
        selected_tasks =  tasks.assigned;
      } else if(type === 'completed'){
        selected_tasks =  tasks.completed;
      } else if(type === 'incomplete'){
        selected_tasks =  tasks.incomplete;
      } else if(type === 'repeated'){
        selected_tasks =  tasks.repeated;
      } else {
        selected_tasks =  tasks.related;
      }
     for(var i = 0; i < selected_tasks.length; i++){
        var a = filterFilter(assignments, {task_id: selected_tasks[i].id});
        var b =  [];
        for(var j = 0; j < a.length; j++){
          var c = filterFilter(users, {id: a[j].assignee_id})[0];
          b.push(c);
        }
        var e = filterFilter(selected_tasks, {task_id: selected_tasks[i].id});
        selected_tasks[i].subtask = [];
        selected_tasks[i].subtask = e;
        selected_tasks[i].taskAssignee = b;
        selected_tasks[i].selected = false;
     }
     return selected_tasks;
   }

   service.getCollabs = function(){
     service.initCollabs();
     var collabs = JSON.parse($window.sessionStorage['all-collabs']);
     return collabs;
   }

   ///////////////////////// MINIMAL GETTERS ///////////////////////////////
   service.getProjectById = function(projects,id){
    var project = {};
    project = filterFilter(projects, {id : id})[0];
    return project === undefined ? null : project;
   }
   service.getCollabById = function(collabs, users, id){
     var collab_projects = filterFilter(collabs, {project_id: id});
     var collab_users = [];
     for(var i = 0; i < collab_projects.length; i++){
      var user = filterFilter(users, {id: collab_projects[i].person_id})[0];
      collab_users.push(user);
     }
     return collab_users;
   }

   service.getSubtasksById = function(tasks, id){
     var subtasks = [];
     subtasks = filterFilter(tasks, {task_id: id});
     return subtasks;
   }
   
   service.getAssignmentsById = function(assignments, users, id, task_id){
    var a = filterFilter(assignments, {task_id: id});
    var d = [];
     for(var i = 0; i < a.length; i++){
      var c = filterFilter(users, {id: a[i].assignee_id})[0];
      d.push(c);
     }
     return d;
   }
   service.getProjectTasksById = function(tasks, projectid){
    var ptasks = filterFilter(tasks, {project_id : projectid});
    return ptasks;
   }

   service.getRelatedTasksById = function(tasks, task){
     var rTasks = [];
     if(task.task_id === null){
      return rTasks;
     } else {
      var rTask = filterFilter(tasks, {id : task.task_id})[0];
      console.log(rTask);
      rTasks.push(rTask);
      while(rTask.task_id !== null){
        rTask = filterFilter(tasks, {id : rTask.task_id})[0];
        rTasks.push(rTask);
      } 
      console.log(rTasks);
      return rTasks;
     }
   }
   service.getRelatedLowerTasks = function(tasks, task){
    var lTasks = [];
    var lTask = filterFilter(tasks, { task_id : task.id});
    console.log(lTask);
    var queue = [];
    for(var i = 0; i < lTask.length; i++){
     lTasks.push(lTask[i]);
     queue.push(lTask[i]);
    }
    while(queue.length !== 0){
      var curr = queue.shift();
      var under = filterFilter(tasks, { task_id : curr.id});
      for(var j = 0; j < under.length; j++){
        queue.push(under[j]);
        lTasks.push(under[j]);
      }
    }
    return lTasks;
   }
   //////////////////////// HELPERS //////////////////////////////////
   service.getData = function(key){
     var data = [];
     service.get(key).then(function(response){
       self.data = response;
     }, function(response){});
   }
   service.get = function(key){
    if($window.sessionStorage.getItem(key)){
      return $q.when(JSON.parse($window.sessionStorage.getItem(key)));
    } else {
      var deferred = $q.defer();
      deferred.reject('No Data Found');
      return deferred.promise;
    }
   }
   return service;
}]);

app.service('MiscService', ['filterFilter','$location', function(filterFilter, $location){
  var service = {};
  service.cleanText = function(text){
    text = text.replace(new RegExp('\r?<br>','g'), '');
    text = text.replace(new RegExp('\r?</div>','g'), '');
    text = text.replace(new RegExp('\r?<div>','g'), '');
    text = text.replace(new RegExp('\r?\n','g'), '');
    text = text.replace(new RegExp('\r?&amp;','g'), '');
    text = text.replace(new RegExp('\r?amp;','g'), '');
    text = text.replace(new RegExp('\r?nbsp;','g'), '');
    text = text.replace(new RegExp('\r?&;','g'), ' ');
    text = text.replace(new RegExp('\r?&','g'), ' ');
    text = text.replace(/(\r\n|\n|\r)/gm,"");
    return text;
  }
  service.filterOne = function(array, attrib, value){
    return filterFilter(array, {attrib: value})[0];
  }
  service.getUserId = function(){
   var name = "userid=";
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
  service.getCurrentPath = function(){
    return $location.$$path;
  }
  return service;
}]);


