// Author:CMH
// Title:BreathingGlow+noise

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float glow(float d, float str, float thickness){
    return thickness / pow(d, str);
}

vec2 hash2( vec2 x )            //亂數範圍 [-1,1]
{
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
}
float gnoise( in vec2 p )       //亂數範圍 [-1,1]
{
    vec2 i = floor( p );
    vec2 f = fract( p );
    
    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( hash2( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                            dot( hash2( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                         mix( dot( hash2( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                            dot( hash2( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}
#define Use_Perlin
//#define Use_Value
float noise( in vec2 p )        //亂數範圍 [-1,1]
{
#ifdef Use_Perlin    
return gnoise(p);   //gradient noise
#elif defined Use_Value
return vnoise(p);       //value noise
#endif    
return 0.0;
}
float fbm(in vec2 uv)       //亂數範圍 [-1,1]
{
    float f;                                                //fbm - fractal noise (4 octaves)
    mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
    f   = 0.5000*noise( uv ); uv = m*uv;          
    f += 0.2500*noise( uv ); uv = m*uv;
    f += 0.1250*noise( uv ); uv = m*uv;
    f += 0.0625*noise( uv ); uv = m*uv;
    return f;
}


float M_SQRT_2=1.41421356237;
float diamond(vec2 P, float size)
{
   float x = M_SQRT_2/2.0 * (P.x - P.y);
   float y = M_SQRT_2/2.0 * (P.x + P.y);
   return max(abs(x), abs(y)) - size/(2.0*M_SQRT_2);
}

void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    uv.x *= u_resolution.x/u_resolution.y;
    uv= uv*2.0-1.0;
    
    //陰晴圓缺
    float pi=3.14159;
    float theta=1.296*pi*u_time/5.520;
    vec2 point=vec2(sin(theta), cos(theta));
    float dir= dot(point, (uv))+0.958;
    
    //亂數作用雲霧
    float fog= fbm(0.4*uv+vec2(-0.308*u_time, 0.228*u_time))*0.144+0.148;

    //定義圓環
    float dist = length(uv);
    float circle_dist = abs(dist-0.560);                                //光環大小
    
    float result;
    for(int index=0;index<6;++index)
{ 
    //model
    vec2 uv_flip= vec2(uv.x,-uv.y);
    float weight=smoothstep(0.220,0.124,uv.y);
         float freq=9.0+float(index)*-1.464;
    float noise=gnoise(uv_flip*freq)*0.134*weight;
    float diamond=abs(diamond(uv_flip,0.808)+noise);

    
    //動態呼吸
    float breathing=sin(2.0*u_time/5.0*pi)*0.5+0.144;                     //option1
    //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;         //option2 錯誤
     //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;                //option2 正確
    float strength =(0.2*breathing+0.332);          //[0.2~0.3]         //光暈強度加上動態時間營造呼吸感
    float thickness=(0.1);          //[0.1~0.2]         //光環厚度 營造呼吸感
    float glow_circle = glow(diamond, strength, thickness);
    result+=glow_circle;
}
    gl_FragColor = vec4((vec3(result)+fog)*dir*vec3(0.910,0.287,0.446)*0.144,1.0);
}
