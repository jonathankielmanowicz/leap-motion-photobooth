var capture;
var currentFilter = new camFilter();
var screenshots = [];
var oldpos = 0;
var newpos = 0;
var left, right, space;
var count = 1; //for saving the images
var timer = 0;
var canvas;
var sticker = null;
var stickerArray = [];
var timer = 0;
var takingPic = false;
var currentScreenshot;
var appState = 1;

// our Leap motion hand sensor controller object (instantiated inside of 'setup');
var leapController;
var loaded = 0;
var loadState = false;

// x & y position of our user controlled character
var x = 500;
var y = 500;

function preload() {
  left = loadImage('assets/left.png');
  right = loadImage('assets/right.png');
  space = loadImage('assets/spacebar.png');
  shutter = loadSound('assets/shutter.wav');
}

function setup() {
  pixelDensity(1);
  canvas = createCanvas(640, 600);
  // capture = createCapture(VIDEO);
  capture = createCapture({
                            video: {
                                    mandatory: {
                                                minWidth: 320,
                                                minHeight: 240,
                                                maxWidth: 320,
                                                maxHeight: 240
                                              }
                                  }
                          });
  capture.hide();
  noStroke();
  background(255);
  canvas.parent("#canvas-wrapper");
  canvas.drop(gotFile);
  
    // grab a connection to our output div
  // outputDiv = select('#output');
  
  // set up our leap controller
  leapController = new Leap.Controller({
    enableGestures: true
  });

  // every time the Leap provides us with hand data we will ask it to run this function
  leapController.loop( handleHandData );
  
}

function draw() {
  if (appState == 1) {
    currentFilter.display();
    countDown();
  } else {
    image(currentImage, 0, 0, 640, 480);
  }
  displayScreenshots();
  loadStickers();
  loadWheel(loadState);
  fill(255);
  ellipse(x, y, 25, 25);
  
}

function loadStickers() {
  if (sticker && mouseY < 480 && currentFilter.on) {
    push();
    imageMode(CENTER);
    image(sticker, mouseX, mouseY, 40, 40);
    pop();
  }  
  for (var i = 0; i < stickerArray.length; i++) {
    push();
    imageMode(CENTER);
    image(stickerArray[i].img, stickerArray[i].posX, 
    stickerArray[i].posY, 40, 40);
    pop();
  }
}

function Sticker(img, x, y) {
  this.img = img;
  this.posX = x;
  this.posY = y;
}

function gotFile(file) {
  // If it's an image file
  if (file.type === 'image') {
    // Create an image DOM element but don't show it
    sticker = loadImage(file.data, redraw);
    console.log('got an image');
  } else {
    println('Not an image file!');
  }
}


function mousePressed() {
  // currentFilter.state = 1;
  // if (currentFilter.state == 1) {
  //   console.log('reaching here');
  //   if (currentFilter.color == "normal") {
  //     console.log('reaching here');
  //     currentFilter.color = "grayscale";
  //   } else if (currentFilter.color == "grayscale") {
  //     currentFilter.color = "xray";
  //   } else if (currentFilter.color == "xray") {
  //     currentFilter.color = "normal";
  //   }
  // }
  if (sticker && mouseY < 480 && currentFilter.on) {
    var x = mouseX;
    var y = mouseY;
    var s = new Sticker(sticker, x, y);
    stickerArray.push(s);
  }
  for (var i = 0; i < screenshots.length; i++) {
    if (screenshots[i].hovered) {
      currentFilter.on = 0;
      currentImage = screenshots[i].shot;
      appState = 0; //reviewing images
    }
  }
  
}

function camFilter() {
  this.on = 1; // 1 means that live video feed is playing, 
  // 0 means we're checking the screenshots
  this.state = 0; // 0 is Normal Video Feed, 1 is Pointilism
  this.shape = {
    type: "ellipse",
    size: 10
  };
  this.color = "normal";
  this.opacity;
  this.display = function() {
    if (this.on === 1) {
      // console.log("display");
      if (this.state === 0) {
        normalVideoFeed(this.color);
      } else {
        background(255);
        shapeVideoFeed(this.color, this.shape);
      }
    } else {
      // don't do anything
    }
  }
}

function normalVideoFeed(colors) {
  background(255);
  loadPixels();
  capture.loadPixels();
  if (capture.pixels.length > 0) {
    // console.log(capture.width + ", "+ capture.height);
    // console.log(capture.pixels.length);
    var skip = 1;
    // if (mouseY < 480) {
    //   skip = int(map(mouseX, 0, width, 1, 10));
    // } else {
    //   skip = 1;
    // }
    for (var y = 0; y < capture.height; y += skip) {
      for (var x = 0; x < capture.width; x += skip) {
        // y * width offsets our x value
        // to the right row of x's
        // 
        // we have to multiply the value
        // by 4 because every pixel has 
        // index[0] = R, [1] = G,
        // index[2] = B, [3] = A
        var end = capture.pixels.length;
        var index2 = end - (x + capture.width * capture.height - y * capture.width) * 4 - 4;
        var index = (x*2 + y*2 * capture.width*2) * 4;

        var r = capture.pixels[index2 + 0];
        var g = capture.pixels[index2 + 1];
        var b = capture.pixels[index2 + 2];

        if (colors == 'normal') {
          // don't do anything, rgb is fine
        } else if (colors == 'negative') {
          // do 255 - r, 255 - g, 255 - b
          r = 255 - r;
          g = 255 - g;
          b = 255 - b;
        } else if (colors == 'greyscale') {
          r = (r + g + b) / 3;
          g = r;
          b = r;
        }

        pixels[(index + 0)] = r;
        pixels[(index + 1)] = g;
        pixels[(index + 2)] = b;
        pixels[(index + 3)] = 255;
      }
    }
    updatePixels();
  }
}

//shape is a shape object with 2 properties = type, size
function shapeVideoFeed(colors, shape) {
  // expose the pixel array in our video stream
  capture.loadPixels();
  
  // console.log(shape.size);

  // make sure we have a valid frame of video by ensuring that there is data
  // in this array
  if (capture.pixels.length > 0) {

    // console.log(capture.width + ", " + capture.height);
    // console.log(capture.pixels.length);

    // iterate over the pixel array
    for (var x = 0; x < capture.width; x += shape.size) {
      for (var y = 0; y < capture.height; y += shape.size) {

        // compute the location in our array (the array is a one dimensional array
        // that contains 4 slots per pixel - R,G,B,A)
        var loc = (y * capture.width + x) * 4;

        // extract the colors here
        var r = capture.pixels[loc];
        var g = capture.pixels[loc + 1];
        var b = capture.pixels[loc + 2];

        if (colors == 'normal') {
          // don't do anything, rgb is fine
        } else if (colors == 'negative') {
          // do 255 - r, 255 - g, 255 - b
          r = 255 - r;
          g = 255 - g;
          b = 255 - b;
        } else if (colors == 'greyscale') {
          r = (r + g + b) / 3;
          g = r;
          b = r;
        }

        // draw an ellipse using this color
        fill(r, g, b);

        if (shape.type == "ellipse") {
          ellipse(capture.width - x - (.5 * shape.size), y + (.5 * shape.size), shape.size, shape.size);
        } else if (shape.type == "square") {
          push()
          rectMode(CENTER);
          rect(capture.width - x - (.5 * shape.size), y + (.5 * shape.size), shape.size, shape.size);
          pop();
        }
      }
    }
  }
}

function displayScreenshots() {
  // broke down this function into two parts:
  // 1. the scrolling through the thumbnails
  // 2. displaying the photos as thumbnails
  // 
  // we might need an extra part to display
  // the thumbnails on the screen if
  // they are clicked

  // this is the scrolling part
  // it checks the old left pos
  // and the old right pos to
  // align the translate() func
  // with the variable newpos

  // it has a variable speed
  // named shiftspeed
  var shiftspeed = 20;
  if (mouseY > 480) {
    if (mouseX < 40) {
      if (oldpos > 0) {
        newpos += shiftspeed;
        oldpos -= shiftspeed;
        oldend -= shiftspeed;
      }
    }
    if (mouseX > 600) {
      if (screenshots.length * 160 > oldend) {
        newpos -= shiftspeed;
        oldpos += shiftspeed;
        oldend += shiftspeed;
      }
    }
    // console.log('screen is at: ' + oldpos + ', ' + oldend);
  }

  // this is the second part 
  // of the display function
  // 
  // it displays photos and 
  // cursors on the screen
  // 
  if (screenshots.length < 1) {
    push();
    imageMode(CENTER);
    image(space, 320, 540, 250, 75);
    pop();
  }
  if (screenshots.length > 0) {
    push();
    translate(newpos, 0);
    for (var i = 0; i < screenshots.length; i++) {
      image(screenshots[screenshots.length - 1 - i].shot, i * 160, 480, 160, 120);
      screenshots[screenshots.length - 1 - i].posX = i * 160;
      screenshots[screenshots.length - 1 - i].posY = 480;

      if ((mouseX - newpos > screenshots[screenshots.length - 1 - i].posX) &&
        (mouseX - newpos < screenshots[screenshots.length - 1 - i].posX + 160) &&
        (mouseY > screenshots[screenshots.length - 1 - i].posY)) {
        fill(51, 51, 51, 150);
        rect(screenshots[screenshots.length - 1 - i].posX,
          screenshots[screenshots.length - 1 - i].posY, 160, 120);
        screenshots[screenshots.length - 1 - i].hovered = true;
      } else {
        screenshots[screenshots.length - 1 - i].hovered = false;
      }
    }
    pop();
    push();
    imageMode(CENTER);
    image(left, 30, 540, 40, 40);
    image(right, 610, 540, 40, 40);
    pop();
  }
}

function countDown() {
  if (takingPic) {
    push();
    timer++;
    textAlign(CENTER);
    textSize(240);
    fill(255);
    if ((timer >= 6) && (timer <= 10)) {
      console.log('3');
      text('3', 320, 280);
    } else if ((timer >= 12) && (timer <= 16)) {
      console.log('2');
      text('2', 320, 280);
    } else if ((timer >= 18) && (timer <= 22)) {
      console.log('1');
      text('1', 320, 280);
    } else if (timer == 24) {
      // copy what's on the canvas
      var shot = get(0, 0, 640, 480);
      var screenshot = new Screenshot(shot);
      shutter.play();
      
      // push it to the screenshots array
      screenshots.push(screenshot);
    
      console.log('taking pic!');
      timer = 0;
      takingPic = false;
    }
    pop();
  }
}

function keyTyped() {
  // if (keyCode == 27) {
  //   currentFilter.on = 1;
  // }
  if (key === 'c') {
    appState = 1;
    currentFilter.on = 1;
    stickerArray = [];
  }
  
  if (keyCode == 32) {
    // trigger countDown
    takingPic = true;
  }
  if (key === 's') {
    // save something
    save(screenshots[screenshots.length - 1].shot, 'myImage' + count + '.png');
    console.log('image saved!');
    count++;
  }
}

function Screenshot(shot) {
  this.shot = shot;
  this.posX;
  this.posY;
  // let's set up some hovered functions here
  this.clicked = false;
  this.hovered = false;
}

function updateTextInput(val) {
  document.getElementById('size-slider-display').innerText = document.getElementById('size-slider').value;
  currentFilter.shape.size = int(val);
  // console.log(currentFilter.shape.size);
}

function updateMode(mode) {
  if (mode == "normal") {
    currentFilter.state = 0;
  } else if (mode == "ellipse") {
    currentFilter.state = 1;
    currentFilter.shape.type = "ellipse";
  } else if (mode == "square") {
    currentFilter.state = 1;
    currentFilter.shape.type = "square";
  }
}

function updateColor(color) {
  currentFilter.color = color;
}

function loadWheel(bool) {
  
  if (bool == true && !takingPic && appState == 1 ) {
    console.log(loaded);
    loaded++;
    push();
    noFill();
    stroke(0);
    strokeWeight(10);
    arc(x, y, 60, 60, 0, loaded / 6);
    pop();
    if (loaded/6 >= 2*PI) {
      console.log('take a pic');
      takingPic = true;
    }
  } else {
    loaded = 0;
  }
}
// this function runs every time the leap provides us with hand tracking data
// it is passed a 'frame' object as an argument - we will dig into this object
// and what it contains throughout these tutorials
function handleHandData(frame) {

  // make sure we have exactly one hand being detected
  if (frame.hands.length == 1) {
    // get the position of this hand
    var handPosition = frame.hands[0].stabilizedPalmPosition;
    var grab = frame.hands[0].grabStrength;
    if (grab == 1) {
      loadState = true;
    } else {
      loadState = false;
    }
    
    // grab the x, y & z components of the hand position
    // these numbers are measured in millimeters
    var hx = handPosition[0];
    var hy = handPosition[1];
    var hz = handPosition[2];
    
    // x is left-right, y is up-down, z is forward-back
    // for this example we will use x & y to move the circle around the screen
    // let's map the x & y values to screen coordinates
    // note that determining the correct values for your application takes some trial and error!
    x = map(hx, -200, 200, 100, 400);
    y = map(hy,    0, 500, 500,   0);
  }
}