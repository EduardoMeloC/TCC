#ifndef CUSTOMLITSINESHADER_HLSL
#define CUSTOMLITSINESHADER_HLSL

#define PI 3.14159265358

float _Wavelength;
float _Amplitude;
float _Speed;

// void CustomLitSineShader_float(float3 Position, out float3 OutPosition, out float3 OutNormal)
// {
//     float3 p = Position;
//     float k = 2 * PI / _Wavelength;
//     float f = k * (p.x - _Speed * Time_Time);
//     p.y = _Amplitude * sin(f);
//
//     float3 tangent = normalize(float3(1, k * _Amplitude * cos(f), 0));
//     float3 normal = float3(-tangent.y, tangent.x, 0.0);
//     
//    OutNormal = normal;
//    OutPosition = p;
// }

float3 _Time;

void CustomLitSineShader_float(float3 Position, out float3 OutPosition, out float3 OutNormal)
{
    OutPosition = Position + sin(_Time.y) * float3(1,1,1);
    OutNormal = Position + sin(_Time.y) * float3(1,1,1);
}

#endif
