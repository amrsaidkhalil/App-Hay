import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import localFont from "next/font/local";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

// Poetsen One — Bilaal TV's brand display font, self-hosted so org-branded
// card pages render it without a CDN dependency. Other orgs default to
// Poppins for headings unless their branding settings say otherwise.
const poetsenOne = localFont({
  src: "../../public/fonts/poetsen-one.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-poetsen",
});

export const metadata: Metadata = {
  title: "Digital Cards",
  description: "Digital business cards, lead capture, and CRM sync.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

// Tints the iOS status bar / Android chrome to match the app shell.
export const viewport: Viewport = {
  themeColor: "#0b1120",
  // Let the shell paint into the notch/home-indicator area; fixed bars inside
  // handle their own safe-area padding.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${poetsenOne.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[var(--app-bg)] text-[var(--app-fg)]">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
