"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import { getTeamBadge } from "../../lib/utils/FPLFetch";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import GradeOutlinedIcon from "@mui/icons-material/GradeOutlined";

import { MdInfoOutline } from "react-icons/md";

// AOS animation
import AOS from "aos";
import "aos/dist/aos.css";
import { Element } from "@/lib/types/FPLStatic";
import { FPLHistory } from "@/lib/types/FPLPlayerHistory";

interface CaptainPick {
  playerId: number;
  playerName: string;
  timesPicked: number;
  userIds: number[];
  userNames: string[];
  captainPoints: number;
  captainPhoto: string;
  teamCode: number;
  team: number;
  managerLeagueData: FPLResult[];
  playerData: FPLHistory;
  playerElement: Element;

}

interface CaptainCardProps {
  captainPick: CaptainPick;
  infoClick: (id: number, playerData: Element, ownedUsers: FPLResult[], gw: number) => void;
}

const CaptainCard: React.FC<CaptainCardProps> = ({
  captainPick,
  infoClick,
}) => {
  const {
    playerId,
    playerName,
    timesPicked,
    captainPoints,
    captainPhoto,
    teamCode,
    managerLeagueData,
    playerData,
    playerElement
  } = captainPick;
  const teamBadge = getTeamBadge(teamCode);

  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <div
      className="flex-shrink-0 w-48 h-48 p-3 rounded-lg bg-white shadow-md relative"
      // data-aos="fade-left"
      // data-aos-duration="2000"
    >
      <MdInfoOutline
        className="absolute top-3 right-3 z-20 text-xl text-icon-green cursor-pointer"
        onClick={() => infoClick(playerId, playerElement, managerLeagueData, playerData.round)}
      />
      {/* Team Badge */}
      <div className="w-full h-36 flex justify-end absolute top-0 left-0 z-1">
        <div className="w-full h-full relative opacity-20">
          <Image
            src={teamBadge}
            alt={`${playerName} team badge`  || "Team Badge"}
            fill
            sizes="calc(100vw - 32px)"
            style={{
              objectFit: "contain",
            }}
          />
        </div>
      </div>
      {/* Team Badge */}
      {/* Player Image */}
      <div className="w-full h-full flex justify-end relative z-1">
        <div className="w-3/4 z-10 h-full absolute bottom-0">
          <Image
            src={captainPhoto}
            alt={playerName || "Captain Photo"}
            fill
            sizes="calc(100vw - 32px)"
            style={{
              objectFit: "cover",
            }}
          />
        </div>
        <div className="w-full  h-16 absolute bottom-0 bg-gradient-to-t from-white to-transparent"></div>
      </div>
      {/* Player Image */}
      {/* Player Name */}
      <div className="absolute top-2 left-3">
        <h2 className="text-[#606060]">{playerName.split(" ")[0]}</h2>
        <h2 className="text-xl text-[#565656] font-bold -mt-2">
          <span>{playerName.split(" ")[1]}</span>{" "}
          {playerName.split(" ").length === 3 && (
            <span>{playerName.split(" ")[2]}</span>
          )}
        </h2>
      </div>
      {/* Player Name */}

      {/* Selected and Points */}
      <div className="absolute top-14 left-3 z-1 flex flex-col gap-1">
        <div>
          <div className="flex items-center gap-1">
            <HowToRegOutlinedIcon className=" text-icon-green" />
            <p className="text-[#4f4f4f] font-bold">{timesPicked}</p>
          </div>
          <p className="text-sm text-[#6a6a6a] font-medium">Selected</p>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <GradeOutlinedIcon className=" text-icon-green" />
            <p className="text-[#4f4f4f] font-bold">{captainPoints}</p>
          </div>
          <p className="text-sm text-[#6a6a6a] font-medium">Point</p>
        </div>
      </div>
      {/* Selected and Points */}
    </div>
  );
};

export default CaptainCard;
