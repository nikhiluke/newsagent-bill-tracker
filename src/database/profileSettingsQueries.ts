import { getDB } from './db';
import { DistributorProfile, AppSettings } from '../types';
import { NEWSPAPERS } from '../data';

const defaultProfile: DistributorProfile = {
  businessName: null,
  ownerName: null,
  phone: null,
  address: null,
  passPin: null,
};

export const getProfile = async (): Promise<DistributorProfile> => {
  try {
    const db = getDB();
    const profile = await db.getFirstAsync<DistributorProfile>('SELECT * FROM profile WHERE id = 1;');
    if (!profile) {
      await saveProfile(defaultProfile);
      return defaultProfile;
    }
    return profile;
  } catch (error) {
    console.error('[profileSettingsQueries] getProfile failed:', error);
    throw error;
  }
};

export const saveProfile = async (profile: DistributorProfile): Promise<void> => {
  try {
    const db = getDB();
    await db.runAsync(
      `INSERT INTO profile (id, businessName, ownerName, phone, address, passPin) 
       VALUES (1, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET 
       businessName=excluded.businessName, 
       ownerName=excluded.ownerName, 
       phone=excluded.phone, 
       address=excluded.address,
       passPin=excluded.passPin;`,
      [
        profile.businessName,
        profile.ownerName,
        profile.phone,
        profile.address,
        profile.passPin,
      ]
    );
  } catch (error) {
    console.error('[profileSettingsQueries] saveProfile failed:', error);
    throw error;
  }
};

// Use default settings if none exists
const defaultSettings: AppSettings = {
  darkMode: false,
  notificationsEnabled: true,
  appVersion: '1.2.0',
  supportedNewspapers: NEWSPAPERS,
  allNewspapers: NEWSPAPERS
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const db = getDB();
    const row = await db.getFirstAsync<any>('SELECT * FROM settings WHERE id = 1;');
    if (!row) {
      await saveSettings(defaultSettings);
      return defaultSettings;
    }
    return {
      darkMode: !!row.darkMode,
      notificationsEnabled: !!row.notificationsEnabled,
      appVersion: row.appVersion,
      supportedNewspapers: row?.supportedNewspapers?.split(',') || NEWSPAPERS,
      allNewspapers: row?.allNewspapers?.split(',') || NEWSPAPERS
    };
  } catch (error) {
    console.error('[profileSettingsQueries] getSettings failed:', error);
    throw error;
  }
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    const db = getDB();
    await db.runAsync(
      `INSERT INTO settings (id, darkMode, notificationsEnabled, appVersion, supportedNewspapers, allNewspapers) 
       VALUES (1, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET 
       darkMode=excluded.darkMode, 
       notificationsEnabled=excluded.notificationsEnabled, 
       appVersion=excluded.appVersion, 
       supportedNewspapers=excluded.supportedNewspapers,
       allNewspapers=excluded.allNewspapers;`,
      [
        settings.darkMode ? 1 : 0,
        settings.notificationsEnabled ? 1 : 0,
        settings.appVersion,
        settings.supportedNewspapers.join(','),
        settings.allNewspapers.join(',')
      ]
    );
  } catch (error) {
    console.error('[profileSettingsQueries] saveSettings failed:', error);
    throw error;
  }
};
