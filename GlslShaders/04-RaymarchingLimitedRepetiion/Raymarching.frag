#define SHADOW_BIAS 1.e-4
#define MAX_MARCHING_STEPS 100
#define MAX_MARCHING_DISTANCE 100.

#define SURFACE_DISTANCE .001

#define NULL_MATERIAL Material(vec3(0.),0.,0.,false)
#define NULL_CANDIDATE HitCandidate(INF,NULL_MATERIAL);
#define RAYHIT_INFINITY Hit(vec3(INF),vec3(0.),INF,NULL_MATERIAL,false)
#define LIGHT_SPHERE Sphere(light.pos,0.1,Material(light.color,0.,0.,false))

#include "Core.frag"
#include "Scene.frag"

#iKeyboard
#iFirstPersonControls
/*
WASD move
R|F up | down
Q|E roll
up|down pitch
left|right yaw
*/

HitCandidate getDist(vec3 point, Scene scene){
    HitCandidate minDist = NULL_CANDIDATE;
    /*
    for(int i = 0; i < NSPHERES; i++){
        float dist = sphereDistance(point - scene.spheres[i].pos, scene.spheres[i]);
        
        if(dist < minDist.dist){
            minDist.dist = dist;
            minDist.material = scene.spheres[i].material;
        }
    }

    for(int i = 0; i < NCAPSULES; i++){
        float dist = capsuleDistance(point - (scene.capsules[i].pos1 + scene.capsules[i].pos2)*0.5, scene.capsules[i]);
        
        if(dist < minDist.dist){
            minDist.dist = dist;
            minDist.material = scene.capsules[i].material;
        }
    }

    for(int i = 0; i < NTORUSES; i++){
        float dist = torusDistance(point - scene.toruses[i].pos, scene.toruses[i]);
        
        if(dist < minDist.dist){
            minDist.dist = dist;
            minDist.material = scene.toruses[i].material;
        }
    }

    for(int i = 0; i < NBOXES; i++){
        float dist = boxDistance(point - scene.boxes[i].pos, scene.boxes[i]);
        
        if(dist < minDist.dist){
            minDist.dist = dist;
            minDist.material = scene.boxes[i].material;
        }
    }*/
    
    float scale = 2.5;
    vec3 lim = vec3(3.,3.,3.);

    vec3 q = opLimitedRepetition(point, scale, lim);
    //vec3 q = opTwist(0.1,point);
    //q = point;

    float arms = capsuleDistance(q - (scene.capsules[0].pos1 + scene.capsules[0].pos2)*0.5, scene.capsules[0]);
    float leg1 = capsuleDistance(q - (scene.capsules[1].pos1 + scene.capsules[1].pos2)*0.5, scene.capsules[1]);
    float leg2 = capsuleDistance(q - (scene.capsules[2].pos1 + scene.capsules[2].pos2)*0.5, scene.capsules[2]);
    float body = capsuleDistance(q - (scene.capsules[3].pos1 + scene.capsules[3].pos2)*0.5, scene.capsules[3]);
    float head = sphereDistance(q - scene.spheres[0].pos, scene.spheres[0]);

    //float dist2 = capsuleDistance(point - (scene.capsules[0].pos1 + scene.capsules[0].pos2)*0.5, scene.capsules[0]);
    //float dist3 = torusDistance(point - scene.toruses[0].pos, scene.toruses[0]);
    
    float dist = opSmoothUnion(arms,body,0.1);
    dist = opSmoothUnion(dist,head,0.03);
    dist = opSmoothUnion(dist,leg1,0.03);
    dist = opSmoothUnion(dist,leg2,0.03);
    //float intensity = 0.5;
    //dist = opDisplace(dist,q,intensity);
    //dist = opTwist(1.,q);
    


    if(dist < minDist.dist){
        minDist.dist = dist;
        minDist.material = scene.spheres[0].material;
    }

    Light light = scene.light;
    float lightDist = sphereDistance(point - scene.light.pos, LIGHT_SPHERE);
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
        }
        if(distToCamera > MAX_MARCHING_DISTANCE){
            isHit = false;
        }
    }
    // render sphere in point light's location
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

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    Scene scene = createScene();

    vec2 uv = (fragCoord - .5*iResolution.xy) / iResolution.y;
    vec3 color = vec3(0.);
  
    // Creating Ray
    vec3 rayOrigin = vec3(0., 0., 1.);
    mat4 view = inverse(iViewMatrix);
    vec3 rayDirection = vec3(uv.x,uv.y, 0.) - rayOrigin;
    rayDirection = normalize(rayDirection);
    rayDirection = mat3(view)*rayDirection;
    rayOrigin = (view*(vec4(rayOrigin,1.))).xyz;


    Ray ray = Ray(rayOrigin, rayDirection);
    
    // Marching Ray
    Hit hit = marchRay(ray, scene);
    
    if (hit.isHit) color = getLight(hit, ray, scene);
    
    // Output to screen
    fragColor = vec4(color,1.0);
}