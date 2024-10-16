#ifndef SHAPES_H
#define SHAPES_H

#include "Core.frag"

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

#endif