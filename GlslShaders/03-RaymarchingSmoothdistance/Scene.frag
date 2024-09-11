#ifndef SCENE_H
#define SCENE_H

#include "Core.frag"

#define NSPHERES 2
#define NCAPSULES 1
#define NTORUSES 1
#define NBOXES 1

struct Scene{
    Sphere[NSPHERES] spheres;
    Capsule[NCAPSULES] capsules;
    Torus[NTORUSES] toruses;
    Box[NBOXES] boxes;
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
        vec3(-3., 0., -5.),
        1.,
        sphereMaterial
    );
    
    Sphere ground = Sphere(
        vec3(2., -1001., -5.),
        1000.,
        groundMaterial
    );
    
    Sphere[2] spheres = Sphere[](s1, ground);
    
    Capsule c1 = Capsule(
        vec3(0. + cos(iTime)*1.5, 0.5, -5.+sin(iTime)*-1.5),
        vec3(2., 1., -5.),
        0.5,
        sphereMaterial
    );

    Capsule[1] capsules = Capsule[](c1);

    Torus t1 = Torus(
        vec3(0., 2., -5),
        2.,
        0.5,
        sphereMaterial
    );

    Torus[1] toruses = Torus[](t1);

    Box b1 = Box(
        vec3(0., 0., -5.),
        vec3(1., 1., 1.),
        sphereMaterial
    );

    Box[1] boxes = Box[](b1);

    Light light = Light(
        vec3(1. /*+ cos(iTime)*4.*/, 1., -5. + /*sin(iTime)**/4.), // position
        vec3(1.), // color
        70. // intensity
    );
    
    Scene scene = Scene(spheres, capsules, toruses, boxes, light);
    return scene;
}

#endif