var MOTMovement = (function (jspsych) {
    "use strict";
  
    const info = {
    name: 'MOT-movement',
    description: 'Custom MOT-movement task plugin',
    parameters: {
      totalCircleNumber: {
        type: jspsych.ParameterType.INT,
        default: 3
      },
      secondsBeforeFlash: {
        type: jspsych.ParameterType.INT,
        default: 2
      },
      flashingCircleNumber: {
        type: jspsych.ParameterType.INT,
        default: 2
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
        type: jspsych.ParameterType.INT,
        default: 2
      },
      milisecondsFixationCross: {
        type: jspsych.ParameterType.INT,
        default: 1000
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
      }
    }
  };

  class MOTMovement {
    constructor(jsPsych) {
        this.jsPsych = jsPsych;
    }
    trial(display_element, trial) {

    //setup parameters here
    let phaseStartTime;
    let alreadySetPhase = false;
    //i put the parameter let circles = createCircles(); below because it 
    //needs to go after the circle class is defined


    // Create and append canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    //canvas.width = 800;
    //canvas.height = 600;
    console.log("canvas.width: " + canvas.width);
    display_element.appendChild(canvas);
    canvas.addEventListener("click", canvasClickHandler);
    document.addEventListener("keydown", keydownHandler);
    canvas.addEventListener('mousemove', canvasMouseMoveHandler);
    // Get context
    const ctx = canvas.getContext('2d');


    // Use the parameters like trial.totalCircleNumber, trial.secondsBeforeFlash, etc.
    class Circle {
        constructor(x, y, dx, dy, color) {
            this.x = x;
            this.y = y;
            this.dx = dx;
            this.dy = dy;
            this.color = color;
            this.origcolor = color;
            this.isSelected = false; // Whether the circle is selected or not
        }
    
        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 30, 0, Math.PI * 2, false);
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
        return distance <= 60;
      }

    function createCircles() {
    
        let circles = [];

    // Create distractor balls
    for (let i = 0; i < trial.totalCircleNumber - trial.flashingCircleNumber; i++) {
        let newCircle = new Circle(
        30 + Math.random() * (canvas.width - 60),
        30 + Math.random() * (canvas.height - 60),
        1 + Math.random() * trial.speed,
        1 + Math.random() * trial.speed,
        "white"
        );
        while (circles.some(c => circlesOverlap(c, newCircle))) {
        newCircle.x = 30 + Math.random() * (canvas.width - 60);
        newCircle.y = 30 + Math.random() * (canvas.height - 60);
        }
        circles.push(newCircle);
    }

    // Create flashing balls
    for (let i = 0; i < trial.flashingCircleNumber; i++) {
        let newCircle = new Circle(
        30 + Math.random() * (canvas.width - 60),
        30 + Math.random() * (canvas.height - 60),
        1 + Math.random() * trial.speed,
        1 + Math.random() * trial.speed,
        "green"
        );
        while (circles.some(c => circlesOverlap(c, newCircle))) {
        newCircle.x = 30 + Math.random() * (canvas.width - 60);
        newCircle.y = 30 + Math.random() * (canvas.height - 60);
        }
        circles.push(newCircle);
    }

    return circles;
    }

    let circles = createCircles();

    //Function to check for collisions between circles and canvas bounds
    function circleCollision() {
        circles.forEach((circle) => {
          if (circle.x + circle.dx < 30 || circle.x + circle.dx > canvas.width - 30) {
            circle.dx = -circle.dx;
          }
          if (circle.y + circle.dy < 30 || circle.y + circle.dy > canvas.height - 30) {
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

        if (distance <= 60) {
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
    if (phase === 5) {
        let rect = canvas.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;

        circles.forEach((circle) => {
        let dx = mouseX - circle.x;
        let dy = mouseY - circle.y;
        if (Math.sqrt(dx * dx + dy * dy) <= 30) {
            if (circle.isSelected) {
            // If the circle is already selected, deselect it and remove it from the queue
            circle.isSelected = false;
            selectedQueue = selectedQueue.filter(c => c !== circle);
            } else {
            // If the circle is not selected, select it and add it to the queue
            if (selectedQueue.length === trial.flashingCircleNumber) {
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
        if (phase === 5 && event.key === " ") {
            // Count correct circle selections and proceed to phase 4
            correctSelections = 0;
            totalSelections = 0;
            for (const [i, circle] of circles.entries()){
                if (circle.isSelected) {
                    totalSelections += 1;
                }
                if (circle.origcolor === "green" && circle.isSelected) {
                    correctSelections += 1;
                    console.log("the following circle was correctly selected: " + i)
                }
            };
    
            if (totalSelections < trial.flashingCircleNumber){
                showSelectMoreText = true; //this will have its effect in the game loop part for phase 5
                
            }
            else{
                // Level progression and regression
                if (correctSelections === trial.flashingCircleNumber) {
                    // If all flashing balls were correctly selected, move to the next level
                    level = Math.min(level + 1, flashingBalls.length - 1);
                    consecutive += 1;
                } else {
                    // If at least one flashing ball was not correctly selected, move to the level three previous
                    level = Math.max(level - 3, 0);
                    consecutive = Math.floor(consecutive / 2)
                }
    
                timeOfResponse = performance.now();
                transitionToPhase(6);
            }
                        
        }
    }
    function canvasMouseMoveHandler(event) {
    if (phase === 5) {
        let rect = canvas.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;

        // Reset color of the previously hovered circle
        if (hoveredCircle) {
        hoveredCircle.color = 'white'; 
        hoveredCircle = null;
        }

        circles.forEach((circle) => {
        let dx = mouseX - circle.x;
        let dy = mouseY - circle.y;
        if (Math.sqrt(dx * dx + dy * dy) <= 30) {
            // Set this circle as the currently hovered circle and change its color
            hoveredCircle = circle;
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
    

    

    function TrialLoop() {

        
        if (phase == 'fixationCross'){

            //make sure we don't reset the phase start time every loop
            if (alreadySetPhase == false){
                phaseStartTime = performance.now();
                alreadySetPhase = true;
            }

            console.log('in update trial. phase is ' + phase + 
        ' trial.milisecondsFixationCross is ' + trial.milisecondsFixationCross + 
        'phaseStartTime - performance.now() is ' + (performance.now() - phaseStartTime));

            if (performance.now() - phaseStartTime > trial.milisecondsFixationCross){
                phase = 'circlesAndCross';
                phaseStartTime = performance.now();
            }
        }
        

        if (phase == 'circlesAndCross'){

            console.log("in circlesAndCross")

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


            circleCollision();
            circleBounce();
            
            // after milisecondsMotion, move to phase motion
            if (performance.now() - phaseStartTime > trial.milisecondsMotion){
                phase = 'question';
                phaseStartTime = performance.now();
            }
        }

        requestAnimationFrame(TrialLoop);

    }

    function endTrial() {
      // Perform any cleanup or data collection here
      var trial_data = {
        // Add relevant data properties here
      };

      // Remove event listeners
      canvas.removeEventListener('click', canvasClickHandler);
      canvas.removeEventListener('mousemove', canvasMouseMoveHandler);

      // End the trial
      this.jsPsych.finishTrial(trial_data);
    }

    // Call updateTrial() to start the trial logic
    let phase = "fixationCross"
    TrialLoop();

    // Call endTrial() after the trial duration
    setTimeout(endTrial, trial.totalDuration); // Trial duration in milliseconds
  }
}

  // Define your other functions here
  MOTMovement.info = info;
  return MOTMovement;
})(jsPsychModule);
