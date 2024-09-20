#iKeyboard
#iFirstPersonControls
/*
WASD move
R|F up | down
Q|E roll
up|down pitch
left|right yaw
*/


#define SHADOW_BIAS 1.e-4
#define MAX_MARCHING_STEPS 50
#define MAX_MARCHING_DISTANCE 1000.

#define SURFACE_DISTANCE .001

#define INF 3.402823466e+38
#define PI  3.1415926535898

#define NULL_MATERIAL Material(vec3(0.),0.,0.,false)
#define NULL_CANDIDATE HitCandidate(INF,NULL_MATERIAL);
#define RAYHIT_INFINITY Hit(vec3(INF),vec3(0.),INF,NULL_MATERIAL,false)
#define LIGHT_SPHERE Sphere(light.pos,0.1,Material(light.color,0.,0.,false))

#define NSPHERES 5
#define NCAPSULES 0
#define NTORUSES 0
#define NBOXES 0

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


struct Sphere{
    vec3 pos;
    float radius;
    Material material;
};

struct Capsule{
    vec3 point1;
    vec3 point2;
    float radius;
    Material material;
};

struct Torus{
    vec3 point;
    float radius1;
    float radius2;
    Material material;
};

struct Box{
    vec3 point;
    vec3 size;
    Material material;
};

struct Light{
    vec3 pos;
    vec3 color;
    float intensity;
};

struct Scene{
    Sphere[NSPHERES+1] spheres;
    Capsule[NCAPSULES+1] capsules;
    Torus[NTORUSES+1] toruses;
    Box[NBOXES+1] boxes;
    Light light;
};

struct HitCandidate{
    float dist;
    Material material;
};

Scene createScene(){
    
    Material groundMaterial = Material(
        vec3(1.), // albedo
        150., // specular power
        0., // specular intensity
        true // is lit
    );


    Material sphereMaterial = Material(
        vec3(1.0, 0.0, 0.0), // albedo
        150., // specular power
        0.5, // specular intensity
        true // is lit
    );

     Sphere defaultSphere = Sphere(
        vec3(0., 0., -5. -1.),
        1.,
        sphereMaterial
    );

    Capsule defaultCapsule = Capsule(
        vec3(0. + cos(iTime)*1.5, 0.5, -5.+sin(iTime)*-1.5),
        vec3(2., 1., -5.),
        0.5,
        sphereMaterial
    );

    Torus defaultorus = Torus(
        vec3(0., 2., -5),
        2.,
        0.5,
        sphereMaterial
    );

    Box defaultBox = Box(
        vec3(0., 0., -5.),
        vec3(1., 1., 1.),
        sphereMaterial
    );

    Sphere s1 = Sphere(
        vec3(0., 0., -5. -1.),
        1.,
        sphereMaterial
    );
    
    Sphere s2 = Sphere(
        vec3(2. + sin(iTime)*1., 0., -5. -1.),
        1.,
        sphereMaterial
    );

    Sphere s3 = Sphere(
        vec3(-2. + sin(iTime)*1.5, 0., -4.5 -1.),
        0.5,
        sphereMaterial
    );

    Sphere s4 = Sphere(
        vec3(0., 2., -5. -1.),
        1.,
        sphereMaterial
    );

    Sphere ground = Sphere(
        vec3(2., -1001., -5. -1.),
        1000.,
        groundMaterial
    );
    
    Sphere[NSPHERES+1] spheres = Sphere[](s1,s2,s3,s4, ground, defaultSphere);
    
    Capsule[NCAPSULES+1] capsules = Capsule[](defaultCapsule);

    Torus[NTORUSES+1] toruses = Torus[](defaultorus);

    Box[NBOXES+1] boxes = Box[](defaultBox);

    Light light = Light(
        (inverse(iViewMatrix)*vec4(0., 0., 1., 1.)).xyz, // position
        vec3(1.), // color
        100. // intensity
    );
    
    Scene scene = Scene(spheres, capsules, toruses, boxes, light);
    return scene;
}

float sphereDistance(vec3 point, Sphere sphere){
    return length(point) - sphere.radius;
}

float capsuleDistance(vec3 point, Capsule capsule){
    vec3 p1ToP2 = capsule.point2 - capsule.point1;
    vec3 p1ToP = point - capsule.point1;

    float closestDist = dot(p1ToP2,p1ToP) / dot(p1ToP2,p1ToP2);
    closestDist = clamp(closestDist, 0., 1.);

    vec3 closest = capsule.point1 + p1ToP2 * closestDist;

    return length(point - closest) - capsule.radius;
}

float torusDistance(vec3 point, Torus torus){
    vec3 p = point;
    vec2 distToInnerCircle = vec2(length(p.xz)-torus.radius1, p.y);
    return length(distToInnerCircle) - torus.radius2;
}

float boxDistance(vec3 point, Box box){
    vec3 p = point - box.point;
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

HitCandidate getDist(vec3 point, Scene scene){
    HitCandidate minDist = NULL_CANDIDATE;

    for(int i = 4; i < NSPHERES; i++){
        float dist = sphereDistance(point-scene.spheres[i].pos, scene.spheres[i]);
        
        if(dist < minDist.dist){
            minDist.dist = dist;
            minDist.material = scene.spheres[i].material;
        }
    }

    for(int i = 0; i < NCAPSULES; i++){
        float dist = capsuleDistance(point, scene.capsules[i]);
        
        if(dist < minDist.dist){
            minDist.dist = dist;
            minDist.material = scene.capsules[i].material;
        }
    }

    for(int i = 0; i < NTORUSES; i++){
        float dist = torusDistance(point, scene.toruses[i]);
        
        if(dist < minDist.dist){
            minDist.dist = dist;
            minDist.material = scene.toruses[i].material;
        }
    }

    for(int i = 0; i < NBOXES; i++){
        float dist = boxDistance(point, scene.boxes[i]);
        
        if(dist < minDist.dist){
            minDist.dist = dist;
            minDist.material = scene.boxes[i].material;
        }
    }

    // float dist0 = sphereDistance(point, scene.spheres[0]);
    // float dist1 = sphereDistance(point, scene.spheres[1]);
    // float dist2 = sphereDistance(point, scene.spheres[2]);
    // float dist3 = sphereDistance(point, scene.spheres[3]);

    // float dist = opSmoothUnion(dist0,dist1,1.5);
    // dist = opSmoothUnion(dist,dist3,1.+ cos(iTime)*0.5);
    // dist = opSmoothSubtraction(dist2,dist,0.5);

    //if(dist < minDist.dist){
    //    minDist.dist = dist;
    //    minDist.material = scene.spheres[0].material;
    //}

    Material mat = Material(
        vec3(1.0, 0.0, 0.0), // albedo
        150., // specular power
        0.5, // specular intensity
        true // is lit
    );

    vec3 s = vec3(14.,2.,14.);
    vec3 q = point - s*round(point/s);
    float dist = torusDistance(q-vec3(0.,0.,0), Torus(vec3(0.), 7.,1.,mat));

    if(dist < minDist.dist){
       minDist.dist = dist;
       minDist.material = scene.spheres[0].material;
    }

    // Light light = scene.light;
    // float lightDist = sphereDistance(point-LIGHT_SPHERE.pos, LIGHT_SPHERE);
    // if(lightDist < minDist.dist){
    //     minDist.dist = lightDist;
    //     minDist.material = LIGHT_SPHERE.material;
    // }
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
    //vec3 eye = 10.0*normalize(vec3(0.5-iMouse.xy/iResolution.xy,0.5)); // Position of the eye
  
    // Creating Ray
    vec3 rayOrigin = vec3(0., 0., 1.);
    mat4 view = inverse(iViewMatrix); //lookAt(eye,rayOrigin,vec3(0.0,1.0,0.0));
    //iViewMatrix = mat4(vec4(1.,0.,0.,0.),vec4(0.,1.,0.,0.),vec4(0.,0.,1.,0.),vec4(0.,0.,0.,1.));
    vec3 rayDirection = vec3(uv.x,uv.y, 0.) - rayOrigin;
    rayDirection = normalize(rayDirection);
    rayDirection = mat3(view)*rayDirection;
    rayOrigin = (view*(vec4(rayOrigin,1.))).xyz;

    //rayOrigin = rayOrigin - vec3(view[0][3],view[1][3],view[2][3]);

    Ray ray = Ray(rayOrigin, rayDirection);
    
    // Marching Ray
    Hit hit = marchRay(ray, scene);
    
    
    if (hit.isHit) color = getLight(hit, ray, scene);
    
    // Output to screen
    fragColor = vec4(color,1.0);
}