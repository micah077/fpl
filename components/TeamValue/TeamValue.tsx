"use client";
import React, { useState, useEffect } from "react";
import MainCard from "../Card/MainCard";
import { FaArrowRightLong } from "react-icons/fa6";
import { BsBank } from "react-icons/bs";
import { FaLongArrowAltUp, FaLongArrowAltDown } from "react-icons/fa";
import Popup from "../Modals/Popup";
import { MdClose } from "react-icons/md";

interface TeamValueData {
  userId: number;
  userName: string | undefined;
  teamValue: number;
  trendValue: number;
  trend: number;
  bank: number;
}

const TeamValue = ({ leagueId }: { leagueId: string }) => {
  const [isModalOpen, setModalOpen] = useState(false); // State for modal visibility
  const [teamValueData, setTeamValueData] = useState<TeamValueData[]>([]); // State for team value data
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<boolean>(false);

  const openModal = () => {
    setModalOpen(true);
    document.body.style.overflow = "hidden";
  }; // Function to open the modal
  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = "auto";
  }; // Function to close the modal




  useEffect(() => {
    if (leagueId) {
      fetchData();
    }

    fetchData();
  }, [leagueId]);

  const fetchData = async () => {
    const BASE_URL =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const NEXT_API_BASE_URL = `${BASE_URL}/api/fetch`;

    try {
      setIsLoading(true)
      setError(false)
      const res = await fetch(
        `${NEXT_API_BASE_URL}/getTeamValue/${leagueId}`
      );
      const data: TeamValueData[] = await res.json();
      setTeamValueData(data);
    } catch (error) {
      console.error("Error fetching value:", error);
      setError(true)
    } finally {
      setIsLoading(false)
    }
  };


  return (
    <div className="col-span-2">
      <MainCard  error={error} loader={isLoading} onRefresh={()=>fetchData()} title={`Team Value`}>
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="text-sm text-primary-gray">
              <tr className="shadow-primary">
                <th className="px-4 py-2 border-r border-off-white text-left">
                  Username
                </th>
                <th className="px-4 py-2 border-r border-off-white">
                  Team Value
                </th>
                <th className="px-4 py-2 border-r border-off-white">Trend</th>
                <th className="px-4 py-2">Bank</th>
              </tr>
            </thead>

            <tbody className="text-sm text-secondary-gray text-center font-medium">
              {teamValueData && (
                Array.isArray(teamValueData) && teamValueData.slice(0, 7).map((player, index) => (
                  <tr
                    className="border-b border-off-white relative"
                    key={player.userId}
                  >
                    <td className="px-4 py-2 text-left">{player.userName}</td>
                    <td className="px-4 py-2">{player.teamValue / 10}M</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-center items-center gap-2">
                        <span>{(player.teamValue - player.trendValue) / 10}M</span>
                        {player.teamValue - player.trend < 0 ? (
                          <FaLongArrowAltDown className="text-icon-red" />
                        ) : (
                          <FaLongArrowAltUp className="text-icon-green" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 flex justify-center items-center gap-2">
                      <div className="flex justify-center items-center gap-2">
                        <span>{player.bank / 10}M</span>
                        <BsBank />
                      </div>
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
        {teamValueData.length > 6 && (
          <div className="flex justify-end items-center my-3 px-6">
            <button
              className="text-sm text-primary-gray font-medium flex items-center gap-1"
              onClick={openModal}
            >
              More <FaArrowRightLong />
            </button>
          </div>
        )}
      </MainCard>

      {/* Modal Component */}
      <Popup isOpen={isModalOpen} onClose={closeModal}>
        {/* Popup */}
        <div
          className={`w-[90%] md:w-4/5 lg:w-1/2 fixed left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1010] bg-white shadow-lg rounded-lg overflow-hidden ${isModalOpen
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
            <h2>Team Value</h2>
            <MdClose className="text-xl cursor-pointer" onClick={closeModal} />
          </div>
          {/* Popup head */}

          {/* Popup content */}
          <div className="h-[85vh] overflow-auto">
            <table className="w-full">
              <thead className="text-sm text-primary-gray">
                <tr className="shadow-primary">
                  <th className="px-4 py-2 border-r border-off-white text-left">
                    Username
                  </th>
                  <th className="px-4 py-2 border-r border-off-white">
                    Team Value
                  </th>
                  <th className="px-4 py-2 border-r border-off-white">Trend</th>
                  <th className="px-4 py-2">Bank</th>
                </tr>
              </thead>

              <tbody className="text-sm text-secondary-gray text-center font-medium">
                {
                  Array.isArray(teamValueData) && teamValueData.slice(0, 7).map((player, index) => (
                    <tr
                      className="border-b border-off-white relative"
                      key={player.userId}
                    >
                      <td className="px-4 py-2 text-left">{player.userName}</td>
                      <td className="px-4 py-2">{player.teamValue / 10}M</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center items-center gap-2">
                          <span>{(player.teamValue - player.trendValue) / 10}M</span>
                          {player.teamValue - player.trend < 0 ? (
                            <FaLongArrowAltDown className="text-icon-red" />
                          ) : (
                            <FaLongArrowAltUp className="text-icon-green" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 flex justify-center items-center gap-2">
                        <div className="flex justify-center items-center gap-2">
                          <span>{player.bank / 10}M</span>
                          <BsBank />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {/* Popup content */}
        </div>
        {/* Popup */}
      </Popup>
      {/* Modal Component */}
    </div>
  );
};

export default TeamValue;
