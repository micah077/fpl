import { getImageLink } from "@/lib/utils/FPLFetch";
import Image from "next/image";
import React from "react";
import { getTeamBadge } from "@/lib/utils/FPLFetch";

interface Transfer {
  element_in: number;
  element_in_cost: number;
  element_out: number;
  element_out_cost: number;
  entry: number;
  event: number;
  time: string;
  element_in_web_name: string;
  element_out_web_name: string;
  element_in_point: number;
  element_out_point: number;
  pointDifference: number;
  element_in_id: number;
  element_out_id: number;
  element_in_photo: string;
  element_out_photo: string;
}

const TransferCard = ({ transfer_photo, transfer_point, transfer_first_name, transfer_second_name, team_code }: { transfer_photo: string, transfer_point: string, transfer_first_name: string, transfer_second_name: string, team_code: number }) => {
  const teamBadge = getTeamBadge(team_code);
  return (
    <div className="w-32 rounded-md shadow-md text-center">
      <div className="w-full h-28 relative">
        <div className="absolute inset-0 opacity-20">
          <Image
            src={teamBadge}
            alt={`Transfered player's team badge`}
            fill
            sizes="calc(100vw - 32px)"
            style={{
              objectFit: "contain",
            }}
          />
        </div>
        <div className="absolute inset-0">
          <Image
            src={getImageLink(transfer_photo)}
            alt="Transfered player Photo"
            fill
            sizes="calc(100vw - 32px)"
            style={{
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
        </div>
        <div className="w-full h-10 absolute bottom-0 bg-gradient-to-t from-white to-transparent"></div>
        <div className="absolute top-5 right-1 z-[-10]">
          <h2 className="text-primary-green text-2xl font-bold">{transfer_point}</h2>
          <p className="text-[#7e7e7e] text-xs font-medium">Points</p>
        </div>
      </div>
      <h3 className="text-sm my-1">
        <span className="text-secondary-gray">{transfer_first_name}</span>{" "}
        <span className="text-[#565656] font-bold">{transfer_second_name}</span>
      </h3>
    </div>
  );
};

export default TransferCard;
