"use client";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

const Advertise = () => {
  const adRef = useRef<HTMLDivElement | null>(null);
  const [isAtTop, setIsAtTop] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (adRef.current) {
        const rect = adRef.current.getBoundingClientRect();

        // Check if the top of the element is at or above the top of the viewport
        if (rect.top <= 0) {
          setIsAtTop(true);
        } else {
          setIsAtTop(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Initial check if the element is already at the top on page load
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    // <div className="mt-5 overflow-hidden border border-red-500">
    <div
      ref={adRef}
      className={`overflow-hidden ${isAtTop ? "sticky top-0" : ""}`}
    >
      <h2 className={`${isAtTop ? "" : "text-[#fff]"} font-bold mb-2`}>Ad</h2>
      {/* <div
        className="w-full relative aspect-square mb-2"
      >
        
      </div> */}
      <div className="w-full relative aspect-[9/16] mb-2">
        <Image src="/ad2.png" alt="Advertise" fill quality={100} sizes="calc(100vw - 32px)" />
      </div>
      <div className="w-full relative aspect-[9/16] mb-2">
        <Image src="/ad3.png" alt="Advertise" fill quality={100} sizes="calc(100vw - 32px)"/>
      </div>
    </div>
  );
};

export default Advertise;
