import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { resources } from "./resources";
import { getLanguage } from "./utils";
export * from "./utils";

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources,
  lng: getLanguage() || "en", // TODO: if you are not supporting multiple languages or languages with multiple directions you can set the default value to `en`
  fallbackLng: "en",

  // allows integrating dynamic values into translations.
  interpolation: {
    escapeValue: false, // escape passed in values to avoid XSS injections
  },
});

export default i18n;
