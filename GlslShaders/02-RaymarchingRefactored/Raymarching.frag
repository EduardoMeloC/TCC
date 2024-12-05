#define SHADOW_BIAS 1.e-4
#define MAX_MARCHING_STEPS 150
#define MAX_MARCHING_DISTANCE 40.

#define SURFACE_DISTANCE .0001

#define NULL_MATERIAL Material(vec3(0.),0.,0.,false)
#define NULL_CANDIDATE HitCandidate(INF,NULL_MATERIAL);
#define RAYHIT_INFINITY Hit(vec3(INF),vec3(0.),INF,NULL_MATERIAL,false)
#define LIGHT_SPHERE Sphere(light.pos,0.1,Material(light.color,0.,0.,false))

#include "Core.frag"
#include "Scene.frag"

HitCandidate getDist(vec3 point, Scene scene){
    HitCandidate minDist = NULL_CANDIDATE;

    for(int i = 0; i < 2; i++){
        float dist = sphereDistance(point, scene.spheres[i]);
        
        if(dist < minDist.dist){
            minDist.dist = dist;
            minDist.material = scene.spheres[i].material;
        }
    }
    // render sphere in point light's location
    Light light = scene.light;
    float lightDist = sphereDistance(point, LIGHT_SPHERE);
    if(lightDist < minDist.dist){
        minDist.dist = lightDist;
        minDist.material = LIGHT_SPHERE.material;
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
    // generate Hit
    Hit hit = Hit(
        marchPos,
        getNormal(marchPos,nextStepHit.dist, scene),
        distToCamera,
        nextStepHit.material,
        isHit); 
    return hit;
}

vec3 getLight(Hit hit, Ray ray, Scene scene)
{
    
    // Unlit material
    if (!hit.material.isLit)
        return hit.material.albedo;
    
    Light light = scene.light;
    vec3 ldir = (light.pos - hit.point);
    float r = length(light.pos - hit.point);
    float r2 = r*r;
    ldir = normalize(ldir);
    
    // cast hard shadow
    float shadowValue = 1.;
    vec3 shadowRayOrigin = hit.point + hit.normal * SHADOW_BIAS;
    vec3 shadowRayDirection = ldir;
    Ray shadowRay = Ray(shadowRayOrigin, shadowRayDirection);
    Hit shadowHit = marchRay(shadowRay, scene);
    if(shadowHit.isHit){
        if(shadowHit.material != LIGHT_SPHERE.material)
        if(length(shadowHit.point - shadowRayOrigin) < r){
            shadowValue = 0.;
        }
    }
    
    
    // inv square law
    vec3 li = light.color * (light.intensity / (4. * PI * r2));
    // lambert
    float lv = max(dot(ldir, hit.normal), 0.);
    
    // specular (Phong)
    vec3 R = reflect(ldir, hit.normal);
    vec3 specular = li * pow(max(0.f, dot(R, ray.direction)), hit.material.specularPower);
    
    vec3 albedo = hit.material.albedo;
    vec3 diffuse = albedo * li * lv;
    
    return (diffuse + specular * hit.material.specularIntensity) * shadowValue;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    Scene scene = createScene();

    vec2 uv = (fragCoord - .5*iResolution.xy) / iResolution.y;
    vec3 color = vec3(0.);
    
    // Creating Ray
    vec3 rayOrigin = vec3(0., 0., 1.);
    vec3 rayDirection = normalize(vec3(uv.xy, 0.) - rayOrigin);
    Ray ray = Ray(rayOrigin, rayDirection);
    
    // Marching Ray
    Hit hit = marchRay(ray, scene);
    
    if (hit.isHit) color = getLight(hit, ray, scene);
    
    // Output to screen
    fragColor = vec4(color,1.0);
}