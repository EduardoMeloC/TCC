#ifndef CORE_H
#define CORE_H

#define INF 3.402823466e+38
#define PI  3.1415926535898


struct Ray{
    vec3 origin;
    vec3 direction;
};

struct Material{
    int type; // -1 - null ; 0 - unlit 1 - solid; 2 - gradient ; 3 - checkerboard
    vec3 albedo;
    float specularPower;
    float specularIntensity;
    vec3 albedo2;
};

#define M_UNLIT 0
#define M_SOLID 1
#define M_GRADIENT 2
#define M_CHECKERBOARD 3

#define NULL_MATERIAL Material(-1, vec3(0.),0.,0., vec3(0.))

Material createUnlitMaterial(vec3 albedo, float specularPower, float specularIntensity){
    return Material(M_UNLIT, albedo, specularPower, specularIntensity, vec3(0.));
}

Material createSolidMaterial(vec3 albedo, float specularPower, float specularIntensity){
    return Material(M_SOLID, albedo, specularPower, specularIntensity, vec3(0.));
}

Material createGradientMaterial(vec3 albedo1, vec3 albedo2, float specularPower, float specularIntensity){
    return Material(M_GRADIENT, albedo1, specularPower, specularIntensity, albedo2);
}

Material createCheckerboardMaterial(vec3 albedo1, vec3 albedo2, float specularPower, float specularIntensity){
    return Material(M_CHECKERBOARD, albedo1, specularPower, specularIntensity, albedo2);
}

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

struct PointLight{
    vec3 pos;
    vec3 color;
    float intensity;
};

struct DirectionalLight{
    vec3 direction;
    vec3 color;
    float intensity;
};

struct Fog{
    float dist;
    float intensity;
    vec3 color;
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

struct Ground{
    float height;
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

vec3 opRepetition( in vec3 p, in float s) {
    return p - s*round(p/s);
}

vec3 opLimitedRepetition( in vec3 p, in float s, in vec3 l) {
    return p - s*clamp(round(p/s),-l,l);
}

float opDisplace( in float d1, in vec3 p, in float i ) {
    float d2 = 0.5*sin(i*p.x)*sin(i*p.y)*sin(i*p.z);
    return d1+d2;
}

vec3 opTwist( in float k, in vec3 p ) {
    float c = cos(k*p.y);
    float s = sin(k*p.y);
    mat2  m = mat2(c,-s,s,c);
    return vec3(m*p.xz,p.y);
}

mat3 CameraRotation( vec2 m )
{
    vec2 s = sin(m);
    vec2 c = cos(m);
    mat3 rotX = mat3(
        1.0, 0.0, 0.0, 
        0.0, c.y, s.y, 
        0.0, -s.y, c.y
    );
    mat3 rotY = mat3(
        -c.x, 0.0, -s.x, 
        0.0, 1.0, 0.0, 
        s.x, 0.0, -c.x
    );
    
    return rotY * rotX;
}

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
float simplexNoise(vec2 uv){
    // Precompute values for skewed triangular grid
    const vec4 C = vec4(0.211324865405187,
                        // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,
                        // 0.5*(sqrt(3.0)-1.0)
                        -0.577350269189626,
                        // -1.0 + 2.0 * C.x
                        0.024390243902439);
                        // 1.0 / 41.0

    // First corner (x0)
    vec2 i  = floor(uv + dot(uv, C.yy));
    vec2 x0 = uv - i + dot(i, C.xx);

    // Other two corners (x1, x2)
    vec2 i1 = vec2(0.0);
    i1 = (x0.x > x0.y)? vec2(1.0, 0.0):vec2(0.0, 1.0);
    vec2 x1 = x0.xy + C.xx - i1;
    vec2 x2 = x0.xy + C.zz;

    // Do some permutations to avoid
    // truncation effects in permutation
    i = mod289(i);
    vec3 p = permute(
            permute( i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0 ));

    vec3 m = max(0.5 - vec3(
                        dot(x0,x0),
                        dot(x1,x1),
                        dot(x2,x2)
                        ), 0.0);

    m = m*m ;
    m = m*m ;

    // Gradients:
    //  41 pts uniformly over a line, mapped onto a diamond
    //  The ring size 17*17 = 289 is close to a multiple
    //      of 41 (41*7 = 287)

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    // Normalise gradients implicitly by scaling m
    // Approximation of: m *= inversesqrt(a0*a0 + h*h);
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);

    // Compute final noise value at P
    vec3 g = vec3(0.0);
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
    return 130.0 * dot(m, g) *.5 + .5;
}

float layeredSimplexNoise(vec2 uv){
  float c = 0.;
  c += simplexNoise(uv);
  c += simplexNoise(uv*2. )*0.5;
  c += simplexNoise(uv*4. )*0.25;
  c += simplexNoise(uv*8. )*0.125;
  c += simplexNoise(uv*16.)*0.0625;

  return c*0.5;
}

#endif