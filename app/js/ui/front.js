const helper = require('js/shared/helper');
const config = require('js/shared/config');
const Vector = require("js/shared/vector").Vector;

document.addEventListener("DOMContentLoaded", () => {
    var c = document.getElementById("canvas");
    var ctx = c.getContext("2d");
    var nodes = [];
    var trueSimulationSpeed = 0;

    var worker = new Worker("worker.js");
    worker.onmessage = function(data) {
        //console.log(data.data)
        nodes = data.data.nodes;
        trueSimulationSpeed = data.data.trueSimulationSpeed;
        draw();
        compute();
        calcSimSpeed();
    };
    worker.postMessage("init");

    document.getElementById("start").addEventListener("click", function() {
        userPause = false;
        worker.postMessage("run");
    });

    var userPause = false;
    document.getElementById("stop").addEventListener("click", function() {
        userPause = true;
        worker.postMessage("pause");
    });

    var showIDs = true;
    document.getElementById("show-ids").addEventListener("click", function() {
        showIDs = document.getElementById("show-ids").checked;
    });

    document.getElementById("load").addEventListener("click", function() {
        var data = document.getElementById("load-data").value;
        worker.postMessage(["load", data]);
    });

    document.getElementById("save").addEventListener("click", function() {
        document.getElementById("save-data").value = btoa(
            JSON.stringify(nodes)
        );
    });

    var selectedNode; 
    var mousePosition;
    var startCoords;
    var lastCoords = {x:0,y:0};
    var transformed = {x:0,y:0};
    c.addEventListener('mousedown', (e) => {
        var rect = c.getBoundingClientRect();
        var mouse = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        var m = new Vector(mouse.x, mouse.y);
        var transformedV = new Vector().load(transformed);
        var min = 5;
        var selected;
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].position = new Vector().load(nodes[i].position);
            var distance = nodes[i].position.subtract(m.subtract(transformedV)).length();
            if (!min || distance < min) {
                selected = nodes[i];
                min = distance;
            }
        }
        mousePosition = m.subtract(transformedV);
        if (selected) {
            selectedNode = selected;
        } else {
            startCoords = {x: e.pageX - rect.left - lastCoords.x, y: e.pageY - rect.top - lastCoords.y};
            //worker.postMessage(["newnode", {mousePosition}]);
        }
      }, true);
      c.addEventListener('mousemove', (e) => {
        if (selectedNode) {
            var rect = c.getBoundingClientRect();
            var mouse = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            var transformedV = new Vector().load(transformed);
            mousePosition = new Vector(mouse.x, mouse.y).subtract(transformedV);
        } else if (startCoords) {
            var rect = c.getBoundingClientRect();
            var mouse = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            transformed = {x:  mouse.x - startCoords.x, y: mouse.y - startCoords.y};
            ctx.setTransform(1, 0, 0, 1, transformed.x, transformed.y);
        }
      }, true);
      c.addEventListener('mouseup', (e) => {
        if (selectedNode) {
            worker.postMessage(["nomove", {selectedNode}]);
            selectedNode = undefined;
        } else if (startCoords) {
            var rect = c.getBoundingClientRect();
            lastCoords = {x: e.pageX - rect.left - startCoords.x,
            y: e.pageY - rect.top - startCoords.y};
            startCoords = undefined;
        }
      }, true);

    var simSpeeds = new Array(100);
    simSpeeds.fill(config.simulationSpeed);
    function calcSimSpeed() {
        simSpeeds.pop();
        simSpeeds.unshift(trueSimulationSpeed);
        var sum = simSpeeds.reduce(function(a, b) {
            return a + b;
        }, 0);
        document.getElementById("simspeed").innerText =
            (sum / simSpeeds.length).toFixed(2) + "x";
    }

    function draw() {
        ctx.strokeStyle = "rgb(0,0,0)";
        ctx.clearRect(0 - transformed.x, 0 - transformed.y, c.width, c.height);
        ctx.strokeStyle = "rgb(0,0,0)";
        ctx.beginPath();
        ctx.moveTo(10, 50);
        ctx.lineTo(10, 50 + 10 * config.metre);
        ctx.fillText("10m", 11, 50 + 10 * config.metre / 2);
        ctx.stroke();
        var drawn = [];
        function drawLine(node, connectedNodeID) {
            ctx.beginPath();
            ctx.fillRect(node.position.x - 1, node.position.y - 1, 3, 3);
            if (showIDs) {
                ctx.fillText(node.id, node.position.x + 1, node.position.y);
            }
            ctx.stroke();
            if (
                drawn.indexOf(connectedNodeID.toString() + node.id.toString()) <
                0
            ) {
                ctx.beginPath();
                var connectedNode = helper.getNode(connectedNodeID, nodes);
                //var midpoint = helper.getMidpoint(node, connectedNode);
                //ctx.fillText("x: " + node.force.x.toFixed(3) + " y: " + node.force.y.toFixed(3) ,midpoint.x,midpoint.y);
                ctx.moveTo(connectedNode.position.x, connectedNode.position.y);
                ctx.lineTo(node.position.x, node.position.y);
                drawn.push(node.id.toString() + connectedNode.id.toString());
                var force = helper.getForce(node, connectedNode);
                if (
                    force.total >= config.dangerForceMin &&
                    force.total < config.dangerForceMax
                ) {
                    normForce =
                        (force.total - config.dangerForceMin) /
                        (config.dangerForceMax - config.dangerForceMin);
                    color = normForce * 255;
                    ctx.strokeStyle = "rgb(" + color.toFixed(0) + ", 0, 0)";
                } else if (force.total >= config.dangerForceMax) {
                    ctx.strokeStyle = "rgb(255, 0, 0)";
                } else {
                    ctx.strokeStyle = "rgb(0,0,0)";
                }
                ctx.stroke();
            }
        }
        nodes.forEach(function(node) {
            if (node.connectedNodes.length <= 0) {
                ctx.beginPath();
                ctx.fillRect(node.position.x - 1, node.position.y - 1, 3, 3);
                if (showIDs) {
                    ctx.fillText(node.id, node.position.x + 1, node.position.y);
                }
                ctx.stroke();
            }
            node.connectedNodes.forEach(drawLine.bind(this, node));
        });
        //ctx.stroke();
    }
    function compute() {
        var connected = false;
        function computeNode(node, connectedNodeID) {
            if (
                parseInt(document.getElementById("to").value) ===
                connectedNodeID
            ) {
                connected = true;
                var connectedNode = helper.getNode(connectedNodeID, nodes);
                var force = helper.getForce(node, connectedNode);
                document.getElementById("result").innerText =
                    force.total.toFixed(3) + "N";
            }
        }
        nodes.forEach(function(node) {
            if (parseInt(document.getElementById("from").value) === node.id) {
                node.connectedNodes.forEach(computeNode.bind(this, node));
            }
        });
        if (!connected) {
            document.getElementById("result").innerText = "Not connected";
        }
    }

    function frameSyncer(timestamp) {
        if (selectedNode) {
            worker.postMessage(["move", {selectedNode, mousePosition}])
        }
        worker.postMessage("send");
        requestAnimationFrame(frameSyncer);
    }
    requestAnimationFrame(frameSyncer);

    worker.postMessage("run");
});
