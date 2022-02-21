"use strict";

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

  // viewport
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  var createShader = function (type, source) {
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

  var createProgram = function (vertexShader, fragmentShader) {
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

  // Process shaders
  var vertShader = createShader(
    gl.VERTEX_SHADER,
    document.querySelector("#vertex-shader-2d").text
  );
  var fragShader = createShader(
    gl.FRAGMENT_SHADER,
    document.querySelector("#fragment-shader-2d").text
  );

  // Create program
  var program = createProgram(vertShader, fragShader);

  function drawObject(program, vertices, mode, count) {
    // Look up where data stored
    var positionLocation = gl.getAttribLocation(program, "vPosition");
    var colorLocation = gl.getAttribLocation(program, "vColor");

    // Create a buffer for vertices position
    var positionBuffer = gl.createBuffer();

	    // Clear canvas
		gl.clear(gl.COLOR_BUFFER_BIT);
// Tell to use program
    gl.useProgram(program);



    // Bind position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);


    // Tell the attribute how to read vertices buffer
    var size = 2;
    var type = gl.FLOAT;
    var normalized = false;
    var stride = 5 * Float32Array.BYTES_PER_ELEMENT; // Size per vertex
    var offset = 0;
    gl.vertexAttribPointer(
      positionLocation,
      size,
      type,
      normalized,
      stride,
      offset
    );

    // Tell the attribute how to read color buffer
    var sizeColor = 2;
    var typeColor = gl.FLOAT;
    var offsetColor = 2 * Float32Array.BYTES_PER_ELEMENT; // offset for color
    gl.vertexAttribPointer(
      colorLocation,
      sizeColor,
      typeColor,
      normalized,
      stride,
      offsetColor
    );

    // Turn on the attribute
    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(colorLocation);

    // Draw the geometry
	
    gl.drawArrays(mode, 0, count);
  }
  var vertices = [670,253,1,1,1,
				1113,425,1,1,1];

  drawObject(program, vertices, gl.LINES,2 );
  //   Constanta
  var arrayOfObjects = []; // {vertices, color, type}

  // Mouse click
  canvas.addEventListener("mousedown", (e) => {
    console.log(e);
  });

  // Mouse move
  canvas.addEventListener("mousemove", (e) => {
    // console.log(e);
  });
}

main();
