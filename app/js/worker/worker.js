const helper = require("js/shared/helper");
const config = require("js/shared/config");
const Vector = require("js/shared/vector").Vector;
const Node = require("js/shared/node").Node;

var running = true;
var nodes = [];
var lastTime = new Date();
var trueSimulationSpeed = 0;

onmessage = function(e) {
    if (e.data === "init") {
        init();
    } else if (e.data === "run") {
        running = true;
        doPhysics();
    } else if (e.data === "pause") {
        running = false;
    } else if (e.data === "send") {
        postMessage({ nodes: nodes, trueSimulationSpeed: trueSimulationSpeed });
    } else if (e.data[0] === "load") {
        nodes = JSON.parse(atob(e.data[1]));
    } else if (e.data[0] === "move") {
        var node = helper.getNode(e.data[1].selectedNode.id, nodes);
        node.position = new Vector().load(e.data[1].mousePosition);
        node.velocity = new Vector();
        node.force = new Vector();
    } else if (e.data[0] === "nomove") {
        //var node = helper.getNode(e.data[1].selectedNode.id, nodes);
    } else if (e.data[0] === "newanchor") {
        var position = e.data[1].mousePosition;
        nodes.push(new Node(position.x, position.y,0,0,0,0,true,[]));
    } else if (e.data[0] === "deletenode") {
        var node = e.data[1].node;
        nodes = nodes.filter(n=>n.id !== node.id).map(n=> {
            n.connectedNodes = n.connectedNodes.filter(cn => cn !== node.id);
            return n
        })
    } else if (e.data[0] === "addnodes") {
        var newNodes = e.data[1].nodes;
        nodes = nodes.concat(newNodes)
        checkConnections();
    }
};

function init() {
    var xpos = 200;
    var ypos = 50;
    nodes.push(new Node(xpos, ypos, 0, 0, 0, 0, true, [1]));
    for (var i = 1; i < config.numOfNodes; i++) {
        xpos = xpos + config.nominalStringLength;
        var connectedNodes = [i - 1];
        if (i < config.numOfNodes - 1) connectedNodes.push(i + 1);
        nodes.push(new Node(xpos, ypos, 0, 0, 0, 0, false, connectedNodes));
    }

    var lastNode = helper.getNode(nodes.length - 1, nodes);
    lastNode.fixed = true;
    lastNode.position.x = 260;
    lastNode.position.y = 300;

    var yhangnode = new Node(220, 50, 0, 0, 0, 0, true, [1]);
    nodes.push(yhangnode);

    var node1 = helper.getNode(1, nodes);
    node1.connectedNodes.push(yhangnode.id);
}

function checkConnections() {
    //TODO: make less bad
    let connectedNodes = nodes
    nodes.forEach(n => {
        n.connectedNodes.forEach(cnID => {
            let cn = helper.getNode(cnID, nodes);
            if (cn.connectedNodes.indexOf(n.id) < 0) {
                connectedNodes = connectedNodes.map(node => {
                    if (node.id === cnID) {
                        node.connectedNodes.push(n.id)
                    }
                    return node
                })
            }
        })
    })
    nodes = connectedNodes
}

function doPhysics() {
    var delta = 0;
    lastTime = self.performance.now();
    setTimeout(physics, 0);
}

function get_a(node) {
    var ySpringForce = 0;
    var xSpringForce = 0;
    var xVelocityDampingForce = 0;
    var yVelocityDampingForce = 0;
    node.connectedNodes.forEach(function(connectedNodeID) {
        var connectedNode = helper.getNode(connectedNodeID, nodes);
        if (connectedNode) {
            var stringLength = helper.getLength(connectedNode, node);
            if (stringLength > config.nominalStringLength) {
                var lengthDifference =
                    stringLength - config.nominalStringLength;
                var angleFromHorizontal = helper.getAngleFromHorizontal(
                    node,
                    connectedNode
                );
                ySpringForce +=
                    Math.sin(angleFromHorizontal) *
                    lengthDifference *
                    config.springConstant;
                xSpringForce +=
                    Math.cos(angleFromHorizontal) *
                    lengthDifference *
                    config.springConstant;
            }
            xVelocityDampingForce +=
                config.internalViscousFrictionConstant *
                (node.velocity.x - connectedNode.velocity.x);
            yVelocityDampingForce +=
                config.internalViscousFrictionConstant *
                (node.velocity.y - connectedNode.velocity.y);
        }
    });

    // Other forces
    var yGravForce = 9.8 * config.ropeWeightPerNode;
    var xGravForce = 0 * config.ropeWeightPerNode;
    var yViscousForce = node.velocity.y * config.viscousConstant;
    var xViscousForce = node.velocity.x * config.viscousConstant;

    // Total force
    node.force.y =
        yGravForce + ySpringForce - yViscousForce - yVelocityDampingForce;
    node.force.x =
        xGravForce + xSpringForce - xViscousForce - xVelocityDampingForce;

    return new Vector(
        node.force.x / config.ropeWeightPerNode,
        node.force.y / config.ropeWeightPerNode
    );
}

function physics() {
    var simSpeedQuantity = 0;
    var simulationSpeedSum = 0;
    for (var j = 0; j < 100; j++) {
        // Timing and simulation speed
        var newTime = self.performance.now();
        var actualElapsedMilliseconds = newTime - lastTime;
        var actualElapsedTime = actualElapsedMilliseconds / 1000;
        var elapsedMilliseconds =
            actualElapsedMilliseconds * config.simulationSpeed;
        if (elapsedMilliseconds > config.maxStep) {
            elapsedTime = config.maxStep / 1000;
            console.warn(
                "Max step exceeded, simulation speed may not be correct."
            );
        } else {
            elapsedTime = elapsedMilliseconds / 1000;
        }
        var actualSimulationSpeed = elapsedTime / actualElapsedTime;
        if (!isNaN(actualSimulationSpeed)) {
            simSpeedQuantity += 1;
            simulationSpeedSum += actualSimulationSpeed;
        }
        lastTime = newTime;

        // Physics
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (!node.fixed) {
                node.velocity.x = node.velocity.x + (node.force.x / config.ropeWeightPerNode * elapsedTime / 2);
                node.velocity.y = node.velocity.y + (node.force.y / config.ropeWeightPerNode * elapsedTime / 2);

                // x
                node.position.y =
                    node.position.y + node.velocity.y * elapsedTime;
                node.position.x =
                    node.position.x + node.velocity.x * elapsedTime;

                // v
                dv = get_a(node).multiply(elapsedTime/2);
                node.velocity.x = node.velocity.x + dv.x;
                node.velocity.y = node.velocity.y + dv.y;
            }
        }
    }
    trueSimulationSpeed = simulationSpeedSum / simSpeedQuantity;
    if (running) {
        setTimeout(physics, 0);
    }
}
