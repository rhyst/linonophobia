const helper = require('js/shared/helper');
const config = require('js/shared/config');
const Vector = require('js/shared/vector').Vector;
const Node = require('js/shared/node').Node;
const ActionsEnum = require('js/shared/constants').ActionsEnum;
const {ccallArrays, cwrapArrays} = require('js/shared/wasm-arrays');

var wasm;
var running = true;
var nodes = [];
var lastTime = new Date();
var trueSimulationSpeed = 0;
var elapsedTimeSumAverage = 0;

onmessage = function(e) {
  switch (e.data.type) {
    case ActionsEnum.init:
      init();
      break;
    case ActionsEnum.run:
      running = true;
      doPhysics();
      break;
    case ActionsEnum.pause:
      running = false;
      break;
    case ActionsEnum.send:
      postMessage({nodes, trueSimulationSpeed, elapsedTimeSumAverage});
      break;
    case ActionsEnum.load:
      nodes = JSON.parse(atob(e.data.nodes));
      break;
    case ActionsEnum.move:
      var node = helper.getNode(e.data.selectedNode.id, nodes);
      node.position = new Vector().load(e.data.mousePosition);
      node.velocity = new Vector();
      node.force = new Vector();
      node.grabbed = true;
      break;
    case ActionsEnum.nomove:
      var node = helper.getNode(e.data.node.id, nodes);
      node.grabbed = false;
      break;
    case ActionsEnum.addanchor:
      var position = e.data.mousePosition;
      nodes.push(new Node(position.x, position.y, 0, 0, 0, 0, true, []));
      break;
    case ActionsEnum.deletenode:
      var node = e.data.node;
      nodes = nodes.filter(n => n.id !== node.id).map(n => {
        n.connectedNodes = n.connectedNodes.filter(cn => cn !== node.id);
        return n;
      });
      break;
    case ActionsEnum.addnodes:
      var newNodes = e.data.nodes;
      nodes = nodes.concat(newNodes);
      checkConnections();
      break;
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

  importScripts('calc.js');
  Module['onRuntimeInitialized'] = () => {
    const v = (v1, v2) => {
      if (!v2) {
        return nodes.map(node => node[v1]);
      }
      return nodes.map(node => node[v1]).map(node => node[v2]);
    };
    const cns = nodes.map(n => {
        const typedArray = new Int32Array(n.connectedNodes);
        const buf = Module._malloc(typedArray.length * typedArray.BYTES_PER_ELEMENT);
        Module['HEAP32'].set(typedArray, buf >> 2);
        return {buf: buf, len: n.connectedNodes.length}
    })
    // Pass in all relevant quantities as seperate arrays
    // Seperate float arrays and int arrays as they need to be
    // on seperate heaps
    ccall('setConfig',null,[],[]);
    ccallArrays(
        'setFloats', null,
        [
          'array', 'array', 'array', 'array', 'array', 'array', 'array',
          'array', 'number'
        ],
        [
          v('position', 'x'), v('position', 'y'), v('velocity', 'x'),
          v('velocity', 'y'), v('force', 'x'), v('force', 'y')
        ],
        {heapIn: 'HEAPF32'});
    ccallArrays(
        'setInts', null, ['number', 'array', 'array', 'array'],
        [
          nodes.length, 
          v('id'), 
          v('fixed').map(f => (f ? 1 : 0)),
          v('grabbed').map(f => (f ? 1 : 0)),
          cns.map(cn => cn.buf),
          cns.map(cn => cn.len),
        ],
        {heapIn: 'HEAP32'});
  };
}

function checkConnections() {
  // TODO: make less bad
  let connectedNodes = nodes;
  nodes.forEach(n => {
    n.connectedNodes.forEach(cnID => {
      let cn = helper.getNode(cnID, nodes);
      if (cn.connectedNodes.indexOf(n.id) < 0) {
        connectedNodes = connectedNodes.map(node => {
          if (node.id === cnID) {
            node.connectedNodes.push(n.id);
          }
          return node;
        });
      }
    });
  });
  nodes = connectedNodes;
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
        var lengthDifference = stringLength - config.nominalStringLength;
        var angleFromHorizontal =
            helper.getAngleFromHorizontal(node, connectedNode);
        ySpringForce += Math.sin(angleFromHorizontal) * lengthDifference *
            config.springConstant;
        xSpringForce += Math.cos(angleFromHorizontal) * lengthDifference *
            config.springConstant;
      }
      xVelocityDampingForce += config.internalViscousFrictionConstant *
          (node.velocity.x - connectedNode.velocity.x);
      yVelocityDampingForce += config.internalViscousFrictionConstant *
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
      node.force.y / config.ropeWeightPerNode);
}

function physics() {
  let simSpeedQuantity = 0;
  let simulationSpeedSum = 0;
  let elapsedTimeSum = 0;
  for (let j = 0; j < 100; j++) {
    // Timing and simulation speed
    let newTime = self.performance.now();
    let actualElapsedMilliseconds = newTime - lastTime;
    let actualElapsedTime = actualElapsedMilliseconds / 1000;
    let elapsedMilliseconds =
        actualElapsedMilliseconds * config.simulationSpeed;
    if (elapsedMilliseconds > config.maxStep) {
      elapsedTime = config.maxStep / 1000;
      console.warn('Max step exceeded, simulation speed may not be correct.');
    } else {
      elapsedTime = elapsedMilliseconds / 1000;
    }
    let actualSimulationSpeed = elapsedTime / actualElapsedTime;
    if (!isNaN(actualSimulationSpeed)) {
      simSpeedQuantity += 1;
      simulationSpeedSum += actualSimulationSpeed;
      elapsedTimeSum += elapsedMilliseconds;
    }
    lastTime = newTime;
    let newNodes = [];
    // Physics
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i].copy();
      if (!node.fixed && !node.grabbed) {
        node.velocity.x = node.velocity.x +
            node.force.x / config.ropeWeightPerNode * elapsedTime / 2;
        node.velocity.y = node.velocity.y +
            node.force.y / config.ropeWeightPerNode * elapsedTime / 2;

        // x
        node.position.y = node.position.y + node.velocity.y * elapsedTime;
        node.position.x = node.position.x + node.velocity.x * elapsedTime;

        // v
        dv = get_a(node).multiply(elapsedTime / 2);
        node.velocity.x = node.velocity.x + dv.x;
        node.velocity.y = node.velocity.y + dv.y;
      }
      newNodes.push(node);
    }
    nodes = newNodes;
  }
  trueSimulationSpeed = simulationSpeedSum / simSpeedQuantity;
  elapsedTimeSumAverage = elapsedTimeSum / simSpeedQuantity;
  if (running) {
    elapsedTimeSumAverage;
    setTimeout(physics, 0);
  }
}
