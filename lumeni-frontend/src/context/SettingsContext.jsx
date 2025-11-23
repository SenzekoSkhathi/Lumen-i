import React, { createContext, useState, useContext, useEffect } from "react";

// 1. Create the Context
const SettingsContext = createContext();

// Helper function to get initial state from localStorage
const getInitialState = (key, defaultValue) => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

// 2. Create the Provider Component
export const SettingsProvider = ({ children }) => {
  // --- Existing States ---
  const [autoplay, setAutoplay] = useState(() =>
    getInitialState("settings_autoplay", true)
  );
  
  const [language, setLanguage] = useState(() =>
    getInitialState("settings_language", "en-US")
  );

  const [notificationSettings, setNotificationSettings] = useState(() =>
    getInitialState("settings_notifications", {
      newVideo: true,
      newPlaylist: true,
    })
  );

  const [emailSettings, setEmailSettings] = useState(() =>
    getInitialState("settings_emails", {
      weeklyProgress: true,
      passwordChange: true,
      billing: true,
    })
  );

  const [downloadSettings, setDownloadSettings] = useState(() =>
    getInitialState("settings_downloads", {
      autoDelete: false,
      autoDownloadNext: false,
      downloadOnWifiOnly: true,
      downloadQuality: "720p",
    })
  );

  // --- 1. ADD NEW STATE FOR PRIVACY PREFERENCES ---
  const [privacySettings, setPrivacySettings] = useState(() =>
    getInitialState("settings_privacy", {
      allowTutorView: true,
      showProfilePicture: true,
      hideWatchHistory: false,
    })
  );


  // --- Effects to save settings to localStorage ---
  useEffect(() => {
    try {
      window.localStorage.setItem("settings_autoplay", JSON.stringify(autoplay));
    } catch (error) {
      console.warn("Error saving autoplay setting to localStorage:", error);
    }
  }, [autoplay]);

  useEffect(() => {
    try {
      window.localStorage.setItem("settings_language", JSON.stringify(language));
    } catch (error) {
      console.warn("Error saving language setting to localStorage:", error);
    }
  }, [language]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "settings_notifications",
        JSON.stringify(notificationSettings)
      );
    } catch (error) {
      console.warn("Error saving notification settings to localStorage:", error);
    }
  }, [notificationSettings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "settings_emails",
        JSON.stringify(emailSettings)
      );
    } catch (error) {
      console.warn("Error saving email settings to localStorage:", error);
    }
  }, [emailSettings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "settings_downloads",
        JSON.stringify(downloadSettings)
      );
    } catch (error) {
      console.warn("Error saving download settings to localStorage:", error);
    }
  }, [downloadSettings]);

  // --- 2. ADD EFFECT FOR NEW PRIVACY SETTINGS ---
  useEffect(() => {
    try {
      window.localStorage.setItem(
        "settings_privacy",
        JSON.stringify(privacySettings)
      );
    } catch (error) {
      console.warn("Error saving privacy settings to localStorage:", error);
    }
  }, [privacySettings]);


  // --- 3. PASS ALL VALUES TO PROVIDER ---
  const value = {
    autoplay,
    setAutoplay,
    language,
    setLanguage,
    notificationSettings,
    setNotificationSettings,
    emailSettings,
    setEmailSettings,
    downloadSettings,
    setDownloadSettings,
    privacySettings,
    setPrivacySettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// 4. Custom hook for easy access
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};