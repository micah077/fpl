"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoIcon from "@mui/icons-material/Info";
import { getImageLink } from "@/lib/utils/FPLFetch";
import MainCard from "../Card/MainCard";

import { MdClose, MdInfoOutline } from "react-icons/md";
import { FaArrowRightLong, FaArrowLeftLong } from "react-icons/fa6";
import Popup from "../Modals/Popup";

interface TransferDetails {
  photo: string;
  users: string[];
}

type Transfers = [string, TransferDetails][];

const   TransferInOut = ({
  leagueId,
  inOut,
}: {
  leagueId: string;
  inOut: string;
}) => {
  const [transfers, setTransfers] = useState<Transfers>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<number | null>(null);
  const [isFromMoreModal, setFromMoreModal] = useState(false);

  const [isModalOpen, setModalOpen] = useState(false); // State for modal visibility

  const openModal = () => {
    setModalOpen(true);
    document.body.style.overflow = "hidden";
  }; // Function to open the modal
  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = "auto";
  }; // Function to close the modal

  useEffect(() => {


    if (leagueId && inOut) {
      fetchData(); // Fetch data only if both leagueId and inOut are valid
    }
  }, [leagueId, inOut]); // Ensure the effect only triggers when leagueId or inOut changes

  const fetchData = async () => {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const NEXT_API_BASE_URL = `${BASE_URL}/api/fetch`;

    try {
      setLoading(true); // Start loading state
      setError(false);
      const res = await fetch(`${NEXT_API_BASE_URL}/getTransferInOut/${inOut}/${leagueId}`);
      if (!res.ok) {
        throw new Error(`Error fetching transfer data: ${res.statusText}`);
      }
      const data: UserTransfer = await res.json();
      setTransfers(data);
    } catch (error) {
      console.error("Error fetching transfer data:", error);
      setError(true);
    } finally {
      setLoading(false); // End loading state
    }
  };


  return (
    <div className="w-full">
      <MainCard error={error} onRefresh={() => fetchData()} loader={loading} title={`Top Transfers ${inOut}`}>
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="text-sm text-primary-gray">
              <tr className="shadow-primary">
                <th className="hidden md:table-cell px-4 py-2"></th>
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2 border-r border-off-white">Player</th>
                <th className="px-4 py-2 border-r border-off-white">
                  # of Users
                </th>
                <th className="px-4 py-2">Info</th>
              </tr>
            </thead>

            <tbody className="text-sm text-secondary-gray text-center font-medium">
              {transfers.slice(0, 5).map(([player, details], index) => (
                <tr className="border-b border-off-white relative" key={player}>
                  <td className="hidden md:table-cell px-4 py-2">
                    {index + 1}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center items-center">
                      {inOut === "In" ? (
                        <FaArrowRightLong className="text-icon-green" />
                      ) : (
                        <FaArrowLeftLong className="text-icon-red" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <Image
                        src={getImageLink(details.photo)}
                        alt={player}
                        width={40}
                        height={40}
                        className="rounded-full"
                        style={{
                          maxWidth: "100%",
                          height: "auto",
                        }}
                      />
                      <span className="text-left">{player}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">{details.users.length}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center items-center">
                      <MdInfoOutline
                        className="text-lg text-icon-green cursor-pointer"
                        onMouseEnter={() => {
                          setFromMoreModal(false);
                          setShowInfo(index);
                        }}
                        onMouseLeave={() => setShowInfo(null)}
                      />
                      {showInfo === index && !isFromMoreModal && (
                        <ul
                          className={`bg-secondary-green text-off-white text-[10px] text-start p-3 rounded-md space-y-1 absolute ${showInfo === 4 ? "bottom-2" : "top-2"
                            } right-12 z-[5]`}
                        >
                          {details.users.map((user, idx) => (
                            <li key={idx}>{user}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end items-center my-3 px-6">
          <button
            className="text-sm text-primary-gray font-medium flex items-center gap-1"
            onClick={openModal}
          >
            More <FaArrowRightLong />
          </button>
        </div>
      </MainCard>

      {/* Modal Component */}
      <Popup isOpen={isModalOpen} onClose={closeModal}>
        {/* Popup */}
        <div
          className={`w-[90%] md:w-3/5 lg:w-2/5 fixed left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1010] bg-white shadow-lg rounded-lg overflow-hidden ${isModalOpen
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
            <h2>Top Transfers {inOut}</h2>
            <MdClose className="text-xl cursor-pointer" onClick={closeModal} />
          </div>
          {/* Popup head */}

          {/* Popup content */}
          <div className="h-[70vh] overflow-auto">
            <table className="w-full">
              <thead className="text-sm text-primary-gray bg-white sticky top-0 z-10">
                <tr className="shadow-primary">
                  <th className="hidden md:table-cell">
                    <div className="px-4 py-2"></div>
                  </th>
                  <th>
                    <div className="px-4 py-2"></div>
                  </th>
                  <th>
                    <div className="px-4 py-2 border-r border-off-white">
                      Player
                    </div>
                  </th>
                  <th>
                    <div className="px-4 py-2 border-r border-off-white">
                      # of Users
                    </div>
                  </th>
                  <th>
                    <div className="px-4 py-2">Info</div>
                  </th>
                </tr>
              </thead>

              <tbody className="text-sm text-secondary-gray text-center font-medium">
                {transfers.map(([player, details], index) => (
                  <tr
                    className="border-b border-off-white relative"
                    key={player}
                  >
                    <td className="px-4 py-2 hidden md:table-cell">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-center items-center">
                        {inOut === "In" ? (
                          <FaArrowRightLong className="text-icon-green" />
                        ) : (
                          <FaArrowLeftLong className="text-icon-red" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <Image
                          src={getImageLink(details.photo)}
                          alt={player}
                          width={40}
                          height={40}
                          className="rounded-full"
                          style={{
                            maxWidth: "100%",
                            height: "auto",
                          }}
                        />
                        <span className="">{player}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">{details.users.length}</td>
                    <td className="px-4 py-2">
                      <div className="group flex justify-center items-center">
                        <MdInfoOutline
                          className="text-lg text-icon-green cursor-pointer"
                          onMouseEnter={() => {
                            setFromMoreModal(true);
                            setShowInfo(index);
                          }}
                          onMouseLeave={() => setShowInfo(null)}
                        />
                        
                          <ul
                            className={`group-hover:inline-block hidden bg-secondary-green text-off-white text-[10px] z-10 text-start p-3 rounded-md space-y-1 absolute ${showInfo === transfers.length - 1
                                ? "bottom-2"
                                : "top-2"
                              } right-12 `}
                          >
                            {details.users.map((user, idx) => (
                              <li key={idx}>{user}</li>
                            ))}
                          </ul>
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

export default TransferInOut;
