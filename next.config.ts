import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://192.168.56.1:3000",
    "http://berberlink.com",
    "http://192.168.1.253:3000" // ekledik
  ],
};

export default nextConfig;
