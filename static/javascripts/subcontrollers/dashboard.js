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

        $scope.data = [
            {
                "key" : "North America" ,
                "values" : [ [ 1025409600000 , 23.041422681023] , [ 1028088000000 , 19.854291255832] , [ 1030766400000 , 21.02286281168] , [ 1033358400000 , 22.093608385173] , [ 1036040400000 , 25.108079299458] , [ 1038632400000 , 26.982389242348] , [ 1041310800000 , 19.828984957662] , [ 1043989200000 , 19.914055036294] , [ 1046408400000 , 19.436150539916] , [ 1049086800000 , 21.558650338602] , [ 1051675200000 , 24.395594061773] , [ 1054353600000 , 24.747089309384] , [ 1056945600000 , 23.491755498807] , [ 1059624000000 , 23.376634878164] , [ 1062302400000 , 24.581223154533] , [ 1064894400000 , 24.922476843538] , [ 1067576400000 , 27.357712939042] , [ 1070168400000 , 26.503020572593] , [ 1072846800000 , 26.658901244878] , [ 1075525200000 , 27.065704156445] , [ 1078030800000 , 28.735320452588] , [ 1080709200000 , 31.572277846319] , [ 1083297600000 , 30.932161503638] , [ 1085976000000 , 31.627029785554] , [ 1088568000000 , 28.728743674232] , [ 1091246400000 , 26.858365172675] , [ 1093924800000 , 27.279922830032] , [ 1096516800000 , 34.408301211324] , [ 1099195200000 , 34.794362930439] , [ 1101790800000 , 35.609978198951] , [ 1104469200000 , 33.574394968037] , [ 1107147600000 , 31.979405070598] , [ 1109566800000 , 31.19009040297] , [ 1112245200000 , 31.083933968994] , [ 1114833600000 , 29.668971113185] , [ 1117512000000 , 31.490638014379] , [ 1120104000000 , 31.818617451128] , [ 1122782400000 , 32.960314008183] , [ 1125460800000 , 31.313383196209] , [ 1128052800000 , 33.125486081852] , [ 1130734800000 , 32.791805509149] , [ 1133326800000 , 33.506038030366] , [ 1136005200000 , 26.96501697216] , [ 1138683600000 , 27.38478809681] , [ 1141102800000 , 27.371377218209] , [ 1143781200000 , 26.309915460827] , [ 1146369600000 , 26.425199957518] , [ 1149048000000 , 26.823411519396] , [ 1151640000000 , 23.850443591587] , [ 1154318400000 , 23.158355444054] , [ 1156996800000 , 22.998689393695] , [ 1159588800000 , 27.9771285113] , [ 1162270800000 , 29.073672469719] , [ 1164862800000 , 28.587640408904] , [ 1167541200000 , 22.788453687637] , [ 1170219600000 , 22.429199073597] , [ 1172638800000 , 22.324103271052] , [ 1175313600000 , 17.558388444187] , [ 1177905600000 , 16.769518096208] , [ 1180584000000 , 16.214738201301] , [ 1183176000000 , 18.729632971229] , [ 1185854400000 , 18.814523318847] , [ 1188532800000 , 19.789986451358] , [ 1191124800000 , 17.070049054933] , [ 1193803200000 , 16.121349575716] , [ 1196398800000 , 15.141659430091] , [ 1199077200000 , 17.175388025297] , [ 1201755600000 , 17.286592443522] , [ 1204261200000 , 16.323141626568] , [ 1206936000000 , 19.231263773952] , [ 1209528000000 , 18.446256391095] , [ 1212206400000 , 17.822632399764] , [ 1214798400000 , 15.53936647598] , [ 1217476800000 , 15.255131790217] , [ 1220155200000 , 15.660963922592] , [ 1222747200000 , 13.254482273698] , [ 1225425600000 , 11.920796202299] , [ 1228021200000 , 12.122809090924] , [ 1230699600000 , 15.691026271393] , [ 1233378000000 , 14.720881635107] , [ 1235797200000 , 15.387939360044] , [ 1238472000000 , 13.765436672228] , [ 1241064000000 , 14.631445864799] , [ 1243742400000 , 14.292446536221] , [ 1246334400000 , 16.170071367017] , [ 1249012800000 , 15.948135554337] , [ 1251691200000 , 16.612872685134] , [ 1254283200000 , 18.778338719091] , [ 1256961600000 , 16.756026065421] , [ 1259557200000 , 19.385804443146] , [ 1262235600000 , 22.950590240168] , [ 1264914000000 , 23.61159018141] , [ 1267333200000 , 25.708586989581] , [ 1270008000000 , 26.883915999885] , [ 1272600000000 , 25.893486687065] , [ 1275278400000 , 24.678914263176] , [ 1277870400000 , 25.937275793024] , [ 1280548800000 , 29.461381693838] , [ 1283227200000 , 27.357322961861] , [ 1285819200000 , 29.057235285673] , [ 1288497600000 , 28.549434189386] , [ 1291093200000 , 28.506352379724] , [ 1293771600000 , 29.449241421598] , [ 1296450000000 , 25.796838168807] , [ 1298869200000 , 28.740145449188] , [ 1301544000000 , 22.091744141872] , [ 1304136000000 , 25.07966254541] , [ 1306814400000 , 23.674906973064] , [ 1309406400000 , 23.418002742929] , [ 1312084800000 , 23.24364413887] , [ 1314763200000 , 31.591854066817] , [ 1317355200000 , 31.497112374114] , [ 1320033600000 , 26.67238082043] , [ 1322629200000 , 27.297080015495] , [ 1325307600000 , 20.174315530051] , [ 1327986000000 , 19.631084213898] , [ 1330491600000 , 20.366462219461] , [ 1333166400000 , 19.284784434185] , [ 1335758400000 , 19.157810257624]]
            }

        ]
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

