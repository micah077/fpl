"use client";
import React, { useState, useEffect } from "react";
import MainCard from "../Card/MainCard";
import { FaArrowRightLong } from "react-icons/fa6";
import { MdClose, MdInfoOutline } from "react-icons/md";
import Image from "next/image";
import Popup from "../Modals/Popup";
import PlayerDetail from "../Common/PlayerDetail";
import { Element } from "@/lib/types/FPLStatic";
import { getImageLink } from "@/lib/utils/FPLFetch";

// Set type for result of API call

type MostOwnedPlayer = {
  id: number;
  ownership: number;
  entries: string[];
  currentPlayerData: Element;
  ownedPlayers: FPLResult[];
};

type MostOwnedPlayerType = { 
  leagueData: FPLLeague,
  mostOwnedPlayers: MostOwnedPlayer[],
  gw: number
};


const MostOwnedPlayer = ({ leagueId, isDiff }: { leagueId: string, isDiff: boolean }) => {
  const [isModalOpen, setModalOpen] = useState(false); // State for modal visibility
  const [isMoreModalOpen, setMoreModalOpen] = useState(false); // State for modal visibility
  const [isFromMoreModal, setFromMoreModal] = useState(false); // State for modal controlling
  const [mostOwnedPlayers, setMostOwnedPlayers] = useState<MostOwnedPlayerType>();
  const [playerData, setPlayerData] = useState<Element>();
  const [ownedUsers, setownedUsers] = useState<FPLResult[]>();
  

  useEffect(() => {
    const fetchData = async () => {
      const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const NEXT_API_BASE_URL = `${BASE_URL}/api/fetch`;
  
      if (!mostOwnedPlayers ) {
        try {
          const res = await fetch(`${NEXT_API_BASE_URL}/getMostOwnedPlayer/${leagueId}`);
          if (!res.ok) {
            throw new Error(`Error fetching most owned player: ${res.statusText}`);
          }
          const data: MostOwnedPlayerType = await res.json();
          setMostOwnedPlayers(data); // Update state with fetched data
        } catch (error) {
          console.error("Error fetching most owned player:", error);
        }
      }
    }   
    if (leagueId) {
      fetchData(); // Fetch data only if leagueId is valid
    }
  }, [leagueId]); // Ensure the effect runs only when leagueId changes
  


  const openModal = (currentPlayerData: Element, ownedPlayers: FPLResult[]) => {
    setModalOpen(true);
    document.body.style.overflow = "hidden";
    setPlayerData(currentPlayerData);
    setownedUsers(ownedPlayers);
    setMoreModalOpen(false);
  }; // Function to open the modal

  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = "auto";
  }; // Function to close the modal

  const openMoreModal = () => {
    setMoreModalOpen(true);
    document.body.style.overflow = "hidden";
  }; // Function to open the modal

  const closeMoreModal = () => {
    setMoreModalOpen(false);
    document.body.style.overflow = "auto";
  }; // Function to close the modal



  let totalMostOwnedPlayers;

  if (isDiff) {
    totalMostOwnedPlayers = mostOwnedPlayers?.mostOwnedPlayers?.filter((player) => Number(player.currentPlayerData.selected_by_percent) < 10);
    // sort totalMostOwnedPlayers by points
    totalMostOwnedPlayers?.sort((a, b) => b.currentPlayerData.event_points - a.currentPlayerData.event_points);
  } else {
    totalMostOwnedPlayers = mostOwnedPlayers?.mostOwnedPlayers;
  }




  const numberOfPlayersInLeague = mostOwnedPlayers?.leagueData.standings.results.length;


  // Formate percentage
  const getFormatedPercentage = (
    picked: number,
    numberOfPlayersInLeague: number
  ) => {
    const fraction = (picked / numberOfPlayersInLeague) * 100;
    return fraction.toFixed(2);
  };

  return (
    <>
      {/* Main content */}
      <MainCard title={isDiff ? "Most Owned Differential" : "Most Owned Player"}>
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="text-sm text-primary-gray">
              <tr className="shadow-primary">
                <th className="px-4 py-2 border-r border-off-white">
                  <div className="flex flex-col">
                    <span>%</span>
                    <span className="text-xs">(x/y)</span>
                  </div>
                </th>
                <th className="px-4 py-2 border-r border-off-white text-left">
                  Player
                </th>
                <th className="px-4 py-2 border-r border-off-white">
                  GW Points
                </th>
                <th className="px-4 py-2">Info</th>
              </tr>
            </thead>
            <tbody className="text-sm text-secondary-gray text-center font-medium">
              {totalMostOwnedPlayers &&
                totalMostOwnedPlayers
                  ?.slice(0, 5)
                  .map((player) => (
                    <tr
                      className="border-b border-off-white relative"
                      key={player.id}
                    >
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <span>
                            {getFormatedPercentage(
                              player.ownership,
                              numberOfPlayersInLeague as number
                            )}
                            %
                          </span>
                          <span className="text-xs">
                            {player.entries.length}/{numberOfPlayersInLeague}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full relative">
                          <Image
                            src={getImageLink(player.currentPlayerData.photo) || "/player-loading.png"}
                            alt={player.currentPlayerData.web_name || "Img of Player"}
                            height={40}
                            width={40}
                            className="w-10 h-10 object-cover rounded-full max-w-max" // Add this class
                          />

                          </div>
                          <span className="text-left">
                            {player.currentPlayerData.first_name}{" "}
                            {player.currentPlayerData.second_name}{" "}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {player.currentPlayerData.event_points}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center items-center">
                          <MdInfoOutline
                            className="text-lg text-icon-green cursor-pointer"
                            onClick={() => openModal(player.currentPlayerData, player.ownedPlayers)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {totalMostOwnedPlayers && totalMostOwnedPlayers?.length && totalMostOwnedPlayers.length > 5 && (
          <div className="flex justify-end items-center my-3 px-6">
            <button
              className="text-sm text-primary-gray font-medium flex items-center gap-1"
              onClick={openMoreModal}
            >
              More <FaArrowRightLong />
            </button>
          </div>
        )}
      </MainCard>
      {/* Main content */}

      {/* Modal Component */}
      <Popup isOpen={isModalOpen} onClose={closeModal}>
        {/* Popup */}
        <PlayerDetail isOpen={isModalOpen} onClose={closeModal} playerData={playerData as Element} ownedUsers={ownedUsers as FPLResult[]} gw={mostOwnedPlayers?.gw as number} />
        {/* Popup */}
      </Popup>
      {/* Modal Component */}

      {/* More Modal Component */}
      <Popup isOpen={isMoreModalOpen} onClose={closeMoreModal}>
        {/* Popup */}
        {isFromMoreModal ? (
          <PlayerDetail
            isOpen={isMoreModalOpen}
            onClose={() => setFromMoreModal(false)}
            playerData={playerData as Element} 
            ownedUsers={ownedUsers as FPLResult[]}
            gw={mostOwnedPlayers?.gw as number}
            
          />
        ) : (
          <div
            className={`w-[90%] md:w-4/5 lg:w-1/2 fixed left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500] bg-white shadow-lg rounded-lg overflow-hidden ${
              isMoreModalOpen
                ? "top-[50%] visible opacity-100"
                : "top-[40%] invisible opacity-0"
            } transition duration-500`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popup head */}
            <div
              className={
                "py-3 px-4 rounded-t-lg bg-third-gradient bg-no-repeat bg-right text-primary-gray font-bold flex items-center justify-between"
              }
            >
              <h2>{isDiff ? "Most Owned Differential" : "Most Owned Player"}</h2>
              <MdClose
                className="text-xl cursor-pointer"
                onClick={closeMoreModal}
              />
            </div>
            {/* Popup head */}

            {/* Popup content */}
            <div className="h-[85vh] overflow-auto">
              <table className="w-full">
                <thead className="text-sm text-primary-gray bg-white sticky top-[-2px] z-10">
                  <tr className="shadow-primary">
                    <th>
                      <div className="px-3 py-1 border-r border-off-white flex flex-col">
                        <span>%</span>
                        <span className="text-xs">(x/y)</span>
                      </div>
                    </th>
                    <th>
                      <div className="px-3 py-1 border-r border-off-white text-left">
                        Player
                      </div>
                    </th>
                    <th>
                      <div className="px-3 py-1 border-r border-off-white">
                        GW Points
                      </div>
                    </th>
                    <th>
                      <div className="px-3 py-1">Info</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm text-secondary-gray text-center font-medium">
                  {totalMostOwnedPlayers &&
                    totalMostOwnedPlayers?.map((player) => (
                      <tr
                        className="border-b border-off-white relative"
                        key={player.id}
                      >
                        <td className="px-4 py-2">
                          <div className="flex flex-col">
                            <span>
                              {getFormatedPercentage(
                                player.ownership,
                                numberOfPlayersInLeague as number
                              )}
                              %
                            </span>
                            <span className="text-xs">
                              {player.entries.length}/{numberOfPlayersInLeague}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full">
                          <Image
                            src={
                              getImageLink(
                                player.currentPlayerData.photo
                              ) || "/player-loading.png"
                            }
                            alt={player.currentPlayerData.web_name || "Img of Player"}
                            height={40}
                            width={40}

                          />

                          </div>
                            <span className="text-left">
                              {player.currentPlayerData.first_name}{" "}
                              {player.currentPlayerData.second_name}{" "}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          {player.currentPlayerData.event_points}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex justify-center items-center">
                            <MdInfoOutline
                              className="text-lg text-icon-green cursor-pointer"
                              onClick={() => openModal(player.currentPlayerData, player.ownedPlayers)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {/* Popup content */}
          </div>
        )}
        {/* Popup */}
      </Popup>
      {/* More Modal Component */}
    </>
  );
};

export default MostOwnedPlayer;
