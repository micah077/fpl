"use client";
import React, { useState } from "react";
import MainCard from "../Card/MainCard";
import { FaArrowRightLong } from "react-icons/fa6";
import { MdClose, MdInfoOutline } from "react-icons/md";
import Image from "next/image";
import Popup from "../Modals/Popup";
import PlayerDetail from "../Common/PlayerDetail";

const TopDifferential = () => {
  const [isModalOpen, setModalOpen] = useState(false); // State for modal visibility
  const [isMoreModalOpen, setMoreModalOpen] = useState(false); // State for modal visibility
  const [isFromMoreModal, setFromMoreModal] = useState(false); // State for modal controlling

  const openModal = () => {
    setModalOpen(true);
    document.body.style.overflow = "hidden";
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

  const players = [
    {
      id: 1,
      percentage: 80,
      name: "Cristiano Ronaldo",
      points: 30,
    },
    {
      id: 2,
      percentage: 77,
      name: "Lionel Messi",
      points: 25,
    },
    {
      id: 3,
      percentage: 70,
      name: "Neymar Jr",
      points: 20,
    },
    {
      id: 4,
      percentage: 82,
      name: "Kiliyan Mbappe",
      points: 30,
    },
    {
      id: 5,
      percentage: 80,
      name: "Trent Alexander Arnold",
      points: 26,
    },
    {
      id: 6,
      percentage: 82,
      name: "Vinicius Jr",
      points: 30,
    },
    {
      id: 7,
      percentage: 70,
      name: "Robert Lewandoski",
      points: 15,
    },
    {
      id: 8,
      percentage: 75,
      name: "Erling Halaand",
      points: 20,
    },
    {
      id: 9,
      percentage: 78,
      name: "Jude Bellingham",
      points: 26,
    },
    {
      id: 10,
      percentage: 75,
      name: "Luka Madric",
      points: 22,
    },
  ];

  // Create a copy of the data array and sort it in descending order
  const sortedData = players
    .slice()
    .sort((a, b) => b.percentage - a.percentage);

  // Formate percentage
  const getFormatedPercentage = (percentage: number) => {
    const fraction = (percentage / 100) * 10;
    return `(${fraction.toFixed(1)}/10)`;
  };

  return (
    <>
      {/* Main content */}
      <MainCard title={`Most Owned Differential Player`}>
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
              {sortedData.slice(0, 5).map((player, index) => (
                <tr
                  className="border-b border-off-white relative"
                  key={player.id}
                >
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span>{player.percentage}%</span>
                      <span className="text-xs">
                        {getFormatedPercentage(player.percentage)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden relative">
                        <Image
                          src="/player.png"
                          alt="Player Image"
                          fill
                          objectFit="cover"
                          objectPosition="top"
                        />
                      </div>
                      <span className="text-left">{player.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">{player.points}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center items-center">
                      <MdInfoOutline
                        className="text-lg text-icon-green cursor-pointer"
                        onClick={openModal}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sortedData.length > 5 && (
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
        <div></div>
        {/* Popup 
        <PlayerDetail isOpen={isModalOpen} onClose={closeModal} />
        {/* Popup */}
      </Popup>
      {/* Modal Component */}

      {/* More Modal Component */}
      <Popup isOpen={isMoreModalOpen} onClose={closeMoreModal}>
        {/* Popup 
        {isFromMoreModal ? (
          <PlayerDetail
            isOpen={isMoreModalOpen}
            onClose={() => setFromMoreModal(false)}
          />
        ) : ( */}
          <div
            className={`w-[90%] md:w-4/5 lg:w-1/2 fixed left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1010] bg-white shadow-lg rounded-lg overflow-hidden ${
              isMoreModalOpen
                ? "top-[50%] visible opacity-100"
                : "top-[40%] invisible opacity-0"
            } transition duration-500`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popup head */}
            <div
              className={
                "py-3 px-4 rounded-t-lg bg-secondary-gradient text-primary-gray font-bold flex items-center justify-between"
              }
            >
              <h2>Most Owned Differential Player</h2>
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
                  {sortedData.map((player) => (
                    <tr
                      className="border-b border-off-white relative"
                      key={player.id}
                    >
                      <td className="px-4 py-2">
                        <div className="flex flex-col">
                          <span>{player.percentage}%</span>
                          <span className="text-xs">
                            {getFormatedPercentage(player.percentage)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden relative">
                            <Image
                              src="/player.png"
                              alt="Player Image"
                              fill
                              objectFit="cover"
                              objectPosition="top"
                            />
                          </div>
                          <span className="text-left">{player.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">{player.points}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-center items-center">
                          <MdInfoOutline
                            className="text-lg text-icon-green cursor-pointer"
                            onClick={() => setFromMoreModal(true)}
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
          

        {/* Popup */}
      </Popup>
      {/* More Modal Component */}
    </>
  );
};

export default TopDifferential;
