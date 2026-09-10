"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { useApp } from "../context/AppContext";

export const BackToTopButton: React.FC = () => {
  const { settings } = useApp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button once scrolled down more than 350px
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Check initial scroll
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Respect user setting (enabled by default)
  const isEnabled = settings.enableBackToTop ?? true;
  if (!isEnabled) return null;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={`fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-40 transition-all duration-300 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        title="Back to top"
        className="group p-3 sm:p-3.5 rounded-2xl bg-surface-card/90 hover:bg-brand-primary text-content-secondary hover:text-white border border-surface-border hover:border-brand-primary shadow-xl hover:shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        <ArrowUp className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5 stroke-[2.5]" />
      </button>
    </div>
  );
};

