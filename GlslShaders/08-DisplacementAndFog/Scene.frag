#ifndef SCENE_H
#define SCENE_H

#include "Core.frag"

#define NSPHERES 8
#define NLIGHTS 3

struct Scene{
    Ground ground;
    Sphere[NSPHERES] spheres;
    DirectionalLight dirLight;
    vec3 ambientLight;
    Fog fog;
};

Scene createScene(){
    Material groundMaterial = createCheckerboardMaterial(
        vec3(0.94, 0.91, 0.86) * 0.7, // albedo1
        vec3(0.58, 0.66, 0.57) * 0.7, // albedo2
        1., // specular power
        0. // specular intensity
    );

    Material sphereMaterial = createSolidMaterial(
        vec3(1.0, 0.0, 0.0), // albedo
        150., // specular power
        0.5 // specular intensity
    );

    Sphere[NSPHERES] spheres;

    Ground ground = Ground(
        0.,
        groundMaterial
    );

    for(int it=1; it < NSPHERES; it++){
        float i = float(it);
        float nspheres = float(NSPHERES);
        spheres[it] = Sphere(
            vec3(6.*cos(i*PI/nspheres), 1., -5. -6.*sin(i*PI/nspheres)),
            1.,
            sphereMaterial
        );
    }

    // spheres[0] = Sphere(
    //     vec3(0., 1., 0.),
    //     1.,
    //     sphereMaterial
    // );

    DirectionalLight dirLight = DirectionalLight(
        normalize(vec3(cos(iTime), -1., -sin(iTime))),
        vec3(0.788235294117647, 0.8862745098039215, 1.0),
        20.
    );

    vec3 ambientLight = dirLight.color * 0.15 + groundMaterial.albedo * 0.3;

    Fog fog = Fog(
        16.,
        1.,
        vec3(0.7, 0.9, 1.)
    );
    
    Scene scene = Scene(ground, spheres, dirLight, ambientLight, fog);
    return scene;
}

#endif