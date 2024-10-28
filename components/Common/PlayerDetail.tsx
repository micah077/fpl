import { Element } from "@/lib/types/FPLStatic";
import { getImageLink } from "@/lib/utils/FPLFetch";
import Image from "next/image";
import React, { FC, useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import SupervisedUserCircleOutlinedIcon from '@mui/icons-material/SupervisedUserCircleOutlined';
import ControlPointDuplicateOutlinedIcon from '@mui/icons-material/ControlPointDuplicateOutlined';

type PlayerDetailProps = {
  isOpen: boolean;
  onClose: () => void;
  playerData: Element;
  ownedUsers: FPLResult[];
  gw: number;
};

const PlayerDetail: FC<PlayerDetailProps> = ({ isOpen, onClose, playerData, ownedUsers, gw }) => {
  // ***you need to pass and except required data to make it dynamic as it is just the template***
  const [gwEvents, setGwEvents] = useState<EventDatabase[] >( [] );
  const [isLoaded, setIsLoaded] = useState(false);


  if (isOpen && !isLoaded) {
    
    const fetchData = async () => {
      const BASE_URL =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const NEXT_API_BASE_URL = `${BASE_URL}/api/`;

      try {
        if (gwEvents.length === 0) {
          const res = await fetch(
        `${NEXT_API_BASE_URL}/getEvent/${gw}`
          );
          const data: EventDatabase[] = await res.json();
          setGwEvents(data);
        }
      } catch (error) {
        console.error("Error fetching captain picks:", error);
      } finally {
        setIsLoaded(true);
      }
    }
    fetchData();
  };


  const playerEvents = gwEvents?.filter((event) => event?.playerId === playerData?.id);
  
  return (
    <div
      className={`w-[90%] lg:w-3/5 fixed left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1010] bg-white shadow-lg rounded-lg ${
        isOpen
          ? "top-[52%] visible opacity-100"
          : "top-[42%] invisible opacity-0"
      } transition duration-500`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Popup head */}
      <div className="relative h-[100px] px-4 py-3 rounded-t-lg bg-third-gradient bg-no-repeat bg-right text-primary-gray font-bold flex justify-end">
        <div className="absolute top-[-60px] left-5">
          <Image
            src={getImageLink(playerData?.photo)}
            alt={playerData?.web_name || "Player Photo"}
            width={120}
            height={120}
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
          />
        </div>
        <MdClose className="text-xl cursor-pointer" onClick={onClose} />
        <div className="w-full h-10 absolute left-0 bottom-0 bg-gradient-to-t from-white to-transparent"></div>
      </div>
      {/* Popup head */}

      {/* Popup content */}
      <div className="relative">
        {/* Content head */}
        <div className="w-[96%] p-4 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5 rounded-lg border border-[#f4f4f4] bg-white shadow-sm  absolute -top-11 left-1/2 transform -translate-x-1/2">
          <h2 className="text-[#474747] text-2xl font-medium">{playerData?.first_name} {playerData?.second_name}</h2>
          <div className="flex lg:items-center gap-5">
            <div className="flex items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-third-gradient flex justify-center items-center">
              <SupervisedUserCircleOutlinedIcon />


              </div>
              <p className="flex flex-col">
                <span className="text-[#474747] font-medium">{ownedUsers?.length}</span>
                <span className="text-[#7e7e7e] text-xs font-medium">
                  Total Picks
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-third-gradient flex justify-center items-center">
              <ControlPointDuplicateOutlinedIcon />

              </div>
              <p className="flex flex-col">
                <span className="text-[#474747] font-medium">{playerData?.event_points}</span>
                <span className="text-[#7e7e7e] text-xs font-medium">
                  Total Points
                </span>
              </p>
            </div>
          </div>
        </div>
        {/* Content head */}

        {/* Content body */}
        <div className="px-4 py-3">
          <div className="mt-20 lg:mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="overflow-hidden">
              <h2 className="py-3 px-4 rounded-t-lg bg-third-gradient bg-no-repeat bg-right text-primary-gray font-bold">
                Selected By
              </h2>
              <div className="h-[20vh] md:h-[45vh] overflow-auto">
                <table className="w-full">
                  <thead className="text-sm text-primary-gray bg-white sticky top-[-2px] z-10">
                    <tr className="shadow-primary">
                      <th>
                        <div className="px-3 py-1 border-r border-off-white text-left">
                          User name
                        </div>
                      </th>
                      <th>
                        <div className="px-3 py-1 text-left">Team Name</div>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="text-sm text-secondary-gray">
                    {ownedUsers?.map((select, index) => (
                      <tr className="border-b border-off-white" key={index}>
                        <td className="px-3 py-1">{select.player_name}</td>
                        <td className="px-3 py-1">{select.entry_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-hidden">
              <h2 className="py-3 px-4 rounded-t-lg bg-third-gradient bg-no-repeat bg-right text-primary-gray font-bold">
                Point details
              </h2>
              <div className="h-[20vh] md:h-[45vh] overflow-auto">
                <table className="w-full">
                  <thead className="text-sm text-primary-gray bg-white sticky top-[-2px] z-10">
                    <tr className="shadow-primary">
                      <th>
                        <div className="px-3 py-1 border-r border-off-white text-left">
                          Event
                        </div>
                      </th>
                      <th>
                        <div className="px-3 py-1 border-r border-off-white">
                          Value
                        </div>
                      </th>
                      <th>
                        <div className="px-3 py-1">Points</div>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="text-sm text-secondary-gray">
                    {playerEvents.map((detail, index) => (
                      <tr className="border-b border-off-white" key={index}>
                        <td className="px-3 py-1">{detail?.identifier?.charAt(0).toUpperCase() + detail?.identifier?.slice(1)}</td>
                        <td className="px-3 py-1 text-center">
                          {detail.value}
                        </td>
                        <td className="px-3 py-1 text-center">
                          {detail.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        {/* Content body */}
      </div>
      {/* Popup content */}
    </div>
  );
};

export default PlayerDetail;
