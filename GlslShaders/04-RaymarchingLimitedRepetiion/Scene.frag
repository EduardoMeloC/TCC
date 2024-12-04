#ifndef SCENE_H
#define SCENE_H

#include "Core.frag"

#define NSPHERES 2
#define NCAPSULES 4
#define NTORUSES 0
#define NBOXES 0

struct Scene{
    Sphere[NSPHERES+1] spheres;
    Capsule[NCAPSULES+1] capsules;
    Torus[NTORUSES+1] toruses;
    Box[NBOXES+1] boxes;
    Light light;
};

Scene createScene(){
    #include "DefaultShapes.frag"

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

    const Material defaultMaterial = Material(
        vec3(0.), // albedo
        0., // specular power
        0., // specular intensity
        false // is lit
    );

    const Sphere defaultSphere = Sphere(
        vec3(0.),
        0.,
        defaultMaterial
    );

    const Capsule defaultCapsule = Capsule(
        vec3(0.),
        vec3(0.),
        0.,
        defaultMaterial
    );

    const Torus defaultTorus = Torus(
        vec3(0.),
        0.,
        0.,
        defaultMaterial
    );

    const Box defaultBox = Box(
        vec3(0.),
        vec3(0.),
        defaultMaterial
    );

    Sphere head = Sphere(
        vec3(0., 0.85, -5.),
        0.3,
        sphereMaterial
    );
    
    Sphere ground = Sphere(
        vec3(2., -1001., -5.),
        1000.,
        groundMaterial
    );
    
    Capsule arms = Capsule(
        vec3(-0.5,0.5,-5.),
        vec3(0.5,0.5,-5.),
        0.1,
        sphereMaterial
    );
    
    Capsule body = Capsule(
        vec3(0.,0.5,-5.),
        vec3(0.,0.0,-5.),
        0.1,
        sphereMaterial
    );

    Capsule leg1 = Capsule(
        vec3(0.,0.,-5.),
        vec3(0.3,-0.6,-5.),
        0.1,
        sphereMaterial
    );

    Capsule leg2 = Capsule(
        vec3(0.,0.,-5.),
        vec3(-0.3,-0.6,-5.),
        0.1,
        sphereMaterial
    );

    Torus t1 = Torus(
        vec3(0., 2., -5),
        2.,
        0.5,
        sphereMaterial
    );

    Box b1 = Box(
        vec3(0., 0., -5.),
        vec3(1., 1., 1.),
        sphereMaterial
    );

    Sphere[NSPHERES+1] spheres = Sphere[](head, ground, defaultSphere);
    Capsule[NCAPSULES+1] capsules = Capsule[](arms, leg1, leg2, body, defaultCapsule);
    Torus[NTORUSES+1] toruses = Torus[](defaultTorus);
    Box[NBOXES+1] boxes = Box[](defaultBox);

    Light light = Light(
        vec3(1.,0.,0.), // position
        vec3(1.), // color
        70. // intensity
    );
    
    Scene scene = Scene(spheres, capsules, toruses, boxes, light);
    return scene;
}

#endif