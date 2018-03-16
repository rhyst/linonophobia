var metre = 10; //pixels
var numOfNodes = 40;
var nominalStringLength = 10; // pixels
var springConstant = 25;
var internalViscousFrictionConstant = 8;
var viscousConstant = 0.00002;
var simulationSpeed = 1; // times real time
var maxStep = 50;  // milliseconds
var dangerForceMax = 25000;
var dangerForceMin = 10000;
var ropeWeightPerMetre = 1;
var ropeWeightPerNode = ( nominalStringLength / metre ) * ropeWeightPerMetre;

module.exports = {
    metre, 
    numOfNodes, 
    nominalStringLength, 
    springConstant, 
    internalViscousFrictionConstant, 
    viscousConstant, 
    running, 
    simulationSpeed, 
    maxStep, 
    dangerForceMax, 
    dangerForceMin, 
    ropeWeightPerMetre, 
    ropeWeightPerNode
};