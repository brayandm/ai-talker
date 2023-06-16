//set up canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
var cw = canvas.width = 1024;
var ch = canvas.height =255;
var waveForm = document.createElement("canvas");
waveForm.width = 1024;
waveForm.height =255;
var ctxw = waveForm.getContext("2d");
document.body.appendChild(canvas);
document.body.appendChild(waveForm);

// set up HTML5 audio player
var audio = new Audio();
audio.src = "hi.mp3";
audio.load();

// Set up web audio object
var duration=0;
window.AudioContext = window.AudioContext||window.webkitAudioContext; // old safari trick
var audioContext = new AudioContext();
var analyser = audioContext.createAnalyser();
analyser.connect(audioContext.destination);
var source = audioContext.createMediaElementSource(audio);
// async, wait for audio to load before connecting to audioContext
audio.addEventListener("canplaythrough", function(){
  source.connect(analyser);
  document.getElementById("play-btn").style.display = "block";
  duration = audio.duration;
  draw();
});

function getDataFromAudio(){
  //analyser.fftSize = 2048;
  var freqByteData = new Uint8Array(analyser.fftSize/2);
  var timeByteData = new Uint8Array(analyser.fftSize/2);
  analyser.getByteFrequencyData(freqByteData);
  analyser.getByteTimeDomainData(timeByteData);
  return {f:freqByteData, t:timeByteData}; // array of all 1024 levels
}

//play button
document.getElementById("play-btn").addEventListener("click", function(){
  //audio.currentTime=420;
  audio.paused ? (audio.play(), draw()): audio.pause();
})

var currentTime ;
function draw(t) {
   currentTime = audio.currentTime;
  ctx.clearRect(0,0,1024,255)
  var ID = requestAnimationFrame(draw);
  if (audio.paused) {
    cancelAnimationFrame(ID)
  }
  var data = getDataFromAudio(); // {f:array, t:array}
  var waveSum = 0;
 //draw live waveform and oscilloscope
  for (let i = 0; i<data.f.length; i++) {
    ctx.fillStyle="black";
    ctx.fillRect(i, ch, 1, -data.f[i]);
    waveSum += data.f[i]; //add current bar value (max 255)
  }
  for (let i = 0; i<data.t.length; i++) {
    ctx.fillStyle="red";
    ctx.fillRect(i*2, data.t[i], 1, 1);
  }
  if (Math.round(currentTime)%4 == 0) {
    ctxw.fillRect(currentTime/duration*1024, ch, 1,-waveSum/data.f.length);
  }
}
