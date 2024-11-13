"use client";
import React, { useState, useEffect } from "react";
import MainCard from "../Card/MainCard";
import { FaArrowRightLong } from "react-icons/fa6";
import { MdInfoOutline } from "react-icons/md";
import { BsBank } from "react-icons/bs";
import { FaLongArrowAltUp, FaLongArrowAltDown } from "react-icons/fa";
import Popup from "../Modals/Popup";
import { MdClose } from "react-icons/md";
import { EventElement, Events } from "../../lib/types/FPLEvents";
import { getImageLink, getTeamBadgeFromClubId } from "@/lib/utils/FPLFetch";
import { calculateLiveGWPointsForPlayer } from "@/lib/utils/FPLHelper";
import { Result } from "../../lib/types/FPLLeague";
import MilitaryTechOutlinedIcon from '@mui/icons-material/MilitaryTechOutlined';
import ControlPointDuplicateOutlinedIcon from '@mui/icons-material/ControlPointDuplicateOutlined';
import SportsScoreOutlinedIcon from '@mui/icons-material/SportsScoreOutlined';


import Image from "next/image";

type ManagerData = {
  managerData: Result;
  managerGWData: FPLUserGameweek;
  userId: number;
  gwPoints: number;
  totalPoints: number;
  userBonusPlayers: { player: Element | undefined; playerId: number; value: number; }[];
  numberOfPlayersStarted: number;
  userGWEvents: EventElement[];

}

type LeagueTableData = {
  managerData: ManagerData[];
  gwEvents: FPLEvents;
  gwFixtures: FPLFixtures[];
  gwBonusPoints: { player: Element | undefined; playerId: number; value: number; }[];
  currentGameweek: number;
  leagueData: FPLLeague;
  userGWEvents: EventElement[];
  staticData: FPLStatic;
  enrichedManagerInsights: FPLManager[];
}


const LeagueTable = ({ leagueId }: { leagueId: string }) => {
  const [isMoreModalOpen, setMoreModalOpen] = useState(false); // State for modal visibility
  const [isInfoModalOpen, setInfoModalOpen] = useState(false); // State for modal visibility
  const [leagueTableData, setLeagueTableData] = useState<LeagueTableData | null>(null); // State for league table data
  const [selectedManager, setSelectedManager] = useState<Result>(); // State for selected manager
  const [loader,setLoader] = useState(false)
  const [isError,setIsError] = useState(false)

  const openMoreModal = () => {
    setMoreModalOpen(true);
    document.body.style.overflow = "hidden";
  }; // Function to open the modal


  const closeMoreModal = () => {
    setMoreModalOpen(false);
    document.body.style.overflow = "auto";
  }; // Function to close the modal

  const openInfoModal = (manager: Result) => {
    setSelectedManager(manager);
    setInfoModalOpen(true);
    setMoreModalOpen(false);
    document.body.style.overflow = "hidden";
  }; // Function to open the modal

  const closeInfoModal = () => {
    setInfoModalOpen(false);
    document.body.style.overflow = "auto";
  }


  useEffect(() => {

    if (leagueId) {
      fetchData();
    }
  }, [leagueId]);

  const fetchData = async () => {
    const BASE_URL =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const NEXT_API_BASE_URL = `${BASE_URL}/api/fetch`;

    try {
      setIsError(false)
      setLoader(true)
      const res = await fetch(
        `${NEXT_API_BASE_URL}/getLiveTable/${leagueId}`
      );
      const data: LeagueTableData = await res.json();

      setLeagueTableData(data);
    } catch (error) {
      console.error("Error fetching value:", error);
      setIsError(true)
    } finally {
      setLoader(false)
    }
  };

  const { managerData, gwEvents, gwFixtures, gwBonusPoints, currentGameweek, leagueData, staticData, enrichedManagerInsights } = leagueTableData || {};



  // Loop through managagerData and for each managerData, calculate the point of each usserGWEvent
  // store the points in an array per player
  const userPlayerPoints = managerData?.map(manager => {
    const { userGWEvents, managerGWData } = manager;
    const userPlayerPoint = userGWEvents.map(event => {
      const playerPoint = event.explain.reduce((acc: number, explain) => {
        return acc + explain.stats.reduce((acc: number, stat) => {
          const pick = managerGWData.picks.find(pick => pick.element === event.id);
          if (pick) {
            //return acc + (stat.points * pick.multiplier);
            return acc + (stat.points);
          }
          return acc;
        }, 0);
      }, 0);
      // enrich the event with elementData from staticData
      const elementData = staticData?.elements.find(element => element.id === event.id);

      return {
        player: elementData,
        points: playerPoint,
        player_id: event.id,
      };
    });
    // sort the array of playerPoints by points
    userPlayerPoint.sort((a, b) => b.points - a.points);

    return { userId: manager.userId, userPlayerPoint };



  });


  return (
    <div className="col-span-2">
      <MainCard error={isError} onRefresh={()=>fetchData()} loader={loader} title={`Live League Table`}>
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="text-sm text-primary-gray">
              <tr className="shadow-primary">
                <th className="px-4 py-2 border-r border-off-white text-left">Rank</th>
                <th className="px-4 py-2 border-r border-off-white text-left">Full Name</th>
                <th className="px-4 py-2 border-r border-off-white text-left">Username</th>
                <th className="px-4 py-2 border-r border-off-white">GW</th>
                <th className="px-4 py-2 border-r border-off-white">Score</th>
                <th className="px-4 py-2 border-r border-off-white">GW Bonus</th>
                <th className="px-4 py-2 border-r border-off-white text-left">Top Player</th>
                <th className="px-4 py-2 border-r border-off-white">Players left</th>
                <th className="px-4 py-2 border-r border-off-white text-left">Avg. PPP</th>
                <th className="px-4 py-2 border-r border-off-white text-left">Info</th>
              </tr>
            </thead>

            <tbody className="text-sm text-secondary-gray text-center font-medium">
              {leagueData?.standings.results.slice(0, 3).map((manager, index) => (
                <tr key={index}>
                  <td className="py-2 border-r border-off-white">
                    {
                      index + 1 < manager.last_rank ?
                        (
                          <div className="ml-4 flex items-center">
                            <div className="w-4 h-4 rounded-full bg-green-400 flex items-center justify-center text-white">
                              <FaLongArrowAltUp className="text-lg" />
                            </div>
                            <span className="ml-2">
                              {index + 1}
                            </span>
                          </div>
                        ) : index + 1 > manager.last_rank ?
                          (
                            <div className="ml-4 flex items-center">
                              <div className="w-4 h-4    rounded-full bg-red-400 flex items-center justify-center text-white">
                                <FaLongArrowAltDown className="text-lg" />
                              </div>
                              <span className="ml-2">
                                {index + 1}
                              </span>
                            </div>
                          ) :
                          (
                            <div className="ml-4 flex items-center">
                              <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-white">

                              </div>
                              <span className="ml-2">
                                {index + 1}
                              </span>
                            </div>
                          )
                    }
                  </td>

                  <td className="px-2 py-2 border-r border-off-white text-left">
                    <div className="flex items-center">
                      {
                        enrichedManagerInsights?.find(managerData => managerData.id === manager.entry)?.countryImgSrc && (
                          <Image
                            src={enrichedManagerInsights?.find(managerData => managerData.id === manager.entry)?.countryImgSrc as string}
                            alt={manager.player_name || "Country img"}
                            width={30}
                            height={30}
                            className="rounded-full object-cover h-6 w-6 mr-2"  // Added margin-right (mr-2)
                          />


                        )
                      }
                      <span>{manager.player_name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 border-r border-off-white text-left">
                    <div className="flex items-center">
                      {
                        enrichedManagerInsights?.find(managerData => managerData.id === manager.entry)?.favourite_team_badge && (
                          <Image
                            src={enrichedManagerInsights?.find(managerData => managerData.id === manager.entry)?.favourite_team_badge as string}
                            alt={manager.player_name || "favorite team badge"}
                            width={30}
                            height={30}
                            className="rounded-full object-cover h-6 w-6 mr-2"  // Added margin-right (mr-2)
                          />
                        )
                      }
                      <span>{manager.entry_name}</span>
                    </div>
                  </td>

                  <td className="px-4 py-2 border-r border-off-white ">
                    {managerData?.find(managerData => managerData.userId === manager.entry)?.gwPoints}
                  </td>
                  <td className="px-4 py-2 border-r border-off-white">
                    {managerData?.find(managerData => managerData.userId === manager.entry)?.totalPoints}
                  </td>
                  <td className="px-4 py-2 border-r border-off-white">
                    {managerData?.find(managerData => managerData.userId === manager.entry)?.userBonusPlayers.reduce((acc, bonus) => acc + bonus.value, 0)}
                  </td>
                  <td className="px-4 py-2 border-r border-off-white text-left">
                    <div className="relative flex items-center">
                      {
                        userPlayerPoints &&
                        (() => {
                          // Find the player points based on the manager's entry
                          const playerPoints = userPlayerPoints.find(playerPoints => playerPoints.userId === manager?.entry);

                          if (playerPoints && playerPoints.userPlayerPoint[0].player?.photo) {
                            // If playerPoints exists and has a photo, return the image
                            return (
                              <div className="w-10 h-10 rounded-full relative">
                                <Image
                                  src={getImageLink(playerPoints.userPlayerPoint[0].player?.photo)}
                                  alt={playerPoints.userPlayerPoint[0].player?.web_name || "best player"}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 object-cover rounded-full max-w-max" // Add this class
                                />


                                {/* Transparent green circle */}

                              </div>
                            );
                          }
                          return ""; // Return an empty string if photo or player is not available
                        })()
                      }

                      <span className="text-base ml-4">
                        {
                          userPlayerPoints?.find(playerPoints => playerPoints?.userId === manager?.entry)?.userPlayerPoint[0]?.player?.web_name || 'Unknown Player'
                        }
                      </span>
                      <div className="absolute top-0 -right-2 bg-third-gradient text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full opacity-70">
                        {userPlayerPoints?.find(playerPoints => playerPoints?.userId === manager?.entry)?.userPlayerPoint[0]?.points}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 border-r border-off-white">
                    {11 - (managerData?.find(managerData => managerData.userId === manager.entry)?.numberOfPlayersStarted ?? 0)}
                  </td>
                  <td className="px-4 py-2 border-r border-off-white text-left">
                    {((managerData?.find(managerData => managerData.userId === manager.entry)?.gwPoints || 0) /
                      (managerData?.find(managerData => managerData.userId === manager.entry)?.numberOfPlayersStarted || 1)).toFixed(1)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center items-center">
                      <MdInfoOutline
                        className="text-lg text-icon-green cursor-pointer"
                        onClick={() => openInfoModal(manager)}
                      />
                    </div>
                  </td>




                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leagueData?.standings.results && leagueData?.standings.results?.length && leagueData?.standings.results.length > 3 && (
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

      {/* Modal Component */}
      <Popup isOpen={isMoreModalOpen} onClose={closeMoreModal}>
        {/* Popup */}
        <div
          className={`w-[90%] md:w-4/5 lg:w-4/5 fixed left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1010] bg-white shadow-lg rounded-lg overflow-hidden ${isMoreModalOpen
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
            <h2>League Table</h2>
            <MdClose className="text-xl cursor-pointer" onClick={closeMoreModal} />
          </div>
          {/* Popup head */}

          {/* Popup content */}
          <div className="h-[85vh] overflow-auto">
            <div className="overflow-auto">
              <table className="w-full">
                <thead className="text-sm text-primary-gray">
                  <tr className="shadow-primary">
                    <th className="px-4 py-2 border-r border-off-white text-left">Rank</th>
                    <th className="px-4 py-2 border-r border-off-white text-left">Full Name</th>
                    <th className="px-4 py-2 border-r border-off-white text-left">Username</th>
                    <th className="px-4 py-2 border-r border-off-white">GW</th>
                    <th className="px-4 py-2 border-r border-off-white">Score</th>
                    <th className="px-4 py-2 border-r border-off-white">GW Bonus</th>
                    <th className="px-4 py-2 border-r border-off-white text-left">Top Player</th>
                    <th className="px-4 py-2 border-r border-off-white">Players left</th>
                    <th className="px-4 py-2 border-r border-off-white text-left">Avg. PPP</th>
                    <th className="px-4 py-2 border-r border-off-white text-left">Info</th>
                  </tr>
                </thead>

                <tbody className="text-sm text-secondary-gray text-center font-medium">
                  {leagueData?.standings.results.map((manager, index) => (
                    <tr key={index}>
                      <td className="py-2 border-r border-off-white">
                        {
                          index + 1 < manager.last_rank ?
                            (
                              <div className="ml-4 flex items-center">
                                <div className="w-4 h-4 rounded-full bg-green-400 flex items-center justify-center text-white">
                                  <FaLongArrowAltUp className="text-lg" />
                                </div>
                                <span className="ml-2">
                                  {index + 1}
                                </span>
                              </div>
                            ) : index + 1 > manager.last_rank ?
                              (
                                <div className="ml-4 flex items-center">
                                  <div className="w-4 h-4    rounded-full bg-red-400 flex items-center justify-center text-white">
                                    <FaLongArrowAltDown className="text-lg" />
                                  </div>
                                  <span className="ml-2">
                                    {index + 1}
                                  </span>
                                </div>
                              ) :
                              (
                                <div className="ml-4 flex items-center">
                                  <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-white">

                                  </div>
                                  <span className="ml-2">
                                    {index + 1}
                                  </span>
                                </div>
                              )
                        }
                      </td>

                      <td className="px-2 py-2 border-r border-off-white text-left">
                        <div className="flex items-center">
                          {
                            enrichedManagerInsights?.find(managerData => managerData.id === manager.entry)?.countryImgSrc && (
                              <Image
                                src={enrichedManagerInsights?.find(managerData => managerData.id === manager.entry)?.countryImgSrc as string}
                                alt={manager.player_name || "Country img"}
                                width={30}
                                height={30}
                                className="rounded-full object-cover h-6 w-6 mr-2"  // Added margin-right (mr-2)
                              />
                            )
                          }
                          <span>{manager.player_name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 border-r border-off-white text-left">
                        <div className="flex items-center">
                          {
                            enrichedManagerInsights?.find(managerData => managerData.id === manager.entry)?.favourite_team_badge && (
                              <Image
                                src={enrichedManagerInsights?.find(managerData => managerData.id === manager.entry)?.favourite_team_badge as string}
                                alt={manager.player_name || "favorite team badge"}
                                width={30}
                                height={30}
                                className="rounded-full object-cover h-6 w-6 mr-2"  // Added margin-right (mr-2)
                              />
                            )
                          }
                          <span>{manager.entry_name}</span>
                        </div>
                      </td>

                      <td className="px-4 py-2 border-r border-off-white ">
                        {managerData?.find(managerData => managerData.userId === manager.entry)?.gwPoints}
                      </td>
                      <td className="px-4 py-2 border-r border-off-white">
                        {managerData?.find(managerData => managerData.userId === manager.entry)?.totalPoints}
                      </td>
                      <td className="px-4 py-2 border-r border-off-white">
                        {managerData?.find(managerData => managerData.userId === manager.entry)?.userBonusPlayers.reduce((acc, bonus) => acc + bonus.value, 0)}
                      </td>
                      <td className="px-4 py-2 border-r border-off-white text-left">
                        <div className="relative flex items-center">
                          {
                            userPlayerPoints &&
                            (() => {
                              // Find the player points based on the manager's entry
                              const playerPoints = userPlayerPoints.find(playerPoints => playerPoints.userId === manager?.entry);

                              if (playerPoints && playerPoints.userPlayerPoint[0].player?.photo) {
                                // If playerPoints exists and has a photo, return the image
                                return (
                                  <div className="w-10 h-10 rounded-full relative">
                                    <Image
                                      src={getImageLink(playerPoints.userPlayerPoint[0].player?.photo)}
                                      alt={playerPoints.userPlayerPoint[0].player?.web_name || "best player"}
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 object-cover rounded-full max-w-max" // Add this class
                                    />

                                    {/* Transparent green circle */}

                                  </div>
                                );
                              }
                              return ""; // Return an empty string if photo or player is not available
                            })()
                          }

                          <span className="text-base ml-2">
                            {
                              userPlayerPoints?.find(playerPoints => playerPoints?.userId === manager?.entry)?.userPlayerPoint[0]?.player?.web_name || 'Unknown Player'
                            }
                          </span>
                          <div className="absolute top-0 -right-3 bg-third-gradient text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full opacity-70">
                            {userPlayerPoints?.find(playerPoints => playerPoints?.userId === manager?.entry)?.userPlayerPoint[0]?.points}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 border-r border-off-white">
                        {11 - (managerData?.find(managerData => managerData.userId === manager.entry)?.numberOfPlayersStarted ?? 0)}
                      </td>
                      <td className="px-4 py-2 border-r border-off-white text-left">
                        {((managerData?.find(managerData => managerData.userId === manager.entry)?.gwPoints || 0) /
                          (managerData?.find(managerData => managerData.userId === manager.entry)?.numberOfPlayersStarted || 1)).toFixed(1)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center items-center">
                          <MdInfoOutline
                            className="text-lg text-icon-green cursor-pointer"
                            onClick={() => openInfoModal(manager)}
                          />
                        </div>
                      </td>




                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Popup content */}
        </div>
        {/* Popup */}
      </Popup>
      {/* Info Popup */}
      {/* Modal Component */}



      <Popup isOpen={isInfoModalOpen} onClose={closeInfoModal}>
        {/* Popup */}
        <div
          className={`w-[90%] md:w-3/4 lg:w-2/5 fixed left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1010] bg-white shadow-lg rounded-lg overflow-hidden ${isInfoModalOpen
            ? "top-[50%] visible opacity-100"
            : "top-[40%] invisible opacity-0"
            } transition duration-500`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Popup head */}
          <div
            className={
              "py-3 px-4 rounded-t-lg bg-third-gradient bg-no-repeat bg-right  text-primary-gray font-bold flex items-center justify-between"
            }
          >
            <h2>Manager Team</h2>
            <MdClose className="text-xl cursor-pointer" onClick={closeInfoModal} />
          </div>
          {/* Popup head */}

          {/* Popup content */}
          <div className="h-[90vh] overflow-auto">
            <div className="m-4 p-4 rounded-lg border border-[#f4f4f4] bg-white shadow-md">
              <h2 className="text-[#474747] font-bold">{selectedManager?.player_name}</h2>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="flex flex-col md:flex-row items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-third-gradient flex justify-center items-center">
                    <MilitaryTechOutlinedIcon />

                  </div>
                  <p className="flex flex-col items-center md:items-start">
                    <span className="text-[#474747] font-medium">
                      {selectedManager?.rank}
                    </span>
                    <span className="text-[#7e7e7e] text-xs font-medium">
                      Manager Rank
                    </span>
                  </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-third-gradient flex justify-center items-center">
                    <ControlPointDuplicateOutlinedIcon />

                  </div>
                  <p className="flex flex-col items-center md:items-start">
                    <span className="text-[#474747] font-medium">
                      {
                        managerData?.find(managerData => managerData.userId === selectedManager?.entry)
                          ?.gwPoints
                      }
                    </span>
                    <span className="text-[#7e7e7e] text-xs font-medium">
                      Manager Points
                    </span>
                  </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-third-gradient flex justify-center items-center">
                    <SportsScoreOutlinedIcon />

                  </div>
                  <p className="flex flex-col items-center md:items-start">
                    <span className="text-[#474747] font-medium">
                      {
                        managerData?.find(managerData => managerData.userId === selectedManager?.entry)
                          ?.totalPoints
                      }
                    </span>
                    <span className="text-[#7e7e7e] text-xs font-medium">
                      Total Points
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-5">
              {/* Football Pitch */}
              <div className="relative w-full h-[550px] sm:h-[600px] overflow-hidden">
                <div className="absolute inset-0 w-full h-full">
                  <Image
                    src="/premierLeaguePitch.svg"
                    alt="Football Pitch"
                    fill          // Ensures the image covers the container
                    style={{ objectFit: 'cover' }}
                    className="scale-[1.05] md:scale-[1] transition-transform duration-500 ease-in-out" // Adjust zoom level here
                  />
                </div>


                {/* Players layout on the field */}
                <div className="absolute top-0 left-0 w-full h-full flex flex-col px-4 sm:px-8">
                  {/* Goalkeeper */}
                  <div className="flex justify-center mt-6">
                    {managerData?.find(managerData => managerData.userId === selectedManager?.entry)
                      ?.managerGWData.picks
                      .filter(pick => pick.position < 12 && staticData?.elements.find(element => element.id === pick.element)?.element_type === 1)
                      .map((pick, index) => {
                        const player = staticData?.elements.find(element => element.id === pick.element);
                        return (
                          <div className="flex items-center flex-col relative" key={index}>
                            <div className="relative">
                              <Image
                                src={getImageLink(player?.photo)}
                                alt={player?.web_name || "Goalkeeper Images"}
                                width={50}   // Larger images for more coverage
                                height={50}  // Adjust height accordingly
                                className="rounded-full sm:w-14 sm:h-14"
                              />
                              <div className="absolute top-0 -right-2 bg-third-gradient md:text-gray-100 text-xs font-bold rounded-full w-4 h-4 sm:w-4 sm:h-4 flex items-center justify-center">
                                {calculateLiveGWPointsForPlayer(gwEvents as Events, Number(pick.element))}
                              </div>
                            </div>
                            <h2 className="text-[#474747] text-center mt-1 font-bold text-xs sm:text-sm">
                              {player?.web_name.slice(0, 8) || "Unknown"}
                            </h2>
                          </div>
                        );
                      })}
                  </div>

                  {/* Defenders */}
                  <div className="flex justify-evenly mt-6">
                    {managerData?.find(managerData => managerData.userId === selectedManager?.entry)
                      ?.managerGWData.picks
                      .filter(pick => pick.position < 12 && staticData?.elements.find(element => element.id === pick.element)?.element_type === 2)
                      .map((pick, index) => {
                        const player = staticData?.elements.find(element => element.id === pick.element);
                        return (
                          <div className="flex items-center flex-col relative" key={index}>
                            <div className="relative">
                              <Image
                                src={getImageLink(player?.photo)}
                                alt={player?.web_name || "Defender Image"}
                                width={50}
                                height={50}
                                className="rounded-full sm:w-14 sm:h-14"
                              />
                              <div className="absolute top-0 -right-2 bg-third-gradient md:text-gray-100 text-xs font-bold rounded-full w-4 h-4 sm:w-4 sm:h-4 flex items-center justify-center">
                                {calculateLiveGWPointsForPlayer(gwEvents as Events, Number(pick.element))}
                              </div>
                            </div>
                            <h2 className="text-[#474747] text-center mt-1 font-bold text-xs sm:text-sm">
                              {player?.web_name.slice(0, 8) || "Unknown"}
                            </h2>
                          </div>
                        );
                      })}
                  </div>

                  {/* Midfielders */}
                  <div className="flex justify-evenly mt-6">
                    {managerData?.find(managerData => managerData.userId === selectedManager?.entry)
                      ?.managerGWData.picks
                      .filter(pick => pick.position < 12 && staticData?.elements.find(element => element.id === pick.element)?.element_type === 3)
                      .map((pick, index) => {
                        const player = staticData?.elements.find(element => element.id === pick.element);
                        return (
                          <div className="flex items-center flex-col relative" key={index}>
                            <div className="relative">
                              <Image
                                src={getImageLink(player?.photo)}
                                alt={player?.web_name || "Midfielder Image"}
                                width={50}
                                height={50}
                                className="rounded-full sm:w-14 sm:h-14"
                              />
                              <div className="absolute top-0 -right-2 bg-third-gradient md:text-gray-100 text-xs font-bold rounded-full w-4 h-4 sm:w-4 sm:h-4 flex items-center justify-center">
                                {calculateLiveGWPointsForPlayer(gwEvents as Events, Number(pick.element))}
                              </div>
                            </div>
                            <h2 className="text-[#474747] text-center mt-1 font-bold text-xs sm:text-sm">
                              {player?.web_name.slice(0, 8) || "Unknown"}
                            </h2>
                          </div>
                        );
                      })}
                  </div>

                  {/* Forwards */}
                  <div className="flex justify-evenly mt-6">
                    {managerData?.find(managerData => managerData.userId === selectedManager?.entry)
                      ?.managerGWData.picks
                      .filter(pick => pick.position < 12 && staticData?.elements.find(element => element.id === pick.element)?.element_type === 4)
                      .map((pick, index) => {
                        const player = staticData?.elements.find(element => element.id === pick.element);
                        return (
                          <div className="flex items-center flex-col relative" key={index}>
                            <div className="relative">
                              <Image
                                src={getImageLink(player?.photo)}
                                alt={player?.web_name || "Forward Image"}
                                width={50}
                                height={50}
                                className="rounded-full sm:w-14 sm:h-14"
                              />
                              <div className="absolute top-0 -right-2 bg-third-gradient md:text-gray-100 text-xs font-bold rounded-full w-4 h-4 sm:w-4 sm:h-4 flex items-center justify-center">
                                {calculateLiveGWPointsForPlayer(gwEvents as Events, Number(pick.element))}
                              </div>
                            </div>
                            <h2 className="text-[#474747] text-center mt-1 font-bold text-xs sm:text-sm">
                              {player?.web_name.slice(0, 8) || "Unknown"}
                            </h2>
                          </div>
                        );
                      })}
                  </div>
                  {/* Bench */}
                  <span className="mt-4">Benchplayers</span>
                  <div className="flex justify-evenly mt-10">
                    {managerData?.find(managerData => managerData.userId === selectedManager?.entry)
                      ?.managerGWData.picks
                      .filter(pick => pick.position >= 12 && pick.position <= 15)
                      .map((pick, index) => {
                        const player = staticData?.elements.find(element => element.id === pick.element);
                        return (
                          <div className="flex items-center flex-col relative" key={index}>
                            <div className="relative">
                              <Image
                                src={getImageLink(player?.photo)}
                                alt={player?.web_name || "Bench Player"}
                                width={40}
                                height={40}
                                className="rounded-full sm:w-12 sm:h-12"
                              />
                              <div className="absolute top-0 -right-2 bg-third-gradient md:text-gray-100 text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                                {calculateLiveGWPointsForPlayer(gwEvents as Events, Number(pick.element))}
                              </div>
                            </div>
                            <h2 className="text-[#474747] text-center mt-1 font-bold text-xs sm:text-sm">
                              {player?.web_name.slice(0, 8) || "Unknown"}
                            </h2>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

            </div>
          </div>
          {/* Popup content */}
        </div>
      </Popup>


      {/* Info Popup */}
      {/* Modal Component */}
    </div>
  );
};

export default LeagueTable;
