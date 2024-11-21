"use client";
import React from "react";
import Image from "next/image";
import landingImage from "/public/print-screen-frontpage.png"; // Replace with your screenshot image path

const Welcome = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:h-screen">
      {/* Left Side - Screenshot */}
      <div className="relative w-full sm:w-2/3 h-[300px] sm:h-full">
        {/* Image */}
        <Image
          src={landingImage}
          alt="FPL League Insights Screenshot"
          fill
          className="object-cover object-left"
        />
        {/* Fade transition */}
        <div className="absolute right-0 top-0 w-full md:w-2/3 h-full sm:inset-y-0 sm:right-0 sm:w-full sm:h-full bg-gradient-to-b sm:bg-gradient-to-r from-transparent to-[#32003C]" />
      </div>

      {/* Right Side - Background and Text */}
      <div className="w-full sm:w-1/3 h-1/2 sm:h-full bg-[#32003C] flex flex-col justify-center p-8 text-white">
        <h2 className="text-2xl sm:text-3xl mr-5 mb-4">Introducing FPL League Insights</h2>
        <p className="mb-6 sm:mb-10">
        Discover everything happening in your FPL league: from gameweek results and transfers to the smartest 
        captain picks and surprise differentials. Stay ahead of your rivals with Fantasy Premier League - League Insights.
        </p>
        <p className="mb-6 sm:mb-10">
        Do you want to know who&#39;s making bold moves or sticking to the FPL template teams?  
        FPL League Insights gives you a detailed look at what each league member is doing, 
        helping you make informed decisions and secure the bragging rights.
        </p>
        <p className="mb-4 sm:mb-2">
          Explore your league like never before and fuel the rivalry. Are you ready to gain the upper hand?
        </p>
      </div>
    </div>
  );
};

export default Welcome;
