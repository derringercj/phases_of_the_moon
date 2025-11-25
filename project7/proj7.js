/*
CS 535, Project #7, Casey Derringer
This program seeks to model the light interaction between our Sun, the Earth, and our Moon. The Sun is a light source that realistically lights the Earth and the different parts of the moon
as it orbits around the Earth. There are four buttons. You start in the scene state, where you can see the sun, the Earth, and the moon. Then there's the Sun button which focuses the camera
on the sun while still keeping the Earth and the moon in view. Next, the Earth button centers the camera on the Earth with the moon still in view and allows the user to press either of the 
left or right arrow keys to orbit the moon around the Earth with a static camera. Finally, there's the moon button which places the camera on the "surface" of the Earth and pressing either of
the arrow keys still orbits the moon around the Earth, but now the camera follows the moon as it orbits around the Earth, realistically illustrating the phases of the moon as its position between the 
Earth and the Sun changes. 
*/
"use strict";

/** @type {HTMLCanvasElement} */

var canvas, gl, program;

var points = [];
var normals = [];
var texCoords = [];

var modelViewMatrix, projectionMatrix, nMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc, lightPositionLoc;

var lightPosition = vec4(-3.0, 0.0, 0.0, 1.0);
var lightAmbient = vec4(0.1, 0.1, 0.1, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var moonPosition = vec3()
var earthPosition = vec3(5.0, 0.0, 0.0);
var sunPosition = vec3(-10.0, 0.0, 0.0);

var sunMaterialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var sunMaterialDiffuse = vec4(0.0, 0.0, 0.0, 1.0);
var sunMaterialSpecular = vec4(0.0, 0.0, 0.0, 1.0);
var sunMaterialShininess = 1;

var earthMaterialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var earthMaterialDiffuse = vec4(0.8, 0.8, 0.8, 1.0);
var earthMaterialSpecular = vec4(0.5, 0.5, 0.5, 1.0);
var earthMaterialShininess = 10;

var moonMaterialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var moonMaterialDiffuse = vec4(0.8, 0.8, 0.8, 1.0);
var moonMaterialSpecular = vec4(0.1, 0.1, 0.1, 1.0);
var moonMaterialShininess = 1;

var sphereStarts = [];

const State = {
    SCENE: "scene",
    MOON: "moon",
    EARTH: "earth",
    SUN: "sun"
};

var mutable = false;
var currentState = State.SCENE;
var theta = 0;

var eye = vec3(0.0, 0.0, 10.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

var sunTex, moonTex, earthTex, blankTex;

function drawScene(){
    for(let i = 0; i < 3; i++){
        // Generating spheres with density of 5, while also tracking the amount of points in the buffer between each set of points generated
        sphereStarts.push(points.length);
        tetrahedron(va, vb, vc, vd, 5);
    }
}

// Below three functions are for generating spheres
function triangle(a, b, c) {
    points.push(a);
    points.push(b);
    points.push(c);

    // normals are vectors
    normals.push(vec4(a[0], a[1], a[2], 0.0));
    normals.push(vec4(b[0], b[1], b[2], 0.0));
    normals.push(vec4(c[0], c[1], c[2], 0.0));

}
function divideTriangle(a, b, c, count) {
    if (count > 0) {
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        triangle( a, b, c );
    }
}

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function buttonListeners(document){
    // Retrieving all html buttons
    var sceneButton = document.getElementById("scene");
    var sunButton = document.getElementById("sunButton");
    var earthButton = document.getElementById("earthButton");
    var moonButton = document.getElementById("moonButton");

    // Based on button clicked, reset camera, and set currentState
    sceneButton.addEventListener("click", function(){
        if(currentState != State.SCENE){
            currentState = State.SCENE;

            eye = vec3(0.0, 0.0, 10.0);
            at = vec3(0.0, 0.0, 0.0);            
            mutable = false;
        }
    });

    sunButton.addEventListener("click", function(){
        if(currentState != State.SUN){
            currentState = State.SUN;
            
            eye = vec3(sunPosition[0], 0, 22);
            at = sunPosition;
            mutable = false;
        }
    });

    earthButton.addEventListener("click", function(){
        if(currentState != State.EARTH){
            currentState = State.EARTH;
            
            eye = vec3(earthPosition[0], 0, 5);
            at = earthPosition;
            mutable = true;
        }
    });

    moonButton.addEventListener("click", function(){
        if(currentState != State.MOON){
            currentState = State.MOON;

            eye = vec3(0, 0, 0);
            at = vec3(moonPosition[0], moonPosition[1], moonPosition[2]);
            mutable = true;
        }
    });

    // If the left arrow key was pressed and we're focused on the earth or the moon, increase theta. If right arrow key pressed and we're focused on the same, decrease theta
    document.addEventListener("keydown", function(event){
        switch(event.key){
            case "ArrowLeft":
                if(mutable == true){
                    theta += 1;
                }    
            break;
            case "ArrowRight":
                if(mutable == true){
                    theta -= 1
                }
                break;
        }
    });
}

// Function to configure textures to use in program
function configureTexture(image, textureUnit){
    var texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0 + textureUnit);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,
        gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureMap"), textureUnit);

    return texture;
}

window.onload = function init(){
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext("webgl2");
    if(!gl) this.alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Retrieving locations for our most important uniform variables
    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");
    lightPositionLoc = gl.getUniformLocation(program, "uLightPosition");

    // Generating all of the points for our objects in the scene
    drawScene();

    // Setting up button and arrow key listeners for our program
    buttonListeners(document);

    // Setting up vertex buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    // Setting normal buffer
    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    // Configuring our textures for the sun, earth, and moon
    var sunImg = document.getElementById("sun");
    sunTex = configureTexture(sunImg, 0);
    var earthImg = document.getElementById("earth");
    earthTex = configureTexture(earthImg, 1);
    var moonImg = document.getElementById("moon");
    moonTex = configureTexture(moonImg, 2);

    render();
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Code that calculates the final position of the moon, for use in our camera adjustments, necessary for following the moon around the earth
    var distanceFromEarth = 1.5;
    var thetaRadians = theta * (Math.PI / 180);
    
    var x = earthPosition[0] + (distanceFromEarth * Math.sin(thetaRadians));
    var z = earthPosition[2] + (distanceFromEarth * Math.cos(thetaRadians));
    moonPosition = vec3(x, earthPosition[1], z);

    // If our current focus is the moon, point the camera at its current position and position the camera at the nearest location on the "surface" of the Earth
    if(currentState == State.MOON){    
        var earthRadius = 0.25;

        at = vec3(moonPosition[0], moonPosition[1], moonPosition[2]);
        eye = vec3(earthPosition[0] + earthRadius*Math.sin(thetaRadians), 0.0, earthPosition[2] + earthRadius*Math.cos(thetaRadians));
    }

    // Creating model view matrix, projection matrix, and normal matrix and sending them to our GPU
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(40.0, canvas.width / canvas.height, 0.1, 50);
    nMatrix = normalMatrix(modelViewMatrix, true);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(nMatrix));

    // Transforming light into eye coordinates then sending it to GPU
    var lightPositionEye = mult(modelViewMatrix, lightPosition);
    gl.uniform4fv(lightPositionLoc, lightPositionEye);

    // Sending the sun lighting information to our GPU
    var globalSunAmbient = vec4(1.0, 1.0, 1.0, 1.0);
    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"), mult(globalSunAmbient, sunMaterialAmbient));
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"), mult(lightDiffuse, sunMaterialDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"), mult(lightSpecular, sunMaterialSpecular));
    gl.uniform1f(gl.getUniformLocation(program, "uShininess"), sunMaterialShininess);

    // Setting textures to our sun sphere and applying proper transformations
    var sunMatrix = modelViewMatrix;
    sunMatrix = mult(sunMatrix, translate(sunPosition[0], sunPosition[1], sunPosition[2]));
    sunMatrix = mult(sunMatrix, scale(4, 4, 4));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sunTex);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureMap"), 0);

    // Drawing sun
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(sunMatrix));
    gl.drawArrays(gl.TRIANGLES, sphereStarts[0], sphereStarts[1] - sphereStarts[0]);

    // Sending the earth lighting information to our GPU
    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"), mult(lightAmbient, earthMaterialAmbient));
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"), mult(lightDiffuse, earthMaterialDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"), mult(lightSpecular, earthMaterialSpecular));
    gl.uniform1f(gl.getUniformLocation(program, "uShininess"), earthMaterialShininess);

    // Setting textures to our earth sphere and applying proper transformations
    var earthMatrix = modelViewMatrix;
    earthMatrix = mult(earthMatrix, translate(earthPosition[0], earthPosition[1], earthPosition[2]));
    earthMatrix = mult(earthMatrix, scale(0.25, 0.25, 0.25));
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, earthTex);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureMap"), 1);

    // Drawing earth
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(earthMatrix));
    gl.drawArrays(gl.TRIANGLES, sphereStarts[1], sphereStarts[2] - sphereStarts[1]);

    // Sending the moon lighting information to our GPU
    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"), mult(lightAmbient, moonMaterialAmbient));
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"), mult(lightDiffuse, moonMaterialDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"), mult(lightSpecular, moonMaterialSpecular));
    gl.uniform1f(gl.getUniformLocation(program, "uShininess"), moonMaterialShininess);

    // Setting textures to our moon sphere and applying proper transformations
    var moonMatrix = modelViewMatrix;
    moonMatrix = mult(moonMatrix, translate(moonPosition[0], moonPosition[1], moonPosition[2]));
    moonMatrix = mult(moonMatrix, scale(0.06, 0.06, 0.06));

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, moonTex);
    gl.uniform1i(gl.getUniformLocation(program, "uTextureMap"), 2);
    
    // Drawing moon, recalculating normal matrix depending on new location, accurately altering lighting based on position around the earth
    var moonNMatrix = normalMatrix(moonMatrix, true);
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(moonNMatrix));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(moonMatrix));
    gl.drawArrays(gl.TRIANGLES, sphereStarts[2], points.length - sphereStarts[2]);

    requestAnimationFrame(render);
}