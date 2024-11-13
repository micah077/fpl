"use client";
import React, { useEffect, useRef, useState } from "react";
import MainCard from "../Card/MainCard";
import {
  BarChart,
  Bar,
  LabelList,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Text,
  ResponsiveContainer,
} from "recharts";
import Popup from "../Modals/Popup";
import { MdClose } from "react-icons/md";
import TransferCard from "../Card/TransferCard";
import Image from "next/image";
import { RiRectangleFill } from "react-icons/ri";
import { PoBAutoSubs } from "@/lib/types/FPLPoBAutosub";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

interface graphData {
  name: string;
  points_on_bench: number;
  auto_sub: number;
}


const BenchAndAutoSub = ({ leagueId }: { leagueId: string }) => {
  const divRef = useRef<HTMLDivElement | null>(null);
  const [chartDimensions, setChartDimensions] = useState({
    width: divRef?.current?.offsetWidth,
    height: 325,
  });
  
  const [isModalOpen, setModalOpen] = useState(false); // State for modal visibility
  const [poBAutoSub, setPoBAutoSub] = useState<PoBAutoSubs[]>([]); // State for bench data
  const [graphData, setGraphData] = useState<graphData[]>([]); // State for graph data
  const [selectedManager, setSelectedManager] = useState<PoBAutoSubs>(); // State for selected manager
  const [selectedPoB, setSelectedPoB] = useState<number>(0); // State for selected PoB
  const [selectedAutoSub, setSelectedAutoSub] = useState<number>(0); // State for selected AutoSub
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [barWidth, setBarWidth] = useState<number | null>(null);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

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
    const { payload, label, active } = props;
    
    if (active && payload && payload?.length) {
      return (
        <div className="bg-light-black text-off-white text-sm p-4 rounded-md">
          <p className="mb-1">{payload[0]?.payload?.name}</p>
          <p  className="text-xs capitalize text-[#20FECD]">
            Points on Bench: <span>{payload[0].value}</span>
          </p>
          <p className="text-xs capitalize text-[#FFC107]">
            Autosub points: <span>{payload[1]?.value}</span>
          </p>
        </div>
      );
    }

    return null;
  };

  // Fetching data
  useEffect(() => {
    
  
    if (leagueId) {
      fetchData(); // Fetch data only if leagueId exists
    }
  }, [leagueId]); // Ensure the effect triggers only when leagueId changes

  const fetchData = async () => {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const NEXT_API_BASE_URL = `${BASE_URL}/api/fetch`;

      try {
        setIsLoading(true)
        setError(false)
        const res = await fetch(`${NEXT_API_BASE_URL}/getPoBAndAutoSub/${leagueId}`);
        if (!res.ok) {
          throw new Error(`Error fetching transfer stats: ${res.statusText}`);
        }
        const data: PoBAutoSubs[] = await res.json()
        
        setPoBAutoSub(data); // Update state with sorted data

        // Create graph data
        const graphData = data.map((item) => {
          return {
            name: item.player_name,
            points_on_bench: item.pointsOnBench.reduce((acc, curr) => acc + curr.elementGWdata.total_points, 0),
            auto_sub: item.autoSubs.reduce((acc, curr) => acc + curr.elementIn.elementGWdata.total_points , 0),
            manager_id: item.userId
          };
        }); 
        const sortedData = graphData.slice().sort((a, b) => b.points_on_bench - a.points_on_bench);


        setGraphData(sortedData);

      } catch (error) {
        console.error("Error fetching transfer data:", error);
        setError(true)
      }finally {
        setIsLoading(false)
      }

    }

  // Create a copy of the data array and sort it in descending order based on point



  const handleBarClick = (data: any) => {
    const managerData = poBAutoSub.find((item) => item.userId === data.manager_id);
    setSelectedManager(managerData);
    setSelectedPoB(data.points_on_bench);
    setSelectedAutoSub(data.auto_sub);
    openModal();
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
      if (divRef.current ) {
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
    updateScrollButtons();

    window.addEventListener("resize", updateChartDimensions);
    divRef.current?.addEventListener("scroll", updateScrollButtons); // Listen for scroll events

    return () => {
      window.removeEventListener("resize", updateChartDimensions);
      divRef.current?.removeEventListener("scroll", updateScrollButtons); // Clean up event listener
    };
  }, [graphData]);


  

  return (
    <div className="w-full lg:w-3/4">
      <MainCard  error={error} loader={isLoading} onRefresh={()=>fetchData()} title={`Point of bench and auto sub`}>
        <div className="flex-1 relative">
          <div className="w-full flex justify-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <RiRectangleFill className="text-sm text-[#20FECD]" />
              <p className="text-sm text-secondary-gray">Points on Bench</p>
            </div>
            <div className="flex items-center gap-1">
              <RiRectangleFill className="text-sm text-[#FFC107]" />
              <p className="text-sm text-secondary-gray">Autosub</p>
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
              barGap={0}
              margin={{
                top: 30,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <Tooltip cursor={false} content={<CustomTooltip />} />
              <Bar
                className="cursor-pointer"
                dataKey="points_on_bench"
                // fill="#20FECD"
                // opacity={0.2}
                radius={[10, 10, 0, 0]}
                isAnimationActive={true}
                animationDuration={500}
                onClick={handleBarClick}
                onMouseLeave={handleMouseOut}
              >
                {graphData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill="#20FECD"
                    opacity={
                      activeIndex === null || activeIndex === index ? 1 : 0.3
                    }
                    onMouseOver={() => handleMouseOver(index)}
                  />
                ))}
                <LabelList dataKey="points_on_bench" position="top" />
                <LabelList dataKey="player_name" content={<CustomLabel />} />
              </Bar>
              <Bar
                className="cursor-pointer"
                dataKey="auto_sub"
                // fill="#FFC107"
                // opacity={0.2}
                radius={[10, 10, 0, 0]}
                isAnimationActive={true}
                animationDuration={500}
                onClick={handleBarClick}
                onMouseLeave={handleMouseOut}
              >
                {graphData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill="#FFC107"
                    opacity={
                      activeIndex === null || activeIndex === index ? 1 : 0.3
                    }
                    onMouseOver={() => handleMouseOver(index)}
                  />
                ))}
                <LabelList dataKey="auto_sub" position="top" />
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
      </MainCard>

      {/* Modal Component */}
      <Popup isOpen={isModalOpen} onClose={closeModal}>
        {/* Popup */}
        <div
          className={`w-[90%] md:w-[65%] lg:w-2/5 fixed left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1010] bg-white shadow-lg rounded-lg overflow-hidden ${
            isModalOpen
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
            <h2>Auto Sub - {selectedManager?.player_name}</h2>
            <MdClose className="text-xl cursor-pointer" onClick={closeModal} />
          </div>
          {/* Popup head */}

          {/* Popup content */}
          <div className="h-[75vh] overflow-auto flex flex-col md:flex-row justify-between">
            <div className="p-4 flex flex-col items-center">
              <h2 className="text-primary-gray font-medium">Auto Sub Status</h2>
              <div className="w-full p-4 bg-third-gradient bg-no-repeat bg-right rounded-md shadow-md flex flex-col justify-center items-center">
                <h2 className="text-[#4F4F4F] text-lg font-bold">{selectedAutoSub}</h2>
                <p className="text-secondary-gray text-xs">Points</p>
              </div>
              <div className="py-4 flex flex-col gap-5">
                {
                  selectedManager?.autoSubs.map((autoSub, index) => (
                  <div className="flex justify-center gap-4 relative" key={index}>
                    <TransferCard 
                      transfer_photo={autoSub.elementOut.elementData.photo}
                      transfer_point={autoSub.elementOut.elementGWdata.total_points.toString()}
                      transfer_first_name={autoSub.elementOut.elementData.first_name}
                      transfer_second_name={autoSub.elementOut.elementData.second_name}
                      team_code={autoSub.elementOut.elementData.team_code}
                    />
                    <TransferCard 
                      transfer_photo={autoSub.elementIn.elementData.photo}
                      transfer_point={autoSub.elementIn.elementGWdata.total_points.toString()}
                      transfer_first_name={autoSub.elementIn.elementData.first_name}
                      transfer_second_name={autoSub.elementIn.elementData.second_name}
                      team_code={autoSub.elementIn.elementData.team_code}
                    />
                    <div className="w-8 h-8 rounded-full bg-primary-gradient text-[#474747] text-lg flex justify-center items-center absolute top-20">
                      <Image
                        src="/transfer.png"
                        alt="TransferIcon"
                        width={16}
                        height={16}
                        style={{
                          maxWidth: "100%",
                          height: "auto",
                        }}
                      />
                    </div>
                  </div>
                  ))
                }
              </div>
            </div>
            <div className="p-4 flex flex-col items-center">
              <h2 className=" text-primary-gray font-medium">
                Point of the bench
              </h2>
              <div className="w-full p-4 bg-third-gradient bg-no-repeat bg-right rounded-md shadow-md flex flex-col justify-center items-center">
                <h2 className="text-[#4F4F4F] text-lg font-bold">{selectedPoB}</h2>
                <p className="text-secondary-gray text-xs">Points</p>
              </div>
              <div className="py-4 flex flex-col gap-5">
                {
                  selectedManager?.pointsOnBench.map((pointOnBench, index) => (
                  <div className="flex justify-center gap-4" key={index}>
                    <TransferCard 
                      transfer_photo={pointOnBench.elementData.photo}
                      transfer_point={pointOnBench.elementGWdata.total_points.toString()}
                      transfer_first_name={pointOnBench.elementData.first_name}
                      transfer_second_name={pointOnBench.elementData.second_name}
                      team_code={pointOnBench.elementData.team_code}
                    />
                  </div>
                  ))
                }
              </div>
            </div>
          </div>
          {/* Popup content */}
        </div>
        {/* Popup */}
      </Popup>
      {/* Modal Component */}
    </div>
  );
};

export default BenchAndAutoSub;
