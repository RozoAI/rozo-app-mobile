import type TranslateOptions from "i18next";
import i18n from "i18next";
import memoize from "lodash.memoize";
import { NativeModules, Platform } from "react-native";
import RNRestart from "react-native-restart";

import { storage } from "@/libs/storage";

import type { Language, resources } from "./resources";
import type { RecursiveKeyOf } from "./types";

type DefaultLocale = typeof resources.en.translation;
export type TxKeyPath = RecursiveKeyOf<DefaultLocale>;

export const LOCAL = "_locale";

export const getLanguage = () => storage.getString(LOCAL); // 'Marc' getItem<Language | undefined>(LOCAL);

export const translate = memoize(
  (key: TxKeyPath, options = undefined) =>
    // eslint-disable-next-line import/no-named-as-default-member
    i18n.t(key, options) as unknown as string,
  (key: TxKeyPath, options: typeof TranslateOptions) =>
    options ? key + JSON.stringify(options) : key
);

export const changeLanguage = (lang: Language) => {
  // eslint-disable-next-line import/no-named-as-default-member
  i18n.changeLanguage(lang);
  if (Platform.OS === "ios" || Platform.OS === "android") {
    if (__DEV__) NativeModules.DevSettings.reload();
    else RNRestart.restart();
  } else if (Platform.OS === "web") {
    window.location.reload();
  }
};
