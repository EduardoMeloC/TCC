#define SHADOW_BIAS 1.e-3
#define MAX_MARCHING_STEPS 150
#define MAX_MARCHING_DISTANCE 80.

#define SURFACE_DISTANCE .001

#define NULL_CANDIDATE HitCandidate(INF,NULL_MATERIAL)
#define RAYHIT_INFINITY Hit(vec3(INF),vec3(0.),INF,NULL_MATERIAL,false)
#define LIGHT_SPHERE Sphere(light.pos,0.1,Material(light.color,0.,0.,false))

#include "Core.frag"
#include "Scene.frag"

#iChannel0 "CameraBuffer.frag"

const ivec2 POSITION = ivec2(1, 0);
const ivec2 VMOUSE = ivec2(1, 1);

#define load(P) texelFetch(iChannel0, ivec2(P), 0)

#iKeyboard

HitCandidate getDist(vec3 point, Scene scene){
    HitCandidate minDist = NULL_CANDIDATE;

    float noise = layeredSimplexNoise(vec2(point.x * 0.75, point.z * 0.75)) * 0.25;

    float groundDist = point.y - scene.ground.height - noise;

    if(groundDist < minDist.dist){
        minDist.dist = groundDist;
        minDist.material = createSolidMaterial(vec3(1.), 0., 0.);
    }

    return minDist;
}

vec3 getNormal(vec3 point,float d, Scene scene){
    vec2 e = vec2(.01, 0);
    HitCandidate n1 = getDist(point - e.xyy, scene);
    HitCandidate n2 = getDist(point - e.yxy, scene);
    HitCandidate n3 = getDist(point - e.yyx, scene);
    
    vec3 stretchedNormal = d-vec3(
        n1.dist,
        n2.dist,
        n3.dist
    );
    return normalize(stretchedNormal);
}

Hit marchRay(Ray ray, Scene scene){
    float distToCamera = 0.;
    bool isHit = false;
    vec3 marchPos = ray.origin;
    HitCandidate nextStepHit = NULL_CANDIDATE;
    for(int stp=0; stp<MAX_MARCHING_STEPS; stp++){
        marchPos = ray.origin + (distToCamera * ray.direction);
        nextStepHit = getDist(marchPos, scene);
        distToCamera += nextStepHit.dist;
        if(nextStepHit.dist < SURFACE_DISTANCE){
            isHit = true;
            break;
        }
        if(distToCamera > MAX_MARCHING_DISTANCE){
            isHit = false;
            break;
        }
    }
    Hit hit = Hit(
        marchPos,
        getNormal(marchPos,nextStepHit.dist, scene),
        distToCamera,
        nextStepHit.material,
        isHit); 
    return hit;
}

vec3 getAlbedo(Hit hit){
    switch(hit.material.type){
        case M_SOLID:
            return hit.material.albedo;
            break;
        case M_GRADIENT:
            return hit.material.albedo; // TODO
            break;
        case M_CHECKERBOARD:
            float Size = 2.0;
            vec3 OffsetCoord = hit.point - vec3(Size / 2.0);
            vec3 Pos = floor(OffsetCoord / Size);
            float PatternMask = mod(Pos.x + mod(Pos.z, 2.0), 2.0);
            vec3 albedo = PatternMask * hit.material.albedo + (1.-PatternMask) * hit.material.albedo2;
            return albedo;
            break;
    }
}

vec3 getLight(Hit hit, Ray ray, in Scene scene)
{
    // Unlit material
    if (hit.material.type == M_UNLIT)
        return hit.material.albedo;
    
    vec3 outputColor = vec3(0.);

    DirectionalLight light = scene.dirLight;
    vec3 ldir = -normalize(light.direction);

    // cast hard shadow
    float shadowValue = 1.;
    // vec3 shadowRayOrigin = hit.point + hit.normal * SHADOW_BIAS;
    // vec3 shadowRayDirection = ldir;
    // Ray shadowRay = Ray(shadowRayOrigin, shadowRayDirection);
    // Hit shadowHit = marchRay(shadowRay, scene);
    // if(shadowHit.isHit){
    //     if(shadowHit.material.type != M_UNLIT)
    //             shadowValue = 0.4;
    // }
    // shadowValue = min(shadowValue, 8.*shadowHit.dist/, )
    
    vec3 li = light.color * (light.intensity / (4. * PI));
    // lambert
    float lv = clamp(dot(ldir, hit.normal), 0., 1.);
    
    // specular (Phong)
    vec3 R = reflect(ldir, hit.normal);
    vec3 specular = li * pow(max(0.f, dot(R, ray.direction)), hit.material.specularPower);
    
    vec3 albedo = getAlbedo(hit);
    vec3 diffuse = albedo * li * lv;

    outputColor += (diffuse + specular * hit.material.specularIntensity) * shadowValue; 

    float fogInfluence = (clamp(((length(ray.origin - hit.point) - scene.fog.dist)/scene.fog.intensity) - 1., 0., scene.fog.dist) / scene.fog.dist );

    return (outputColor + scene.ambientLight)*(1.-fogInfluence) + scene.fog.color * fogInfluence;
}

mat4 lookAt(vec3 eye, vec3 center, vec3 up) {
    // Based on gluLookAt man page
    vec3 f = normalize(center - eye);
    vec3 s = normalize(cross(f, up));
    vec3 u = cross(s, f);
    return mat4(
        vec4(s, 0.0),
        vec4(u, 0.0),
        vec4(-f, 0.0),
        vec4(0.0, 0.0, 0.0, 1.)
    );
}

void Camera(in vec2 fragCoord, out vec3 ro, out vec3 rd) 
{
    ro = load(POSITION).xyz;
    vec2 m = load(VMOUSE).xy/iResolution.x;
    
    float a = 1.0/max(iResolution.x, iResolution.y);
    rd = normalize(vec3((fragCoord - iResolution.xy*0.5)*a, 0.5));

    rd = CameraRotation(m) * rd;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    Scene scene = createScene();

    vec2 uv = (fragCoord - .5*iResolution.xy) / iResolution.y;
    vec3 color = vec3(0.);
  
    // Creating Ray
    vec3 rayOrigin = vec3(0.);
    vec3 rayDirection = vec3(0.);
    Camera(fragCoord, rayOrigin, rayDirection);


    Ray ray = Ray(rayOrigin, rayDirection);
    
    // Marching Ray
    Hit hit = marchRay(ray, scene);

    // Skybox Color
    vec3 skyBoxColor = mix(vec3(0.4, 0.6, 0.8), vec3(0.7, 0.9, 1.), dot(rayDirection, vec3(0., 1., 0.)));
    float sunDot = dot(scene.dirLight.direction * 1.224744871391589, rayDirection);
    skyBoxColor += skyBoxColor * exp(exp(exp(-sunDot-0.2))) * scene.dirLight.color * 0.0000001;
    
    if (hit.isHit){
        vec3 sceneColor = getLight(hit, ray, scene);
        float fogInfluence = (clamp(((length(ray.origin - hit.point) - scene.fog.dist)/scene.fog.intensity) - 1., 0., scene.fog.dist) / scene.fog.dist );
        color += mix(sceneColor, skyBoxColor, fogInfluence);
    }
    else color = skyBoxColor;
    
    // Output to screen
    fragColor = vec4(color,1.0);
}