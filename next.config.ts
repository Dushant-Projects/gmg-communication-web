// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   images: {
//     remotePatterns: [
//       { protocol: "https", hostname: "res.cloudinary.com" },
//       { protocol: "https", hostname: "placehold.co" }, // demo placeholders, remove later
//     ],
//   },
//   allowedDevOrigins: ["192.168.0.102"],

// };
// module.exports = {
//   allowedDevOrigins: ['10.11.149.253'],
// }
// export default nextConfig;


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "placehold.co" }, // demo placeholders, remove later
    ],
  },
  // Combine both origins into the correct array inside nextConfig
  allowedDevOrigins: ["192.168.0.102", "10.11.149.253"],
};

export default nextConfig;
