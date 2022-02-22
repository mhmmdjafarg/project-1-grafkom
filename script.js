"use strict";

/**
 * Resize a canvas to match the size its displayed.
 * @param {HTMLCanvasElement} canvas The canvas to resize.
 * @param {number} [multiplier] amount to multiply by.
 *    Pass in window.devicePixelRatio for native pixels.
 * @return {boolean} true if the canvas was resized.
 * @memberOf module:webgl-utils
 */
function resizeCanvasToDisplaySize(canvas, multiplier) {
  multiplier = multiplier || 1;
  const width = (canvas.clientWidth * multiplier) | 0;
  const height = (canvas.clientHeight * multiplier) | 0;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}

var createProgram = function (gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Error linking program!", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return;
  }
  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    console.error("Error validating program!", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return;
  }

  return program;
};

var createShader = function (gl, type, source) {
  var shader = gl.createShader(type);

  gl.shaderSource(shader, source);

  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Error compiling shader!", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return;
  }

  return shader;
};

function main() {
  // Get canvas context
  const canvas = document.getElementById("canvas");
  const gl = canvas.getContext("webgl");

  if (!gl) {
    alert("Webgl not supported");
    return;
  }

  // Resizing canvas
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // create GLSL shaders, upload the GLSL source, compile the shaders
  var vertShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    document.querySelector("#vertex-shader-2d").text
  );
  var fragShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    document.querySelector("#fragment-shader-2d").text
  );

  // Link the two shaders into a program
  var program = createProgram(gl, vertShader, fragShader);

  // Look up where data stored
  var positionLocation = gl.getAttribLocation(program, "vPosition");
  var colorLocation = gl.getAttribLocation(program, "a_color");
  var resolutionUniformLocation = gl.getUniformLocation(
    program,
    "u_resolution"
  );

  // Create a buffer for vertices position
  var positionBuffer = gl.createBuffer();
  // Create a buffer for the colors.
  var colorBuffer = gl.createBuffer();

  // Clear canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  function drawObject(program, vertices, mode, count) {
    resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Tell to use program
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Tell the attribute how to read vertices buffer
    var size = 2;
    var type = gl.FLOAT;
    var normalized = false;
    var stride = 0; // Size per vertex
    var offset = 0;
    gl.vertexAttribPointer(
      positionLocation,
      size,
      type,
      normalized,
      stride,
      offset
    );

    // Turn on the color attribute
    gl.enableVertexAttribArray(colorLocation);

    // Bind the color buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    setColors(gl);

    // Tell the color attribute how to get data out of colorBuffer (ARRAY_BUFFER)
    var size = 4; // 4 components per iteration
    var type = gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(
      colorLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    // set the resolution
    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
    // Draw the geometry
    gl.drawArrays(mode, 0, count);
  }

  // Test
  var vertices = [0, 373, 418, 123, 700, 400];
  var vertices2 = [800, 373, 400, 123];
  drawObject(program, vertices, gl.TRIANGLES, 3);
  drawObject(program, vertices2, gl.LINES, 2);

  // Mouse click
  canvas.addEventListener("mousedown", (e) => {
    console.log(e);
  });

  // Mouse move
  canvas.addEventListener("mousemove", (e) => {
    // console.log(e);
  });
}

// Fill the buffer with colors for the 2 triangles
// that make the rectangle.
// Note, will put the values in whatever buffer is currently
// bound to the ARRAY_BUFFER bind point
function setColors(gl) {
  // Pick 2 random colors.
  var r1 = Math.random();
  var b1 = Math.random();
  var g1 = Math.random();

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([r1, b1, g1, 1, r1, b1, g1, 1, r1, b1, g1, 1]),
    gl.STATIC_DRAW
  );
}

main();
