// Circle Temper js

// constants
var DEBUG = true;
var PI = Math.PI;
var DOS_PI = 2 * PI;
var PI_MEDIO = PI / 2;
var TRES_PI_MEDIO = 3 * PI_MEDIO
var GRANULARITY = 30;

angular.module('circleTemper', ['ionic'])

.controller('ctCtrl', function($scope) {
  var windowWidth;
  var windowHeight;
  var d;
  var rotX;
  var rotY;
  var prevQuadrant;
  var playPauseIcon;
  var effectIcon;
  var blob;
  var songChooser;
  var songName;
  var canvas;
  var ctx;
  var file;
  var sample;
  var smartBuffer = {time: 0, count: 0};

  /*
   * Function to initialize all variables and objects
   */ 
  $scope.initialize = function() {

    // Check for BlobURL support
    blob = window.URL || window.webkitURL;
    if (!blob) {
      console.log('Your browser does not support Blob URLs :(');
      return;           
    }

    $scope.DEBUG = DEBUG;
    // calculate initial circle diameter with minimal length
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    d = Math.min(windowWidth,windowHeight);
    $scope.diameter = d / 2;
    $scope.tempo = 1;
    $scope.level = 1;
    $scope.levelCount = 1;
    $scope.rad = 0;
    $scope.slow = true;
    rotX = windowWidth / 2;
    rotY = windowHeight / 2;
    prevQuadrant = 1;

    $scope.songName = "";
    $scope.uploaded = false;
    $scope.song = document.getElementById("song");
    playPauseIcon = document.getElementsByClassName('playPauseIcon');
    effectIcon = document.getElementById("effectIcon");
    songChooser = document.getElementById("songChooser");
    songName = document.getElementById("songName");
    songFile = document.getElementById("songFile");
    canvas = document.createElement('canvas');
    ctx = canvas.getContext("2d");
    // ctx.font = "11px Arial"; 
    $scope.tempoActive = true;
    $scope.startActive = false;
    $scope.endActive = false;

    sample = false;
    $scope.song.loop = true;
    $scope.loopStatus = "on";
    smartBuffer = {time: 0, count: 0};

    $scope.start = 0;

  }; $scope.initialize(); // call to initialize

  getQuadrant = function(){
    var angle = $scope.rad % DOS_PI; // [0..360) if angle is positive, (-360..0] if negative
    if (angle < 0) angle += DOS_PI; // Back to [0..360)
    return Math.floor((angle/PI_MEDIO) % 4 + 1); 
  }

  /* 
  * Change the knob according to
  * mouse's x & y coordinates
  *       x
  *       
  *     I | IV
  * y ____|____
  *       |    
  *    II | III
  */
  getKnobValue = function(e,knob){
    var value;
    //rearrange coord. with point of reference
    $scope.x = (rotY) - e.gesture.center.pageY;
    $scope.y = (rotX) - e.gesture.center.pageX;

    // calculate angle
    $scope.rad = Math.atan2($scope.y , $scope.x);
    $scope.deg = $scope.rad * 180 / Math.PI;

    // check if is getting slower or faster 
    $scope.quadrant = getQuadrant();
    if($scope.quadrant === 1 || $scope.quadrant === 4){
      if(prevQuadrant===4 && $scope.quadrant === 1){
        $scope.slow = true;
        $scope.levelCount++;
      }
      else if(prevQuadrant ===1 && $scope.quadrant === 4){
        $scope.slow = false;
        $scope.levelCount--;
      }
    }

    // Update angles according to direction & level
    if($scope.slow){
      if($scope.rad < 0){
        $scope.rad += DOS_PI;
        $scope.deg += 360;
      }
      $scope.rad += DOS_PI*($scope.levelCount-1);
      $scope.deg += 360*($scope.levelCount-1);
    }
    else{
      if($scope.rad > 0){
        $scope.rad -= DOS_PI;
        $scope.deg -= 360;
      }
      $scope.rad += DOS_PI*($scope.levelCount);
      $scope.deg += 360*($scope.levelCount);
    }

    //update rotation & tempo
    if($scope.tempoActive){
      value = 1 - ($scope.rad / (DOS_PI * $scope.level));
    }
    else if($scope.startActive || $scope.endActive){
      value = - ($scope.rad / (DOS_PI * $scope.level)) * $scope.song.duration;
      if (value < 0) prevQuadrant = $scope.quadrant;
    }
    
    // protect from negative values
    if(value < 0){
      $scope.levelCount = $scope.level;
      value = 0;
      $scope.rad = DOS_PI * $scope.level;
      $scope.deg = 360 * $scope.level;
    } 
    else{
      $scope.updateRotation(knob);
      prevQuadrant = $scope.quadrant;
    }    

    return value;
  }

  /* 
   * Change the tempo according to
   * mouse's x & y coordinates
   */
  $scope.tempoChange = function(e) {
    $scope.tempo = getKnobValue(e,"tempoKnob");
    $scope.updatePlaybackRate();
  }

  /* 
   * Change the start position according to
   * mouse's x & y coordinates
   */
  $scope.startChange = function(e) {
    if($scope.uploaded){
      $scope.start = getKnobValue(e,"startKnob") % $scope.song.duration;
      try{
        $scope.song.currentTime =  $scope.start;
      }catch(e){
        console.log("error: "+e);
        $scope.start = 0;
        $scope.reverseKnobChange();
      }
      console.log("start time: "+$scope.song.currentTime);
    }

  }
  /* 
   * Change the end position according to
   * mouse's x & y coordinates
   */
  $scope.endChange = function(e) {
    if($scope.uploaded){
      $scope.end = getKnobValue(e,"endKnob");
      console.log("end time: "+$scope.end);
      $scope.loopOrEndSong();
    }
  }

  /* 
   * Graphically change the position of the knob
   */
  $scope.updateRotation = function(knob) {
    document.getElementById(knob).style.transform="rotate("+(-$scope.rad)+"rad)";
  }

  /* 
   * Update the song's tempo
   */
  $scope.updatePlaybackRate = function(){
    if($scope.uploaded){
      try{
        $scope.song.playbackRate = $scope.tempo;
      }catch(e){
        console.log("error: "+e);
        $scope.tempo = $scope.song.playbackRate;
        $scope.reverseKnobChange();
      }
      console.log("tempo: "+$scope.song.playbackRate);
    }
  }

  $scope.reverseKnobChange = function(){
    var value = 0;
    var knob = "";
    if ($scope.tempoActive) {
      knob = "tempoKnob";
      value = $scope.tempo;
      $scope.rad = (1 - value) * (DOS_PI * $scope.level);
    }
    else if($scope.startActive){
      knob = "startKnob";
      value = $scope.start;
      $scope.rad = -(value / $scope.song.duration) * (DOS_PI * $scope.level);
    }
    else if ($scope.endActive){
      knob = "endKnob";
      value = $scope.end;
      $scope.rad = -(value / $scope.song.duration) * (DOS_PI * $scope.level);
    }
    
    $scope.updateRotation(knob);
  }

  setInterval(function () {
    $scope.loopOrEndSong();
  }, GRANULARITY);

  $scope.loopOrEndSong = function() {    
    if($scope.isPlaying() && ($scope.end > $scope.start)){
      if($scope.end === $scope.song.duration && $scope.song.currentTime === 0 && $scope.start !== 0){
        console.log("looping at: "+$scope.song.currentTime+" > "+$scope.end);
        $scope.song.currentTime = $scope.start;

        if(!$scope.song.loop){
          $scope.pause();
          return;   
        }
      }
      else if(($scope.song.currentTime > ($scope.end - smartBuffer.time))){
        smartBuffer.count++;
        smartBuffer.time = (($scope.song.currentTime - $scope.end) + smartBuffer.time) / smartBuffer.count;
        console.log("looping at: "+$scope.song.currentTime+" > "+$scope.end);
        $scope.song.currentTime = $scope.start;

        if(!$scope.song.loop){
          $scope.pause();
          return;   
        }
      }
    }
  }

  /* 
   * Decrease the level of precision of tempo ratio
   */
  $scope.decreaseLevel = function(){
    if($scope.level===1) {
      $scope.level = 1
    }
    else{
      $scope.level--;
      $scope.reverseKnobChange();
      if($scope.levelCount > $scope.level){
        $scope.levelCount--;
      }
      else if($scope.levelCount < 0){
        $scope.levelCount ++;
      }
    }
  }

  /* 
   * Increase the level of precision of tempo ratio
   */
  $scope.increaseLevel = function(){
    $scope.level++;
    $scope.reverseKnobChange();
    $scope.quadrant = getQuadrant();
    if($scope.levelCount < 0 || ($scope.levelCount<1 && $scope.quadrant !== prevQuadrant)){
      $scope.levelCount--;
    }
    else if($scope.quadrant === prevQuadrant && $scope.quadrant === 1 || $scope.levelCount < 1){
      // do nothing
    }
    else if($scope.quadrant <= prevQuadrant){
      $scope.levelCount++;
      prevQuadrant = $scope.quadrant;
    }
  }  

  /* 
   * Load song into the app
   */
  $scope.uploadSong = function(fileread){
    $scope.uploaded = false;
    var name = fileread.name;
    $scope.songName = name.slice(name.lastIndexOf('/')+1,name.lastIndexOf('.'));
    var width = ctx.measureText($scope.songName).width;
    if(width > songChooser.clientWidth){
      angular.element(songName).addClass("marquee");
    }

    var src = blob.createObjectURL(fileread);
    $scope.song.setAttribute('src',src);
    $scope.song.playbackRate = $scope.tempo;
    for(var i=0;i<playPauseIcon.length; i++){
      angular.element(playPauseIcon[i]).removeClass('ion-upload');
      angular.element(playPauseIcon[i]).addClass('ion-play');
    }
    
    $scope.updatePlaybackRate();
    $scope.song.muted = false;

    $scope.song.ondurationchange = function(){
      $scope.end = $scope.song.duration;
    };
    $scope.song.ontimeupdate = function(){
      $scope.loopOrEndSong();
    };
    $scope.song.onended = function(){
      console.log("ended");
      $scope.restart();
    };

    $scope.uploaded = true;
  }

  $scope.isPlaying = function(){
    return $scope.uploaded && !$scope.song.paused;
  }

  /* 
   * Play or pause the song
   */
  $scope.playPause = function(){
    if($scope.uploaded){
      
      if($scope.isPlaying()){
        $scope.pause();
      }
      else{
        $scope.play();
      }
    }
  }

  $scope.play = function() {
    $scope.song.play();
    for(var i=0;i<playPauseIcon.length; i++){
      angular.element(playPauseIcon[i]).removeClass('ion-play');
      angular.element(playPauseIcon[i]).addClass('ion-pause');
    }
  }

  $scope.pause = function() {
    $scope.song.pause();
    for(var i=0;i<playPauseIcon.length; i++){
      angular.element(playPauseIcon[i]).removeClass('ion-pause');
      angular.element(playPauseIcon[i]).addClass('ion-play');
    }
  }

  /* 
   * Reset variables to their initial state
   * and resets new variables that were created along the way
   */
  $scope.reset = function(){

    $scope.initialize();
    $scope.updateRotation("tempoKnob");
    $scope.updatePlaybackRate();
    $scope.updateRotation("startKnob");
    $scope.updateRotation("endKnob");

    $scope.song.pause();
    $scope.song.setAttribute('src','');
    songFile.value = '';
    $scope.songName = '';

    for(var i=0; i<playPauseIcon.length; i++){
      angular.element(playPauseIcon[i]).removeClass('ion-play');
      angular.element(playPauseIcon[i]).removeClass('ion-pause');
      angular.element(playPauseIcon[i]).addClass('ion-upload');
    }
    angular.element(songFile).removeClass('marquee');
    
  }
  
  /* 
   * Restarts the song according to sample position
   */
  $scope.restart = function(){
    $scope.playPause();
    $scope.song.currentTime = $scope.start;
    $scope.playPause();
  }

  /* 
   * Saves the sample according to sample position
   */
  $scope.saveSample = function() {

    // saveAs($scope.song);
    if(!$scope.uploaded) {
      alert("No song uploaded");
      return;
    }
    else if($scope.end === 0){
      alert("No region created");
      return;
    }

    var name = prompt("Save as...", $scope.songName);
    var sample = {
      "name": name,
      "start": $scope.start,
      "end": $scope.end
    };
    localStorage.setItem('sample', JSON.stringify(sample));

    // Retrieve the object from storage
    var data = JSON.parse(localStorage.getItem('sample'));
    console.log(data.name+' region: '+data.start+','+data.end);

  }

  clearEffects = function(){
    $scope.tempoActive = false;
    $scope.startActive = false;
    $scope.endActive = false;
  }

  $scope.controlTempo = function(){
    clearEffects();
    $scope.tempoActive = true;
  }

  $scope.controlStart = function(){
    clearEffects();
    $scope.startActive = true;

  }
  $scope.controlEnd = function(){
    clearEffects();
    $scope.endActive = true;

  }
  $scope.toggleLoop = function(){
    if($scope.song.loop){
      $scope.song.loop = false;
      $scope.loopStatus = "off";
    }
    else{
      $scope.song.loop = true;
      $scope.loopStatus = "on";
    }
  }


})

/* 
 * Directive for file upload functionality
 */
.directive("fileread", [function () {
    return {
        scope: {
            fileread: "=",
            someCtrlFn: '&callbackFn'
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                scope.$apply(function () {
                    scope.fileread = changeEvent.target.files[0];
                    // or all selected files:
                    // scope.fileread = changeEvent.target.files;
                    console.log(scope.fileread.name);
                    scope.someCtrlFn({file: scope.fileread});
                });
            });
        }
    }
}])

/* 
 * Something that ionic brought (don't touch)
 */
.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

