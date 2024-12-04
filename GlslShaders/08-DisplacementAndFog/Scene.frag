#ifndef SCENE_H
#define SCENE_H

#include "Core.frag"

#define NSPHERES 8
#define NLIGHTS 3

struct Scene{
    Sphere[NSPHERES] spheres;
    PointLight[NLIGHTS] lights;
    DirectionalLight[1] dirLights;
    vec3 ambientLight;
    Fog fog;
};

Scene createScene(){
    const Material defaultMaterial = Material(
        vec3(0.), // albedo
        0., // specular power
        0., // specular intensity
        false // is lit
    );

    Material groundMaterial = Material(
        vec3(0.4), // albedo
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

    Sphere[NSPHERES] spheres;

    Sphere ground = Sphere(
        vec3(2., -1001., -5.),
        1000.,
        groundMaterial
    );

    spheres[0] = ground;

    for(int it=1; it < NSPHERES; it++){
        float i = float(it);
        float nspheres = float(NSPHERES);
        spheres[it] = Sphere(
            vec3(6.*cos(i*PI/nspheres), .5, -5. -6.*sin(i*PI/nspheres)),
            1.,
            sphereMaterial
        );
    }

    PointLight[NLIGHTS] lights; 
    
    // lights[0] = PointLight(
    //     vec3(-1., 2.15 + sin(iTime) * 2., -8.5), // position
    //     vec3(1., 1., 0.), // color
    //     150. // intensity
    // );

    // lights[1] = PointLight(
    //     vec3(0., 2.15 + sin(iTime) * 2., -8.5), // position
    //     vec3(1.), // color
    //     150. // intensity
    // );

    
    // lights[2] = PointLight(
    //     vec3(1., 2.15 + sin(iTime) * 2., -8.5), // position
    //     vec3(0., 1., 1.), // color
    //     150. // intensity
    // );

    DirectionalLight[1] dirLights;

    dirLights[0] = DirectionalLight(
        normalize(vec3(cos(iTime), -1., -sin(iTime))),
        vec3(0.788235294117647, 0.8862745098039215, 1.0),
        20.
    );

    vec3 ambientLight = dirLights[0].color * 0.15 + groundMaterial.albedo * 0.3;

    Fog fog = Fog(
        16.,
        1.,
        vec3(0.7, 0.9, 1.)
    );
    
    Scene scene = Scene(spheres, lights, dirLights, ambientLight, fog);
    return scene;
}

#endif