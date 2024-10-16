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

struct Capsule{
    vec3 pos1;
    vec3 pos2;
    float radius;
    Material material;
};

struct Torus{
    vec3 pos;
    float radius1;
    float radius2;
    Material material;
};

struct Box{
    vec3 pos;
    vec3 size;
    Material material;
};

float sphereDistance(vec3 point, Sphere sphere){
    return length(point) - sphere.radius;
}

float capsuleDistance(vec3 point, Capsule capsule){
    vec3 p1 = capsule.pos1 - (capsule.pos1 + capsule.pos2)*0.5;
    vec3 p2 = capsule.pos2 - (capsule.pos1 + capsule.pos2)*0.5;

    vec3 p1ToP2 = p2 - p1;
    vec3 p1ToP = point - p1;

    float closestDist = dot(p1ToP2,p1ToP) / dot(p1ToP2,p1ToP2);
    closestDist = clamp(closestDist, 0., 1.);

    vec3 closest = p1 + p1ToP2 * closestDist;

    return length(point - closest) - capsule.radius;
}

float torusDistance(vec3 point, Torus torus){
    vec3 p = point;
    vec2 distToInnerCircle = vec2(length(p.xz)-torus.radius1, p.y);
    return length(distToInnerCircle) - torus.radius2;
}

float boxDistance(vec3 point, Box box){
    vec3 p = point; 
    vec3 q = abs(p) - box.size;
    return length(max(q,0.)) + min(max(q.x,max(q.y,q.z)),0.);
}

float opSmoothUnion( float d1, float d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

float opSmoothSubtraction( float d1, float d2, float k ) {
    float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
    return mix( d2, -d1, h ) + k*h*(1.0-h);
}

#endif