#ifndef SCENE_H
#define SCENE_H

#include "Core.frag"

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
        vec3(0. + cos(iTime)*2., 0.5, -5. + sin(iTime)*2.), // position
        vec3(1.), // color
        15. // intensity
    );
     
    
    Scene scene = Scene(spheres, light);
    return scene;
}

#endif