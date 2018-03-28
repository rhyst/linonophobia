#include <emscripten/emscripten.h>
#include <iostream>
#include <stdio.h>
#include <string>

extern "C" {

// Config
float metre;               // pixels
float nominalStringLength; // pixels
float springConstant;
float internalViscousFrictionConstant;
float viscousConstant;
float simulationSpeed; // times real time
float maxStep;         // milliseconds
float dangerForceMax;  // 25000;
float dangerForceMin;  // 10000;
float ropeWeightPerMetre;
float ropeWeightPerNode;

// Nodes
int *g_id;
float *g_positionX;
float *g_positionY;
float *g_velocityX;
float *g_velocityY;
float *g_forceX;
float *g_forceY;
int *g_fixed;
int *g_grabbed;
int **g_connectedNodes;    // Pointer to array of connected nodes
int *g_connectedNodesSize; // Size of connected nodes array
int g_bufSize;

// INITIALISATION METHODS

EMSCRIPTEN_KEEPALIVE
int setInts(int bufSize, int *id, int idbf, int *fixed, int fbf, int *grabbed,
            int gbf, int **connectedNodes, int cnbf, int *connectedNodesSize,
            int cnsbf) {
  g_id = id;
  g_fixed = fixed;
  g_grabbed = grabbed;
  g_bufSize = bufSize;
  g_connectedNodes = connectedNodes;
  g_connectedNodesSize = connectedNodesSize;
  return 0;
}

EMSCRIPTEN_KEEPALIVE
int setFloats(float *positionX, int pxbf, float *positionY, int pybf,
              float *velocityX, int vxbf, float *velocityY, int vybf,
              float *forceX, int fxbf, float *forceY, int fybf) {
  // Yes, this is horrible. It was more horrible trying to get structs to work
  g_positionX = positionX;
  g_positionY = positionY;
  g_velocityX = velocityX;
  g_velocityY = velocityY;
  g_forceX = forceX;
  g_forceY = forceY;
  return 0;
}

EMSCRIPTEN_KEEPALIVE
int setConfig() {
  metre = 10;               // pixels
  nominalStringLength = 10; // pixels
  springConstant = 25;
  internalViscousFrictionConstant = 8;
  viscousConstant = 0.00002;
  simulationSpeed = 4;  // times real time
  maxStep = 50;         // milliseconds
  dangerForceMax = 150; // 25000;
  dangerForceMin = 0;   // 10000;
  ropeWeightPerMetre = 1;
  ropeWeightPerNode = nominalStringLength / metre * ropeWeightPerMetre;
  return 0;
}

// GETTERS

EMSCRIPTEN_KEEPALIVE
int *getIDs() { return g_id; }

EMSCRIPTEN_KEEPALIVE
float *getPositionXs() { return g_positionX; }

EMSCRIPTEN_KEEPALIVE
float *getPositionYs() { return g_positionY; }

EMSCRIPTEN_KEEPALIVE
float *getVelocityXs() { return g_velocityX; }

EMSCRIPTEN_KEEPALIVE
float *getVelocityYs() { return g_velocityY; }

EMSCRIPTEN_KEEPALIVE
float *getForceXs() { return g_forceX; }

EMSCRIPTEN_KEEPALIVE
float *getForceYs() { return g_forceY; }

EMSCRIPTEN_KEEPALIVE
int *getFixeds() { return g_fixed; }

EMSCRIPTEN_KEEPALIVE
int *getGrabbeds() { return g_grabbed; }

EMSCRIPTEN_KEEPALIVE
int *getConnectedNodesSize() { return g_connectedNodesSize; }

EMSCRIPTEN_KEEPALIVE
int *getConnectedNodes(int index) { return g_connectedNodes[index]; }

// INPUT METHODS

EMSCRIPTEN_KEEPALIVE
int setPositionX(int id, float positionX) {
  for (int i = 0; i < g_bufSize; i++) {
    int testId = g_id[i];
    if (testId == id) {
      g_positionX[i] = positionX;
    }
  }
  return 0;
}

int setPositionY(int id, float positionY) {
  for (int i = 0; i < g_bufSize; i++) {
    int testId = g_id[i];
    if (testId == id) {
      g_positionY[i] = positionY;
    }
  }
  return 0;
}

// PHYSICS
void getAcceleration(int nodeIndex) {
  float ySpringForce = 0;
  float xSpringForce = 0;
  float xVelocityDampingForce = 0;
  float yVelocityDampingForce = 0;
}
}

//    EM_ASM_({ console.log('checking ' + $0); }, testId);
