// Created by genis sole - 2016
// License Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International.

#include "Common.frag"

#iChannel0 "BufferA.frag"

const float PI = 3.141592;

const ivec2 POSITION = ivec2(1, 0);

const ivec2 VMOUSE = ivec2(1, 1);


#define load(P) texelFetch(iChannel0, ivec2(P), 0)


vec3 Grid(vec3 ro, vec3 rd) {
	float d = -ro.y/rd.y;
    
    if (d <= 0.0) return vec3(0.4);
    
   	vec2 p = (ro.xz + rd.xz*d);
    
    vec2 e = min(vec2(1.0), fwidth(p));
    
    vec2 l = smoothstep(vec2(1.0), 1.0 - e, fract(p)) + smoothstep(vec2(0.0), e, fract(p)) - (1.0 - e);

    return mix(vec3(0.4), vec3(0.8) * (l.x + l.y) * 0.5, exp(-d*0.01));
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
	vec3 ro = vec3(0.0);
    vec3 rd = vec3(0.0);
    
    Camera(fragCoord, ro, rd);
    vec3 color = Grid(ro, rd);
    
    fragColor = vec4(pow(color, vec3(0.4545)), 1.0);
}