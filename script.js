"use strict";

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
  const elementButton = document.getElementsByClassName("button-shape");
  const clearBtn = document.getElementById("clear-btn");
  const exportBtn = document.getElementById("export-button");
  const importBtn = document.getElementById("import_file");
  const colorPicker = document.getElementById("color-input");
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

  // Draw whole objects
  function drawScreen(program, arrayOfObjects) {
    // Clear canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell to use program
    gl.useProgram(program);

    // set the resolution
    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

    for (var i = 0; i < arrayOfObjects.length; i++) {
      // Create a buffer for vertices position
      var positionBuffer = gl.createBuffer();
      // Bind the position buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(arrayOfObjects[i].vertices),
        gl.STATIC_DRAW
      );

      // Turn on the position attribute
      gl.enableVertexAttribArray(positionLocation);
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

      // bind the color buffer
      var colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(arrayOfObjects[i].colors),
        gl.STATIC_DRAW
      );
      // Turn on the color attribute
      gl.enableVertexAttribArray(colorLocation);
      // Tell the color attribute how to get data out of colorBuffer (ARRAY_BUFFER)
      size = 4; // 4 components per iteration
      type = gl.FLOAT; // the data is 8bit unsigned values
      normalized = false; // normalize the data (convert from 0-255 to 0-1)
      stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
      offset = 0; // start at the beginning of the buffer
      gl.vertexAttribPointer(
        colorLocation,
        size,
        type,
        normalized,
        stride,
        offset
      );

      var count = arrayOfObjects[i].vertices.length / 2;
      gl.drawArrays(arrayOfObjects[i].mode, offset, count);
    }
  }

  function getMousePosition(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    return {
      x: x,
      y: y,
    };
  }

  // Initialization of drawing mode
  const colorBlack = [0, 0, 0, 1]; // just default color
  var currColor = colorBlack;
  var arrayOfObjects = [];
  var idxNow = 0;
  var mouseClicked = false;
  var changeObject = {
    // init
    idxObj: -1,
    x: -1,
    y: -1,
  };

  const drawMode = {
    LINE: 0,
    SQUARE: 1,
    RECTANGLE: 2,
    POLYGON: 3,
    CHANGE: 4,
  };
  const shape = {
    LINE: "line",
    SQUARE: "square",
    RECTANGLE: "rectangle",
    POLYGON: "polygon",
  };
  var drawing = drawMode.LINE; // default

  // Change draw mode
  for (var i = 0; i < 5; i++) {
    elementButton[i].addEventListener("click", (e) => {
      switch (e.target.id) {
        case "line-button":
          drawing = drawMode.LINE;
          break;
        case "square-button":
          drawing = drawMode.SQUARE;
          break;
        case "rectangle-button":
          drawing = drawMode.RECTANGLE;
          break;
        case "polygon-button":
          drawing = drawMode.POLYGON;
          break;
        case "changenode-button":
          drawing = drawMode.CHANGE;
          break;
        default:
          drawing = drawMode.LINE;
          break;
      }
    });
  }

  // Clear button
  clearBtn.addEventListener("click", (e) => {
    arrayOfObjects = [];
    idxNow = 0;
    drawScreen(program, arrayOfObjects);
  });

  // Export
  exportBtn.addEventListener("click", (e) => {
    saveJsonObjToFile(arrayOfObjects, idxNow);
  });

  // Import
  importBtn.addEventListener("change", (e) => {
    var file = document.getElementById("import_file").files[0];
    var reader = new FileReader();
    // var data = [];
    reader.onload = function (e) {
      console.log("file imported");
      const arrObjects = JSON.parse(e.target.result);
      arrayOfObjects = arrObjects.arrayOfObjects;
      idxNow = parseInt(arrObjects.idxNow);
      drawScreen(program, arrayOfObjects);
    };

    reader.readAsText(file);
    if (!file) {
      alert("Blank file");
    }
  });

  // Mouse click
  canvas.addEventListener("mousedown", (e, target) => {
    mouseClicked = true;
    const pos = getMousePosition(canvas, e);
    const x = pos.x;
    const y = pos.y;
    switch (drawing) {
      case drawMode.LINE:
        var object = {
          vertices: [],
          colors: [],
          mode: gl.LINES,
          shape: shape.LINE,
        };
        arrayOfObjects.push(object);
        arrayOfObjects[idxNow].vertices.push(x, y, x, y);
        arrayOfObjects[idxNow].colors.push(...currColor, ...currColor);
        break;
      case drawMode.SQUARE:
        var object = {
          vertices: [],
          colors: [],
          mode: gl.LINE_LOOP,
          shape: shape.SQUARE,
        };
        arrayOfObjects.push(object);
        arrayOfObjects[idxNow].vertices.push(x, y, x, y, x, y, x, y);
        arrayOfObjects[idxNow].colors.push(
          ...currColor,
          ...currColor,
          ...currColor,
          ...currColor
        );
        break;
      case drawMode.RECTANGLE:
        var object = {
          vertices: [],
          colors: [],
          mode: gl.LINE_LOOP,
          shape: shape.RECTANGLE,
        };
        arrayOfObjects.push(object);
        arrayOfObjects[idxNow].vertices.push(x, y, x, y, x, y, x, y);
        arrayOfObjects[idxNow].colors.push(
          ...currColor,
          ...currColor,
          ...currColor,
          ...currColor
        );
        break;
      case drawMode.POLYGON:
        if(idxNow != (arrayOfObjects.length -1) ) {
          var object = {
            vertices: [],
            colors: [],
            shape: shape.POLYGON,
          };
          arrayOfObjects.push(object);
        }

        // Jika masih 2 vertex yang tersedia, maka akan menggambar garis aja
        // Jika melebihi 2, maka akan menggambar segitiga
        if(arrayOfObjects[idxNow].vertices.length/2 < 3) {
          arrayOfObjects[idxNow].mode = gl.LINE_LOOP
        } else {
          arrayOfObjects[idxNow].mode = gl.TRIANGLE_FAN
        }

        // Hapus titik dari hasil mousemove
        for (var i = 0; i < 2; i++) {
          arrayOfObjects[idxNow].vertices.pop();
        }

        // Mengecek apakah sudah vertex sudah mencapai titik awal
        var nearestPoint = getNearestPoint(x,y,arrayOfObjects);

        if(nearestPoint.idxObj == idxNow && nearestPoint.idxPoint == 0 && arrayOfObjects[idxNow].vertices.length/2 >= 3) {
          mouseClicked = false;
          idxNow++;

        } else {

          // Tambahkan titik setelah klik dan titik sebagai pergerakan mouse
          arrayOfObjects[idxNow].vertices.push(x, y, x, y);
          arrayOfObjects[idxNow].colors.push(...currColor, ...currColor);
        }
        
        break;
      case drawMode.CHANGE:
        changeObject = getNearestPoint(x, y, arrayOfObjects);
        break;
      default:
        var object = {
          vertices: [],
          colors: [],
          mode: gl.LINES,
          shape: shape.LINE,
        };
        arrayOfObjects.push(object);
        arrayOfObjects[idxNow].vertices.push(x, y, x, y);
        arrayOfObjects[idxNow].colors.push(...currColor, ...currColor);
        break;
    }
    drawScreen(program, arrayOfObjects);
  });

  // Mouse move
  canvas.addEventListener("mousemove", (e) => {
    if (mouseClicked) {
      const pos = getMousePosition(canvas, e);
      const x = pos.x;
      const y = pos.y;

      switch (drawing) {
        case drawMode.LINE:
          for (var i = 0; i < 2; i++) {
            arrayOfObjects[idxNow].vertices.pop();
          }
          arrayOfObjects[idxNow].vertices.push(x, y);
          break;
        case drawMode.SQUARE:
          for (var j = 0; j < 6; j++) {
            arrayOfObjects[idxNow].vertices.pop();
          }
          // get node poros
          const nodeX = arrayOfObjects[idxNow].vertices[0];
          const nodeY = arrayOfObjects[idxNow].vertices[1];
          var kuadran = screenKuadran(nodeX, nodeY, x, y);
          var sizer = Math.max(Math.abs(nodeX - x), Math.abs(nodeY - y));
          if (kuadran == 1) {
            arrayOfObjects[idxNow].vertices.push(
              nodeX + sizer,
              nodeY,
              nodeX + sizer,
              nodeY - sizer,
              nodeX,
              nodeY - sizer
            );
          } else if (kuadran == 2) {
            arrayOfObjects[idxNow].vertices.push(
              nodeX - sizer,
              nodeY,
              nodeX - sizer,
              nodeY - sizer,
              nodeX,
              nodeY - sizer
            );
          } else if (kuadran == 3) {
            arrayOfObjects[idxNow].vertices.push(
              nodeX - sizer,
              nodeY,
              nodeX - sizer,
              nodeY + sizer,
              nodeX,
              nodeY + sizer
            );
          } else if (kuadran == 4) {
            arrayOfObjects[idxNow].vertices.push(
              nodeX + sizer,
              nodeY,
              nodeX + sizer,
              nodeY + sizer,
              nodeX,
              nodeY + sizer
            );
          }
          break;
        case drawMode.RECTANGLE:
          for (var j = 0; j < 6; j++) {
            arrayOfObjects[idxNow].vertices.pop();
          }
          // get node poros
          const nodeRectX = arrayOfObjects[idxNow].vertices[0];
          const nodeRectY = arrayOfObjects[idxNow].vertices[1];
          var kuadranRect = screenKuadran(nodeRectX, nodeRectY, x, y);
          var sizerX = Math.abs(nodeRectX - x);
          var sizerY = Math.abs(nodeRectY - y);
          if (kuadranRect == 1) {
            arrayOfObjects[idxNow].vertices.push(
              nodeRectX + sizerX,
              nodeRectY,
              nodeRectX + sizerX,
              nodeRectY - sizerY,
              nodeRectX,
              nodeRectY - sizerY
            );
          } else if (kuadranRect == 2) {
            arrayOfObjects[idxNow].vertices.push(
              nodeRectX - sizerX,
              nodeRectY,
              nodeRectX - sizerX,
              nodeRectY - sizerY,
              nodeRectX,
              nodeRectY - sizerY
            );
          } else if (kuadranRect == 3) {
            arrayOfObjects[idxNow].vertices.push(
              nodeRectX - sizerX,
              nodeRectY,
              nodeRectX - sizerX,
              nodeRectY + sizerY,
              nodeRectX,
              nodeRectY + sizerY
            );
          } else if (kuadranRect == 4) {
            arrayOfObjects[idxNow].vertices.push(
              nodeRectX + sizerX,
              nodeRectY,
              nodeRectX + sizerX,
              nodeRectY + sizerY,
              nodeRectX,
              nodeRectY + sizerY
            );
          }
          break;

        case drawMode.POLYGON:
          for (var i = 0; i < 2; i++) {
            arrayOfObjects[idxNow].vertices.pop();
          }
          arrayOfObjects[idxNow].vertices.push(x, y);
          break;
          
        default:
          break;
      }

      drawScreen(program, arrayOfObjects);
    }
  });

  // Change color
  colorPicker.addEventListener("change", (e) => {
    currColor = hexToRgba(e.target.value);
  });

  canvas.addEventListener("mouseup", function (e) {
    if(drawing != drawMode.POLYGON) {
      mouseClicked = false;
        if(drawing != drawMode.CHANGE){
          idxNow++;
        }
        if (drawing == drawMode.CHANGE && changeObject.idxObj != -1) {
          const pos = getMousePosition(canvas, e);
          const x = pos.x;
          const y = pos.y;
          changeNode(changeObject, x, y, arrayOfObjects);
          drawScreen(program, arrayOfObjects);
        }
    }
  });
}

// Get kuadran dari poros node
function screenKuadran(nodeX, nodeY, curX, curY) {
  if (nodeX < curX) {
    if (nodeY < curY) {
      return 4;
    } else {
      return 1;
    }
  } else {
    if (nodeY < curY) {
      return 3;
    } else {
      return 2;
    }
  }
}

// Change hex to rgba
function hexToRgba(hexVal) {
  var r = parseInt(hexVal.slice(1, 3), 16);
  var g = parseInt(hexVal.slice(3, 5), 16);
  var b = parseInt(hexVal.slice(5, 7), 16);

  return [r / 255, g / 255, b / 255, 1];
}

function saveJsonObjToFile(arrayOfObjects, idxNow) {
  var filename = document.getElementById("file-name").value;

  if (!filename) {
    filename = "data";
  }
  // file setting
  const text = JSON.stringify({
    arrayOfObjects: arrayOfObjects,
    idxNow: idxNow,
  });
  const name = filename + ".json";
  const type = "text/plain";

  // create file
  const a = document.createElement("a");
  const file = new Blob([text], { type: type });
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

var importFile = function () {
  var file = document.getElementById("import_file").files[0];
  var reader = new FileReader();
  // var data = [];
  reader.onload = function (e) {
    console.log("file imported");
    const arrObjects = JSON.parse(e.target.result);
    arrayOfObjects = arrObjects.arrayOfObjects;
    idxNow = arrObjects.idxNow;
    drawScreen();
    return;
  };

  reader.readAsText(file);
  if (!file) {
    alert("Blank file");
  }
};

function calcDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function getNearestPoint(currX, currY, arrayOfObjects) {
  let nearestDistance = 9999999;
  const threshold = 10;
  let idxObj = -1; // index dimana object berada di array of objects
  let nextX = -1;
  let nextY = -1;
  let idxPoint = -1; // index dimana titik x berada pada vertices
  arrayOfObjects.forEach((element, index) => {
    for (let i = 0; i < element.vertices.length; i += 2) {
      let currDistance = calcDistance(
        currX,
        currY,
        element.vertices[i],
        element.vertices[i + 1]
      );
      if (nearestDistance > currDistance && currDistance <= threshold) {
        nearestDistance = currDistance;
        idxPoint = i;
        nextX = element.vertices[i];
        nextY = element.vertices[i + 1];
        idxObj = index;
      }
    }
  });
  return {
    idxObj: idxObj,
    x: nextX,
    y: nextY,
    idxPoint: idxPoint,
  };
}

/**
 *
 * @param changeObject changeObject berisi idxObject pada arrayOfObject beserta titik x y diklik
 * @param finalX titik X ditarik kemana
 * @param finalY titik Y ditarik kemana
 */
function changeNode(changeObject, finalX, finalY, arrayOfObjects) {
  if (arrayOfObjects[changeObject.idxObj].shape == "line") {
    arrayOfObjects[changeObject.idxObj].vertices[changeObject.idxPoint] =
      finalX;
    arrayOfObjects[changeObject.idxObj].vertices[changeObject.idxPoint + 1] =
      finalY;
  } else if (arrayOfObjects[changeObject.idxObj].shape == "square") {
    const idxNode = getCrossPoint(
      arrayOfObjects[changeObject.idxObj].vertices,
      changeObject.x,
      changeObject.y
    );
    // get node poros
    const nodeX = arrayOfObjects[changeObject.idxObj].vertices[idxNode];
    const nodeY = arrayOfObjects[changeObject.idxObj].vertices[idxNode + 1];
    var kuadran = screenKuadran(nodeX, nodeY, finalX, finalY);
    var sizer = Math.max(Math.abs(nodeX - finalX), Math.abs(nodeY - finalY));
    arrayOfObjects[changeObject.idxObj].vertices = getScaledSquare(
      nodeX,
      nodeY,
      sizer,
      kuadran
    );
  } else if (arrayOfObjects[changeObject.idxObj].shape == "rectangle") {
    const idxNode = getCrossPoint(
      arrayOfObjects[changeObject.idxObj].vertices,
      changeObject.x,
      changeObject.y
    );
    // get node poros
    const nodeX = arrayOfObjects[changeObject.idxObj].vertices[idxNode];
    const nodeY = arrayOfObjects[changeObject.idxObj].vertices[idxNode + 1];
    var kuadran = screenKuadran(nodeX, nodeY, finalX, finalY);
    var sizerX = Math.abs(nodeX - finalX);
    var sizerY = Math.abs(nodeY - finalY);
    arrayOfObjects[changeObject.idxObj].vertices = getScaledRectangle(
      nodeX,
      nodeY,
      sizerX,
      sizerY,
      kuadran
    );
  } else if (arrayOfObjects[changeObject.idxObj].shape == "polygon") {
  }
}

/**
 * Fungsi untuk mengambil index titik yang berseberangan dengan yang sedang di klik untuk dijadikan node poros
 * @param {*} squarePoints
 * @param {*} selectedX
 * @param {*} selectedY
 */
function getCrossPoint(squarePoints, selectedX, selectedY) {
  for (let i = 0; i < squarePoints.length; i += 2) {
    if (squarePoints[i] != selectedX && squarePoints[i + 1] != selectedY) {
      return i;
    }
  }
  return 0;
}

function getScaledSquare(nodeX, nodeY, sizer, kuadran) {
  if (kuadran == 1) {
    return [
      nodeX,
      nodeY,
      nodeX + sizer,
      nodeY,
      nodeX + sizer,
      nodeY - sizer,
      nodeX,
      nodeY - sizer,
    ];
  } else if (kuadran == 2) {
    return [
      nodeX,
      nodeY,
      nodeX - sizer,
      nodeY,
      nodeX - sizer,
      nodeY - sizer,
      nodeX,
      nodeY - sizer,
    ];
  } else if (kuadran == 3) {
    return [
      nodeX,
      nodeY,
      nodeX - sizer,
      nodeY,
      nodeX - sizer,
      nodeY + sizer,
      nodeX,
      nodeY + sizer,
    ];
  } else if (kuadran == 4) {
    return [
      nodeX,
      nodeY,
      nodeX + sizer,
      nodeY,
      nodeX + sizer,
      nodeY + sizer,
      nodeX,
      nodeY + sizer,
    ];
  }
}

function getScaledRectangle(nodeX, nodeY, sizerX, sizerY, kuadran) {
  if (kuadran == 1) {
    return [
      nodeX,
      nodeY,
      nodeX + sizerX,
      nodeY,
      nodeX + sizerX,
      nodeY - sizerY,
      nodeX,
      nodeY - sizerY,
    ];
  } else if (kuadran == 2) {
    return [
      nodeX,
      nodeY,
      nodeX - sizerX,
      nodeY,
      nodeX - sizerX,
      nodeY - sizerY,
      nodeX,
      nodeY - sizerY,
    ];
  } else if (kuadran == 3) {
    return [
      nodeX,
      nodeY,
      nodeX - sizerX,
      nodeY,
      nodeX - sizerX,
      nodeY + sizerY,
      nodeX,
      nodeY + sizerY,
    ];
  } else if (kuadran == 4) {
    return [
      nodeX,
      nodeY,
      nodeX + sizerX,
      nodeY,
      nodeX + sizerX,
      nodeY + sizerY,
      nodeX,
      nodeY + sizerY,
    ];
  }
}

// Get help button and section
var helpSection = document.getElementById('help-section');
var helpButton = document.getElementById('help-button');
var helpSpan = document.getElementsByClassName('close')[0];

// Open help section
helpButton.onclick = function(){
  helpSection.style.display = "block";
}

// Close help section by click x
helpSpan.onclick = function(){
  helpSection.style.display = "none";
}

main();
