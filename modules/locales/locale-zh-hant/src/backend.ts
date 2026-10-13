import { defineModuleApiToken, defineModuleEntry } from "@echoo/core";
import { i18nBackendToken } from "@echoo/module-root.i18n/backend";
import type { LocaleTag } from "@echoo/module-root.i18n/shared";
import { languagePack, PACK_MODULE_ID } from "./pack.js";

export interface LanguagePackApi {
  readonly locale: LocaleTag;
}

export const languagePackToken = defineModuleApiToken<
  typeof PACK_MODULE_ID,
  "backend",
  LanguagePackApi
>({ moduleId: PACK_MODULE_ID, host: "backend" });

export default defineModuleEntry({
  token: languagePackToken,
  dependencies: [i18nBackendToken] as const,
  setup(registrar) {
    registrar.api.require(i18nBackendToken).registerLanguagePack(languagePack);
    registrar.api.publish({ locale: languagePack.locale });
  },
});
