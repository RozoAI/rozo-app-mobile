import { changeLanguage } from "i18next";
import { useCallback } from "react";
import { useMMKVString } from "react-native-mmkv";

import { storage } from "@/libs/storage";
import { LOCAL } from "@/modules/i18n";
import { type Language } from "@/modules/i18n/resources";

export const useSelectedLanguage = () => {
  const [language, setLang] = useMMKVString(LOCAL, storage);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLang(lang);
      if (lang !== undefined) changeLanguage(lang as Language);
    },
    [setLang]
  );

  return { language: language as Language, setLanguage };
};
