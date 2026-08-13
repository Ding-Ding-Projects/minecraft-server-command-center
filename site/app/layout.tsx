import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: "Minecraft Server Command Center — Companion Planner",
    description:
      "A local browser companion for drafting guided Paper and Spigot configuration plans before desktop-app handoff.",
    robots: { index: false, follow: false },
    openGraph: {
      title: "Minecraft Server Command Center",
      description: "Plan a safer Paper or Spigot server. Configure locally. Launch in the desktop app.",
      type: "website",
      images: [
        {
          url: "/og.png",
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
      images: ["/og.png"],
    },
  };
}

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
