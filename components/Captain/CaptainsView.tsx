"use client";
import React, { useEffect, useRef, useState } from "react";
import WhiteCard from "../Card/WhiteCard";
import CaptainCard from "./CaptainCard";
import Popup from "../Modals/Popup";
import PlayerDetail from "../Common/PlayerDetail";
import { FPLHistory } from "@/lib/types/FPLPlayerHistory";
import { Element } from "@/lib/types/FPLStatic";

type captainPicksType = {
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
};

const CaptainsView = ({ leagueId }: { leagueId: string }) => {
  const [captainPicks, setCaptainPicks] = useState<captainPicksType[]>([]);
  const [modalData, setModalData] = useState<captainPicksType | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerElement, setplayerElement] = useState<Element>();
  const [ownedManagers, setOwnedManagers] = useState<FPLResult[]>([]);
  const [gw, setGw] = useState(1);

  const [isModalOpen, setModalOpen] = useState(false); // State for modal visibility

  const captainContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouchX, setLastTouchX] = useState(0);

  const openModal = () => {
    setModalOpen(true);
    document.body.style.overflow = "hidden";
  }; // Function to open the modal

  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = "auto";
  }; // Function to close the modal

  const handleInfoClick = (id: number, playerElement: Element, ownedUsers: FPLResult[], gw: number) => {
    setplayerElement(playerElement);
    setOwnedManagers(ownedUsers);
    setGw(gw);
    openModal();
  };

  useEffect(() => {
    const fetchData = async () => {

      const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const NEXT_API_BASE_URL = `${BASE_URL}/api/fetch`;

      try {
        if (captainPicks.length === 0) {
          setLoading(true); // Start loading state
          const res = await fetch(`${NEXT_API_BASE_URL}/getCaptainView/${leagueId}`);
          if (!res.ok) {
            throw new Error(`Error: ${res.status}`);
          }
          const data: captainPicksType[] = await res.json();

          setCaptainPicks(data); // Set fetched data
        }
      } catch (error) {
        console.error("Error fetching captain picks:", error);
      } finally {

        setLoading(false); // End loading state
      }
    };

    if (leagueId) {
      fetchData(); // Fetch data only if leagueId exists
    }
  }, [leagueId]);


  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && captainContainerRef.current) {
      captainContainerRef.current.scrollLeft -= e.movementX;
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setLastTouchX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging && captainContainerRef.current) {
      const touchX = e.touches[0].clientX;
      captainContainerRef.current.scrollLeft -= touchX - lastTouchX;
      setLastTouchX(touchX);
    }
  };

  if (loading) {
    return (
      <WhiteCard>
        <p>Loading...</p>
      </WhiteCard>
    );
  }

  return (
    <div className="max-w-full overflow-x-hidden">
      <h2 className="text-xl text-white font-bold mb-1">Top Captain</h2>
      <div
        className="flex gap-5 py-3 overflow-x-auto"
        ref={captainContainerRef}

      >
     

          {captainPicks.map((captainPick, index) => (
            <CaptainCard
              key={index}
              captainPick={captainPick}
              infoClick={handleInfoClick}
            />
          ))}

      </div>

      {/* Modal Component */}
      <Popup isOpen={isModalOpen} onClose={closeModal}>
        {/* Popup */}
        <PlayerDetail isOpen={isModalOpen} onClose={closeModal} playerData={playerElement as Element} ownedUsers={ownedManagers} gw={gw} />
        {/* Popup */}
      </Popup>
      {/* Modal Component */}
    </div>
  );
};

export default CaptainsView;
