export type WeatherKind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm';

export interface WeatherDescription
{
    kind: WeatherKind;
    label: string;
}

// WMO weather interpretation codes, as returned by Open-Meteo
// https://open-meteo.com/en/docs#weathervariables
export function describeWeatherCode(code: number): WeatherDescription
{
    if (code === 0) return { kind: 'clear', label: 'Despejado' };
    if (code === 1) return { kind: 'partly', label: 'Mayormente despejado' };
    if (code === 2) return { kind: 'partly', label: 'Parcialmente nublado' };
    if (code === 3) return { kind: 'cloudy', label: 'Nublado' };
    if (code === 45 || code === 48) return { kind: 'fog', label: 'Niebla' };
    if (code >= 51 && code <= 57) return { kind: 'rain', label: 'Llovizna' };
    if (code >= 61 && code <= 67) return { kind: 'rain', label: 'Lluvia' };
    if (code >= 71 && code <= 77) return { kind: 'snow', label: 'Nieve' };
    if (code >= 80 && code <= 82) return { kind: 'rain', label: 'Chubascos' };
    if (code === 85 || code === 86) return { kind: 'snow', label: 'Chubascos de nieve' };
    if (code >= 95) return { kind: 'storm', label: 'Tormenta' };
    return { kind: 'cloudy', label: 'Desconocido' };
}
