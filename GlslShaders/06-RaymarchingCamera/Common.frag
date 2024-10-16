#ifndef COMMON_H
#define COMMON_H

mat3 CameraRotation( vec2 m )
{
    m.y = -m.y;
    
    vec2 s = sin(m);
    vec2 c = cos(m);
    mat3 rotX = mat3(
        1.0, 0.0, 0.0, 
        0.0, c.y, s.y, 
        0.0, -s.y, c.y
    );
    mat3 rotY = mat3(
        -c.x, 0.0, -s.x, 
        0.0, 1.0, 0.0, 
        s.x, 0.0, -c.x
    );
    
    
    return rotY * rotX;
}

#endif