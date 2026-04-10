import { fetchApi } from "./api";

export interface PhoneSetting { number: string; countryCode: string; }
export interface EmailSetting { email: string; condition: string; }
export interface AddressSetting { address: string; isPrimary: boolean; }
export interface SocialSetting { platform: string; url: string; }

export interface SystemSettings {
    [key: string]: any;
    SiteTitle?: string;
    SiteDescription?: string;
    SiteLogo?: string;
    TimeZone?: string;

    Phones?: PhoneSetting[];
    Emails?: EmailSetting[];
    Addresses?: AddressSetting[];
    SocialLinks?: SocialSetting[];
}

const COMPLEX_KEYS = ['Phones', 'Emails', 'Addresses', 'SocialLinks'];

export const settingsApi = {
    getSettings: async () => {
        const data = await fetchApi<SystemSettings>('/Setting', {
            method: 'GET'
        });

        // Parse JSON strings for known complex keys
        COMPLEX_KEYS.forEach(key => {
            if (data[key] && typeof data[key] === 'string') {
                try {
                    data[key] = JSON.parse(data[key]);
                } catch {
                    data[key] = [];
                }
            } else if (!data[key] || !Array.isArray(data[key])) {
                data[key] = [];
            }
        });

        return data;
    },

    updateSettings: async (settings: SystemSettings) => {
        // Clone settings and stringify complex keys
        const payload: Record<string, string> = {};

        for (const [key, value] of Object.entries(settings)) {
            if (value === null || value === undefined) {
                payload[key] = "";
                continue;
            }
            if (COMPLEX_KEYS.includes(key)) {
                payload[key] = typeof value === 'string' ? value : JSON.stringify(value);
            } else {
                payload[key] = String(value);
            }
        }

        return fetchApi<any>('/Setting', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }
};

