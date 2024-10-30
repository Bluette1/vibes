// components/ExternalLink.tsx
import { Link } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { Platform } from "react-native";

export function ExternalLink(props: {
  href: string;
  children: React.ReactNode;
}) {
  const { href, children } = props;

  if (Platform.OS === "web") {
    return (
      <Link
        href={href as any} // temporary type assertion
        target="_blank"
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      onPress={(e) => {
        e.preventDefault();
        WebBrowser.openBrowserAsync(href);
      }}
      href={href as any} // temporary type assertion
    >
      {children}
    </Link>
  );
}
