var SimpleCrossPlugin = (function (jspsych) {
    "use strict";
  
    const info = {
      name: "simple-cross",
      parameters: {}
    };
  
    class SimpleCrossPlugin {
      constructor(jsPsych) {
        this.jsPsych = jsPsych;
      }
  
      trial(display_element, trial) {
        // Display a cross
        display_element.innerHTML = '<p style="font-size: 48px;">+</p>';

        console.log("from cross plugin")
  
        // Data to be saved
        var trial_data = {
          number: 5
        };
  
        // End the trial and save data
        this.jsPsych.finishTrial(trial_data);
      }
    }
    SimpleCrossPlugin.info = info;
  
    return SimpleCrossPlugin;
  })(jsPsychModule);
  