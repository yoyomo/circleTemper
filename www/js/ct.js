// Circle Temper js

// constants
var DEBUG = false;
var DOS_PI = 2 * Math.PI;

angular.module('circleTemper', ['ionic'])

.controller('ctCtrl', function($scope) {
  var windowWidth;
  var windowHeight;
  var d;
  var rotX;
  var rotY;
  var prevX;
  var prevY;
  var playPauseIcon;
  var effectIcon;
  var blob;
  var songChooser;
  var songName;
  var canvas;
  var ctx;
  var file;

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
    prevX = rotX;
    prevY = rotY + $scope.diameter;

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
    $scope.segmentActive = false;

    $scope.start = $scope.end = 0;

  }; $scope.initialize(); // call to initialize


  /* 
   * Change the knob according to
   * mouse's x & y coordinates
   */
  getKnobValue = function(e,knob){
    var value;
    //rearrange coord. with point of reference
    $scope.x = (rotY) - e.gesture.center.pageY;
    $scope.y = (rotX) - e.gesture.center.pageX;

    //calculate angle
    $scope.rad = Math.atan2($scope.y , $scope.x);
    $scope.deg = $scope.rad * 180 / Math.PI;

    // check if is getting slower or faster  

    if($scope.x > 0 && prevY < 0 && $scope.y >= 0){
      $scope.slow = true;
      $scope.levelCount++;
    }
    else if($scope.x > 0 && prevY > 0 && $scope.y <= 0){
      $scope.slow = false;
      $scope.levelCount--;
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
      $scope.rad -= DOS_PI*(-$scope.levelCount);
      $scope.deg -= 360*(-$scope.levelCount);
    }

    //update rotation & tempo
    if($scope.tempoActive){
      value = 1 - ($scope.rad / (DOS_PI * $scope.level));
    }
    if($scope.segmentActive){
      value = - ($scope.rad / (DOS_PI * $scope.level)) * $scope.song.duration;
    }
    
    //protect from negative values
    if(value< 0){
      $scope.levelCount = $scope.level;
      value = 0;
      $scope.rad = DOS_PI * $scope.level;
      $scope.deg = 360 * $scope.level;
      return value;
    } 
    
    $scope.updateRotation(knob);

    //exiting
    prevX = $scope.x;
    prevY = $scope.y;

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
   * Change the tempo according to
   * mouse's x & y coordinates
   */
  $scope.startChange = function(e) {

    $scope.start = getKnobValue(e,"segmentKnob");
    $scope.song.currentTime = $scope.start;

  }

  /* 
   * Graphically change the position of the bar
   */
  $scope.updateRotation = function(knob) {
    document.getElementById(knob).style.transform="rotate("+(-$scope.rad)+"rad)";
  }

  /* 
   * Update the song's tempo
   */
  $scope.updatePlaybackRate = function(){
    if($scope.uploaded){
      $scope.song.playbackRate = $scope.tempo;
    }
  }

  /* 
   * Decrease the level of precision of tempo ratio
   */
  $scope.decreaseLevel = function(){
    $scope.level--;
    if($scope.level < 1) $scope.level = 1;

  }

  /* 
   * Increase the level of precision of tempo ratio
   */
  $scope.increaseLevel = function(){
    $scope.level++;

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
    $scope.uploaded = true;
  }

  /* 
   * Play or pause the song
   */
  $scope.playPause = function(){
    if($scope.uploaded){
      
      if($scope.song.paused){
        $scope.song.play();
        for(var i=0;i<playPauseIcon.length; i++){
          angular.element(playPauseIcon[i]).removeClass('ion-play');
          angular.element(playPauseIcon[i]).addClass('ion-pause');
        }
      }
      else{
        $scope.song.pause();
        for(var i=0;i<playPauseIcon.length; i++){
          angular.element(playPauseIcon[i]).removeClass('ion-pause');
          angular.element(playPauseIcon[i]).addClass('ion-play');
        }
      }
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
    $scope.updateRotation("segmentKnob");

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
    $scope.segmentActive = false;
  }

  $scope.controlTempo = function(){
    clearEffects();
    $scope.tempoActive = true;
  }

  $scope.controlSegment = function(){
    clearEffects();
    $scope.segmentActive = true;

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
