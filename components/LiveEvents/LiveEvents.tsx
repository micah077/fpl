"use client";
import React, { useState, useEffect } from "react";
import MainCard from "../Card/MainCard";
import { FaArrowRightLong } from "react-icons/fa6";
import { MdClose, MdInfoOutline } from "react-icons/md";
import Image from "next/image";
import Popup from "../Modals/Popup";
import PlayerDetail from "../Common/PlayerDetail";
import { getImageLink } from "@/lib/utils/FPLFetch";
import { Element } from "@/lib/types/FPLStatic";

const LiveEvents = ({ leagueId }: { leagueId: string }) => {
  const [isModalOpen, setModalOpen] = useState(false); // State for modal visibility
  const [isMoreModalOpen, setMoreModalOpen] = useState(false); // State for modal visibility
  const [isFromMoreModal, setFromMoreModal] = useState(false); // State for modal controlling
  const [leagueEvent, setLeagueEvent] = useState<FPLLeagueEvents[]>([]); // State for player data
  const [selectedPlayer, setSelectedPlayer] = useState<Element>(); // State for selected player
  const [ownedUsers, setownedUsers] = useState<FPLResult[]>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<boolean>(false);


  const openModal = (currentPlayerData: Element, ownedPlayers: FPLResult[]) => {
    setModalOpen(true);
    document.body.style.overflow = "hidden";
    setSelectedPlayer(currentPlayerData);
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
      setIsLoading(true)
      setError(false)
      const res = await fetch(
        `${NEXT_API_BASE_URL}/getLeaguePlayerEvents/${leagueId}`
      );
      const data: FPLLeagueEvents[] = await res.json();

      setLeagueEvent(data);


    } catch (error) {
      console.error("Error fetching events:", error);
      setError(true)
    } finally {
      setIsLoading(false)
    }
  };

  const players = [
    {
      id: 1,
      time: 4765,
      percentage: 80,
      name: "Cristiano Ronaldo",
      points: 3,
    },
    {
      id: 2,
      time: 3788,
      percentage: 77,
      name: "Lionel Messi",
      points: 2,
    },
    {
      id: 3,
      time: 3489,
      percentage: 70,
      name: "Neymar Jr",
      points: -2,
    },
    {
      id: 4,
      time: 4545,
      percentage: 82,
      name: "Kiliyan Mbappe",
      points: 3,
    },
    {
      id: 5,
      time: 3347,
      percentage: 80,
      name: "Trent Alexander Arnold",
      points: 2,
    },
    {
      id: 6,
      time: 4568,
      percentage: 82,
      name: "Vinicius Jr",
      points: 3,
    },
    {
      id: 7,
      time: 3476,
      percentage: 70,
      name: "Robert Lewandoski",
      points: -1,
    },
    {
      id: 8,
      time: 3684,
      percentage: 75,
      name: "Erling Halaand",
      points: 2,
    },
    {
      id: 9,
      time: 4066,
      percentage: 78,
      name: "Jude Bellingham",
      points: 2,
    },
    {
      id: 10,
      time: 3462,
      percentage: 75,
      name: "Luka Madric",
      points: 2,
    },
  ];

  // Create a copy of the data array and sort it in descending order
  const sortedData = players.slice().sort((a, b) => b.time - a.time);

  const getFormatedTime = (date: Date) => {
    // return the hours and minutes in 24 hours format
    const time = new Date(date);
    const hours = time.getHours();
    const minutes = time.getMinutes();
    return `${hours}:${minutes}`;

  };

  const currentGameweek = leagueEvent[0]?.gw;

  // loop through leagueevents, and get the numberOfPlayers in the league, 
  // by counting the number of unique values in ManagerInsights.id
  // loop through each set, store each unique id in a set, and then get the length of the set

  let numberOfManagersInLeague = 0;
  if (Array.isArray(leagueEvent)) {
    const userIds = leagueEvent.map((event) => event?.managerInsights?.map((manager) => manager.id));
    const uniqueIds = new Set(userIds.flat());
    numberOfManagersInLeague = uniqueIds.size;
  }






  return (
    <div className="col-span-3">
      <MainCard error={error} loader={isLoading} onRefresh={()=>fetchData()} title={`Live Events`}>
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="text-sm text-primary-gray">
              <tr className="shadow-primary">
                <th className="px-4 py-2 border-r border-off-white">Time</th>
                <th className="px-4 py-2 border-r border-off-white text-left">
                  Player
                </th>
                <th className="px-4 py-2 border-r border-off-white">
                  <div className="flex flex-col">
                    <span>%</span>
                    <span className="text-xs">(x/y)</span>
                  </div>
                </th>
                <th className="px-4 py-2 border-r border-off-white">Points</th>
                <th className="px-4 py-2 border-r border-off-white">
                  Event
                </th>
                <th className="px-4 py-2">Info</th>
              </tr>
            </thead>
            <tbody className="text-sm text-secondary-gray text-center font-medium">
              {Array.isArray(leagueEvent) && leagueEvent?.slice(0, 6).map((event, index) => (
                <tr
                  className="border-b border-off-white relative"
                  key={event.playerId + "-" + index}
                >
                  <td className="px-4 py-2">{getFormatedTime(event.updatedAt)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full  relative">
                        <Image
                          src={getImageLink(event.playerIdData.photo) || "/player-loading.png"}
                          alt={event.playerIdData.web_name || "Player photo from event"}
                          height={40}
                          width={40}
                          className="w-10 h-10 object-cover rounded-full max-w-max" // Add this class
                        />
                      </div>
                      <span className="text-left">{event.playerIdData.first_name} {event.playerIdData.second_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span>
                        {
                          ((event?.managerInsights?.length / numberOfManagersInLeague) * 100).toFixed(1)
                        }%
                      </span>
                      <span className="text-xs">
                        ({"" + event.managerInsights?.length.toString() + "/" + numberOfManagersInLeague?.toString()}) {/*{getFormatedPercentage(player.percentage)}*/}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">{event.points}</td>
                  <td className="px-4 py-2 text-left">{event.identifier}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center items-center">
                      <MdInfoOutline
                        className="text-lg text-icon-green cursor-pointer"
                        onClick={() => openModal(event.playerIdData, event.managerInsights)}
                      />

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sortedData?.length > 5 && (
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
      <Popup isOpen={isModalOpen} onClose={closeModal}>
        {/* Popup */}
        <p></p>
        <PlayerDetail isOpen={isModalOpen} onClose={closeModal} playerData={selectedPlayer as Element} ownedUsers={ownedUsers as FPLResult[]} gw={currentGameweek} />
        {/* Popup */}
      </Popup>
      {/* Modal Component */}

      {/* More Modal Component */}
      <Popup isOpen={isMoreModalOpen} onClose={closeMoreModal}>
        {/* Popup */}
        {isFromMoreModal ? (
          <div><p>Test</p></div>
          /*(<PlayerDetail
          isOpen={isModalOpen} onClose={closeModal} playerData={playerData as Element} ownedUsers={ownedUsers as FPLResult[]}
          />*/
        ) : (
          <div
            className={`w-[90%] md:w-4/5 lg:w-1/2 fixed left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1010] bg-white shadow-lg rounded-lg overflow-hidden ${isMoreModalOpen
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
              <h2>Live Events</h2>
              <MdClose
                className="text-xl cursor-pointer"
                onClick={closeMoreModal}
              />
            </div>
            {/* Popup head */}

            {/* Popup content */}
            <div className="h-[85vh] overflow-auto">
              <table className="w-full">
                <thead className="text-sm text-primary-gray">
                  <tr className="shadow-primary">
                    <th className="px-4 py-2 border-r border-off-white">Time</th>
                    <th className="px-4 py-2 border-r border-off-white text-left">
                      Player
                    </th>
                    <th className="px-4 py-2 border-r border-off-white">
                      <div className="flex flex-col">
                        <span>%</span>
                        <span className="text-xs">(x/y)</span>
                      </div>
                    </th>
                    <th className="px-4 py-2 border-r border-off-white">Points</th>
                    <th className="px-4 py-2 border-r border-off-white">
                      Event
                    </th>
                    <th className="px-4 py-2">Info</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-secondary-gray text-center font-medium">
                  {leagueEvent?.length > 0 && leagueEvent?.map((event, index) => (
                    <tr
                      className="border-b border-off-white relative"
                      key={event.playerId + "-" + index}
                    >
                      <td className="px-4 py-2">{getFormatedTime(event.updatedAt)}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full relative">




                            <Image
                              src={getImageLink(event.playerIdData.photo) || "/player-loading.png"}
                              alt={event.playerIdData.web_name || "Player photo from event"}
                              height={40}
                              width={40}
                              className="w-10 h-10 object-cover rounded-full max-w-max" // Add this class
                            />
                          </div>
                          <span className="text-left">{event.playerIdData.first_name} {event.playerIdData.second_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <span>
                            {
                              ((event.managerInsights?.length / numberOfManagersInLeague) * 100).toFixed(1)
                            }%
                          </span>
                          <span className="text-xs">
                            ({"" + event.managerInsights?.length.toString() + "/" + numberOfManagersInLeague.toString()}) {/*{getFormatedPercentage(player.percentage)}*/}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">{event.points}</td>
                      <td className="px-4 py-2 text-left">{event.identifier}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center items-center">
                          <MdInfoOutline
                            className="text-lg text-icon-green cursor-pointer"
                            onClick={() => openModal(event.playerIdData, event?.managerInsights)}
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
    </div>
  );
};

export default LiveEvents;
