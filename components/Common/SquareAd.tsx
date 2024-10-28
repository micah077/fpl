"use client";
import Image from "next/image";
import React, { FC, useEffect } from "react";

// AOS animation
import AOS from "aos";
import "aos/dist/aos.css";

type SquareAdProps = {
  imgUrl: string;
};

const SquareAd: FC<SquareAdProps> = ({ imgUrl }) => {
  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <div
      className="block md:hidden w-full relative aspect-square mb-2"
      // data-aos="fade-up"
      // data-aos-duration="2000"
    >
      <Image src={imgUrl} alt="Advertise" fill quality={100} />
    </div>
  );
};

export default SquareAd;
