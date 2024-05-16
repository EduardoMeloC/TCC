#define SHADOW_BIAS 1.e-4
#define MAX_MARCHING_STEPS 32
#define MAX_MARCHING_DISTANCE 1000

#define INF 3.402823466e+38
#define PI  3.1415926535898

#define NULL_MATERIAL Material(vec3(0.),0.,0.,false)
#define RAYHIT_INFINITY Hit(vec3(INF),vec3(0.),INF,NULL_MATERIAL,false)
#define LIGHT_SPHERE Sphere(light.pos,0.1,Material(light.color,0.,0.,false))

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

struct Light{
    vec3 pos;
    vec3 color;
    float intensity;
};

struct Scene{
    Sphere[2] spheres;
    Light light;
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

    Sphere s1 = Sphere(
        vec3(0., 0., -5.),
        1.,
        sphereMaterial
    );
    
    Sphere ground = Sphere(
        vec3(2., -1001., -5.),
        1000.,
        groundMaterial
    );
    
    Sphere[2] spheres = Sphere[](s1, ground);
    
    Light light = Light(
        vec3(0. + cos(iTime)*2., 1.5, -4. + sin(iTime)*2.), // position
        vec3(1.), // color
        15. // intensity
    );
     
    
    Scene scene = Scene(spheres, light);
    return scene;
}

float sphereDistance(vec3 point, Sphere sphere){
  return distance(point - sphere.pos) - sphere.radius;
}

Hit marchRay(Ray ray, Scene scene){
    Hit closestHit = RAYHIT_INFINITY;
    
    for(int i = 0; i < 2; i++){
        Hit hit = raySphereIntersection(scene.spheres[i], ray);
        
        if(hit.dist < closestHit.dist) closestHit = hit;
    }
    // render sphere in point light's location
    Light light = scene.light;
    Hit lightHit = raySphereIntersection(LIGHT_SPHERE, ray);
    if(lightHit.dist < closestHit.dist) closestHit = lightHit;
    
    return closestHit;
}

vec3 getLight(Hit hit, Ray ray, Scene scene)
{
    // Unlit material
    if (!hit.material.isLit)
        return hit.material.albedo;
    
    Light light = scene.light;
    vec3 ldir = normalize(light.pos - hit.point);
    float r2 = length(ldir);
    ldir = ldir / r2;
    
    // cast hard shadow
    float shadowValue = 1.;
    vec3 shadowRayOrigin = hit.point + hit.normal * SHADOW_BIAS;
    vec3 shadowRayDirection = ldir;
    Ray shadowRay = Ray(shadowRayOrigin, shadowRayDirection);
    for(int i = 0; i < 2; i++){
        Hit hit = raySphereIntersection(scene.spheres[i], shadowRay);
        if(hit.isHit){
            shadowValue = 0.;
            break;
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