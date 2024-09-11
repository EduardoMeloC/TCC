#ifndef CORE_H
#define CORE_H

#define INF 3.402823466e+38
#define PI  3.1415926535898

struct Ray{
    vec3 origin;
    vec3 direction;
};

struct Material{
    vec3 albedo;
    float specularPower;
    float specularIntensity;
    bool isLit;
};

struct Hit{
    vec3 point;
    vec3 normal;
    float dist;
    Material material;
    bool isHit;
};

struct HitCandidate{
    float dist;
    Material material;
};

struct Light{
    vec3 pos;
    vec3 color;
    float intensity;
};

struct Sphere{
    vec3 pos;
    float radius;
    Material material;
};

float sphereDistance(vec3 point, Sphere sphere){
    return length(point- sphere.pos) - sphere.radius;
}

#endif