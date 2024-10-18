#ifndef SCENE_H
#define SCENE_H

#include "Core.frag"

#define NSPHERES 8
#define NLIGHTS 3

struct Scene{
    Sphere[NSPHERES] spheres;
    PointLight[NLIGHTS] lights;
};

Scene createScene(){
    const Material defaultMaterial = Material(
        vec3(0.), // albedo
        0., // specular power
        0., // specular intensity
        false // is lit
    );

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
    
    lights[0] = PointLight(
        vec3(-1., 2.15 + sin(iTime) * 2., -8.5), // position
        vec3(1., 1., 0.), // color
        150. // intensity
    );

    lights[1] = PointLight(
        vec3(0., 2.15 + sin(iTime) * 2., -8.5), // position
        vec3(1.), // color
        150. // intensity
    );

    
    lights[2] = PointLight(
        vec3(1., 2.15 + sin(iTime) * 2., -8.5), // position
        vec3(0., 1., 1.), // color
        150. // intensity
    );

    
    Scene scene = Scene(spheres, lights);
    return scene;
}

#endif