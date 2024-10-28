"use client";
import React, { useEffect, useRef, useState } from "react";
import MainCard from "../Card/MainCard";
import Image from "next/image";
import { MdClose, MdInfoOutline } from "react-icons/md";
import { FPLHistory } from "@/lib/types/FPLPlayerHistory";
import Popup from "../Modals/Popup";
import {
  BarChart,
  Bar,
  LabelList,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Text,
  Rectangle,
} from "recharts";
import { RiRectangleFill } from "react-icons/ri";
import { FaUsers, FaBullseye } from "react-icons/fa";
import { FaUsersRectangle, FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';

interface userChipData {
  managerData: FPLManager;
  userGW: FPLUserGameweek;
  playerGWData: FPLHistory | null;
  playerData: Element | null;
}

interface chipData {
  userData: Record<string, userChipData[]>;
  gw: number;
  userIds: number[];
  leagueData: FPLLeague;
  graphData: GraphData;

}
interface GraphData {
  [key: string]: {
      name: string;
      point: number;
      status: string;
  }[];
}

interface GraphDataDisplay {
  name: string;
  point: number;
  status: string;
}


const Chips = ({ leagueId }: { leagueId: string }) => {

  const divRef = useRef<HTMLDivElement | null>(null);
  const [chartDimensions, setChartDimensions] = useState({
    width: divRef?.current?.offsetWidth,
    height: 325,
  });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [barWidth, setBarWidth] = useState<number | null>(null);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  const [isModalOpen, setModalOpen] = useState(false); // State for modal visibility
  const [chipData, setChipData] = useState<chipData | null>(null); // State for chip data
  const [selectedChip, setSelectedChip] = useState<string | "">(""); // State for selected chip
  const [graphData, setGraphData] = useState<GraphDataDisplay[]>([]);

  const openModal = (chip: string) => {
    
    const sortedData = chipData?.graphData[chip].sort((a, b) => b.point - a.point);
    setSelectedChip(chip);
    setGraphData(sortedData as GraphDataDisplay[]);
    setModalOpen(true);
    document.body.style.overflow = "hidden";
  }; // Function to open the modal

  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = "auto";
  }; // Function to close the modal

  // calculate average points of users who played the chip 
  const calculateAveragePoints = (chipData: chipData, chip: string) => {

    // for free-hit or wildcard chip, calculate average of points of users who played the chip
    if (chip === "freehit" || chip === "wildcard" || chip === "bboost")  {
      const usersData = chipData?.userData[chip];
      const totalPoints = usersData?.reduce((acc, user) => acc + user?.userGW?.entry_history?.points, 0);
      return (totalPoints / usersData?.length).toFixed(1);
    }

    // for triple captain chip, calculate average of points of the captain for the selected user, the gw the chip was played
    if (chip === "3xc") {
      // loop through the different playerGWdata and get the average points of the captain
      const usersData = chipData?.userData[chip];

      // get total points by getting total_points from PlayerGWData
      const totalPoints = usersData?.reduce((acc, user) => {
        const playerGWDataPoints  = user?.playerGWData?.total_points as number;
        return acc + playerGWDataPoints;
      }, 0);

      
      return (totalPoints / usersData?.length).toFixed(1);
    }
  }


  // calculate average points of users who played the chip 
  const getChipImg = (chipData: chipData, chip: string) => {
    // if anybody has the selected chip activated this gw, update the image to chip + "-active"
    const activatedThisGW = chipData?.graphData[chip]?.filter(user => user.status === "Current")?.length > 0 
    if (activatedThisGW) {
      return "/" + chip + "-active.png"
    } else {
      return "/" + chip + ".png"
    }
  }
    


   // Fetching data
   useEffect(() => {
    const fetchData = async () => {
    
      const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const NEXT_API_BASE_URL = `${BASE_URL}/api/fetch`;

        try {
          const res = await fetch(`${NEXT_API_BASE_URL}/getChips/${leagueId}`);
          if (!res.ok) {
            throw new Error(`Error fetching transfer stats: ${res.statusText}`);
          }
          const data: chipData = await res.json()
          setChipData(data);

          

        } catch (error) {
          console.error("Error fetching transfer data:", error);
        } finally {   
          
        } 

      }
  
    if (leagueId) {
      fetchData(); // Fetch data only if leagueId exists
    }
  }, [leagueId]); // Ensure the effect triggers only when leagueId changes

  const chips = [
    {
      id: 1,
      name: "Wild Card",
      webidentifier: "wildcard",
      imgUrl: "/wildcard.png",
      value: 12,
    },
    {
      id: 2,
      name: "Free Hit",
      webidentifier: "freehit",
      imgUrl: "/freehit.png",
      value: 15,
    },
    {
      id: 3,
      name: "Bench Boost",
      webidentifier: "bboost",
      imgUrl: "/bboost.png",
      value: 16,
    },
    {
      id: 4,
      name: "Triple Cap",
      webidentifier: "3xc",
      imgUrl: "/3xc.png",
      value: 10,
    },
  ];


  // Create a copy of the data array and sort it in descending order based on point
  

  const CustomLabel = (props: any) => {
    const { x, y, height, name, index } = props;
    const offsetX = x - 6;
    const offsetY = y + height - 5;
    const angleC = -90;

    return (
      <Text
        x={offsetX}
        y={offsetY}
        angle={angleC}
        textAnchor="start"
        fill="#606060"
        style={{ fontSize: "12px", fontWeight: "500" }}
        opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
      >
        {name}
      </Text>
    );
  };

  const CustomTooltip = (props: any) => {
    const { payload, active } = props;

    if (active && payload && payload?.length) {
      return (
        <div className="bg-light-black text-off-white text-xs p-4 rounded-md">
          <p className="mb-1">{payload[0]?.payload?.name}</p>
          <p>
            Point: <span>{payload[0]?.payload?.point}</span>
          </p>
          <p>
            Status: <span>{payload[0]?.payload?.status}</span>
          </p>
        </div>
      );
    }

    return null;
  };

  const findChip = (webidentifier: string) => {
    return chips.find(chip => chip.webidentifier.toString() === webidentifier);
  }

  const getColor = (status: string) => {
    if (status === "Yes") {
      return "#FFC107";
    } else if (status === "Current") {
      return "#8FED80";
    } else {
      return "#c0c0c2";
    }
  };

  const handleMouseOver = (index: number) => setActiveIndex(index);

  const handleMouseOut = () => setActiveIndex(null);

  const handlePrevClick = () => {
    if (divRef.current && barWidth) {
      divRef.current.scrollBy({ left: -barWidth, behavior: "smooth" });

    }
  };

  const handleNextClick = () => {
    if (divRef.current && barWidth) {
      divRef.current.scrollBy({ left: barWidth, behavior: "smooth" });

    }
  };

  const updateScrollButtons = () => {
    if (divRef.current) {
      
      const { scrollLeft, scrollWidth, clientWidth } = divRef.current;

      setScrollLeft(scrollLeft); // Update left scroll position
      //  setCanScrollRight(scrollLeft + clientWidth < scrollWidth); // Check if we can scroll right
      if ( scrollWidth <= (scrollLeft + clientWidth) + 20 ) {
        
        setCanScrollRight(false);
      } else {
        setCanScrollRight(true);
      };
    }
  };



  useEffect(() => {
    const updateChartDimensions = () => {
      if (divRef.current) {
        let width;
        if (graphData?.length > 10) {
          const count = graphData?.length - 10;
          width = divRef.current.offsetWidth + 70 * count;
        } else {
          width = divRef.current.offsetWidth;
        }

        setChartDimensions({ ...chartDimensions, width });
        setBarWidth(width / graphData.length);
      }
    };

    updateChartDimensions();

    window.addEventListener("resize", updateChartDimensions);
    divRef.current?.addEventListener("scroll", updateScrollButtons); // Listen for scroll events

    return () => {
      window.removeEventListener("resize", updateChartDimensions);
      divRef.current?.removeEventListener("scroll", updateScrollButtons); // Clean up event listener
    };
  }, [graphData]);


  return (
    <div className="flex-1 flex-shrink-0">
        <MainCard title={`Chips`}>
          <div className="flex-1 p-3 grid grid-cols-1 justify-items-center gap-4">
            {chips.map((chip) => (
          <div
            className="w-full px-3 py-2 rounded-md shadow-sm flex justify-between items-center gap-2"
            key={chip.id}
          >
            <Image
              src={getChipImg(chipData as chipData, chip.webidentifier)}
              alt={chip.webidentifier || "chips"} 
              width={60}
              height={60}

            />

            <div className="flex-1">
              <div className="flex justify-between items-center gap-1">
            <h3 className="text-primary-gray font-medium">{chip.name}</h3>
            <MdInfoOutline
              className={`text-lg ${chipData?.userData[chip.webidentifier]?.filter(userChip => userChip.userGW.entry_history.event === chipData?.gw).length ? "text-icon-green cursor-pointer" : "text-secondary-gray"}`}
              onClick={() => {
                if ((chipData && ((chipData?.userData[chip.webidentifier]?.length) / (chipData?.userIds?.length))*100 || 0) > 0) {
                  openModal(chip.webidentifier);
                }
              }}
            />
              </div>
              <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-1 text-sm">
              <FaUsers className="flex-shrink-0 text-secondary-gray" />
              <p className="text-[#474747] font-medium">{(chipData?.userData[chip.webidentifier]?.filter(userChip => userChip.userGW.entry_history.event === chipData?.gw).length  || 0).toFixed(0)} </p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <FaUsersRectangle className="flex-shrink-0 text-secondary-gray" />
              <p className="text-[#474747] font-medium">{(chipData && ((chipData?.userData[chip.webidentifier]?.length) / (chipData?.userIds?.length))*100 || 0).toFixed(0)} %</p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <FaBullseye className="flex-shrink-0 text-secondary-gray" />
              <p className="text-[#474747] font-medium">{calculateAveragePoints(chipData as chipData,chip.webidentifier)}</p>
            </div>
              </div>
            </div>
          </div>
            ))}
          </div>
        </MainCard>

        {/* Modal Component */}
      <Popup isOpen={isModalOpen} onClose={closeModal}>
        {/* Popup */}
        <div
          className={`w-[90%] md:w-3/5 lg:w-2/5 fixed left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1010] bg-white shadow-lg rounded-lg overflow-hidden ${
            isModalOpen
              ? "top-[50%] visible opacity-100"
              : "top-[40%] invisible opacity-0"
          } transition duration-500`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Popup head */}
          <div
            className={
              "h-20 py-3 px-4 rounded-t-lg bg-third-gradient bg-no-repeat bg-right text-primary-gray font-bold flex justify-between"
            }
          >
            <h2 >{findChip(selectedChip as string)?.name }</h2>
            <MdClose className="text-xl cursor-pointer" onClick={closeModal} />
          </div>
          {/* Popup head */}

          {/* Popup content */}
          <div className="relative">
            {/* Content head */}
            <div className="w-[96%]  p-3 flex items-center gap-3 lg:gap-5 rounded-lg border border-[#f4f4f4] bg-white shadow-sm  absolute -top-11 left-1/2 transform -translate-x-1/2 z-[60]">
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="flex flex-col md:flex-row items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-third-gradient flex justify-center items-center">
                    <MemoryOutlinedIcon />
                  </div>
                  <p className="flex flex-col items-center md:items-start">
                    <span className="text-[#474747] font-medium">
                    {(chipData?.userData[selectedChip]?.filter(userChip => userChip.userGW.entry_history.event === chipData?.gw).length  || 0).toFixed(0)} 
                    </span>
                    <span className="text-[#7e7e7e] text-xs font-medium">
                      GW activated chip
                    </span>
                  </p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-third-gradient  flex justify-center items-center">
                    <PeopleAltOutlinedIcon />
                  </div>
                  <p className="flex flex-col items-center md:items-start">
                    <span className="text-[#474747] font-medium">{(chipData && ((chipData?.userData[selectedChip]?.length) / (chipData?.userIds?.length))*100 || 0).toFixed(0)} %</span>
                    <span className="text-[#7e7e7e] text-xs font-medium">
                      in league used chip
                    </span>
                  </p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-third-gradient flex justify-center items-center">
                    <AutoGraphOutlinedIcon />
                  </div>
                  <p className="flex flex-col items-center md:items-start">
                    <span className="text-[#474747] font-medium">{calculateAveragePoints(chipData as chipData, selectedChip)}</span>
                    <span className="text-[#7e7e7e] text-xs font-medium">
                      Average Points
                    </span>
                  </p>
                </div>
              </div>
            </div>
            {/* Content head */}
            {/* Content body */}
            <div ref={divRef}>
              {
                graphData && (

              <div>
                <div className="w-full flex justify-center gap-3 pt-10">
                  <div className="flex items-center gap-1">
                    <RiRectangleFill className="text-sm text-[#FFC107]" />
                    <p className="text-sm text-secondary-gray">Played earlier</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <RiRectangleFill className="text-sm text-[#8FED80]" />
                    <p className="text-sm text-secondary-gray">Activated this GW</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <RiRectangleFill className="text-sm text-[#c0c0c2]" />
                    <p className="text-sm text-secondary-gray">No</p>
                  </div>
                </div>

                {scrollLeft > 0 && (
                <button
                  onClick={handlePrevClick}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full shadow-primary"
                  style={{ background: "rgba(0, 0, 0, 0.15)" }}
                >
                  <FaArrowLeft className="text-lg text-primary-gray" />
                </button>
              )}

                <div className="w-full p-2 overflow-hidden" ref={divRef}>
                  
                  <BarChart
                    width={chartDimensions.width}
                    height={chartDimensions.height}
                    data={graphData}
                    barSize={14}
                    margin={{
                      top: 30,
                      right: 10,
                      left: 10,
                      bottom: 5,
                    }}
                  >
                    <Tooltip cursor={false} content={<CustomTooltip />} />
                    <Bar
                      dataKey="point"
                      radius={[10, 10, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={500}
                      onMouseLeave={handleMouseOut}
                    >
                      {graphData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getColor(entry.status)}
                          opacity={
                            activeIndex === null || activeIndex === index
                              ? 1
                              : 0.3
                          }
                          onMouseOver={() => handleMouseOver(index)}
                        />
                      ))}
                      <LabelList dataKey="point" position="top" />
                      <LabelList content={<CustomLabel />} />
                    </Bar>
                  </BarChart>
                </div>
                {canScrollRight && (
                <button
                  onClick={handleNextClick}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full shadow-primary"
                  style={{ background: "rgba(0, 0, 0, 0.15)" }}
                >
                  <FaArrowRight className="text-lg text-primary-gray" />
                </button>
              )}
              </div>
              )}  
            {/* Content body */}
          </div>
          
          {/* Popup content */}
        </div>
        </div>
        {/* Popup */}
      </Popup>
      {/* Modal Component */}
    </div>
  );
};

export default Chips;