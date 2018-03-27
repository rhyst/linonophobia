#include <stdio.h>
#include <emscripten/emscripten.h>
#include <stdint.h>
#include <memory>
#include <cstdlib>

extern "C" {
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
int8_t* doubleValues (int8_t *buf, int bufSize) {

    int8_t values[bufSize];

    for (int i=0; i<bufSize; i++) {
        values[i] = buf[i] * 2;
    }

    auto arrayPtr = &values[0];
    return arrayPtr;
}
}


