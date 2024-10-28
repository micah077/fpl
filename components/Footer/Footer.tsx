"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "/public/footer-logo.png"; // Replace with actual logo path
import XIcon from '@mui/icons-material/X';
import { Mail } from "@mui/icons-material";

const Footer = () => {
  return (
    <div className="w-full static h-auto bg-[#32003C] bg-no-repeat bg-right flex flex-col md:flex-row justify-between items-center p-6 space-y-6 md:space-y-0">
      {/* Left Side - Logo */}
      <div className="flex flex-col items-center md:items-start">
        <Image src={logo} alt="Footer-logo" width={250} height={100} style={{ width: "auto", height: "auto" }} />
        <span className="text-gray-100 text-center md:text-left mt-4 text-sm">
          All data and images are taken from https://fantasy.premierleague.com/
        </span>
      </div>

      {/* Right Side - Text and Links */}
      <div className="flex flex-col items-center md:items-end">
        <p className="text-gray-100 text-center md:text-right mb-2 text-sm">
          If you have any ideas about what you would like to see for your leagues, please reach out:
        </p>

        <div className="flex items-center justify-center md:justify-end space-x-4">
          {/* Email Link */}
          <Link href="mailto:contact@fplinsights.com" className="flex items-center text-blue-500 hover:underline">
            <Mail className="text-white text-2xl hover:text-blue-500" />
            <span className="ml-2 text-sm text-white">contact@fplinsights.com</span>
          </Link>

          {/* X Icon with Link */}
          <Link href="https://x.com/fplinsight21274" target="_blank" rel="noopener noreferrer" className="text-white">
            <XIcon className="text-white text-2xl hover:text-blue-500" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Footer;
