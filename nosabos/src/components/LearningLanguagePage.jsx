import { useLocation } from "react-router-dom";
import { LEARNING_PAGE_CSS, renderLearningPage } from "../seo/learningPage.js";

export default function LearningLanguagePage() {
  const { pathname } = useLocation();
  return <><style>{LEARNING_PAGE_CSS}</style><div dangerouslySetInnerHTML={{ __html: renderLearningPage(pathname) }} /></>;
}
