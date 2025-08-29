#include "Core.frag"

#iChannel0 "CameraBuffer.frag"
#iChannel1 "file://noise2.png"

const ivec2 POSITION = ivec2(1, 0);
const ivec2 VMOUSE = ivec2(1, 1);

#define NLIGHTS 1
#define RENDER_LIGHT_SPHERE

#define SPHERE_MATERIAL createSolidMaterial(vec3(1.0, 0.0, 0.0), 130., 0.7)
#define BOX_MATERIAL createSolidMaterial(vec3(1.0, 0.0, 0.0), 10., 0.3)

struct Scene{
    DirectionalLight dirLight;
    PointLight[NLIGHTS] pointLights;
    vec3 ambientLight;
    Fog fog;
};

Scene createScene(){
    DirectionalLight dirLight = DirectionalLight(
        // normalize(vec3(cos(iTime), -1., -sin(iTime))),
        normalize(vec3(-2., -3., -5.)),
        vec3(0.788235294117647, 0.8862745098039215, 1.0),
        20.
    );
    
    PointLight[NLIGHTS] pointLights; 
    pointLights[0] = PointLight(
        vec3(2., 2., 2.),
        vec3(0.988235294117647, 0.9862745098039215, 0.9),
        14.
    );

    vec3 ambientLight = dirLight.color * 0.05;

    Fog fog = Fog(
        10., // dist
        0.02, // intensity
        vec3(0.) // color
    );
    
    Scene scene = Scene(dirLight, pointLights, ambientLight, fog);
    return scene;
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


vec4 getLight(Hit hit, Ray ray, in Scene scene)
{
    if (hit.material.type == M_UNLIT)
        return vec4(hit.material.albedo, hit.material.transparency);
        
    if (hit.material.type == M_CLOUD)
        return vec4(hit.material.albedo, hit.material.transparency);
    
    vec3 outputColor = vec3(0.);
    
    for(int i=0; i < NLIGHTS; i++) {
        PointLight light = scene.pointLights[i];
        vec3 ldir = (light.pos - hit.point);
        float r = length(ldir);
        float r2 = r*r;
        ldir = normalize(ldir);

        // cast hard shadow
        float shadowValue = 1.;

        vec3 li = light.color * (light.intensity / (4. * PI));
        // lambert
        float lv = clamp(dot(ldir, hit.normal), 0., 1.);

        // specular (Phong)
        vec3 R = reflect(ldir, hit.normal);
        vec3 specular = li * pow(max(0.f, dot(R, ray.direction)), hit.material.specularPower);

        vec3 albedo = getAlbedo(hit);
        vec3 diffuse = albedo * li * lv;

        outputColor += (diffuse + specular * hit.material.specularIntensity) * shadowValue;
    }
    
    return vec4(outputColor, hit.material.transparency);
}

float getDist(vec3 point, Scene scene){
    vec3 sphereCenter = vec3(0., 2., -5.);
    float sphereRadius = 2.;
    
    float cloudBoundDist = length(point - sphereCenter) - sphereRadius;
    float noise = fbm(point);
    
    return -cloudBoundDist+noise;
}

vec3 getNormal(vec3 point,float d, Scene scene){
    vec2 e = vec2(.01, 0);
    float n1 = getDist(point - e.xyy, scene);
    float n2 = getDist(point - e.yxy, scene);
    float n3 = getDist(point - e.yyx, scene);
    
    vec3 stretchedNormal = d-vec3(
        n1,
        n2,
        n3
    );
    return normalize(stretchedNormal);
}

Hit fixedStepRaymarch(Ray ray, Scene scene){
    float distToCamera = 0.;
    bool isHit = false;
    vec3 marchPos = ray.origin;
    vec4 res = vec4(0.);

    for(int stp=0; stp<FIXED_MAX_MARCHING_STEPS; stp++){
        marchPos = ray.origin + (distToCamera * ray.direction); 
        float density = getDist(marchPos, scene);
        distToCamera += FIXED_STEP_SIZE;
        
        
        if(density > 0.){
            isHit = true;
            vec4 color = vec4(mix(vec3(1.0), vec3(0.3, 0.55, 0.8), density), density);
            color.rgb *= color.a;
            res += color * (1.0-res.a);
            
            // early exit if opaque
            if(res.a > 1.) break;
        }
    }
    
    Material cloudMaterial = createCloudMaterial();
    cloudMaterial.albedo = res.xyz;
    cloudMaterial.transparency = res.a;
    
    Hit hit = Hit(
        marchPos, 
        vec3(0.), // uncalculated normal
        distToCamera,
        cloudMaterial,
        isHit
     ); 
    return hit;
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
    Hit hit = fixedStepRaymarch(ray, scene);

    // Skybox Color
    vec3 skyBoxColor = mix(vec3(0.4, 0.6, 0.8), vec3(0.7, 0.9, 1.), dot(rayDirection, vec3(0., 1., 0.)));
    float sunDot = dot(scene.dirLight.direction * 1.224744871391589, rayDirection);
    skyBoxColor += skyBoxColor * exp(exp(exp(-sunDot-0.2))) * scene.dirLight.color * 0.0000001;
    //vec3 skyBoxColor = vec3(0.);
    
    
    if (hit.isHit){
        vec4 sceneColor = getLight(hit, ray, scene);
        vec3 sceneRgb = sceneColor.rgb + skyBoxColor * (1.-sceneColor.a); // renders skybox after hitting transparent object
        float dist = length(ray.origin - hit.point);        
        float fogDistance = max(0.0, dist - scene.fog.startDistance);
        float fogAmount = 1.0 - exp(-fogDistance * scene.fog.intensity);
        color += mix(sceneRgb, skyBoxColor, fogAmount);
    }
    else color = skyBoxColor;
    
    
    // Output to screen
    fragColor = vec4(color,1.0);
}