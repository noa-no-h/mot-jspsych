var MOTAnimation = (function (jspsych) {
    //"use strict";
  
    const info = {
    name: 'MOT-movement',
    description: 'Custom MOT-movement task plugin',
    parameters: {
      totalCircleNumber: {
        type: jspsych.ParameterType.INT
      },
      secondsBeforeFlash: {
        type: jspsych.ParameterType.INT,
        default: 2
      },
      flashingCircleNumber: {
        type: jspsych.ParameterType.INT
      },
      flashingSeconds: {
        type: jspsych.ParameterType.INT,
        default: 2
      },
      movingSeconds: {
        type: jspsych.ParameterType.INT,
        default: 2
      },
      totalDuration: {
        type: jspsych.ParameterType.INT,
        default: 5
      },
      speed: {
        type: jspsych.ParameterType.INT
      },
      milisecondsFixationCross: {
        type: jspsych.ParameterType.INT,
        default: 2000
      },
      milisecondsCirclesAndCross: {
        type: jspsych.ParameterType.INT,
        default: 1000
     },
      milisecondsFlashingBalls: {
        type: jspsych.ParameterType.INT,
        default: 1000
      },
      milisecondsMotion: {
        type: jspsych.ParameterType.INT,
        default: 3000
      },
      circleRadius: {
        type: jspsych.ParameterType.INT,
        default: 30
      },
    }
  };

  


  class MOTAnimation {
    constructor(jsPsych) {
        this.jsPsych = jsPsych;
    }
    trial(display_element, trial) {

    //setup parameters here
    let phaseStartTime;
    let alreadySetPhase = false;
    let alreadyCheckedTimeOfQuestion = false;
    let correctSelections = 0;
    var totalNumberOfCircles = trial.totalCircleNumber;
    var numberOfFlashingCircles = trial.flashingCircleNumber;
    var speedOfMovement = trial.speed;
    //i put the parameter let circles = createCircles(); below because it 
    //needs to go after the circle class is defined

    //console.log("totalCircleNumber" + trial.totalCircleNumber)
    //console.log("flashingCircleNumber" + numberOfFlashingCircles)
    //console.log("speed" + speedOfMovement)

    // Create and append canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    //canvas.width = 800;
    //canvas.height = 600;
    display_element.appendChild(canvas);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.addEventListener("click", canvasClickHandler);
    document.addEventListener("keydown", keydownHandler);
    document.addEventListener('mousemove', canvasMouseMoveHandler);
    // Get context
    const ctx = canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);


    // Use the parameters like trial.totalCircleNumber, trial.secondsBeforeFlash, etc.
    class Circle {
        constructor(x, y, dx, dy, color, radius) {
            this.x = x;
            this.y = y;
            this.dx = dx;
            this.dy = dy;
            this.radius = radius;
            this.color = color;
            this.origcolor = color;
            this.isSelected = false; // Whether the circle is selected or not
        }
    
        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
    
        
        // Function to update the circle's position
        update() {
            this.x += this.dx;
            this.y += this.dy;
        }
    }

    function circlesOverlap(circle1, circle2) {
        let dx = circle2.x - circle1.x;
        let dy = circle2.y - circle1.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= 2 * trial.circleRadius;
      }

    // Function to check if a circle overlaps with the cross
    function overlapsWithCross(circle, crossX, crossY, crossSize) {
        return Math.abs(circle.x - crossX) < (crossSize + circle.radius) && Math.abs(circle.y - crossY) < (crossSize + circle.radius);
    }

    const crossX = canvas.width / 2;
    const crossY = canvas.height / 2;
    const crossSize = 30; // Adjust this based on the size of your cross

    function createCircles() {
    
        let circles = [];

    // Create distractor balls
    for (let i = 0; i < totalNumberOfCircles - numberOfFlashingCircles; i++) {
        let newCircle;
        do {
            newCircle = new Circle(
                trial.circleRadius + Math.random() * (canvas.width - 2 * trial.circleRadius),
                trial.circleRadius + Math.random() * (canvas.height - 2 * trial.circleRadius),
                1 + Math.random() * speedOfMovement,
                1 + Math.random() * speedOfMovement,
                "white",
                trial.circleRadius
            );
        } while (circles.some(c => circlesOverlap(c, newCircle)) || overlapsWithCross(newCircle, crossX, crossY, crossSize));
        circles.push(newCircle);
    }

    // Create flashing balls
    for (let i = 0; i < numberOfFlashingCircles; i++) {
        let newCircle;
        do {
            newCircle = new Circle(
                trial.circleRadius + Math.random() * (canvas.width - 2 * trial.circleRadius),
                trial.circleRadius + Math.random() * (canvas.height - 2 * trial.circleRadius),
                1 + Math.random() * speedOfMovement,
                1 + Math.random() * speedOfMovement,
                "green",
                trial.circleRadius
            );
        } while (circles.some(c => circlesOverlap(c, newCircle)) || overlapsWithCross(newCircle, crossX, crossY, crossSize));
        circles.push(newCircle);
    }


    return circles;
    }

    let circles = createCircles();

    //Function to check for collisions between circles and canvas bounds
    function circleCollision() {
        circles.forEach((circle) => {
          if (circle.x + circle.dx < trial.circleRadius || circle.x + circle.dx > canvas.width - trial.circleRadius) {
            circle.dx = -circle.dx;
          }
          if (circle.y + circle.dy < trial.circleRadius || circle.y + circle.dy > canvas.height - trial.circleRadius) {
            circle.dy = -circle.dy;
          }
        });
      }      

    function circleBounce() {
    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
        let dx = circles[j].x - circles[i].x;
        let dy = circles[j].y - circles[i].y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= 2 * trial.circleRadius) {
            // Swap the circles' speed in x-axis
            let temp_dx = circles[i].dx;
            circles[i].dx = circles[j].dx;
            circles[j].dx = temp_dx;

            // Swap the circles' speed in y-axis
            let temp_dy = circles[i].dy;
            circles[i].dy = circles[j].dy;
            circles[j].dy = temp_dy;
        }
        }
    }
    }


    /**
       * Function to handle click event on canvas
       */
    
    let selectedQueue = []
    let hoveredCircle = null;
    function canvasClickHandler(event) {
    if (phase === 'question') {
        //console.log("in canvasClickHandler")
        let rect = canvas.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;

        circles.forEach((circle) => {
        let dx = mouseX - circle.x;
        let dy = mouseY - circle.y;
        if (Math.sqrt(dx * dx + dy * dy) <= trial.circleRadius) {
            if (circle.isSelected) {
            // If the circle is already selected, deselect it and remove it from the queue
            circle.isSelected = false;
            selectedQueue = selectedQueue.filter(c => c !== circle);
            } else {
            // If the circle is not selected, select it and add it to the queue
            if (selectedQueue.length == numberOfFlashingCircles) {
                // If there are already n circles in the queue, where n is the level's number of flashingBalls,
                // deselect and remove the first one
                selectedQueue[0].isSelected = false;
                selectedQueue.shift();
            }
            circle.isSelected = true;
            selectedQueue.push(circle);
            }
        }
        });
    }
    }

    function keydownHandler(event) {
        if (phase === 'question' && event.key === " ") {
            //console.log("in keydownHandler")
            // Count correct circle selections and proceed to phase 4
            //correctSelections = 0 //global
            let totalSelections = 0;
            for (const [i, circle] of circles.entries()){
                if (circle.isSelected) {
                    totalSelections += 1;
                }
                if (circle.origcolor === "green" && circle.isSelected) {
                    correctSelections += 1;
                    //console.log("the following circle was correctly selected: " + i)
                }
            };
    
            if (totalSelections < numberOfFlashingCircles){
                showSelectMoreText = true; //this will have its effect in the game loop part for phase 5
                
            }
            else{
                endTrial();
            }
                        
        }
    }
    function canvasMouseMoveHandler(event) {
    if (phase === 'question') {
        //console.log("in canvasMouseMoveHandler")
        let rect = canvas.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;

        // Reset color of the previously hovered circle
        if (hoveredCircle) {
        hoveredCircle.color = 'black'; 
        hoveredCircle = null;
        }

        circles.forEach((circle) => {
        let dx = mouseX - circle.x;
        let dy = mouseY - circle.y;
        if (Math.sqrt(dx * dx + dy * dy) <= trial.circleRadius) {
            // Set this circle as the currently hovered circle and change its color
            hoveredCircle = circle;
            //console.log("in canvasMouseMoveHandler. hoveredCircle is " + hoveredCircle)
            hoveredCircle.color = 'teal';
        }
        });
    }
    }

    function drawCross() {
        const crossSize = 30;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const fontSize = 48;
    
        // Draw the "+" symbol
        ctx.beginPath();
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        ctx.fillText('+', centerX, centerY);
        ctx.closePath();
      }
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    

    function TrialLoop() {


        
        if (phase == 'fixationCross'){

            //make sure we don't reset the phase start time every loop
            if (alreadySetPhase == false){
                phaseStartTime = performance.now();
                alreadySetPhase = true;
            }

            drawCross();

            //console.log('in TrialLoop. phase is ' + phase + 
        //' trial.milisecondsFixationCross is ' + trial.milisecondsFixationCross + 
        //'phaseStartTime - performance.now() is ' + (performance.now() - phaseStartTime));

            if (performance.now() - phaseStartTime > trial.milisecondsFixationCross){
                phase = 'circlesAndCross';
                phaseStartTime = performance.now();
            }
        }
        

        if (phase == 'circlesAndCross'){

            //console.log("in circlesAndCross")

            circles.forEach((circle) => {
                circle.color = "black";
                circle.draw(ctx);
                });
            
            // after milisecondsFixationCross, move to phase flashingBalls
            if (performance.now() - phaseStartTime > trial.milisecondsCirclesAndCross){
                phase = 'flashingBalls';
                phaseStartTime = performance.now();
            }
        }
        

        if (phase == 'flashingBalls'){

            //code to flash circles green
            circles.forEach((circle) => {
                if (circle.origcolor === "green") {
                    circle.color = "green";
                }
                circle.draw(ctx);
                });
            
            // after milisecondsFlashingBalls, move to phase motion
            if (performance.now() - phaseStartTime > trial.milisecondsFlashingBalls){
                phase = 'motion';
                phaseStartTime = performance.now();
            }
        }

        if (phase == 'motion'){

            document.documentElement.style.cursor = 'none';


            ctx.clearRect(0, 0, canvas.width, canvas.height);

            //console.log("in motion")

            circleCollision();
            circleBounce();

            circles.forEach((circle) => {
            circle.color = "black";
            circle.update();
            circle.draw(ctx);
            });
                
            // after milisecondsMotion, move to phase motion
            if (performance.now() - phaseStartTime > trial.milisecondsMotion){
                phase = 'question';
                phaseStartTime = performance.now();
            }
        }

        if (phase == 'question'){
            document.documentElement.style.cursor = 'auto';

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            circles.forEach((circle) => {
                circle.draw(ctx);
                if (circle.isSelected) {
                  circle.color = "red";
                }
                else{
                  circle.color = "black";
                }
              });

            if (alreadyCheckedTimeOfQuestion === false){
                let timeOfQuestion = performance.now();
                showSelectMoreText = false;
                alreadyCheckedTimeOfQuestion = true;
            }

            
        
            // write out the instructions
            // Set the font size and style
            ctx.font = '24px Open Sans';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'grey';

            // Your text, split into lines
            var text = "Select the circles you've been tracking by clicking on them.\nPress space to submit your selection.";
            if (showSelectMoreText === true) {
                text += "\nPlease select at least " + numberOfFlashingCircles + " circles to proceed.";
            }

            // Calculate the starting y-position
            var lines = text.split('\n');
            var lineheight = 20;
            var yStart = (canvas.height - (lines.length * lineheight)) / 2 + lineheight / 2; // Center y

            // Initial position for drawing the text
            var x = canvas.width / 2; // Center x

            // Loop through the lines and draw them one at a time
            for (var i = 0; i < lines.length; i++) {
                var y = yStart + (i * lineheight);
                ctx.fillText(lines[i], x, y);
            }


        }

    requestAnimationFrame(TrialLoop);

    }

    function endTrial() {
        timeOfResponse = performance.now();

      // Perform any cleanup or data collection here
      var trial_data = {
        "reactionTime": timeOfResponse - timeOfQuestion,
        "totalCircles": totalNumberOfCircles,
        "numberTargets": numberOfFlashingCircles,
        "numberCorrectSelections": correctSelections,
        "win": correctSelections == numberOfFlashingCircles
        };


      // Remove event listeners
      document.removeEventListener('click', canvasClickHandler);
      document.removeEventListener('keydown', keydownHandler);
      document.removeEventListener('mousemove', canvasMouseMoveHandler);

      // End the trial
      jsPsych.finishTrial(trial_data);

    }

    // Call updateTrial() to start the trial logic
    let phase = "fixationCross"
    TrialLoop();

    
  }
}

  // Define your other functions here
  MOTAnimation.info = info;
  return MOTAnimation;
})(jsPsychModule);
