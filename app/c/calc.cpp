#include <stdio.h>
#include <string>
#include <iostream>
#include <emscripten/emscripten.h>

typedef struct Vector
{
    float x;
    float y;
} Vector;

typedef struct Node
{
    int id;
    Vector position;
    Vector velocity;
    Vector force;
    int fixed;
    int grabbed;
    int connectedNodes;
} Node;

extern "C" {

//Node* nodes;
//int nodesSize;
int* g_id;
float* g_positionX;
float* g_positionY;
float* g_velocityX;
float* g_velocityY;
float* g_forceX;
float* g_forceY;
int* g_fixed;
int* g_grabbed;
int g_bufSize;


EMSCRIPTEN_KEEPALIVE
int setIDs(int *id, int idbf)
{
    g_id = id;
    return g_bufSize;
}

EMSCRIPTEN_KEEPALIVE
int setNodes(int *id, int idbf, float *positionX, int pxbf, float *positionY, int pybf, float *velocityX, int vxbf, float *velocityY, int vybf, float *forceX, int fxbf, float *forceY, int fybf, int *fixed, int fbf, int *grabbed, int gbf, int bufSize)
{
    /*Node tempNodes[bufSize];
    for (int i = 0; i < bufSize; i++)
    {
        tempNodes[i] = {.id = id[i], .position = {.x = positionX[i], .y = positionY[i]}, .velocity = {.x = velocityX[i], .y = velocityY[i]}, .force = {.x = forceX[i], .y = forceY[i]}, .fixed = fixed[i], .grabbed = grabbed[i]};
    }
    nodes = &tempNodes[0];
    nodesSize = sizeof(tempNodes) / sizeof(Node);*/
    g_id = id;
    g_positionX = positionX;
    g_positionY = positionY;
    g_velocityX = velocityX;
    g_velocityY = velocityY;
    g_forceX = forceX;
    g_forceY = forceY;
    g_fixed = fixed;
    g_grabbed = grabbed;
    g_bufSize = bufSize;
    return g_bufSize;
}

EMSCRIPTEN_KEEPALIVE
float* getNodesX()
{
    /*
    float values[nodesSize];
    for (int i=0; i<nodesSize; i++) {
        values[i] = nodes[i].position.x;
    }
    auto arrayPtr = &values[0];*/
    return g_positionX;
}


EMSCRIPTEN_KEEPALIVE
int* getIDs()
{
    /*
    float values[nodesSize];
    for (int i=0; i<nodesSize; i++) {
        values[i] = nodes[i].position.x;
    }
    auto arrayPtr = &values[0];*/
    return g_id;
}


EMSCRIPTEN_KEEPALIVE
int getNodesSize()
{
    //return nodesSize;
    return g_bufSize;
}

EMSCRIPTEN_KEEPALIVE
int setNodePosition(int id)
{
    for (int i = 0; i < g_bufSize; i++) {
        if (g_id[i] == 1) {
            return -1;
        }
    }
    return g_id[5];
}
}

/*

float* array;

EMSCRIPTEN_KEEPALIVE
void setArray(float *arrayToSet) 
{
    array = arrayToSet;
}

EMSCRIPTEN_KEEPALIVE
float* getArray() 
{
    return array;
}

EMSCRIPTEN_KEEPALIVE
float addNums(float *buffer, int bufSize)
{
    printf("Hello World\n");
    //return buffer[1];
    float total = 0;

    for (int i=0; i<bufSize; i++) {
        total+= buffer[i];
    }

    return total;
}

EMSCRIPTEN_KEEPALIVE
float* doubleValues (float *buf, int bufSize) {

    float values[bufSize];

    for (int i=0; i<bufSize; i++) {
        values[i] = buf[i] * 2;
    }

    auto arrayPtr = &values[0];
    return arrayPtr;
}*/