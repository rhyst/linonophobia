const config = require('config');

function getNode(id, nodes) {
    return nodes.find(function (node) {
        return node.id === id;
    })
}
function getLength(node1, node2) {
    var xdiff = Math.abs(node1.position.x - node2.position.x);
    var ydiff = Math.abs(node1.position.y - node2.position.y);
    return Math.sqrt((xdiff * xdiff) + (ydiff * ydiff));
}
function getMidpoint(node1, node2) {
    return { x: (node1.position.x + node2.position.x) / 2, y: (node1.position.y + node2.position.y) / 2 }
}
function getAngleFromHorizontal(node1, node2) {
    return Math.atan2(node2.position.y - node1.position.y, node2.position.x - node1.position.x)
}

function getForce(node1, node2) {
    var stringLength = getLength(node1, node2);
    var lengthDifference = stringLength - config.nominalStringLength;
    var angleFromHorizontal = getAngleFromHorizontal(node1, node2);
    var ySpringForce = Math.sin(angleFromHorizontal) * lengthDifference * config.springConstant;
    var xSpringForce = Math.cos(angleFromHorizontal) * lengthDifference * config.springConstant;
    var totalSpringForce = Math.sqrt((ySpringForce*ySpringForce)+(xSpringForce+xSpringForce));
    return {total: totalSpringForce, x: xSpringForce, y: ySpringForce}
}

module.exports = {
    getAngleFromHorizontal,
    getForce,
    getLength,
    getMidpoint,
    getNode
}