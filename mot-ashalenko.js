// ashalenko Multiple Object Tracking
var jsPsychMOT = (function (jspsych) {
    'use strict';
      const info = {
          name: "mot",
          parameters: {
              ball_radius: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Ball Radius",
                default: 20,
                description: "The size of the objects displayed."
              },
              objects: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Objects",
                default: 1,
                description: "The number of objects displayed."
              },
              targets: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Targets",
                default: 1,
                description: "The number of objects marked as targets to be tracked."
              },
              trial_duration: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Trial duration",
                default: 10000,
                description: "The length of stimulus presentation."
              },
              flashes: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Target flashes",
                default: 3,
                description: "The number of times the targets will flash before moving."
              },
              flash_duration: {
                  type: jspsych.ParameterType.INT,
                  pretty_name: "Flash duration",
                  default: 500,
                  description: "The duration of each flash for each target."
                },
              show_score: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Show score",
                default: true,
                description: "Whether or not to show the score after the trial."
              },
              show_score_duration: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Show score duration",
                default: 1000,
                description: "The length the score is shown on screen after the trial."
              },
              move_distance: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Move distance",
                default: 2,
                description: "The distance in pixels each object moves per frames"
              },
              canvas_width: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Canvas width",
                default: 800,
                description: "The width of the canvas the targets will move on."
              },
              canvas_height: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Canvas height",
                default: 600,
                description: "The height of the canvas the targets will move on."
              },
              canvas_colour: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Canvas colour",
                default: "black",
                description: "The colour of the canvas the targets will move on."
              },
              background_colour: {
                type: jspsych.ParameterType.STRING,
                pretty_name: "Background colour",
                default: "black",
                description: "The colour of the background the canvas is displayed on."
              },
              timeout: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Timeout duration",
                default: 30000,
                description: "The duration of time for objects to be clickable before the trial ends."
              },
              object_collision: {
                  type: jspsych.ParameterType.BOOL,
                  pretty_name: "Object Collision",
                  default: true,
                  description: "Whether objects should deflect when they collide. False will cause deflections only on walls."
              },
          },
       };
  
  
      //BEGINNING OF TRIAL 
      class MOTPlugin {
          constructor(jsPsych) {
              this.jsPsych = jsPsych;
          }
          trial(display_element, trial) {
  
          //--------------------------------------
          //---------SET PARAMETERS BEGIN---------
          //--------------------------------------
          
  
          //Convert the parameter variables to those that the code below can use
          
          // create canvas
          var html = '<canvas id="myCanvas" width="' + trial.canvas_width + '" height="' + trial.canvas_height + '"></canvas>';
          display_element.innerHTML = html;
          
          var body = document.getElementsByClassName("jspsych-display-element")[0];
          body.style.backgroundColor = trial.background_colour;
          
          let canvas = document.getElementById("myCanvas")
  
          canvas.style.width = trial.canvas_width + "px";
          canvas.style.height = trial.canvas_height + "px";
              canvas.style.padding = 0;
              canvas.style.margin = "auto";
              canvas.style.display = "block";
              canvas.style.position = "absolute";
              canvas.style.top = 0;
              canvas.style.bottom = 0;
              canvas.style.left = 0;
              canvas.style.right = 0;
          canvas.style.backgroundColor = trial.canvas_colour;
          
  
          // Setting variables to be used in the trial
  
          var ctx = canvas.getContext("2d");
          var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
          var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
          var move_distance = trial.move_distance;
          var dxy = [-move_distance, move_distance];
          var ballRadius = trial.ball_radius;
          var x_min = ballRadius;
          var y_min = ballRadius;
          var x_max = canvas.width-ballRadius;
          var y_max = canvas.height-ballRadius;
          var Nobjects = trial.objects;
          var Ntargets = trial.targets;
          var Nflashes = trial.flashes;
          var flashDuration = trial.flash_duration
          var trialDuration = trial.trial_duration;
          var show_score = trial.show_score;
          var show_score_duration = trial.show_score_duration;
          var timeout_duration = trial.timeout;
          var objectCollision = trial.object_collision;
          var noOverlap = true;
          var Object;
          var bucket;
          var counter;
          var startTime;
          var startRT;
          var endRT;
          var reactionTime;
          var timeNow;
          var timeElapsed;
          var moving;
          var clicks;
          var Ncorrect;
          var interval;
          var randomIndex;
          var rect;
          var x;
          var y;
          var AnimateBall;
          var colour;
          
          // Chooses a random X pixel location of the target
          function randXLocation() {
              return Math.floor(Math.random() * (x_max - x_min + 1) + x_min);
          }
          // Chooses a random Y pixel location of the target
          function randYLocation() {	
              return Math.floor(Math.random() * (y_max - y_min + 1) + y_min);
          }
          // Chooses a random target from all targets
          function getRandomFromBucket() {
                 randomIndex = Math.floor(Math.random()*bucket.length);
                 return bucket.splice(randomIndex, 1)[0];
          }
          // Chooses which of the objects will be targets
          function chooseTargets() {
              for(var i=0; i<Nobjects; i++) {
                  bucket.push(i);
              }
              for(var c=0; c<Ntargets; c++) {
                  Object[getRandomFromBucket()].target = 1;
              }		
          }
          // Chooses the locations of each object. It will loop to make sure no object is overlapping or too close to another target.
          function chooseLocations() {
              Object = [];
              while (Object.length < Nobjects) {
                  var Objects = {
                      x: randXLocation(),
                      y: randYLocation(),
                      dx: 0,
                      dy: 0,
                      target: 0,
                      id: Object.length + 1
                  };
              
                  var overlapping = false;
  
                  for(var j=0; j < Object.length; j++) {
                      var other = Object[j];
                      var d = distance(Objects.x, Objects.y, other.x, other.y);
                      if (d < ballRadius * 5) {
                          overlapping = true;
                          break;
                      }
                  }
                  if (!overlapping) {
                      Object.push(Objects);
                  }
              }
          }
          // Formula to check how close the two targets are to one another
          function distance(x1, y1, x2, y2) {
              return Math.hypot(x2-x1, y2-y1)
          }
          // Chooses a direction for each object to move in
          function chooseDirection () {
              for(var c=0; c<Nobjects; c++) {
                  Object[c].dx = dxy[Math.floor(Math.random()*dxy.length)];
                  Object[c].dy = dxy[Math.floor(Math.random()*dxy.length)];
              }
          }
          // Checks to make sure that targets close together aren't all moving in the same direction
          function checkTargets () {
              for(var j=0; j < Nobjects; j++) {
                  for(var i=0; i < Nobjects; i++) {
                      if (i != j) {
                          var d = distance(Object[j].x, Object[j].y, Object[i].x, Object[i].y);
                          if (d < ballRadius * 5  && Object[j].dx == Object[i].dx && Object[j].dy == Object[i].dy) {
                              var temp = Math.floor(Math.random() * 2) + 1;
                              if (temp == 1) {
                                  Object[i].dx = -Object[i].dx
                              }
                              else {
                                  Object[i].dy = -Object[i].dy
                              }
                          }
                      }
                  }
              }
          }
          // Flashes the targets before beginning a trial
          function flashBall() {
              for(var c=0; c<Nobjects; c++) {
                  ctx.beginPath();
                  if(Object[c].target == 1 && counter % 2 == 1) {
                      colour = "red";
                  } else {
                      colour = "white";
                  }
                  ctx.arc(Object[c].x, Object[c].y, ballRadius, 0, Math.PI*2);
                  ctx.fillStyle = colour;
                  ctx.fill();
                  ctx.closePath();
              }
              counter++;
              if(counter == (Nflashes * 2 + 1)) {
                  clearInterval(interval);
                  clicks = 0;
                  moveBall()
                  AnimateBall = requestAnimationFrame(moveBall);
                  cancelAnimationFrame(AnimateBall);
              }
          }
          // Draws each of the objects
          function drawBall() {
              for(var c=0; c<Nobjects; c++) {
                      ctx.beginPath();
                      ctx.arc(Object[c].x, Object[c].y, ballRadius, 0, Math.PI*2);
                  ctx.fillStyle = 'white';
                      ctx.fill();
                      ctx.closePath();
              }
          }
          // Checks if an object is hitting the boundary of the canvas to switch direction.
          function collisionDetection() {
              for(var c=0; c<Nobjects; c++) {
                  if(Object[c].x + Object[c].dx > x_max || Object[c].x + Object[c].dx < ballRadius) {
                      Object[c].dx = -Object[c].dx
                  }			
                  if(Object[c].y + Object[c].dy > y_max || Object[c].y + Object[c].dy < ballRadius) {
                      Object[c].dy = -Object[c].dy
                  }
                  if (objectCollision === true) {
                      for(var i = 0; i<Nobjects; i++) {
                          if(Object[c].id != Object[i].id) {
                              var d = distance(Object[c].x, Object[c].y, Object[i].x, Object[i].y);
                              if(d < ballRadius * 2) {
                                  Object[c].dx = -Object[c].dx
                                  Object[c].dy = -Object[c].dy								
                              }			
                          }
                      }
                  }
              }
              for(var j=0; j < Object.length; j++) {
                  for(var i=0; i < Object.length; i++) {
                      if (i != j) {
                          var d = distance(Object[j].x, Object[j].y, Object[i].x, Object[i].y);
                          if (d < ballRadius * 2) {
                              noOverlap = false;
                              break;
                          }
                      }
                  }
              }
          }
          // Animates each object to move on the screen
          function moveBall() {
              if (startTime == 0) {
                  startTime = Date.now();
                  timeElapsed = 0;
                  timeNow = 0;
              }
              timeNow = Date.now()
              timeElapsed = timeNow - startTime;
              if (timeElapsed < trialDuration) {
                  AnimateBall = requestAnimationFrame(moveBall);
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  noOverlap = true;
                  collisionDetection();
                  for(var c=0; c<Nobjects; c++) {  		
                      Object[c].x += Object[c].dx;
                      Object[c].y += Object[c].dy;
                  }
                  drawBall();
              }
              else {
                  if (noOverlap === true) {
                      document.body.style.cursor = "auto";
                      moving = false;
                      startRT = Date.now();
                      interval = setTimeout(trialFinish, timeout_duration);
                  }
                  else {
                      AnimateBall = requestAnimationFrame(moveBall);
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                      noOverlap = true;
                      collisionDetection();
                      for(var c=0; c<Nobjects; c++) {  		
                          Object[c].x += Object[c].dx;
                          Object[c].y += Object[c].dy;
                      }
                      drawBall();
                  }				
              }
          }
          // Monitors for mouse clicks in the canvas to check what objects are being selected
          function getCursorPosition(canvas, event) {
              rect = canvas.getBoundingClientRect();
              x = event.clientX - rect.left;
              y = event.clientY - rect.top;
              for(var c=0; c<Nobjects; c++) {  		
                  if(x >= Object[c].x - ballRadius && x <= Object[c].x + ballRadius && y >= Object[c].y - ballRadius && y <= Object[c].y + ballRadius){
                      clicks++
                      if(Object[c].target == 1) { colour = "green";
                          Ncorrect++
                      }
                      else colour = "red";
                      ctx.beginPath();
                          ctx.arc(Object[c].x, Object[c].y, ballRadius, 0, Math.PI*2);
                      ctx.fillStyle = colour;
                          ctx.fill();
                          ctx.closePath();
                  }
              }
              if(clicks == Ntargets){
                  endRT = Date.now();
                  reactionTime = endRT - startRT;
                  clearTimeout(interval);
                  trialFinish();
              }
          }
          // Starts a trial
          function startTrials() {
              Object = [];
              bucket = [];
              counter = 0;
              startTime = 0;
              timeNow = 0;
              timeElapsed = 0;
              startRT = 0;
              endRT = 0;
              reactionTime = -1;
              moving = true;
              clicks = 0;
              Ncorrect = 0;
              document.body.style.cursor = "none";
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              chooseLocations();
              chooseTargets();
              chooseDirection();
              checkTargets();		
              flashBall();
              interval = setInterval(flashBall, flashDuration);
          }
          // Finishes the trial
          function trialFinish() {
              clicks = Ntargets;
              if(show_score === true){
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.fillStyle = "white";
                  ctx.font = '40px sans-serif';
                  var textString = Ncorrect + "/" + Ntargets + " correct"
                      var textWidth = ctx.measureText(textString ).width;
                  ctx.fillText(textString , (canvas.width/2) - (textWidth / 2), canvas.height/2);
              }
              setTimeout(end_trial, show_score_duration);
          }
          // Provides the relevant data about the trial performance
          const end_trial = () => {
                  var trial_data = {
                  "rt": reactionTime,
                  "Objects": Nobjects,
                  "Targets": Ntargets,
                  "Correct": Ncorrect
                  }
              display_element.innerHTML = "";
              this.jsPsych.finishTrial(trial_data);
          }
  
          startTrials()
  
          canvas.addEventListener('mousedown', function(e) {
              if (moving === false) getCursorPosition(canvas, e)
          })
      }
  }
  
      //Return the plugin object which contains the trial
    MOTPlugin.info = info;
  
    return MOTPlugin;
  
  })(jsPsychModule);