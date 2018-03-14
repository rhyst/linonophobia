importScripts('config.js')
importScripts('helper.js')

var running = true;
var nodes = [];
var lastTime = new Date();
var trueSimulationSpeed = 0;

onmessage = function(e) {
    if (e.data === 'init') {
        init();
    } else if (e.data === 'run') {
        running = true;
        doPhysics();
    } else if (e.data === 'pause') {
        running = false;
    } else if (e.data === 'send') {
        postMessage({nodes: nodes, trueSimulationSpeed: trueSimulationSpeed})
    } else if (e.data[0] === 'load') {
        nodes = JSON.parse(atob(e.data[1]))
    }
}

function init() {
    var initPosition = { x: 200, y: 50 }
    var position = {
        x: initPosition.x,
        y: initPosition.y
    }
    self.nodes.push({
        id: 0,
        position: {
            x: position.x,
            y: position.y
        },
        fixed: true,
        velocity: {
            x: 0,
            y: 0
        },
        force: {
            x: 0,
            y: 0
        },
        connectedNodes: [1]
    })
    for (var i = 1; i < numOfNodes; i++) {
        position.x = position.x + nominalStringLength;
        var connectedNodes = [i - 1];
        if (i < numOfNodes - 1) connectedNodes.push(i + 1);
        nodes.push({
            id: i,
            position: {
                x: position.x,
                y: position.y
            },
            velocity: {
                x: 0,
                y: 0
            },
            fixed: false,
            force: {
                x: 0,
                y: 0
            },
            connectedNodes: connectedNodes
        });
    }

    var lastNode = getNode(nodes.length - 1, nodes);
    lastNode.fixed = true
    lastNode.position.x = 260;
    lastNode.position.y = 300;

    nodes.push({
        id: nodes.length,
        position: {
            x: initPosition.x + 20,
            y: initPosition.y
        },
        velocity: {
            x: 0,
            y: 0
        },
        fixed: true,
        force: {
            x: 0,
            y: 0
        },
        connectedNodes: [1]
    })
    var node1 = getNode(1, nodes);
    node1.connectedNodes.push(nodes.length - 1)
}

function doPhysics() {
    var delta = 0;
    lastTime = self.performance.now();
    setTimeout(physics, 0);
}

function physics() {
    var simSpeedQuantity = 0;
    var simulationSpeedSum = 0;
    for (var j = 0; j < 100; j++) {
        var newTime = self.performance.now()
        var actualElapsedMilliseconds = (newTime - lastTime);
        var actualElapsedTime = actualElapsedMilliseconds / 1000
        var elapsedMilliseconds = actualElapsedMilliseconds*simulationSpeed;
        if (elapsedMilliseconds > maxStep) {
            elapsedTime = maxStep / 1000;
            //console.warn('Max step exceeded, simulation speed may not be correct.')
        } else {
            elapsedTime = elapsedMilliseconds / 1000;
        }
        var actualSimulationSpeed = elapsedTime/actualElapsedTime;
        if (!isNaN(actualSimulationSpeed)) {
            simSpeedQuantity += 1
            simulationSpeedSum += actualSimulationSpeed;
        }
        lastTime = newTime;
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i]
            if (!node.fixed) {
                // Assume mass = 1 for all nodes
                // Calc spring forces on node from prev and next nodes
                var ySpringForce = 0;
                var xSpringForce = 0;
                var xVelocityDampingForce = 0;
                var yVelocityDampingForce = 0;
                node.connectedNodes.forEach(function (connectedNodeID) {
                    var connectedNode = getNode(connectedNodeID, nodes);
                    if (connectedNode) {
                        var stringLength = getLength(connectedNode, node);
                        if (stringLength > nominalStringLength) {
                            var lengthDifference = stringLength - nominalStringLength;
                            var angleFromHorizontal = getAngleFromHorizontal(node, connectedNode);
                            ySpringForce += Math.sin(angleFromHorizontal) * lengthDifference * springConstant;
                            xSpringForce += Math.cos(angleFromHorizontal) * lengthDifference * springConstant;
                        }
                        xVelocityDampingForce += velocityDampingConstant * (node.velocity.x - connectedNode.velocity.x);
                        yVelocityDampingForce += velocityDampingConstant * (node.velocity.y - connectedNode.velocity.y);
                    }
                });

                // Other forces
                var yGravForce = 9.8;
                var xGravForce = 0;
                var yViscousForce = node.velocity.y * viscousConstant;
                var xViscousForce = node.velocity.x * viscousConstant;

                // Total force
                var yForce = yGravForce + ySpringForce - yViscousForce - yVelocityDampingForce;
                var xForce = xGravForce + xSpringForce - xViscousForce - xVelocityDampingForce;

                node.force.y = yForce;
                node.force.x = xForce;

                // Alter velocity dv = a*dt = (f/m)*dt = f*dt
                node.velocity.y = node.velocity.y + (yForce * elapsedTime);
                node.velocity.x = node.velocity.x + (xForce * elapsedTime);

                // Alter position
                var newY = node.position.y + (node.velocity.y * elapsedTime);
                var newX = node.position.x + (node.velocity.y * elapsedTime);
                node.position.y = node.position.y + (node.velocity.y * elapsedTime);
                node.position.x = node.position.x + (node.velocity.x * elapsedTime);
            }
        }
    }
    trueSimulationSpeed = simulationSpeedSum / simSpeedQuantity;
    if (running) {
        setTimeout(physics, 0)
    }
}