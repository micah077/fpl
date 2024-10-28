"use client";
import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const Header = ({
  managerData,
  leagueId,
}: {
  managerData: FPLManager | null;
  leagueId: string;
}) => {
  const router = useRouter();

  const menuboxRef = useRef<HTMLUListElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouchX, setLastTouchX] = useState(0);

  // Sort leagues by number of players
  const sortedLeagues =
    managerData?.leagues?.classic
      .filter((league) => league.rank_count < 20)
      .sort((a, b) => b.rank_count - a.rank_count) || [];

  const handleClick = (leagueId: number, managerId: string) => {
    router.push(`/${managerId}/${leagueId}`);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLUListElement>) => {
    if (isDragging && menuboxRef.current) {
      menuboxRef.current.scrollLeft -= e.movementX;
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLUListElement>) => {
    setIsDragging(true);
    setLastTouchX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLUListElement>) => {
    if (isDragging && menuboxRef.current) {
      const touchX = e.touches[0].clientX;
      menuboxRef.current.scrollLeft -= touchX - lastTouchX;
      setLastTouchX(touchX);
    }
  };

  return (
    <div
  className="relative h-[300px]"
  style={{
    background: `radial-gradient(circle, rgba(0, 30, 9, 0.8) 10%, rgba(0, 0, 0, 0.8) 100%)`,
  }}
    >
      <Image
        src="/stadium.png"
        alt="Stadium background image" // Provide a meaningful description
        fill // Use fill instead of layout="fill"
        priority // Add this prop for LCP optimization
        style={{ objectFit: 'cover', objectPosition: 'center', zIndex: -1 }} // Ensure the image is behind other content
      />


      {/* Logo start */}
      <div className="pt-4 px-4 md:px-8">
      <Link href="/" passHref>
          <img
            src="/header-logo-compressed.png"
            alt="FPL League Insights Logo"
            className="h-12 cursor-pointer"
          />
        </Link>
      </div>
      {/* Logo end */}

      {/* Navigation section start */}

      <div className="max-w-full mt-5 pl-4 md:pl-8 py-3 overflow-x-hidden">
        <ul
          className="flex items-center gap-4 overflow-x-hidden"
          ref={menuboxRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setIsDragging(false)}
        >
          {sortedLeagues.map((league) => (
            <li
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer ${
                league.id.toString() === leagueId
                  ? "bg-primary-gradient text-black"
                  : "bg-secondary-green text-white"
              }`}
              key={league.id}
              onClick={() =>
                handleClick(league.id, managerData?.id.toString() || "")
              }
            >
              {league.name}
            </li>
          ))}
          
        </ul>
      </div>
      {/* Navigation section end */}
    </div>
  );
};

export default Header;
