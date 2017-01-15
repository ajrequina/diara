////////////////////////////////////////////////////////////////////////////////
var express =           require('express');                                     // express
var app =               express();                                              // main server instance
var http =              require('http');                                        // for the web
var bodyParser =        require('body-parser');                                 // for getting data from post methods in web
var morgan =            require('morgan');                                      // dev's
var consolidate =       require('consolidate');                                 // ui django
var UAParser =          require('ua-parser-js');                                // for getting user browser data
var cookieParser =      require('cookie-parser');                               // cookies
var uuid =              require('node-uuid');                                   // unique id's
var fs =                require('fs');                                          // file system
var options =           {promiseLib: Promise};                                  // init pgp option type
var pgp =               require('pg-promise')(options);                         // database
var connectionString =  'postgres://diara:mrjacarty@127.0.0.1:5432/diara';      // Connecion string to db
var db =                pgp(connectionString);                                  // connect to db
var multer =            require('multer');                                      // file transfer
var gcm =               require('node-gcm');                                    // push notifications
var sender =            new gcm.Sender('AIzaSyA-iRfQdkKbC7Y-Ewcadt1mbcY0ajx43Gc'); // push notif sender
var picstorage =        multer.diskStorage({
  destination: function(req, file, cb) { cb(null, 'uploads/profpics/'); },
  filename:    function(req, file, cb) { cb(null, Date.now()+file.originalname); }
});
var picuploads =        multer({storage: picstorage});
var attstorage =        multer.diskStorage({
  destination: function(req, file, cb) { cb(null, 'uploads/attachments/'); },
  filename:    function(req, file, cb) { cb(null, Date.now()+file.originalname); }
});
var attuploads =        multer({storage: attstorage});
////////////////////////////////////////////////////////////////////////////////
var server = http.createServer(app);
var io = require('socket.io')(server);
server.listen(1532, function() {console.log('DIARA : Server Running!');});      // start and listen to server
//////////////////////////////// MIDDLEWARES ///////////////////////////////////
app.use(cookieParser());
app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'));
app.use('/uploads', express.static(__dirname + '/uploads'));
app.engine('html', consolidate.nunjucks);
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});
////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////     /////////////////////////////////////////
///////////////////////////////    WEB    //////////////////////////////////////
//////////////////////////////////     /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
{
  //////////////////////////////////  BASICS  //////////////////////////////////
  io.sockets.on('connection',        function(socket) {
    socket.on('TASK ADDED',      function() {socket.broadcast.emit('TASK ADDED'); });
    socket.on('TASK UPDATED',    function() {socket.broadcast.emit('TASK UPDATED'); });
    socket.on('TASK DELETED',    function() {socket.broadcast.emit('TASK DELETED'); });
    socket.on('PROJECT ADDED',   function() {socket.broadcast.emit('PROJECT ADDED'); });
    socket.on('PROJECT UPDATED', function() {socket.broadcast.emit('PROJECT UPDATED'); });
    socket.on('PROJECT DELETED', function() {socket.broadcast.emit('PROJECT DELETED'); });
    socket.on('COMMENT ADDED',   function() {socket.broadcast.emit('COMMENT ADDED'); });
    socket.on('COMMENT ADDED',   function() {socket.broadcast.emit('COMMENT ADDED'); });
  });
  app.get('/',                       function(req, res) {
    res.redirect('/login');
  });
  app.get('/home',                   function(req, res) {
    var userid = req.cookies.userid;
    if (userid) {
      db.one('select logged_in,first_name,last_name,username,profpic_path from person where id = $1',userid)
      .then(function(data) {
        var name = data.first_name+" "+data.last_name;
        console.log("LOGGED_IN? : "+data.logged_in);
        if (data.logged_in) res.render('home.html',{name:name,username:data.username,profpicpath:'http://localhost:1532/'+data.profpic_path});

        else throw 'user id in cookie is not logged in!';
      })
      .catch(function(error) {
        console.log("ERROR in DASHBOARD : "+error+'\n');
        res.render('login.html');
      });
    }
    else {
      console.log("ERROR in DASHBOARD : cookie does not exist yet!\n");
      res.render('login.html');
    }
  });
  app.get('/signup',                 function(req, res) {
    var userid = req.cookies.userid;
    if (userid) {
      res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
      db.one('select logged_in from person where id = $1',userid)
      .then(function(data) {
        if (data.logged_in) {
          console.log("SIGNUP SUCCESS!\n");
          res.redirect('/home');
        }
        else throw 'user id in cookie is not logged in!';
      })
      .catch(function(error) {
        console.log('GET SIGNUP ERROR : '+error+'\n');
        res.render('signup.html');
      });
    }
    else {
      console.log("Cookie has no value... \n");
      res.render('signup.html');
    }
  });

  app.post('/signup',                function(req, res) {
    var firstname =   req.body.firstname;
    var lastname =    req.body.lastname;
    var username =    req.body.username;
    var email =       req.body.email;
    var password =    req.body.password;
    var confirm =     req.body.confirm;
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    db.one("select count(*) from person where email = $1",email)
    .then(function(data) {
      var uniquecheck = true;
      if(data.count > 0) {
        uniquecheck = false;
        throw "An account already exists with that Email Address.";
      }
      return uniquecheck;
    })
    .then(function(uniquecheck) {
      if(uniquecheck == true) {
        db.one("select count(*) from person where username = $1",username)
        .then(function(data) {
          uniquecheck = false;
          if(data.count > 0) {
            res.json( {error : 'An account already exists with that Username.'});
          }
        });
      }
      return uniquecheck;
    })
    .then(function(uniquecheck){
      if(uniquecheck == true) {
        if (password == confirm && checkEmail(email)) {
          var id = uuid.v1();
          db.none("insert into person (id,first_name,last_name,username,email,password,logged_in) values($1,$2,$3,$4,$5,$6,'t')",[id,firstname,lastname,username,email,password])
          .then(function() {
              res.cookie('userid',id);
              var date =                 new Date();
              var logdate =              date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
              var parser =               new UAParser();
              var ua =                   req.headers['user-agent'];
              var browserName =          parser.setUA(ua).getBrowser().name;
              var fullBrowserVersion =   parser.setUA(ua).getBrowser().version;
              var browserVersion =       fullBrowserVersion.split(".",1).toString();
              var carrier =              browserName+" "+browserVersion;
              var ip =                   req.connection.remoteAddress;
              var logid =                uuid.v1();
              db.none("insert into logs (id,user_id,action,log_date,carrier,ip_address) values($1,$2,'login',$3,$4,$5)",[logid,id,logdate,carrier,ip]);
              res.redirect('/home');
          })
        }
        else if (!checkEmail(email)){
          console.log('ERROR IN SIGNUP : email invalid!\n');
          throw "Invalid UP Mail address!";
        }
        else if (password != confirm){
          console.log('ERROR IN SIGNUP : passwords does not match!\n');
          throw "Passwords does not match!";
        }
      }
    })
    .catch(function(error) {
      console.log("ERROR : "+error+'\n');
      res.json({error:error});
    });
  });
  app.get('/login',                  function(req, res) {
    var userid = req.cookies.userid;
    if (userid) {
      res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
      db.one('select logged_in from person where id = $1', userid)
      .then(function(data) {
        if (data.logged_in) {
          console.log("LOGIN SUCCESS!\n");
          res.redirect('/home');
        } else if(!data.logged_in){
          console.log("LOGIN SUCCESS!\n");
          res.redirect('/home');
        }
        else
          throw 'user id in cookie is not logged in!'
      })
      .catch(function(error) {
        console.log("ERROR IN LOGIN : " + error + "\n");
        res.render('login.html');
      });
    }
    else {
      console.log("Cookie has no value... \n");
      res.render('login.html');
    }
  });
  app.post('/login',                 function(req, res) {
    var userid =    req.cookies.userid;
    var user =      req.body.user;
    var password =  req.body.password;
    var date =      new Date("year", "month", "day", "hours", "minutes", "seconds", "milliseconds");
    var promise;
    var test =      "";
    if (checkEmail(user)) test = "email";
    else test = "username";
    db.one("select id from person where "+test+" = $1 and password = $2",[user,password])
    .then(function(data) {
      res.cookie('userid',data.id);
      var logdate =              date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
      var parser =               new UAParser();
      var ua =                   req.headers['user-agent'];
      var browserName =          parser.setUA(ua).getBrowser().name;
      var fullBrowserVersion =   parser.setUA(ua).getBrowser().version;
      var browserVersion =       fullBrowserVersion.split(".",1).toString();
      var carrier =              browserName+" "+browserVersion;
      var ip =                   req.connection.remoteAddress;
      var log_id =               uuid.v1();
      db.none("insert into logs (id,user_id,action,log_date,carrier,ip_address) values($1,$2,'login',$3,$4,$5)",[log_id,data.id,logdate,carrier,ip]);
      db.none("update person set logged_in = 'true' where id = $1",data.id);
      res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
      console.log("Login Success!");
      res.redirect('/home');
    })
    .catch(function(error) {
      console.log('ERROR IN LOGIN post : '+error);
      res.json({error : 'Username/Email or Password is incorrect!'});
    });
  });
  app.get('/logout',                 function(req, res) {
    var userid =  req.cookies.userid;
    if (userid) {
      db.none("update person set logged_in = 'f' where id = $1",userid)
        .then(function(data){
          var date =                new Date();
          var logtime =             date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
          var parser =              new UAParser();
          var ua =                  req.headers['user-agent'];
          var browserName =         parser.setUA(ua).getBrowser().name;
          var fullBrowserVersion =  parser.setUA(ua).getBrowser().version;
          var browserVersion =      fullBrowserVersion.split(".",1).toString();
          var carrier =             browserName+" "+browserVersion;
          var ip =                  req.connection.remoteAddress;
          var log_id =              uuid.v1();
          db.none("insert into logs (id,user_id,action,log_date,carrier,ip_address) values($1,$2,'logout',$3,$4,$5)",[log_id,userid,logtime,carrier,ip]);
          console.log("LOGOUT SUCCESS!\n");
          res.render('login.html');
        })
        .catch(function(error) {
          console.log('ERROR IN LOGOUT : '+error+'\n');
          res.redirect('/home');
        });
    }
    else {
      console.log('ERROR IN LOGOUT : userid does not exist : '+error+'\n');
      res.redirect('/home');
    }
  });
  app.post('/changepassword',        function(req, res) {
    var op =      req.body.oldpassword;
    var np1 =     req.body.newpassword1;
    var np2 =     req.body.newpassword2;
    var userid =  req.cookies.userid;
    db.one('select password from person where id = $1',userid)
    .then(function(data) {
      if (data.password == op && np1 == np2 && op != np1) {
        var logid =               uuid.v1();
        var date =                new Date();
        var logdate =             date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
        var parser =              new UAParser();
        var ua =                  req.headers['user-agent'];
        var browserName =         parser.setUA(ua).getBrowser().name;
        var fullBrowserVersion =  parser.setUA(ua).getBrowser().version;
        var browserVersion =      fullBrowserVersion.split(".",1).toString();
        var carrier =             browserName+" "+browserVersion;
        var ip =                  req.connection.remoteAddress;
        db.none("update person set password=$1,logged_in='f' where id=$2",[np1,userid]);
        db.none("insert into logs (id,user_id,action,log_date,carrier,ip_address) values($1,$2,'logout',$3,$4,$5)",[logid,userid,logdate,carrier,ip]);
        console.log("CHANGEPASSWORD SUCCESS!\n");
        res.render('login.html');
      }
      else if (op == np1) {
        throw 'New password must not be the same with current password!';
      }
      else if (data.password != op) {
        throw 'Current password incorrect!\n';
      }
    })
    .catch(function(error) {
      console.log('ERROR IN CHANGEPASSWORD : '+error+'\n');
      res.json({error : error});
    });
  });
  /////////////////////////////////  CREATE  ///////////////////////////////////
  app.get('/createproject',          function(req, res) {
    res.sendFile(__dirname+'/views'+'/popup/createproject.html');
  });
  app.post('/createproject',         function(req, res) {
    var userid =        req.cookies.userid;
    var title =         req.body.title;
    var description =   req.body.description;
    var deadlinedate =  req.body.deadlinedate;
    var deadlinetime =  req.body.deadlinetime;
    var collaborators = req.body.collaborators;
    var date =          new Date();
    var createdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    var id =            uuid.v1();
    var promise;
    if (deadlinedate === null)
      promise = db.none("insert into project (id,user_id,name,description,create_date,edit_date,deleted) values($1,$2,$3,$4,$5,$6,'false')",[id,userid,title,description,createdate,createdate]);
    else{
      var deadlineday = deadlinedate.substring(0,2);//japs and all device with same same probs
      var deadlinemonth = deadlinedate.substring(3,5);//japs and all device with same same probs
      var deadlineyear = deadlinedate.substring(6,10);//japs and all device with same same probs
      var deadlinedate = deadlineyear + "-" + deadlinemonth + "-" + deadlineday;//japs and all device with same same probs
      if (deadlinetime === null)
        promise = db.none("insert into project (id,user_id,name,description,create_date,deadline_date,edit_date,deleted) values($1,$2,$3,$4,$5,$6,$7,'false')",[id,userid,title,description,createdate,deadlinedate,createdate]);
      else
        promise = db.none("insert into project (id,user_id,name,description,create_date,deadline_date,deadline_time,edit_date,deleted) values($1,$2,$3,$4,$5,$6,$7,$8,'false')",[id,userid,title,description,createdate,deadlinedate,deadlinetime,createdate]);
    }
    for (var i = 0; i < collaborators.length; i++) {
      db.none("insert into collaborator (project_id, person_id, status) values($1,$2,$3)",[id,collaborators[i].id,'test status - approved'])
      .catch(function(error) {
        console.log("ERROR IN POST CREATEPROJECT : "+error+'\n');
        res.json({message : 'An Error Occurred!'});
      });
    }
    promise
    .then(function() {
      console.log('Project Created Successfully!\n');
      var data = {
        userid : userid,
        projectid : id,
        title: title,
        description: description,
        createdate: createdate,
        deadlinedate: deadlinedate,
        deadlinetime: deadlinetime,
        collaborators: collaborators
      }
      io.emit("/createproject",data);
      res.json({message : 'Project Created Successfully!', data : data});
    })
    .catch(function(error) {
      console.log("ERROR IN POST CREATEPROJECT : "+error+'\n');
      res.json({message : 'An Error Occurred!'});
    });
  });
  app.get('/createtask',             function(req, res) {
    res.sendFile(__dirname + "/views" + "/popup/createtask.html");
  });
  app.get('/createprojecttask',      function(req, res) {
    res.sendFile(__dirname + "/views" + "/popup/createprojecttask.html");
  })
  app.post('/createtask',            function(req, res) {
    var userid =        req.cookies.userid;
    var title =         req.body.title;
    var description =   req.body.description;
    var deadlinedate =  req.body.deadlinedate;
    var deadlinetime =  req.body.deadlinetime;
    var projectid   =  req.body.projectid;
    var ptask =         req.body.ptask;
    var assignedUser =  req.body.assignedUser;
    var date =          new Date();
    var createdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    var id =            uuid.v1();
    var promise;
    if(deadlinedate === null)
      promise = db.none("insert into task (id,user_id,title,description,create_date,task_id,project_id,edit_date,deleted) values($1,$2,$3,$4,$5,$6,$7,$8,'false')",[id,userid,title,description,createdate,ptask,projectid,createdate]);
    else {
      var deadlineday = deadlinedate.substring(0,2); // for japs' laptop kay kaluoy mn
      var deadlinemonth = deadlinedate.substring(3,5); // for japs' laptop kay kaluoy mn
      var deadlineyear = deadlinedate.substring(6,10); // for japs' laptop kay kaluoy mn
      deadlinedate = deadlineyear + "-" + deadlinemonth + "-" + deadlineday; // for japs' laptop kay kaluoy mn
      if (deadlinetime === null)
        promise = db.none("insert into task (id,user_id,title,description,create_date,deadline_date,task_id,project_id,edit_date,deleted) values($1,$2,$3,$4,$5,$6,$7,$8,$9,'false')",[id,userid,title,description,createdate,deadlinedate,ptask,projectid,createdate]);
      else
        promise = db.none("insert into task (id,user_id,title,description,create_date,deadline_date,deadline_time,task_id,project_id,edit_date,deleted) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false)",[id,userid,title,description,createdate,deadlinedate,deadlinetime,ptask,projectid,createdate]);
    }
    promise.then(function() {
      db.one("select max(create_date) from task")
      .then(function(data){
        if(assignedUser.length === undefined){
          db.none("inse rt into assignment(assignee_id,assigner_id,task_id,assign_date) values($1,$2,$3,$4)",[assignedUser.id,userid,id,createdate]);
        } else {
          for(var i = 0; i < assignedUser.length; i++)
          db.none("insert into assignment(assignee_id,assigner_id,task_id,assign_date) values($1,$2,$3,$4)",[assignedUser[i].id,userid,id,createdate]);
        }
        console.log('Create Task Success!\n');
        var data = {
          userid: userid,
          taskid: id,
          projectid: projectid,
          title: title,
          description: description,
          createdate: createdate,
          deadlinedate: deadlinedate,
          deadlinetime: deadlinetime,
          parenttask: ptask,
          assignedUsers: assignedUser
        }
        io.emit("/createtask",data);
        res.json({message:'Task Created Successfully!', data : data});
      })
      .catch(function(error){
        console.log('ERROR IN CREATE TASK POST : '+error+'\n');
        res.json({message:'An Error Occurred!'});
      });
    })
    .catch(function(error) {
      console.log('ERROR IN CREATE TASK POST : '+error+'\n');
      res.json({message:'An Error Occurred!'});
    });
  })
  app.get('/addsubtask',             function(req, res) {
    res.sendFile(__dirname + "/views" + "/popup/addsubtask.html");
  });
  app.post('/addcomment',            function(req, res){
    var date = new Date();
    var createdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    var taskid = req.body.taskid;
    var userid = req.cookies.userid;
    var comment = req.body.comment;
    var assignees = req.body.assignees;
    var id = uuid.v1();
    db.none("insert into comment (id, task_id, user_id, comment, comment_date, edit_date, deleted) values ($1,$2,$3,$4,$5,$6,'false')", [id, taskid, userid, comment, createdate, createdate])
      .then(function(data){
        console.log('Comment Added Successfully!\n');
        var data = {
          commentid : id,
          userid : userid,
          taskid : taskid,
          comment : comment,
          createdate: createdate,
          assignees : assignees
        }
        io.emit("/addcomment",data);
        res.json({message : 'Commented Successfully!', data : data});
      })
      .catch(function(error){
        console.log('ERROR IN ADD COMMENT POST : '+error+'\n');
        res.json({message:'An Error Occurred!'});
      });
  });
  app.post('/addnotif',              function(req, res) {
    var arrNotif = req.body.arrNotif;
    var arrNotify = [];
    for(var i = 0; i < arrNotif.length; i++){
      var id = uuid.v1();
      var d = {
        id : id,
        user_id : arrNotif[i].userid,
        type : arrNotif[i].type,
        type_id :  arrNotif[i].typeid,
        message: arrNotif[i].message,
        operation : arrNotif[i].operation,
        create_date : arrNotif[i].createdate,
        read_date : null
      }
      arrNotify.push(d);
      db.none("insert into notif (id,user_id,type,type_id,message,operation,create_date) values ($1,$2,$3,$4,$5,$6,$7)",
              [id, arrNotif[i].userid, arrNotif[i].type, arrNotif[i].typeid, arrNotif[i].message, arrNotif[i].operation, arrNotif[i].createdate])
             .then(function(data){

             })
             .catch(function(error){
              console.log("ADD NOTIF (ERROR) : " + error);
              res.json({message : "An Error Occurred!"});
              return;
             })
    }


    res.json({message : "Notifications Added Successfully!"});
    io.emit("/addnotif", arrNotify);
  });
  app.post('/addattachment',         attuploads.array('atts'), function(req, res) {
    var taskid = req.body.taskid;
    var userid = req.cookies.userid;
    var assignees = req.body.assignees;
    var pathdirs = [];
    if(req.files !== undefined){
      for (var i = 0; i < req.files.length; i++) {
        pathdirs.push(req.files[i].path);
      }
    }
    var date = new Date();
    var createdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();

    for (var i = 0; i < req.files.length; i++) {
      db.none("insert into attachment (task_id,filename,create_date,deleted) values ($1,$2,$3,'false')",[taskid,req.files[i].path,createdate])
        .then(function(data) {
          console.log('A file added successfully!\n');
        })
        .catch(function(error) {
          console.log("ERROR IN ADD ATTACHMENT" + error);
          res.json({message:'An Error Occurred!'});
        });
    }
    var data = {
      userid : userid,
      taskid : taskid,
      pathdirs : pathdirs,
      createdate : createdate,
      assignees : assignees
    }
    io.emit("/addattachment", data);
    res.json({message:'Files added successfully!', data : data});
  });
  /////////////////////////////////  UPDATES  //////////////////////////////////
  app.post('/updateuserinfo',        picuploads.single('pic'), function(req, res) {
    var fname = req.body.firstname;
    var lname = req.body.lastname;
    var oldfname = req.body.oldfirstname;
    var oldlname = req.body.oldlastname;
    var info = req.body.info;
    var oldinfo = req.body.oldinfo;
    var pathdir = undefined;
    var oldpathdir = undefined;
    if(req.file !== undefined){
      pathdir = req.file.path;
      oldpathdir = req.file.oldpath;
    }
    //console.log(req.body.buffer);
   // storeFile('uploads/profpics/',req.body.filename, req.body.file);
    var id = req.cookies.userid;
    var promise;
    if (pathdir === undefined) {
      promise = db.none('update person set first_name = $1, last_name = $2, info = $3 where id = $4',[fname, lname, info, id])
    }
    else {
      promise = db.none('update person set first_name = $1, last_name = $2, info = $3, profpic_path = $4 where id = $5',[fname, lname, info, pathdir, id])
    }
    promise
    .then(function(data) {
      console.log('User info updated successfully!\n');
      var data = {
        userid : id,
        fname : fname,
        oldfname : oldfname,
        lname : lname,
        oldlname : oldlname,
        info : info,
        oldinfo : oldinfo,
        pathdir : pathdir,
        oldpathdir : oldpathdir
      }
      io.emit("/updateuserinfo", data);
      res.json({message:'User Information Updated Successfully!'});
    })
    .catch(function(error) {
      console.log("ERROR IN UPDATE USER INFO!" + error);
      res.json({message:'An Error Occurred!'});
    });
  })
  app.post('/updateprojectname',     function(req, res) {
    var projectname = req.body.name;
    var oldprojectname = req.body.oldname;
    var userid = req.cookies.userid;
    var projectid = req.body.projectid;
    var date =          new Date();
    var collaborators = req.body.collaborators;
    var editdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    db.none('update project set name = $1,edit_date = $2 where id = $3',[projectname,editdate,projectid])
      .then(function(data) {
        console.log('Project Name updated successfully!\n');
        var data = {
          userid : userid,
          projectid : projectid,
          projectname : projectname,
          oldprojectname : oldprojectname,
          editdate : editdate,
          collaborators : collaborators
        }
        io.emit("/updateprojectname", data);
        res.json({conf:true, data : data});
      })
      .catch(function(error) {
        console.log("ERROR IN UPDATE PROJECT NAME!" + error);
        res.json({conf:false});
      });
  });
  app.post('/updateprojectdesc',     function(req, res) {
    var description = req.body.description;
    var olddescription = req.body.olddescription;
    var projectid = req.body.projectid;
    var userid = req.cookies.userid;
    var date =          new Date();
    var collaborators = req.body.collaborators;
    var editdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    db.none('update project set description = $1, edit_date = $2 where id = $3',[description,editdate,projectid])
      .then(function(data) {
        var data = {
          userid : userid,
          projectid : projectid,
          description : description,
          olddescription : olddescription,
          editdate : editdate,
          collaborators : collaborators
        }
        console.log('Project description updated successfully!\n');
        io.emit("/updateprojectdesc", data);
        res.json({conf:true, data : data});
      })
      .catch(function(error) {
        console.log("ERROR IN UPDATE PROJECT DESCRIPTION!" + error);
        res.json({conf:false});
      });
  });
  app.post('/updateprojectdeadline', function(req, res) {
    var deadlinedate =  req.body.deadlinedate;
    var deadlinetime =  req.body.deadlinetime;
    var olddeadlinedate =  req.body.olddeadlinedate;
    var olddeadlinetime =  req.body.olddeadlinetime;
    var deadlineday = deadlinedate.substring(0,2);
    var deadlinemonth = deadlinedate.substring(3,5);
    var deadlineyear = deadlinedate.substring(6,10);
    var deadlinedate = deadlineyear + "-" + deadlinemonth + "-" + deadlineday;
    var projectid = req.body.projectid;
    var userid = req.cookies.userid;
    var date =          new Date();
    var collaborators = req.body.collaborators;
    var editdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    db.none('update project set deadline_date = $1, deadline_time = $2, edit_date = $3 where id = $4',[deadlinedate,deadlinetime,editdate,projectid])
      .then(function(data) {
        console.log('Project deadline updated successfully!\n');
        var data = {
          userid : userid,
          projectid : projectid,
          deadlinedate : deadlinedate,
          olddeadlinedate : olddeadlinedate,
          deadlinetime : deadlinetime,
          olddeadlinetime : olddeadlinetime,
          editdate : editdate,
          collaborators : collaborators
        }
        io.emit("/updateprojectdeadline", data);
        res.json({conf:true, data : data});
      })
      .catch(function(error) {
        console.log("ERROR IN UPDATE PROJECT DEADLINE!" + error);
        res.json({conf:false});
      });
  });
  app.post('/updatetaskname',        function(req, res) {
    var tasktitle = req.body.name;
    var oldtasktitle = req.body.oldname;
    var taskid = req.body.taskid;
    var userid = req.cookies.userid;
    var date =          new Date();
    var assignees = req.body.assignees;
    var editdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    db.none('update task set title = $1, edit_date = $2 where id = $3',[tasktitle, editdate, taskid])
      .then(function(data) {
        console.log('Task name updated successfully!\n');
        var data = {
          userid : userid,
          taskid : taskid,
          tasktitle : tasktitle,
          oldtasktitle : oldtasktitle,
          editdate : editdate,
          assignees : assignees
        }
        io.emit("/updatetaskname", data);
        res.json({conf:true, data : data});
      })
      .catch(function(error) {
        console.log("ERROR IN UPDATE TASK NAME!" + error);
        res.json({conf:false});
      });
  });
  app.post('/updatetaskdesc',        function(req, res) {
    var description = req.body.description;
    var olddescription = req.body.olddescription;
    var taskid = req.body.taskid;
    var userid = req.cookies.userid;
    var date =          new Date();
    var assignees = req.body.assignees;
    var editdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    db.none('update task set description = $1, edit_date = $2 where id = $3',[description,editdate,taskid])
      .then(function(data) {
        console.log('Task description updated successfully!\n');
        var data = {
          userid : userid,
          taskid : taskid,
          description : description,
          olddescription : olddescription,
          editdate : editdate,
          assignees : assignees
        }
        io.emit("/updatetaskdesc",data);
        res.json({conf:true, data : data});
      })
      .catch(function(error) {
        console.log("ERROR IN UPDATE TASK DESCRIPTION!" + error);
        res.json({conf:false});
      });
  });
  app.post('/updatetaskdeadline',    function(req, res) {
    var deadlinedate =  req.body.deadlinedate;
    var deadlinetime =  req.body.deadlinetime;
    var olddeadlinedate =  req.body.olddeadlinedate;
    var olddeadlinetime =  req.body.olddeadlinetime;
    var deadlineday = deadlinedate.substring(0,2);
    var deadlinemonth = deadlinedate.substring(3,5);
    var deadlineyear = deadlinedate.substring(6,10);
    var deadlinedate = deadlineyear + "-" + deadlinemonth + "-" + deadlineday;
    var taskid = req.body.taskid;
    var userid = req.cookies.userid;
    var date =          new Date();
    var assignees = req.body.assignees;
    var editdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    db.none('update task set deadline_date = $1, deadline_time = $2, edit_date = $3 where id = $4',[deadlinedate,deadlinetime,editdate,taskid])
      .then(function(data) {
        console.log('Task deadline updated successfully!\n');
        var data = {
          userid : userid,
          taskid : taskid,
          deadlinedate : deadlinedate,
          olddeadlinedate : olddeadlinedate,
          deadlinetime : deadlinetime,
          olddeadlinetime : olddeadlinetime,
          editdate : editdate,
          assignees : assignees
        }
        io.emit("/updatetaskdeadline", data);
        res.json({conf:true, data : data});
      })
      .catch(function(error) {
        console.log("ERROR IN UPDATE TASK DEADLINE!" + error);
        res.json({conf:false});
      });
  });
  app.post('/updateassignee',        function(req, res) {
  var prevUsers = req.body.prev;
  var newUsers = req.body.new;
  var addedUsers = [], removedUsers = [];
  var taskid = req.body.taskid;
  var userid = req.cookies.userid;
  var projectid = req.body.projectid;
  var date = new Date();
  var subtasks = req.body.subtasks;
  var assigndate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();

  for (var i = 0; i < subtasks.length; i++) {
    db.none("update task set project_id = $1 where id = $2",[projectid,subtasks[i].id])
      .then(function(data) {
        console.log("Update project - subtask of task successful!");
      })
      .catch(function(error) {
        console.log("Update project - subtask of task unsuccessful!");
      });
  }
////////////////////////////////////////////////////////////////////////////////
  db.none("update task set project_id = $1 where id = $2",[projectid, taskid])
    .then(function(data) {
      console.log("Update project - task successful!");
    })
    .catch(function(error) {
      console.log("Update project - task unsuccessful!");
    });
    ////update assignees
    for(var j = 0; j < prevUsers.length; j++) {
      db.none("delete from assignment where assignee_id = $1 and task_id = $2",[prevUsers[j].id,taskid])
      .then(function(data){
        console.log("successful deletion!");
      })
      .catch(function(error){
        console.log("error in update task assignee-deleting assignee");
      });
    }
    for(var i = 0; i < subtasks.length; i++){
      for(var j = 0;  j < prevUsers.length; j++){
        db.none("delete from assignment where assignee_id = $1 and task_id = $2", [prevUsers[j].id, subtasks[i].id])
        .then(function(data){
          console.log("successful deletion!");
        })
        .catch(function(error){});
      }
    }
    if(projectid === null){
      for(var i = 0; i < subtasks.length; i++){
        for(var j = 0;  j < newUsers.length; j++){
         db.none("insert into assignment(assignee_id,assigner_id,task_id,assign_date) values($1,$2,$3,$4)",[newUsers[j].id,userid,subtasks[i].id,assigndate])
          .then(function(data){
            console.log("successful insertion!");
          })
          .catch(function(error){});
        }
      }
    }
    for(var j = 0; j < newUsers.length; j++){
       db.none("insert into assignment(assignee_id,assigner_id,task_id,assign_date) values($1,$2,$3,$4)",[newUsers[j].id,userid,taskid,assigndate])
      .then(function(data){
        console.log("successful insertion!");
      })
      .catch(function(error){});
    }
   
    console.log('Update task assignee successful!\n');
    var data = {
      userid : userid,
      taskid : taskid,
      projectid : projectid,
      newUsers : newUsers,
      oldUsers : prevUsers,
      assigndate : assigndate,
      subtasks : subtasks
    }
    io.emit("/updatetaskassignee",data);
    res.json({message:'Task Project and Assignees Updated SuccessfulLy!', data : data});
  });
  // app.post('/updateassignee',        function(req, res) {
  //   var prevUsers = req.body.prev;
  //   var newUsers = req.body.new;
  //   var addedUsers = [], removedUsers = [];
  //   var taskid = req.body.taskid;
  //   var userid = req.cookies.userid;
  //   var projectid = req.body.projectid;
  //   var date = new Date();
  //   var assigndate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
  //   db.none("update task set project_id = $1 where id = $2",[projectid,taskid])
  //     .then(function (data) {
  //       console.log("Update project successful in updateassignee!");
  //     })
  //     .catch(function (error) {
  //       console.log('ERROR IN UPDATE PROJECT OF TASK! : '+error+'\n');
  //       res.json({message:'An Error Occurred!'});
  //     });
  //     for(var j = 0; j < prevUsers.length; j++) {
  //       db.none("delete from assignment where assignee_id = $1 and task_id = $2",[prevUsers[j].id,taskid])
  //       .then(function(data){
  //         console.log("successful deletion!");
  //       })
  //       .catch(function(error){
  //         console.log("error in update task assignee-deleting assignee" + error);
  //       });
  //     }
  //     for(var j = 0; j < newUsers.length; j++) {
  //       db.none("insert into assignment(assignee_id,assigner_id,task_id,assign_date) values($1,$2,$3,$4)",[newUsers[j].id,userid,taskid,assigndate])
  //       .then(function(data){
  //         console.log("successful insertion!");
  //       })
  //       .catch(function(error){
  //         console.log("error in update task assignee-inserting new assignee" + error);
  //       });
  //     }
  //     console.log('Update task assignee successful!\n');
  //     var data = {
  //       userid : userid,
  //       taskid : taskid,
  //       projectid : projectid,
  //       newUsers : newUsers,
  //       oldUsers : prevUsers,
  //       assigndate : assigndate
  //     }
  //     io.emit("/updatetaskassignee",data);
  //     res.json({message:'Task Project and Assignees Updated SuccessfulLy!', data : data});
  // });
  app.post('/updatecollaborator',    function(req, res) {
    var prevUsers = req.body.prev;
    var newUsers = req.body.new;
    var projectid = req.body.projectid;
    var userid = req.cookies.userid;
    for (var i = 0; i < prevUsers.length; i++) {
      db.none("delete from collaborator where project_id = $1 and person_id = $2",[projectid,prevUsers[i].id])
      .catch(function(error) {
        console.log("ERROR IN UPDATE-remove COLLABORATOR: "+error+'\n');
        res.json({message : 'An Error Occurred!'});
      });
    }
    for (var i = 0; i < newUsers.length; i++) {
      db.none("insert into collaborator (project_id, person_id, status) values($1,$2,$3)",[projectid,newUsers[i].id,'test status - approved'])
      .catch(function(error) {
        console.log("ERROR IN UPDATE-add COLLABORATOR: "+error+'\n');
        res.json({message : 'An Error Occurred!'});
      });
    }
    console.log("Update collaborator success!");
    var date = new Date();
    var assigndate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    var data = {
      userid : userid,
      projectid : projectid,
      newUsers : newUsers,
      prevUsers : prevUsers,
      assigndate : assigndate
    }
    io.emit("/updatecollaborator",data);
    res.json({message:'Project Collaborators Updated SuccessfulLy!', data : data});
  });
//   app.post('/updatecollaborator',    function(req, res) {
//     var prevUsers = req.body.prev;
//     var newUsers = req.body.new;
//     var projectid = req.body.projectid;
//     var userid = req.cookies.userid;
//     for (var i = 0; i < prevUsers.length; i++) {
//       db.none("delete from collaborator where project_id = $1 and person_id = $2",[projectid,prevUsers[i].id])
//       .catch(function(error) {
//         console.log("ERROR IN UPDATE-remove COLLABORATOR: "+error+'\n');
//         res.json({message : 'An Error Occurred!'});
//       });
//     }
//     for (var i = 0; i < newUsers.length; i++) {
//       db.none("insert into collaborator (project_id, person_id, status) values($1,$2,$3)",[projectid,newUsers[i].id,'test status - approved'])
//       .catch(function(error) {
//         console.log("ERROR IN UPDATE-add COLLABORATOR: "+error+'\n');
//         res.json({message : 'An Error Occurred!'});
//       });
//     }
//     var removedUsers = [];
//     var flag;
//     for (var j = 0; j < prevUsers.length; j++) {
//       flag = 0;
//       for (var i = 0; i < newUsers.length; i++) {
//         if(prevUsers[i].id == newUsers[j].id) {
//           flag++;
//           break;
//         }
//       }
//       if(flag > 0)
//         removedUsers.push(prevUsers[j].id);
//     }

//     var remtext = '{';
//     for (var i = 0; i < removedUsers.length; i++) {
//       remtext += '' + removedUsers[i];
//       if(i < removedUsers.length-1)
//         remtext+=',';
//     }
//     remtext += '}';

//     db.any("select * from task where project_id = $1 and deleted = 'false'")
//       .then(function (data) {
//         var tasktext = '{';
//         for (var i = 0; i < data.length; i++) {
//           tasktext += '' + data[i].id;
//           if(i < data.length-1)
//             tasktext+=',';
//         }
//         tasktext += '}';
//         db.none("delete from assignment where task_id = any('"+ tasktext +"'::varchar) and assignee_id = any('"+ remtext +"'::varchar)")
//           .then(function(data) {
//             console.log("Update Collaborator - delete removed assignee success!");
//           })
//           .catch(function(error) {
//             console.log("error in update collaborator-delete removed assignee cascade 1!");
//           })
//       })
//       .catch(function (error) {
//         console.log("error in update collaborator-delete removed assignee cascade 2!");
//       });

//     console.log("Update collaborator success!");
//     var date = new Date();
//     var assigndate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
//     var data = {
//       userid : userid,
//       projectid : projectid,
//       newUsers : newUsers,
//       prevUsers : prevUsers,
//       assigndate : assigndate
//     }
//     io.emit("/updatecollaborator",data);
//     res.json({message:'Project Collaborators Updated SuccessfulLy!', data : data});
// });
  app.post('/updatecomment',         function(req, res){
    var date = new Date();
    var editdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    var commentid = req.body.commentid;
    var taskid = req.body.taskid;
    var userid = req.cookies.userid;
    var comment = req.body.comment;
    var oldcomment = req.body.oldcomment;
    var assignees = req.body.assignees;
    db.one("select user_id from comment where id = $1", [commentid])
      .then(function(data){
        if(data.user_id == userid) {
          db.none("update comment set comment = $1, edit_date = $2 where id = $3", [comment, editdate, commentid])
            .then(function(data){
              console.log('Project Created Successfully!\n');
              var data = {
                commentid : commentid,
                userid : userid,
                taskid : taskid,
                comment : comment,
                oldcomment : oldcomment,
                editdate: editdate,
                assignees : assignees
              }
              io.emit("/updatecomment",data);
              res.json({message : 'Comment updated Successfully!'});
            })
            .catch(function(error){
              console.log('ERROR IN UPDATE COMMENT POST : '+error+'\n');
              res.json({message:'An Error Occurred!'});
            });
        }
        else {
          console.log("comment not yours to edit!");
          res.json({message : "Comment not yours to edit!"});
        }
      })
      .catch(function(error){
        console.log("ERROR OCCURRED IN UPDATE COMMENT! : " + error);
        res.json({message : "An error occurred!"});
      });
  });
  app.post('/completetask',          function(req, res) {
    var taskid = req.body.taskid;
    var userid = req.cookies.userid;
    var assignees = req.body.assignees;
    var date = new Date();
    var completedate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    db.none("update task set complete_date = $1 where id = $2",[completedate,taskid])
      .then(function(data) {
        console.log("Successfully completed task " + taskid);
        var data = {
          taskid : taskid,
          userid : userid,
          completedate : completedate,
          assignees : assignees
        }
        io.emit("/completetask", data);
        res.json({message:'Task completed successfully!',data : data});
      })
      .catch(function(error) {
        console.log("ERROR IN COMPLETE TASK" + error);
        res.json({message:'An error occurred!'});
      });
  });
  app.post('/incompletetask',        function(req, res) {
    var taskid = req.body.taskid;
    var userid = req.cookies.userid;
    var assignees = req.body.assignees;
    var date = new Date();
    var incompletedate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    db.none("update task set complete_date = null where id = $1",[taskid])
      .then(function(data) {
        console.log("Successfully completed task " + taskid);
        var data = {
          taskid : taskid,
          userid : userid,
          assignees : assignees,
          incompletedate : incompletedate 
        }
        io.emit("/incompletetask", data);
        res.json({message:'Task in-completed successfully!', data : data});
      })
      .catch(function(error) {
        console.log("ERROR IN INCOMPLETE TASK" + error);
        res.json({message:'An error occurred!'});
      });
  });
  app.post('/ratetask',              function(req, res) {
    var rate = req.body.rating;
    var taskid = req.body.taskid;
    var userid = req.cookies.userid;

    db.any('update task set rating = $1 where id = $2',[rate,taskid])
      .then(function(data) {
        console.log("Successfully rated task " + taskid);
        var data = {
          taskid : taskid,
          userid : userid,
          rate : rate
        }
        io.emit("/ratetask", data);
        res.json({message:'Task rated successfully!'});
      })
      .catch(function(error) {
        console.log("ERROR IN RATE TASK!" + error);
        res.json({message:'An error occurred!'});
      });
  });
 
  app.post('/updatenotif',           function(req, res) {
    var notifid = req.body.notifid;
    var userid = req.cookies.userid;
    var date = new Date();
    var readdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    db.none("update notif set read_date = $1 where id = $2",[readdate,notifid])
      .then(function(data) {
        console.log("Successfully updated notif");
        var data = {
          userid : userid,
          notifid : notifid,
          readdate : readdate
        }
        io.emit("/updatenotif", data);
        res.json({message:'Notif updated successfully!', data});
      })
      .catch(function(error) {
        console.log("ERROR IN UPDATING NOTIFICATION" + error);
        res.json({message:'An error occurred!'});
      });
  });
  ///////////////////////////////  DELETES  ////////////////////////////////////
  app.post('/deleteproject',         function(req, res) {
    var projectid = req.body.projectid;
    var tasks = req.body.tasks;
    var userid = req.cookies.userid;
    var collaborators = req.body.collaborators;
    var date = new Date();
    var completedate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    db.none("update project set deleted = 'true' where id = $1",[projectid])
      .then(function(data) {
        db.none("update task set deleted = 'true' where project_id = $1",[projectid])
          .then(function(data) {
            console.log('Deleted Task Success!\n');
          })
          .catch(function(error) {
            console.log("ERROR IN DELETE TASK in DELETING THE PROJECT!" + error);
            res.json({message:'An error occurred!'});
          });
        db.none("delete from collaborator where project_id = $1",[projectid])
          .then(function(data) {
            console.log("Deleted all collaborators of the project!");
          })
          .catch(function(error) {
            console.log("ERROR IN /deleteproject : Error in deleting collaborators of the deleted project!");
          });
        console.log('Delete project succes!\n');
        var data = {
          userid : userid,
          projectid : projectid,
          collaborators : collaborators,
          createdate : completedate
        }
        io.emit("/deleteproject", data);
        res.json({message:'Project deleted successfully!', data : data});
      })
      .catch(function(error) {
        console.log("ERROR IN DELETE PROJECT!" + error);
        res.json({message:'An error occurred!'});
      });
  });
  app.post('/deletetask',            function(req, res) {
    var taskid = req.body.taskid;
    var userid = req.cookies.userid;
    var assignees = req.body.assignees;
    var date = new Date();
    var deletedate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    db.none("update task set deleted = 'true' where id = $1",[taskid])
      .then(function(data) {
        db.none("delete from assignment where task_id = $1",[taskid])
          .then(function(data) {
            console.log("Successfully deleted assignments from the deleted task!");
          })
          .catch(function(error){
            console.log("ERROR IN /deletetask : deleting assignees in deleted tasks");
          });
        console.log('Deleted Task Success!\n');
        data = {
          userid : userid,
          taskid : taskid,
          assignees : assignees,
          createdate : deletedate
        }
        io.emit("/deletetask",data);
        res.json({message:'Task deleted successfully!', data : data});
      })
      .catch(function(error) {
        console.log("ERROR IN DELETE TASK!" + error);
        res.json({message:'An error occurred!'});
      });
  });
  app.post('/deletecomment',         function(req, res) {
    var commentid = req.body.commentid;
    var userid = req.cookies.userid;
    var assignees = req.body.assignees;
    db.none("update comment set deleted = 'true' where id = $1",[commentid])
      .then(function(data) {
        console.log("Comment deleted successfully!");
        var data = {
          userid : userid,
          commentid : commentid,
          assignees : assignees
        }
        io.emit("/deletecomment",data);
        res.json({message: 'Comment deleted successfully'});
      })
      .catch(function(error){
        console.log("ERROR IN DELETE COMMENT!" + error);
        res.json({message: "An error occurred!"});
      });
  });
  app.post('/deleteattachment', function(req, res) {
    var taskid = req.body.taskid;
    var userid = req.cookies.userid;
    var pathdir = req.body.pathdir;
    var assignees = req.body.assignees;
    var date = new Date();
    var deletedate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    db.none("update attachment set deleted = 'true' where task_id = $1 and filename = $2",[taskid, pathdir])
    .then(function(data){
      var data = {
        userid : userid,
        taskid : taskid,
        pathdir : pathdir,
        deletedate : deletedate,
        assignees : assignees
      }
      io.emit("/deleteattachment", data);
      res.json({message:'File deleted successfully!', data : data});
    })
    .catch(function(error){
      console.log("ERROR IN DELETEATTACHMENT!" + error);
      res.json({message:'An Error Occurred!'});
    });
  });
  ///////////////////////////////  RATINGS  ////////////////////////////////////
  // app.get('rateaverage',             function(req, res) {
  //   var taskid = req.body.taskid;
  //   db.any('select AVG(rating) from task where id = $1',[taskid])
  //     .then(function(data) {
  //       var avg = data.avg;
  //       res.json(avg);
  //     });
  // });
  app.post('/rateaverage', function(req, res) {
    var taskid = req.body.taskid;
    db.any('select AVG(rating) from rating where task_id = $1',[taskid])
      .then(function(data) {
        console.log(data);
        res.json(data);
      });
  });
  ///////////////////////////////   LISTS  /////////////////////////////////////
  app.get('/listpersons',            function(req, res) {
      db.any('select id, username, email, first_name, last_name, info, profpic_path, logged_in from person')
      .then(function (data) {
        var arr = [];
        for (var i = 0; i < data.length; i++)
          arr.push(data[i]);
        res.json(arr);
      });
  });
  app.get('/listprojects',           function(req, res) {
    var userid = req.cookies.userid;
    if(req.body.userid !== undefined){
      userid = req.body.userid;
    }
    if (userid) {
      db.any('select * from project where user_id = $1 and deleted = false',userid)
      .then(function(data) {
        var arrs = {related:[],created:[],collab:[],repeated:[]}
        for (var i = 0; i < data.length; i++) arrs.created.push(data[i]);
        return arrs;
      })
      .then(function(arrs) {
        db.any('select project_id from collaborator where person_id = $1',userid)
        .then(function(data) {
          var ids = [];
          for (var i = 0; i < data.length; i++) ids.push(data[i].project_id);
          var text = '{';
          for (var i = 0; i < ids.length; i++) {
            text+=''+ids[i];
            if (i < ids.length-1) text+=','
          }
          text+='}';
          db.any("select * from project where id = any ('"+text+"'::varchar[]) and deleted = false")
          .then(function(data) {
            for (var i = 0; i < data.length; i++) arrs.collab.push(data[i]);
            for (var i = 0; i < arrs.collab.length; i++) arrs.related.push(arrs.collab[i]);
            for (var i = 0; i < arrs.created.length; i++) {
              var flag = 0;
              for (var j = 0; j < arrs.related.length && flag == 0; j++) {
                if (arrs.related[j].id == arrs.created[i].id) {
                  flag = 1;
                  arrs.repeated.push(arrs.created[i]);
                }
              }
              if (flag == 0) arrs.related.push(arrs.created[i]);
            }
            res.json(arrs);
          })
          .catch(function(error) {
            console.log('ERROR in getTasks loop3! '+error);
            res.json({message:"Error loop 3!"});
          });
        })
        .catch(function(error) {
          console.log('ERROR in getTasks loop2! '+error);
          res.json({message:"Error loop 2!"});
        })
      })
      .catch(function(error) {
        console.log('ERROR in getTasks loop1! '+error);
        res.json({message:"Error loop 1!"});
      });
    }
    else {
      console.log('ERROR : no userid defined!');
      res.json({message:"ERROR:noUserID!"});
    }
  });
  app.post('/listprojects',           function(req, res) {
    var userid = req.cookies.userid;
    if(req.body.userid !== undefined){
      userid = req.body.userid;
    }
    if (userid) {
      db.any('select * from project where user_id = $1 and deleted = false',userid)
      .then(function(data) {
        var arrs = {related:[],created:[],collab:[],repeated:[]}
        for (var i = 0; i < data.length; i++) arrs.created.push(data[i]);
        return arrs;
      })
      .then(function(arrs) {
        db.any('select project_id from collaborator where person_id = $1',userid)
        .then(function(data) {
          var ids = [];
          for (var i = 0; i < data.length; i++) ids.push(data[i].project_id);
          var text = '{';
          for (var i = 0; i < ids.length; i++) {
            text+=''+ids[i];
            if (i < ids.length-1) text+=','
          }
          text+='}';
          db.any("select * from project where id = any ('"+text+"'::varchar[]) and deleted = false")
          .then(function(data) {
            for (var i = 0; i < data.length; i++) arrs.collab.push(data[i]);
            for (var i = 0; i < arrs.collab.length; i++) arrs.related.push(arrs.collab[i]);
            for (var i = 0; i < arrs.created.length; i++) {
              var flag = 0;
              for (var j = 0; j < arrs.related.length && flag == 0; j++) {
                if (arrs.related[j].id == arrs.created[i].id) {
                  flag = 1;
                  arrs.repeated.push(arrs.created[i]);
                }
              }
              if (flag == 0) arrs.related.push(arrs.created[i]);
            }
            res.json(arrs);
          })
          .catch(function(error) {
            console.log('ERROR in getTasks loop3! '+error);
            res.json({message:"Error loop 3!"});
          });
        })
        .catch(function(error) {
          console.log('ERROR in getTasks loop2! '+error);
          res.json({message:"Error loop 2!"});
        })
      })
      .catch(function(error) {
        console.log('ERROR in getTasks loop1! '+error);
        res.json({message:"Error loop 1!"});
      });
    }
    else {
      console.log('ERROR : no userid defined!');
      res.json({message:"ERROR:noUserID!"});
    }
  });
  app.get('/listprojecttasks',       function(req, res) {
    db.any('select * from task where  deleted = false')
    .then(function(data) {
      var arr = [];
      for (var i = 0; i < data.length; i++) arr.push(data[i]);
      res.json(arr);
    })
    .catch(function(error) {
      console.log("ERROR in web list project task... "+error+'\n');
    });
  });
  app.get('/listallprojects',       function(req, res) {
    db.any('select * from project where  deleted = false')
    .then(function(data) {
      var arr = [];
      for (var i = 0; i < data.length; i++) arr.push(data[i]);
      res.json(arr);
    })
    .catch(function(error) {
      console.log("ERROR in web list project task... "+error+'\n');
    });
  });
  app.get('/listtasks',              function(req, res) {
    var userid = req.cookies.userid;
    if(req.body.userid !== undefined){
      userid = req.body.userid;
      console.log(userid);
    }

    if (userid) {
      db.any('select * from task where user_id = $1 and deleted = false',userid)
      .then(function(data) {
        var arrs = {related:[],created:[],assigned:[],repeated:[],incomplete:[],completed:[]}
        for (var i = 0; i < data.length; i++) arrs.created.push(data[i]);
        return arrs;
      })
      .then(function(arrs) {
        db.any('select task_id from assignment where assignee_id = $1',userid)
        .then(function(data) {
          var ids = [];
          for (var i = 0; i < data.length; i++) ids.push(data[i].task_id);
          var text = '{';
          for (var i = 0; i < ids.length; i++) {
            text+=''+ids[i];
            if (i < ids.length-1) text+=','
          }
          text+='}';
          db.any("select * from task where id = any ('"+text+"'::varchar[]) and deleted = false")
          .then(function(data) {
            for (var i = 0; i < data.length; i++) arrs.assigned.push(data[i]);
            for (var i = 0; i < arrs.assigned.length; i++) arrs.related.push(arrs.assigned[i]);
            for (var i = 0; i < arrs.created.length; i++) {
              var flag = 0;
              for (var j = 0; j < arrs.related.length && flag == 0; j++) {
                if (arrs.related[j].id == arrs.created[i].id) {
                  flag = 1;
                  arrs.repeated.push(arrs.created[i]);
                }
              }
              if (flag == 0) arrs.related.push(arrs.created[i]);
            }
            var text = '{';
            for (var i = 0; i < arrs.related.length; i++) {
              text+=''+arrs.related[i].id;
              if (i < arrs.related.length-1) text+=','
            }
            text+='}';
            db.any("select * from task where id = any ('"+text+"'::varchar[]) and complete_date is null and deleted = false", userid)
            .then(function(incs) {
              for (var i = 0; i < incs.length; i++) arrs.incomplete.push(incs[i])
              return arrs;
            })
            .then(function(arz) {
              db.any("select * from task where id = any ('"+text+"'::varchar[]) and complete_date is not null and deleted = false and user_id = $1", userid)
              .then(function(comps) {
                for (var i = 0; i < comps.length; i++) arrs.completed.push(comps[i]);
                res.json(arrs);
              })
            })
            .catch(function(errz) {
              console.log('ERROR in getTasks loop4! '+error);
              res.json({message:"Error loop 4!"});
            });
          })
          .catch(function(error) {
            console.log('ERROR in getTasks loop3! '+error);
            res.json({message:"Error loop 3!"});
          });
        })
        .catch(function(error) {
          console.log('ERROR in getTasks loop2! '+error);
          res.json({message:"Error loop 2!"});
        })
      })
      .catch(function(error) {
        console.log('ERROR in getTasks loop1! '+error);
        res.json({message:"Error loop 1!"});
      });
    }
    else {
      console.log('ERROR : no userid defined!');
      res.json({message:"ERROR:noUserID!"});
    }
  });
  app.post('/listtasks',              function(req, res) {
    var userid = req.cookies.userid;
    if(req.body.userid !== undefined){
      userid = req.body.userid;
      console.log(userid);
    }

    if (userid) {
      db.any('select * from task where user_id = $1 and deleted = false',userid)
      .then(function(data) {
        var arrs = {related:[],created:[],assigned:[],repeated:[],incomplete:[],completed:[]}
        for (var i = 0; i < data.length; i++) arrs.created.push(data[i]);
        return arrs;
      })
      .then(function(arrs) {
        db.any('select task_id from assignment where assignee_id = $1',userid)
        .then(function(data) {
          var ids = [];
          for (var i = 0; i < data.length; i++) ids.push(data[i].task_id);
          var text = '{';
          for (var i = 0; i < ids.length; i++) {
            text+=''+ids[i];
            if (i < ids.length-1) text+=','
          }
          text+='}';
          db.any("select * from task where id = any ('"+text+"'::varchar[]) and deleted = false")
          .then(function(data) {
            for (var i = 0; i < data.length; i++) arrs.assigned.push(data[i]);
            for (var i = 0; i < arrs.assigned.length; i++) arrs.related.push(arrs.assigned[i]);
            for (var i = 0; i < arrs.created.length; i++) {
              var flag = 0;
              for (var j = 0; j < arrs.related.length && flag == 0; j++) {
                if (arrs.related[j].id == arrs.created[i].id) {
                  flag = 1;
                  arrs.repeated.push(arrs.created[i]);
                }
              }
              if (flag == 0) arrs.related.push(arrs.created[i]);
            }
            var text = '{';
            for (var i = 0; i < arrs.related.length; i++) {
              text+=''+arrs.related[i].id;
              if (i < arrs.related.length-1) text+=','
            }
            text+='}';
            db.any("select * from task where id = any ('"+text+"'::varchar[]) and complete_date is null and deleted = false", userid)
            .then(function(incs) {
              for (var i = 0; i < incs.length; i++) arrs.incomplete.push(incs[i])
              return arrs;
            })
            .then(function(arz) {
              db.any("select * from task where id = any ('"+text+"'::varchar[]) and complete_date is not null and deleted = false and user_id = $1", userid)
              .then(function(comps) {
                for (var i = 0; i < comps.length; i++) arrs.completed.push(comps[i]);
                res.json(arrs);
              })
            })
            .catch(function(errz) {
              console.log('ERROR in getTasks loop4! '+error);
              res.json({message:"Error loop 4!"});
            });
          })
          .catch(function(error) {
            console.log('ERROR in getTasks loop3! '+error);
            res.json({message:"Error loop 3!"});
          });
        })
        .catch(function(error) {
          console.log('ERROR in getTasks loop2! '+error);
          res.json({message:"Error loop 2!"});
        })
      })
      .catch(function(error) {
        console.log('ERROR in getTasks loop1! '+error);
        res.json({message:"Error loop 1!"});
      });
    }
    else {
      console.log('ERROR : no userid defined!');
      res.json({message:"ERROR:noUserID!"});
    }
  });
  app.get('/listassignment',         function(req, res) {
    db.any('select * from assignment')
      .then(function (data) {
        var arr = [];
        for (var i = 0; i < data.length; i++)
          arr.push(data[i]);
        res.json(arr);
    });
  });
  app.get('/listcollabs',            function(req, res) {
    db.any('select * from collaborator')
      .then(function (data) {
        var arr = [];
        for (var i = 0; i < data.length; i++)
          arr.push(data[i]);
        res.json(arr);
      });
  });
  app.post('/listtaskcomments',      function(req, res) {
    var taskid = req.body.taskid;
    db.any("select * from comment where task_id = $1 and deleted = 'false'", [taskid])
      .then(function (data) {
        var commentarr = [];
        for (var i = 0; i < data.length; i++)
          commentarr.push(data[i]);
        res.json(commentarr);
    });
  });
  app.post('/listcomments',          function(req, res) {
    db.any("select * from comment where deleted = 'false'")
      .then(function (data) {
        var commentarr = [];
        for (var i = 0; i < data.length; i++)
          commentarr.push(data[i]);
        res.json(commentarr);
    });
  });
  app.post('/listnotifs',            function(req, res) {
    var userid = req.cookies.userid;
    db.any("select * from notif where user_id = $1",[userid])
      .then(function(data) {
        var notifarr = [];
        for (var i = 0; i < data.length; i++) {
          notifarr.push(data[i]);
        }

        res.json(notifarr);
      });
  });
  app.post('/listattachments',       function(req, res){
    var taskid = req.body.taskid;
    db.any("select * from attachment where task_id = $1 and deleted = 'false'",[taskid])
      .then(function(data) {
        var attarr = [];
        for (var i = 0; i < data.length; i++) {
          attarr.push(data[i]);
        }

        res.json(attarr);
      });
  })
  ////////////////////////////////  SUBVIEWS  //////////////////////////////////
  app.get('/archive',                function(req, res) {
     res.sendFile(__dirname + '/views/subviews' +'/archive.html');
  });
  app.get('/dashboard',              function(req, res) {
     res.sendFile(__dirname + '/views/subviews' +'/dashboard.html');
  });
  app.get('/projects',               function(req, res) {
     res.sendFile(__dirname + '/views/subviews' +'/projects.html');
  });
  app.get('/tasks',                  function(req, res) {
     res.sendFile(__dirname + '/views/subviews' +'/tasks.html');
  });
  app.get('/taskdetails',            function(req, res) {
     res.sendFile(__dirname + '/views/subviews' +'/taskdetails.html');
  });
  app.get('/projectdetails',         function(req, res) {
     console.log('Sending Project Details ... ');
     res.sendFile(__dirname + '/views/subviews' +'/projectdetails.html');
  });
  app.get('/teams',                  function(req, res) {
     res.sendFile(__dirname + '/views/subviews' +'/teams.html');
  });
  app.get('/teamthreads',            function(req, res) {
     res.sendFile(__dirname + '/views/subviews' +'/teamthreads.html');
  });
  app.get('/settings',               function(req, res) {
    res.sendFile(__dirname +"/views"+"/popup/settings.html")
  });
  app.get('/notifications',          function(req, res) {
    res.sendFile(__dirname +"/views"+"/subviews/notif.html")
  });
  app.get('/profile',                function(req, res){
    res.sendFile(__dirname +"/views"+"/subviews/profile.html")
  })
  ////////////////////////////////////////////////////////////////////////////////
}
////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////     /////////////////////////////////////////
///////////////////////////////    LUA    //////////////////////////////////////
//////////////////////////////////     /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
{
  ///////////////////////////////////////  BASICS  /////////////////////////////
  app.post('/lua-signup',                function(req, res) {
    var firstname = req.body.firstname;
    var lastname =  req.body.lastname;
    var username =  req.body.username;
    var email =     req.body.email;
    var password =  req.body.password;
    var confirm =   req.body.confirm;
    var id =        uuid.v1();
    if (password == confirm) {
      db.none("insert into person (id,first_name, last_name, username, email, password, logged_in) values($1,$2,$3,$4,$5,$6,'false')",[id,firstname,lastname,username,email,password])
      .then(function() {
        res.json({message:"NICE KA!", conf:true}); // return
      })
      .catch(function(error) {
        console.log('ERROR IN SIGNUP : '+error+"\n");
        res.json({message:"Error : "+error, conf:false}); // return
      });
    }
    else {
      console.log('ERROR IN SIGNUP : passwords does not match!' +"\n");
      res.json({message:"ERROR : passwords does not match!", conf:false}); // return
    }
  });
  app.post('/lua-login',                 function(req, res) {
    var user =      req.body.user;
    var password =  req.body.password;
    var date =      new Date();
    var test =      "";
    if (checkEmail(user)) test = "email";
    else test = "username";
    db.one("select * from person where "+test+" = $1",user)
    .then(function(data) {
      if (data.password != password) throw "Error: wrong password!";
      var logid =    uuid.v1();
      var logtime =  date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
      var ip =       "noIP!";
      var carrier =  "mobile";
      db.none("insert into logs (id,user_id,action,log_date,carrier,ip_address) values($1,$2,'login',$3,$4,$5)",[logid,data.id,logtime,carrier,ip]);
      db.none("update person set logged_in = 'true' where id = $1",data.id);
      res.json({message:"LOGIN Success!",info:data.info,fname:data.first_name,lname:data.last_name,username:data.username,email:data.email,conf:true,userid:data.id});
    })
    .catch(function(error) {
      console.log('ERROR IN LUA LOGIN : '+error+"\n");
      res.json({message:"LOGIN Failed! Username or Password incorrect...", conf:false});
    });
  });
  app.get('/lua-sendnotif',              function(req, res) {
    var message = new gcm.Message();
    message.addNotification({
      title: 'Alert!!!',
      body: 'Notified',
      icon: 'ic_launcher'
    });
     db.any('select reg_id from device')
    .then(function(data) {
      console.log(data);
       var tokens = [];
       for (var i = 0; i < data.length; i++)
        tokens.push(data[i].reg_id);
       console.log(tokens);
       sender.send(message, { registrationTokens: tokens }, function (err, response) {
        if(err) console.error(err);
        else    console.log(response);
      });
    })
    .catch(function(error) {
      console.log(error); // return
    });
    res.end();

  })
  app.post('/lua-registerdevice',        function(req, res) {
   console.log("i was called..");
   var regid = req.body.reg_id;
   var userid =  req.body.user_id;
   db.none("insert into device (reg_id,user_id) values($1,$2) on conflict do nothing",[regid,userid])
    .then(function() {
      console.log("Registration Success!");
    })
    .catch(function(error) {
      console.log({message:"Error : "+error, conf:false}); // return
    });
  });
  app.post('/lua-logout',                function(req, res) {
    var userid =  req.body.userid;
    var date = new Date();
    if (userid) {
      db.none("update person set logged_in = 'f' where id = $1",userid)
        .then(function(data){
          var logid =    uuid.v1();
          var logtime =  date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
          var ip =       "noIP!";
          var carrier =  "mobile";
          db.none("insert into logs (id,user_id,action,log_date,carrier,ip_address) values($1,$2,'logout',$3,$4,$5)",[logid,userid,logtime,carrier,ip]);
          console.log("LUA LOGOUT SUCCESS!\n");
          res.json({message: "Logout Success!", conf: true});
        })
        .catch(function(error) {
          console.log('LUA ERROR IN LOGOUT : '+error+'\n');
          res.json({message:"error while loggin out!", conf:false});
        });
    }
    else {
      console.log('ERROR IN LOGOUT : userid does not exist\n');
      res.json({message:"error while loggin out! no id given!", conf:false});
    }
  });
  app.post('/lua-confirmpassword',       function(req, res) {
    var op =      req.body.oldpassword;
    var userid =  req.body.userid;
    db.one('select password from person where id = $1',userid)
    .then(function(data) {
      if (data.password == op) {
        console.log("LUA CONFIRMPASSWORD SUCCESSFUL!\n");
        res.json({message:"OKAY NA!",conf:true});
      }
      else if (data.password != op) throw 'wrong password!';
    })
    .catch(function(error) {
      console.log('LUA ERROR IN CONFIRMPASSWORD : '+error+"\n");
      res.json({message:"NAAY ERROR sa confirm password : "+error,conf:false});
    });
  });
  app.post('/lua-changepassword',        function(req, res) {
    var np1 =     req.body.newpassword1;
    var np2 =     req.body.newpassword2;
    var userid =  req.body.userid;
    db.one('select password from person where id = $1',userid)
    .then(function(data) {
      if (np1 == np2) {
        var logid =    uuid.v1();
        var date =     new Date();
        var logdate =  date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
        var carrier =  'mobile';
        var ip =       "noIP";
        db.none("update person set password=$1,logged_in='f' where id=$2",[np1,userid]);
        db.none("insert into logs (id,user_id,action,log_date,carrier,ip_address) values($1,$2,'change pass',$3,$4,$5)",[logid,userid,logdate,carrier,ip]);
        console.log("LUA CHANGEPASSWORD SUCCESSFUL!\n");
        res.json({message:"OKAY NA : password changed!",conf:true});
      }
      else if (np1 != np2)
        throw 'new passwords does not match!';
    })

    .catch(function(error) {
      console.log('LAU ERROR IN CHANGEPASSWORD : '+error+"\n");
      res.json({message:"UY NAAY ERROR sa changepassword: "+error,conf:false});
    });
  });
  ///////////////////////////////////////  CREATE  /////////////////////////////
  app.post('/lua-createproject',         function(req, res) {
    var userid =        req.body.userid;
    var title =         req.body.title;
    var description =   req.body.description;
    var deadlinedate =  req.body.deadlinedate;
    var deadlinetime =  req.body.deadlinetime;
    var collaborator =  req.body.collaborator;
    var date =          new Date();
    var createdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    var id =            uuid.v1();
    var promise;
    if (deadlinedate === "")
      promise = db.none("insert into project (id,user_id,name,description,create_date,edit_date,deleted) values($1,$2,$3,$4,$5,$6,false)",[id,userid,title,description,createdate,createdate]);
    else{
      if (deadlinetime === "")
        promise = db.none("insert into project (id,user_id,name,description,create_date,deadline_date,edit_date,deleted) values($1,$2,$3,$4,$5,$6,$7,false)",[id,userid,title,description,createdate,deadlinedate,createdate]);
      else
        promise = db.none("insert into project (id,user_id,name,description,create_date,deadline_date,deadline_time,edit_date,deleted) values($1,$2,$3,$4,$5,$6,$7,$8,false)",[id,userid,title,description,createdate,deadlinedate,deadlinetime,createdate]);
    }
    promise
    .then(function() {
      db.one('select name from project where id = $1',id)
      .then(function(data) {
        var coldz = collaborator.split(',');
        if (coldz.length == 1 && coldz[0] == "") coldz = [];
        db.none("insert into collaborator (project_id, person_id, status) values($1,$2,$3)",[id,userid,'test status']);
        for (var i = 0; i < coldz.length; i++) {
          collid = uuid.v1();
          db.none("insert into collaborator (project_id, person_id, status) values($1,$2,$3)",[id,coldz[i],'test status']);
        }
        var message = 'You have a new Project : '+data.name;
        for (var i = 0; i < coldz.length; i++) {
          var notifid = uuid.v1();
          db.none("insert into notif values($1,$2,$3,$4,$5,$6,$7,$8,$9)",[notifid,coldz[i],userid,'project',id,message,'add',createdate,null])
          .catch(function(error) {
            console.log("\nERROR IN POST LUA NOTIF NOTIF notif : "+error);
            res.json({message : 'An Error Occurred!',conf:false});
          });
        }
        console.log('Project Created Successfully!\n');
        res.json({message : 'Project Created Successfully!',conf:true});
      })
      .catch(function(error) {
        console.log(error);
      });
    })
    .catch(function(error) {
      console.log("ERROR IN LUA POST CREATEPROJECT : "+error+'\n');
      res.json({message : 'An Error Occurred!',conf:false});
    });
  });
  app.post('/lua-createtask',            function(req, res) {
    var userid =        req.body.userid;
    var title =         req.body.title;
    var description =   req.body.description;
    var deadlinedate =  req.body.deadlinedate;
    var deadlinetime =  req.body.deadlinetime;
    var projectid   =   req.body.projectid;
    var ptask =         req.body.ptask;
    var assignedUser =  req.body.assignedUser;
    var date =          new Date();
    var createdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes();
    var id =            uuid.v1();
    var promise;
    if (projectid == "") projectid = null;
    if (ptask == "")     ptask = null;
    if(deadlinedate === "")
      promise = db.none("insert into task (id,user_id,title,description,create_date,task_id,project_id,edit_date,deleted) values($1,$2,$3,$4,$5,$6,$7,$8,'false')",[id,userid,title,description,createdate,ptask,projectid,createdate]);
    else {
      if (deadlinetime === "")
        promise = db.none("insert into task (id,user_id,title,description,create_date,deadline_date,task_id,project_id,edit_date,deleted) values($1,$2,$3,$4,$5,$6,$7,$8,$9,'false')",[id,userid,title,description,createdate,deadlinedate,ptask,projectid,createdate]);
      else
        promise = db.none("insert into task (id,user_id,title,description,create_date,deadline_date,deadline_time,task_id,project_id, edit_date, deleted) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'false')",[id,userid,title,description,createdate,deadlinedate,deadlinetime,ptask,projectid,createdate]);
    }
    promise
    .then(function() {
      db.one('select title from task where id = $1',id)
      .then(function(data) {
        var assign = assignedUser.split(',');
        if (assign.length == 1 && assign[0] == "") assign = [];
        for(var i = 0; i < assign.length; i++) {
          db.none("insert into assignment (assignee_id,assigner_id,task_id,assign_date) values($1,$2,$3,$4)",[assign[i],userid,id,createdate]);
        }
        var message = 'You have a new Task : '+data.title;
        for (var i = 0; i < assign.length; i++) {
          var notifid = uuid.v1();
          db.none("insert into notif values($1,$2,$3,$4,$5,$6,$7,$8,$9)",[notifid,assign[i],userid,'task',id,message,'add',createdate,null])
          .catch(function(error) {
            console.log("\nERROR IN POST task LUA NOTIF NOTIF notif : "+error);
            res.json({message : 'An Error Occurred!',conf:false});
          });
        }
        console.log('Create Task Success!\n');
        res.json({message:'Task Created Successfully!',conf:true});
      })
      .catch(function(error) {
        console.log(error);
      });
    })
    .catch(function(error) {
      console.log('ERROR IN CREATE TASK POST : '+error+'\n');
      res.json({message:'An Error Occurred!',conf:false});
    });
  });
  app.post('/lua-addcomment',            function(req, res){
    var date =          new Date();
    var createdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    var taskid =        req.body.taskid;
    var userid =        req.body.userid;
    var comment =       req.body.comment;
    var id =            uuid.v1();
    db.none("insert into comment (id, task_id, user_id, comment, comment_date, edit_date, deleted) values ($1,$2,$3,$4,$5,$6,'false')", [id, taskid, userid, comment, createdate, createdate])
    .then(function(data){
      db.one('select * from task where id = $1',taskid)
      .then(function(data) {
        var title = data.title;
        db.any('select * from assignment where task_id = $1',taskid)
        .then(function(data) {
          var message = 'Someone commented on your task : '+title;
          for (var i = 0; i < data.length; i++) {
            var notifid = uuid.v1();
            db.none("insert into notif values($1,$2,$3,$4,$5,$6,$7,$8,$9)",[notifid,data[i].assignee_id,userid,'comment',id,message,'add',createdate,null])
            .catch(function(error) {
              console.log("\nERROR IN POST comment LUA NOTIF NOTIF notif : "+error);
              res.json({message : 'An Error Occurred!',conf:false});
            });
          }
          console.log('\nComment Added Successfully!');
          res.json({message:'Commented Successfully!', conf:true});
        })
        .catch(function(error) {
          console.log(error);
        })
      })
      .catch(function(error) {
        console.log(error);
      })
    })
    .catch(function(error){
      console.log('\nERROR IN ADD COMMENT POST : '+error);
      res.json({message:'An Error Occurred!', conf:false});
    });
  });
  ///////////////////////////////////////  UPDATE  /////////////////////////////
  app.post('/lua-updatetaskname',        function(req, res) {
    var tasktitle = req.body.name;
    var taskid =    req.body.taskid;
    var date =      new Date();
    var editdate =  date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    db.none('update task set title = $1, edit_date = $2 where id = $3',[tasktitle, editdate, taskid])
      .catch(function(error) {
        console.log("ERROR IN UPDATE TASK NAME!" + error);
        res.json({message:"ERROR : UPDATE TASK NAME LUA",conf:false});
      });
  });
  app.post('/lua-updatetaskdesc',        function(req, res) {
    var description = req.body.description;
    var taskid = req.body.taskid;
    var date =          new Date();
    var editdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    db.none('update task set description = $1, edit_date = $2 where id = $3',[description, editdate, taskid])
    .catch(function(error) {
      console.log("ERROR IN UPDATE TASK DESCRIPTION!" + error);
      res.json({message:"ERROR : UPDATE TASK DESCRIPTION LUA",conf:false});
    });
  });
  app.post('/lua-updatetaskdeadline',    function(req, res) {
      var deadlinedate =  req.body.deadlinedate;
      var deadlinetime =  req.body.deadlinetime;
      var deadlineday = deadlinedate.substring(0,2);
      var deadlinemonth = deadlinedate.substring(3,5);
      var deadlineyear = deadlinedate.substring(6,10);
      var deadlinedate = deadlineyear + "-" + deadlinemonth + "-" + deadlineday;
      var taskid = req.body.taskid;
      var date =          new Date();
      var editdate =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
      db.none('update task set deadline_date = $1, deadline_time = $2, edit_date = $3 where id = $4',[deadlinedate, deadlinetime, editdate, taskid])
      .catch(function(error) {
        console.log("ERROR IN UPDATE TASK DEADLINE!" + error);
        res.json({message:"ERROR : UPDATE TASK DEADLINE LUA",conf:false});
      });
  });
  app.post('/lua-updateuserinfo',        function(req, res) {
    var fname =       req.body.firstname;
    var lname =       req.body.lastname;
    var info =        req.body.info;
    var id =          req.body.userid;
    var pathdir =     undefined;
    var promise;
    if (pathdir === undefined) {
      promise = db.none('update person set first_name = $1, last_name = $2, info = $3 where id = $4',[fname, lname, info, id])
    }
    else {
      promise = db.none('update person set first_name = $1, last_name = $2, info = $3, profpic_path = $4 where id = $5',[fname, lname, info, pathdir, id])
    }
    promise
    .then(function(data) {
      console.log('User info updated successfully!\n');
      res.json({message:'User Information Updated Successfully!', conf:true});
    })
    .catch(function(error) {
      console.log("ERROR IN UPDATE USER INFO!" + error);
      res.json({message:'An Error Occurred!', conf:false});
    });
  });
  app.post('/lua-updateusername',        function(req, res) {
    var uname =       req.body.username;
    var userid =      req.body.userid;
    if (uname && userid) {
      db.any('select username from person')
      .then(function(data) {
        var isIn = false;
        var flag = false;
        for (var i = 0; i < data.length && !flag; i++) {
          if (uname == data[i]) {
            isIn = true;
            flag = true;
          }
        }
        if (!isIn) {
          db.none('update person set username = $1 where id = $2',[uname, userid])
          .then(function(data) {
            console.log('\nUsername info updated successfully!');
            res.json({message:'Username Updated Successfully!', conf:true});
          })
        }
        else {
          console.log('\nUsername already exist!');
          res.json({message:'Username already exist!', conf:true});
        }
      })
      .catch(function(error) {
        console.log("\nERROR IN UPDATE USERNAME!" + error);
        res.json({message:'An Error Occurred!', conf:false});
      });
    }
  });
  app.post('/lua-updatetask',            function(req, res) {
    var date =           new Date();
    var taskid =         req.body.taskid;
    var title =          req.body.title;
    var desc =           req.body.description;
    var deadlinedate =   req.body.deadlinedate;
    var editdate =       date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()
    console.log(title);
    console.log(desc);
    console.log(deadlinedate);
    console.log(editdate);
    db.none('update task set title = $1, description = $2, deadline_date = $3, edit_date = $4 where id = $5',[title,desc,deadlinedate,editdate,taskid])
    .then(function() {
      console.log("\nlua update task okayyyy!");
      res.json({message:"lua update task okayyyy!", conf:true});
    })
    .catch(function(error) {
      console.log("\nlua update task Failed!");
      res.json({message:"lua update task Failed!", conf:false});
    });
  });
  app.post('/lua-updatecomment',         function(req, res) {
    var commentid =       req.body.commentid;
    var comment =         req.body.comment;
    var date =            new Date();
    var editdate =        date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    db.none('update comment set edit_date = $1, comment = $2 where id = $3',[editdate,comment,commentid])
    .then(function() {
      console.log("\nlua update comment okayyyy!");
      res.json({message:"lua update comment okayyyy!", conf:true});
    })
    .catch(function(error) {
      console.log("\nlua update comment Failed!");
      res.json({message:"lua update comment Failed!", conf:false});
    });
  });
  ///////////////////////////////////////  DELETE  /////////////////////////////
  app.post('/lua-deleteproject',         function(req, res) {
    var projectid = req.body.projectid;
    var userid = req.body.userid;
    db.none("update project set deleted = 'true' where id = $1",[projectid])
    .then(function() {
      console.log("HOKIE1!\n");
    })
    .then(function() {
      db.any("select id from task where project_id = $1",[projectid])
      .then(function(data) {
        for (var i = 0; i < data.length; i++) {
          db.none("update comment set deleted = 'true' where task_id = $1",data[i].id);
        }
      })
      .then(function() {
        db.none("update task set deleted = 'true' where project_id = $1",[projectid])
        .then(function(data) {

          db.one('select * from project where id = $1',projectid)
          .then(function(data) {
            var name = data.name;
            db.any('select * from collaborator where project_id = $1',projectid)
            .then(function(data) {
              var arr = [];
              for (var i = 0; i < data.length; i++) arr.push(data[i].person_id);
              var message = 'Someone deleted your project : '+name;
              var date = new Date();
              var now =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
              for (var i = 0; i < arr.length; i++) {
                var notifid = uuid.v1();
                db.none("insert into notif values($1,$2,$3,$4,$5,$6,$7,$8,$9)",[notifid,arr[i],userid,'project',projectid,message,'remove',now,null])
                .catch(function(error) {
                  console.log("\nERROR IN POST comment LUA NOTIF NOTIF notif : "+error);
                  res.json({message : 'An Error Occurred!',conf:false});
                });
              }
              console.log("HOKIE3 deleted project!\n");
              res.json({message:"HOKIE deleted project",conf:true});
            })
            .catch(function(error) {
              console.log(error);
            })
          })
          .catch(function(error) {
            console.log(error);
          })

        })
        .catch(function(error) {
          console.log("ERROR IN DELETE lua PROJECT TASK!" + error+"\n");
          res.json({message:'An error occurred3!',conf:false});
        });
      })
      .catch(function(error) {
        console.log("ERROR IN DELETE lua PROJECT TASK COMMENT!" + error+"\n");
        res.json({message:'An error occurred2!',conf:false});
      });
    })
    .catch(function(error) {
      console.log("ERROR IN DELETE lua PROJECT!" + error+"\n");
      res.json({message:'An error occurred1!',conf:false});
    });
  });
  app.post('/lua-deletetask',            function(req, res) {
    var taskid = req.body.taskid;
    var userid = req.body.userid;
    db.none("update task set deleted = 'true' where id = $1",[taskid])
    .then(function() {
      db.none("update comment set deleted = 'true' where task_id = $1",[taskid])
      .then(function() {          
        db.any('select * from task')
        .then(function(data) {
          var parents = [];
          parents.push(taskid);
          for (var j = 0; j < parents.length; j++) {
            for (var i = 0; i < data.length; i++) {
              if (parents[j] == data[i].task_id) {
                parents.push(data[i].id);
              }
            }
          }
          console.log(parents);
          var text = '{';
          for (var i = 0; i < parents.length; i++) {
            text+=''+parents[i];
            if (i < parents.length-1) text+=','
          }
          text+='}';
          db.none("update task set deleted = 'true' where id = any ('"+text+"'::varchar[])")
          .then(function() {

            db.one('select * from task where id = $1',taskid)
            .then(function(data) {
              var name = data.title;
              db.any('select * from assignment where task_id = $1',taskid)
              .then(function(data) {
                var arr = [];
                for (var i = 0; i < data.length; i++) arr.push(data[i].assignee_id);
                var message = 'Someone deleted your task : '+name;
                var date = new Date();
                var now =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
                for (var i = 0; i < arr.length; i++) {
                  var notifid = uuid.v1();
                  db.none("insert into notif values($1,$2,$3,$4,$5,$6,$7,$8,$9)",[notifid,arr[i],userid,'task',taskid,message,'remove',now,null])
                  .catch(function(error) {
                    console.log("\nERROR IN POST comment LUA NOTIF NOTIF notif : "+error);
                    res.json({message : 'An Error Occurred!',conf:false});
                  });
                }
                console.log("okayokayokayokayokayokay");
                res.json({message:"okay", conf:true});
              })
              .catch(function(error) {
                console.log(error);
              })
            })
            .catch(function(error) {
              console.log(error);
            })

          })
          .catch(function(error) {
            console.log("errorerrorerrorerrorerror " + error);
            res.json({message:"fail", conf:false});
          });
        })
        .catch(function(error) {
          console.log("ERROR IN DELETE TASK 3!" + error);
          res.json({message:'An error occurred!', conf:false});
        });
      })
      .catch(function(error) {
        console.log("ERROR IN DELETE TASK 2!" + error);
        res.json({message:'An error occurred!', conf:false});
      });
    })
    .catch(function(error) {
      console.log("ERROR IN DELETE TASK 1!" + error);
      res.json({message:'An error occurred!', conf:false});
    });
  });
  app.post('/lua-deletecomment',         function(req, res) {
    var commentid = req.body.commentid;
    db.none('update comment set deleted = true')
    .then(function() {
      console.log("\nlua delete comment okayyyy!");
      res.json({message:"lua delete comment okayyyy!", conf:true});
    })
    .catch(function(error) {
      console.log("\nlua delete comment Failed!");
      res.json({message:"lua delete comment Failed!", conf:false});
    });
  });
  ////////////////////////////////////// NOTIFS ////////////////////////////////
  app.post('/lua-listnotif',             function(req, res) {
    var userid = req.body.userid;
    var date = new Date();
    var now =    date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    console.log(userid);
    db.any('select * from notif where user_id = $1 order by create_date desc', userid)
    .then(function(data) {
      var arr = [];
      for (var i = 0; i < data.length; i++) arr.push(data[i]);
      for (var i = 0; i < arr.length; i++) {
        db.none('update notif set read_date = $1 where user_id = $2',[now,userid])
        .catch(function(error) {
          console.log(error);
        })
      }
      res.json({message:"your notifs!", conf:true, arr:arr});
    })
    .catch(function(error) {
      console.log(error);
      res.json({message:"not your notifs!", conf:false});
    });
  });
  ///////////////////////////////////////  LIST  ///////////////////////////////
  app.post('/lua-listpersons',           function(req, res) {
      db.any('select * from person')
      .then(function (data) {
        var a = [];
        for (var i = 0; i < data.length; i++) a.push(data[i]);
        res.json({arr:a,conf:true,message:"HOKIE NA!"});
      })
      .catch(function(error) {
        console.log("\nERROR in lua list persons : "+error);
        res.json({message:"error here... hehehe...",conf:false});
      });
  });
  app.post('/lua-listtasks',             function(req, res) {
    var userid = req.body.userid;
    if (userid) {
      db.any("select * from task where user_id = $1 and task_id is null and deleted = 'false'",userid)
      .then(function(data) {
        var arrs = {related:[],created:[],assigned:[],repeated:[]}
        for (var i = 0; i < data.length; i++) arrs.created.push(data[i]);
        return arrs;
      })
      .then(function(arrs) {
        db.any('select task_id from assignment where assignee_id = $1',userid)
        .then(function(data) {
          var ids = [];
          for (var i = 0; i < data.length; i++) ids.push(data[i].task_id);
          var text = '{';
          for (var i = 0; i < ids.length; i++) {
            text+=''+ids[i];
            if (i < ids.length-1) text+=','
          }
          text+='}';
          db.any("select * from task where id = any ('"+text+"'::varchar[]) and deleted = 'false'")
          .then(function(data) {
            for (var i = 0; i < data.length; i++) arrs.assigned.push(data[i]);
            for (var i = 0; i < arrs.assigned.length; i++) arrs.related.push(arrs.assigned[i]);
            for (var i = 0; i < arrs.created.length; i++) {
              var flag = 0;
              for (var j = 0; j < arrs.related.length && flag == 0; j++) {
                if (arrs.related[j].id == arrs.created[i].id) {
                  flag = 1;
                  arrs.repeated.push(arrs.created[i]);
                }
              }
              if (flag == 0) arrs.related.push(arrs.created[i]);
            }
            res.json({message:"List Tasks saksez...",arr:arrs,conf:true});
          })
          .catch(function(error) {
            console.log('\nERROR in getTasks loop3! '+error);
            res.json({message:"Error loop 3!",conf:false});
          });
        })
        .catch(function(error) {
          console.log('\nERROR in getTasks loop2! '+error);
          res.json({message:"Error loop 2!",conf:false});
        })
      })
      .catch(function(error) {
        console.log('\nERROR in getTasks loop1!'+error);
        res.json({message:"Error loop 1!",conf:false});
      });
    }
    else {
      console.log('\nERROR : no userid defined!');
      res.json({message:"ERROR:noUserID!",conf:false});
    }
  });
  app.post('/lua-listsubtasks',          function(req, res) {
    var taskid = req.body.taskid;
    db.any("select * from task where task_id = $1 and deleted = 'false'", taskid)
    .then(function(data) {
      var arr = [];
      for (var i = 0; i < data.length; i++) arr.push(data[i]);
      console.log("\nLUA list subtasks saksez!");
      res.json({message:"okssss!",conf:true,arr:arr});
    })
    .catch(function(error) {
      console.log("\nERROR in lua list subtask!" + error);
      res.json({message:"hala error o!", conf:false});
    });
  });
  app.post('/lua-listprojecttasks',      function(req, res) {
    var projectid = req.body.projectid;
    if (projectid) {
      db.any("select * from task where project_id = $1 and task_id is null and deleted = 'false'",projectid)
      .then(function(data) {
        var arr = [];
        for (var i = 0; i < data.length; i++) arr.push(data[i]);
        res.json({arr:arr});
      })
      .catch(function(error) {
        console.log("\nERROR in lua list project task... "+error);
        res.json({message:"error in somewhere!",conf:false});
      });
    }
    else {
      console.log("\nERROR in lua list project task");
      res.json({message:"no project id given! hehehe",conf:false});
    }
  });
  app.post('/lua-listprojects',          function(req, res) {
    var userid = req.body.userid;
    if (userid) {
      db.any('select * from project where user_id = $1 and deleted = false',userid)
      .then(function(data) {
        var arrs = {related:[],created:[],collab:[],repeated:[]}
        for (var i = 0; i < data.length; i++) arrs.created.push(data[i]);
        return arrs;
      })
      .then(function(arrs) {
        db.any('select project_id from collaborator where person_id = $1',userid)
        .then(function(data) {
          var ids = [];
          for (var i = 0; i < data.length; i++) ids.push(data[i].project_id);
          var text = '{';
          for (var i = 0; i < ids.length; i++) {
            text+=''+ids[i];
            if (i < ids.length-1) text+=','
          }
          text+='}';
          db.any("select * from project where id = any ('"+text+"'::varchar[]) and deleted = false")
          .then(function(data) {
            for (var i = 0; i < data.length; i++) arrs.collab.push(data[i]);
            for (var i = 0; i < arrs.collab.length; i++) arrs.related.push(arrs.collab[i]);
            for (var i = 0; i < arrs.created.length; i++) {
              var flag = 0;
              for (var j = 0; j < arrs.related.length && flag == 0; j++) {
                if (arrs.related[j].id == arrs.created[i].id) {
                  flag = 1;
                  arrs.repeated.push(arrs.created[i]);
                }
              }
              if (flag == 0) arrs.related.push(arrs.created[i]);
            }
            res.json({arrs:arrs, message:"okay", conf:true});
          })
          .catch(function(error) {
            console.log('ERROR in getTasks loop3! '+error);
            res.json({message:"Error loop 3!", conf:false});
          });
        })
        .catch(function(error) {
          console.log('ERROR in getTasks loop2! '+error);
          res.json({message:"Error loop 2!", conf:false});
        })
      })
      .catch(function(error) {
        console.log('ERROR in getTasks loop1! '+error);
        res.json({message:"Error loop 1!", conf:false});
      });
    }
    else {
      console.log('ERROR : no userid defined!');
      res.json({message:"ERROR:noUserID!", conf:false});
    }
  });
  app.post('/lua-listcollabs',           function(req, res) {
    var userid = req.body.userid;
    db.any('select * from collaborator where person_id = $1',userid)
    .then(function (data) {
      console.log(data);
      var a = [];
      for (var i = 0; i < data.length; i++) a.push(data[i]);
      res.json({message:"get collabsz Succez!",arr:a,conf:true});
    })
    .catch(function(error) {
      console.log("\nERROR in LUA listprojects : "+error);
      res.json({message:"get collabsz FAILZZ!",arr:[],conf:false});
    });
  });
  app.post('/lua-listprojectcollabs',    function(req, res) {
    var projectid = req.body.projectid;
    db.any('select person_id from collaborator where project_id = $1',projectid)
    .then(function (data) {
      var result = [];
      var a = [];

      for (var i = 0; i < data.length; i++) a.push(data[i].person_id);;

      var text = '{';
      for (var i = 0; i < a.length; i++) {
        text+=''+a[i];
        if (i < a.length-1) text+=','
      }
      text+='}';
      db.any("select * from person where id = any ('"+text+"'::varchar[])")
      .then(function(data) {
        res.json({message:"hokie!",conf:true,arr:data});
      });
    })
    .catch(function(error) {
      console.log("\nERROR in LUA get project collabsz : "+error);
      res.json({message:"get collabsz FAILZZ!",arr:[],conf:false});
    });
  });
  app.post('/lua-listtaskassign',        function(req, res) {
    var taskid = req.body.taskid;
    db.any('select * from assignment where task_id = $1',taskid)
    .then(function(data) {
      var ids = [];
      for (var i = 0; i < data.length; i++) ids.push(data[i].assignee_id);

      var text = '{';
      for (var i = 0; i < ids.length; i++) {
        text+=''+ids[i];
        if (i < ids.length-1) text+=','
      }
      text+='}';
      db.any("select * from person where id = any ('"+text+"'::varchar[])")
      .then(function(data) {
        res.json({message:"hokiehokiehokiehokie!",conf:true,arr:data});
      });

    })
    .catch(function(error) {
      console.log("\nERROR in list task assign! "+error);
      res.json({message:"naay sayup sa server!", conf:false});
    });
  });
  app.post('/lua-listcomments',          function(req, res) {
    var taskid = req.body.taskid;
    db.any('select * from comment where task_id = $1 and deleted = false order by comment_date',taskid)
    .then(function(data) {
      var arrs = {arr:[], usrs:[]};
      for (var i = 0; i < data.length; i++) arrs.arr.push(data[i]);
      return arrs;
    })
    .then(function(arrs) {

      var ids = [];
      for (var i = 0; i < arrs.arr.length; i++) ids.push(arrs.arr[i].user_id);

      var text = '{';
      for (var i = 0; i < ids.length; i++) {
        text+=''+ids[i];
        if (i < ids.length-1) text+=','
      }
      text+='}';
      db.any("select * from person where id = any ('"+text+"'::varchar[])")
      .then(function(data) {
        for (var i = 0; i < data.length; i++) arrs.usrs.push(data[i]);
        res.json({message:"hokiehokiehokiehokie!",conf:true,arrs:arrs});
        console.log("\nSakzez!...........lua-listcomments");
      });

    })
    .catch(function(error) {
      console.log("\nsayup sayup sayup : "+error);
      res.json({message:"error!!!!!!", conf:false});
    })
  });
  ////////////////////////////////////// OTHERS ////////////////////////////////
  app.post('/lua-completetask',          function(req, res) {
    var date =          new Date();
    var rating =        req.body.rating;
    var taskid =        req.body.taskid;
    var userid =        req.body.userid;
    var completedate =  date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    if (taskid != undefined || taskid == "") {
      db.none("update task set complete_date = $1 where id = $2",[completedate,taskid])
      .then(function(data) {

        db.any('select assignee_id from assignment where task_id = $1',taskid)
        .then(function(data) {

          var arr = [];
          for (var i = 0; i < data.length; i++) arr.push(data[i].assignee_id);

          var message = 'Someone completed a Task that you are also working with!';
          for (var i = 0; i < arr.length; i++) {
            var notifid = uuid.v1();
            console.log(arr[i]);
            db.none("insert into notif values($1,$2,$3,$4,$5,$6,$7,$8,$9)",[notifid,arr[i],userid,'completed',taskid,message,'completed',completedate,null])
            .catch(function(error) {
              console.log("\nERROR IN POST LUA NOTIF NOTIF notif : "+error);
              res.json({message : 'An Error Occurred!',conf:false});
            });
          }
          console.log("\nSuccessfully completed task! : ");
          res.json({message:'Task completed successfully!', conf:true});
        })
        .catch(function(error) {
          console.log("\nERROR IN lua COMPLETE TASKzzz" + error);
          res.json({message:'An error occurred!', conf:false});
        });
      })
      .catch(function(error) {
        console.log("\nERROR IN lua COMPLETE TASK" + error);
        res.json({message:'An error occurred!', conf:false});
      });
    }
    else {
      console.log("\nERROR IN lua COMPLETE TASK NO ID GiVEN" + error);
      res.json({message:'An error occurred! NO ID GiVEN', conf:false});
    }
  });
  app.post('/lua-uncompletetask',        function(req, res) {
    var taskid = req.body.taskid;
    if (taskid != undefined || taskid == "") {
      db.none("update task set complete_date = null where id = $1",taskid)
      .then(function(data) {
        console.log("\nSuccessfully UNcompleted task! : ");
        res.json({message:'Task completed successfully!', conf:true});
      })
      .catch(function(error) {
        console.log("\nERROR IN lua unCOMPLETE TASK"+error);
        res.json({message:'An error occurred!', conf:false});
      });
    }
    else {
      console.log("\nERROR IN lua unCOMPLETE TASK NO ID GiVEN" + error);
      res.json({message:'An error occurred! NO ID GiVEN', conf:false});
    }
  });
  app.post('/lua-checkcomplete',         function(req, res) {
    var taskid = req.body.taskid;
    db.any('select * from task')
    .then(function(data) {
      var parents = [];
      parents.push(taskid);
      for (var j = 0; j < parents.length; j++) {
        for (var i = 0; i < data.length; i++) {
          if (parents[j] == data[i].task_id) {
            parents.push(data[i].id);
          }
        }
      }
      parents.splice(0,1);
      var text = '{';
      for (var i = 0; i < parents.length; i++) {
        text+=''+parents[i];
        if (i < parents.length-1) text+=','
      }
      text+='}';
      db.any("select complete_date from task where id = any ('"+text+"'::varchar[])")
      .then(function(data) {
        for (var i = 0; i < data.length; i++) {
          if (data[i].complete_date == null) {throw "CANNOT COMPLETE!"; }
        }
        res.json({message:"okay", conf:true});
      })
      .catch(function(error) {
        console.log("not okay to complete " + error);
        res.json({message:"fail", conf:false});
      })
    })
    .catch(function(error) {
        console.log("not okay to complete " + error);
        res.json({message:"fail", conf:false});
    });
  });
  app.post('/lua-ratetask',              function(req, res) {
    var taskid =       req.body.taskid;
    var rating =       req.body.rating;
    db.none('update task set rating = $1 where id = $2',[rating,taskid])
    .then(function() {
      res.json({message:"lua rate task okayyyy!", conf:true});
    })
    .catch(function(error) {
      console.log("\nlua rate task Failed! "+error);
      res.json({message:"lua rate task Failed!", conf:false});
    });
  });
  app.post('/lua-getrating',             function(req, res) {
    var taskid = req.body.taskid;
    db.one('select rating from task where id = $1', taskid)
    .then(function(data) {
      console.log("\nlua get task raating oksssss!"+data.rating);
      res.json({message:"lua get task rating oksssss!", conf:false, rating:data.rating});
    })
    .catch(function(error) {
      console.log("\nlua get rating Failed! "+error);
      res.json({message:"lua get rating Failed!", conf:false});
    });
  });
  app.post('/lua-uploadpic',             function(req, res) {
    var fs = require('fs');
    var writableStream = fs.createWriteStream('file2.jpg');
    req.pipe(writableStream);
    req.setEncoding('utf8');
    req.on('data', function(chunk) {
        writableStream.write(chunk);
    });
    req.on('end', function() {
      res.json({message:"japheth!", conf:true}); 
    });
  });
  app.post('/lua-download',              function(req, res) {
    var userid = req.body.userid;
    console.log(userid);
    if (userid != "" && userid != undefined) {
      db.one('select profpic_path from person where id = $1',userid)
      .then(function(data) {
        console.log("lua-download okay!");
        res.sendFile(__dirname+"/"+data.profpic_path);
      })
      .catch(function(error) {
        console.log("\nlua-download Failed!...");
        res.json({message:"lua lua-download Failed!", conf:false});  
      });
    }
    else {
      console.log("\nlua-download Failed!");
      res.json({message:"lua lua-download Failed!", conf:false});
    }
  });
  //////////////////////////////////////////////////////////////////////////////
}
////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////     //////////////////////////////////////////
////////////////////////////   FUNCTIONS   /////////////////////////////////////
/////////////////////////////////     //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
function checkEmail(email) {return !(email.indexOf('@up.edu.ph') === -1);}
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////