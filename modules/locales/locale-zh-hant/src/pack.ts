import { defineI18nLanguagePack } from "@echoo/module-root.i18n/shared";
import { messages, sources } from "./messages.js";

/** 语言包 Module 自身的 ID，与 echoo.module.json 的 id、package.json 的 name 一致；发布前改为所属模块池的发布方前缀。 */
export const PACK_MODULE_ID = "example.locale-zh-hant";

export const languagePack = defineI18nLanguagePack({
  moduleId: PACK_MODULE_ID,
  locale: "zh-Hant",
  nativeName: "繁體中文",
  // 缺少繁体译文时直接回退到源语言简体中文：zh-Hant → zh-CN。
  fallback: [],
  messages,
  // 每条译文翻译时依据的 zh-CN 原文；原文之后被修改时，该译文计入过期数并按回退链显示。
  sources,
});
