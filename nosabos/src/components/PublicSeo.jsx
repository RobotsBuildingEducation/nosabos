import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { applyPublicMetadata } from "../seo/head.js";
import { getPublicMetadata, resolvePublicRoute } from "../seo/publicRoutes.js";
import useLanguage from "../hooks/useLanguage.js";

export default function PublicSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const route = resolvePublicRoute(pathname);
    if (route.localized) useLanguage.getState().setLanguage(route.locale, { navigate: false });
    applyPublicMetadata(getPublicMetadata(pathname, localStorage.getItem("appLanguage")));
  }, [pathname]);
  return null;
}
