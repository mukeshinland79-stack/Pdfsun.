import React from "react";
import { NewsletterSubscription } from "./NewsletterSubscription";

export interface NewsletterProps {
  className?: string;
  variant?: "standalone" | "compact";
}

/**
 * PDFSun Newsletter Component
 * Provides high-contrast email subscription with responsive touch targets and instant validation.
 */
export const Newsletter: React.FC<NewsletterProps> = (props) => {
  return <NewsletterSubscription {...props} />;
};

export default Newsletter;
