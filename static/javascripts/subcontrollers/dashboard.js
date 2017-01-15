app.controller("DashboardController", ['$rootScope', '$scope', '$state', '$location','Flash','DataService','filterFilter','$filter',
function ($rootScope, $scope, $state, $location,  Flash, DataService, filterFilter, $filter) {
  var ctrl = this;
  ctrl.showDetails = true;
  ctrl.home = {};
  $scope.ave_response = null;
  $scope.incomplete_tasks = [];
  $scope.overdue_tasks = [];
  $scope.ave_task = 0;
  $scope.options = {
    chart: {
        type: 'barChart',
        height: 400,
        width : 600,
        margin : {
            top: 20,
            right: 20,
            bottom: 30,
            left: 40
        },
        x: function(d){return d[0];},
        y: function(d){return d[1];},
        useVoronoi: false,
        clipEdge: true,
        duration: 100,
        xAxis: {
            showMaxMin: false,
            tickFormat: function(d) {
                return d3.time.format('%x')(new Date(d))
            }
        },
        yAxis: {
            tickFormat: function(d){
                return d3.format(',.2f')(d);
            }
        },
        zoom: {
            enabled: true,
            scaleExtent: [1, 10],
            useFixedDomain: false,
            useNiceScale: false,
            horizontalOff: false,
            verticalOff: true,
            unzoomEventType: 'dblclick.zoom'
        }
    }
  };
  ctrl.setListTasks = function(){
    DataService.initTasks2()
     .then(function(data){
       list_tasks = data.related;
       ctrl.startCalculations();
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
      list_projects = data.related;
      ctrl.list_projects = data.related;
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
  ctrl.setUserDetails = function(user){
  $window.localStorage['user'] = JSON.stringify(user);
 }
  ctrl.setNeededData = function(){
    ctrl.setListUsers();
  }
  var shown_projects = [];
  var projectsnames = [];
  var projectsdate = [];
  var projectstasks = [];
  $scope.incomplete_task = undefined;
  $scope.overdue_task = undefined;
  var shown_projects_tasks = [];

  ctrl.startCalculations = function(){
    var first = new Date(list_tasks[0].create_date);
    var second = new Date();
    var total = 0;
    var count = 1;
    var tasks = DataService.setTasks(list_projects, list_assignments, list_users, list_tasks);
    tasks = tasks.filter(function(task){
      var exist_user = filterFilter(task.assignees, {id : getCookie('userid')})[0];
      return exist_user !== undefined;
    });
    for(var i = 0; i < tasks.length; i++){
      if(tasks[i].complete_date !== null){
        total += new Date(tasks[i].complete_date) - new Date(tasks[i].create_date);
        count++;
      }
    }
    var ONE_DAY = 1000 * 60 * 60 * 24;
    $scope.ave_response = timeConversion(new Date(total / count));

    var project_month = new Array();
    for(var i = 0; i < 12; i++){
      project_month[i] = [];
    }
    
    var projects = list_projects;
    projects = projects.filter(function(project){
      var collabs = DataService.getCollabById(list_collabs, list_users, project.id);
      var user_exist = filterFilter(collabs, {id : getCookie('userid')})[0];
      return user_exist !== undefined;
    });

    for(var i = 0; i < projects.length; i++){
      projects[i].tasks = filterFilter(list_tasks, {project_id : projects[i].id });
      var data = {}
      var project = {};
      project.name = projects[i].name;
      project.tasklength = projects[i].tasks.length;
      projectsnames.push(projects[i].name);
      shown_projects_tasks.push(project);
      var date =  new Date(projects[i].create_date);
      projects[i].real = date.getTime();
      projectstasks.push(projects[i].tasks.length);
      if(projects[i].deadline_date !== null){
        var datetime  = null;
        if(projects[i].deadline_time !== null){
          datetime = new Date(projects[i].deadline_date + ' ' + projects[i].deadline_time);
        }
         datetime = new Date(projects[i].deadline_date);
         var date = new Date();
         if(datetime.getTime() <= date.getTime()){
          var task_completed = filterFilter(projects[i].tasks, {complete_date : null})[0];
          if(task_completed === undefined){
            data.name = projects[i].name;
            var date1 = new Date(projects[i].create_date);
            var date2 = new Date();
            var timeDiff = Math.abs(datetime.getTime() - date1.getTime());
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
            data.days = diffDays;
            projectsdate.push(diffDays);
            shown_projects.push(data);
          }
         }
         if(datetime !== null){
           project_month[datetime.getMonth()].push(projects[i]);
         }   
      }
    }

    
    
    shown_projects_tasks = $filter('orderBy')(shown_projects_tasks, 'tasklength');
    shown_projects = $filter('orderBy')(shown_projects, 'days');
    var task_completed = new Array();
    for(var i = 0 ; i < 7 ; i++){
      task_completed[i] = [];
    }

    var task_samples = filterFilter(tasks, {complete_date : null});
    var overdue_tasks = [];
    var incomplete_tasks = [];
    for(var i = 0; i < task_samples.length; i++){
      var not_due = false;
      if(task_samples[i].deadline_date !== null){
        var datetime  = null;
        var data = {};
        if(task_samples[i].deadline_time !== null){
          datetime = new Date(task_samples[i].deadline_date + ' ' + task_samples[i].deadline_time);
        }
         datetime = new Date(task_samples[i].deadline_date);
         var date = new Date();
         if(datetime.getTime() <= date.getTime()){             
            data.name = task_samples[i].title;
            var date1 = new Date(task_samples[i].create_date);
            var date2 = new Date();
            var timeDiff = Math.abs(datetime.getTime() - date1.getTime());
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
            data.time = timeConversion(diffDays);
            data.real = diffDays;
            overdue_tasks.push(data);           
         } else {
           not_due = true;
         }
      }
      if(not_due){
        var data = {};
        data.name = task_samples[i].title;
        var date1 = new Date(task_samples[i].create_date);
        var date2 = new Date();
        var timeDiff = Math.abs(date2.getTime() - date1.getTime());
        data.time = timeConversion(timeDiff);
        data.real = timeDiff;
        incomplete_tasks.push(data);
      } 
      
    }
    incomplete_tasks = $filter('orderBy')(incomplete_tasks, '-real');
    if(incomplete_tasks.length > 0){
      $scope.incomplete_task = incomplete_tasks[0];
    }
    overdue_tasks = $filter('orderBy')(overdue_tasks, '-real');
    if(overdue_tasks.length > 0){
      $scope.overdue_task = overdue_tasks[0];
    }

    var min = 1;
    min = projects[0].real;
    if(projects.length > 0){
     for(var i = 0; i <  projects.length; i++){
      if(projects[i].real !== null){
         if(projects[i].real < min){
           min = projects[i].real;
         }
       }
      }
    } else {
      var arranged = $filter('orderBy')(tasks, 'create_date');
      if(arranged.length > 0){
       var min_task = new Date(arranged[0].create_date);
       min = min_task.getTime();
      }
    }

    var now = new Date();   
    min = timeConversionForDay(now.getTime() - min)
    var count = 0;
    for(var i = 0; i < tasks.length; i++){
      if(tasks.complete_date !== null){
         count++;
      }
    }

    $scope.ave_task = Math.floor(count / min);
    ctrl.setLineGraph();
    ctrl.setBarGraph();
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
ctrl.setBarGraph = function(){
  var ctxBar = document.getElementById("bar").getContext("2d");
  var names = [];
  var length = [];
  for(var i = 0; i < shown_projects_tasks.length; i++){
    names.push(shown_projects_tasks[i].name);
    length.push(shown_projects_tasks[i].tasklength);
  }
  var myChart = new Chart(ctxBar, {
  type: 'bar',
  data: {
      labels: names,
      datasets: [{
          label: 'No. of Tasks Per Project',
          data: length,
          backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)'
          ],
          borderColor: [
              'rgba(255,99,132,1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
      }]
  },
  options: {
      scales: {
          yAxes: [{
              ticks: {
                  beginAtZero:true
              }
          }]
      }
  }
});
}
ctrl.setLineGraph = function(){
  var names = [];
  var days = [];
  for(var i = 0; i < shown_projects.length; i++){
    names.push(shown_projects[i].name);
    days.push(shown_projects[i].days);
  }
  var ctxLine = document.getElementById("line").getContext("2d");
  var data = {
  labels: names,
  datasets: [
      {
          label: "Completed Projects By Days",
          fill: false,
          lineTension: 0.1,
          backgroundColor: "rgba(75,192,192,0.4)",
          borderColor: "rgba(75,192,192,1)",
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: "rgba(75,192,192,1)",
          pointBackgroundColor: "#fff",
          pointBorderWidth: 1,
          pointHoverRadius: 10,
          pointHoverBackgroundColor: "rgba(75,192,192,1)",
          pointHoverBorderColor: "rgba(220,220,220,1)",
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: days,
          spanGaps: false,
      }
  ]
};
    var myLineChart = new Chart(ctxLine, {
    type: 'line',
    data: data,
    options: []
  });
}
  function timeConversionForDay(millisec){
    var days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1);
    return days;
  }
   function timeConversion(millisec) {

      var seconds = (millisec / 1000).toFixed(1);

      var minutes = (millisec / (1000 * 60)).toFixed(1);

      var hours = (millisec / (1000 * 60 * 60)).toFixed(1);

      var days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1);

      if (seconds < 60) {
          return seconds + " sec";
      } else if (minutes < 60) {
          return minutes + " min";
      } else if (hours < 24) {
          return hours + " hrs";
      } else {
          return days + " days";
      }
  }
  
  ctrl.setNeededData();
}]);

