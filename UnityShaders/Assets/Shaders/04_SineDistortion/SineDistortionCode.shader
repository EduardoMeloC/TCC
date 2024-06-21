Shader "Water/04_SineDistortion"
{
    Properties
    {
        _Color("Color", Color) = (1, 1, 1, 1)
        
    	_Amplitude("Amplitude", Float) = 1
    	_Wavelength("Wavelength", Float) = 10
    	_Speed("Speed", Float) = 1
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 100

        Pass
        {
            CGPROGRAM
            #pragma vertex vertexShader
            #pragma fragment fragmentShader
            // make fog work
            #pragma multi_compile_fog

            #include "UnityCG.cginc"

            struct VertexInput
            {
                float4 worldPosition : POSITION;
            };

            struct v2f
            {
                UNITY_FOG_COORDS(1)
                float4 vertex : SV_POSITION;
            };

            float _Amplitude, _Wavelength, _Speed;
            half4 _Color;

            v2f vertexShader (VertexInput input)
            {
                v2f output;

                float3 p = input.worldPosition;
                float k = 2 * UNITY_PI / _Wavelength;
                float f = k * (p.x - _Speed * _Time.y);
                p.y = _Amplitude * sin(f);

                float3 tangent = normalize(float3(1, k * _Amplitude * cos(f), 0));
                float3 normal = float3(-tangent.y, tangent.x, 0.0);
                
                UNITY_TRANSFER_FOG(output,output.vertex);
                output.vertex = UnityObjectToClipPos(p);
                return output;
            }

            fixed4 fragmentShader (v2f i) : SV_Target
            {
                UNITY_APPLY_FOG(i.fogCoord, i.color);
                return _Color; 
            }
            ENDCG
        }
    }
}
