import type { Metadata } from "next";
import "./globals.css";

// The companion has no request-scoped data and must be emitted for a static host.
export const dynamic = "force-static";

const githubPagesSiteUrl = "https://ding-ding-projects.github.io/minecraft-server-command-center/";
const socialImageUrl = new URL("og.png", githubPagesSiteUrl).toString();

export const metadata: Metadata = {
  metadataBase: new URL(githubPagesSiteUrl),
  title: "Minecraft Server Command Center — Companion Planner",
  description:
    "A local browser companion for drafting guided Paper and Spigot configuration plans before desktop-app handoff.",
  robots: { index: false, follow: false },
  openGraph: {
    url: githubPagesSiteUrl,
    title: "Minecraft Server Command Center",
    description: "Plan a safer Paper or Spigot server. Configure locally. Launch in the desktop app.",
    type: "website",
    images: [
      {
        url: socialImageUrl,
        width: 1200,
        height: 630,
        alt: "Minecraft Server Command Center planner cards on a dark material surface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Minecraft Server Command Center",
    description: "Plan a safer Paper or Spigot server. Configure locally. Launch in the desktop app.",
    images: [socialImageUrl],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
