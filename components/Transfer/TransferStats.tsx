"use client";
import React, { useEffect, useRef, useState } from "react";
import MainCard from "../Card/MainCard";

import {
  BarChart,
  Bar,
  LabelList,
  Cell,
  Text,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import Popup from "../Modals/Popup";
import { MdClose } from "react-icons/md";
import Image from "next/image";
import TransferCard from "../Card/TransferCard";
import { Element } from "@/lib/types/FPLStatic";
import { FPLHistory } from "@/lib/types/FPLPlayerHistory";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import TransferWithinAStationOutlinedIcon from '@mui/icons-material/TransferWithinAStationOutlined';
import DifferenceOutlinedIcon from '@mui/icons-material/DifferenceOutlined';
import PriceChangeOutlinedIcon from '@mui/icons-material/PriceChangeOutlined';

import SwapHorizontalCircleOutlinedIcon from '@mui/icons-material/SwapHorizontalCircleOutlined';


interface Transfer {
  element_in: number;
  element_in_cost: number;
  element_out: number;
  element_out_cost: number;
  entry: number;
  event: number;
  time: string;
  element_in_web_name: string;
  element_out_web_name: string;
  element_in_point: number;
  element_out_point: number;
  pointDifference: number;
  element_in_id: number;
  element_out_id: number;
  element_in_photo: string;
  element_out_photo: string;
  elementIn: Element;
  elementOut: Element;
  elementInGWData: FPLHistory;
  elementOutGWData: FPLHistory;

}

interface UserTransfer {
  user_team_name: string;
  user_full_name: string;
  user_transfer_result: number;
  event_transfers: number;
  event_transfers_cost: number;
  transfers: Transfer[];
  totalTransferResult: number;
}

type UserTransfers = UserTransfer[];


const TransferStats = ({ leagueId }: { leagueId: string }) => {
  const [transfersData, setTransfersData] = useState<UserTransfers>([]);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false)

  const [pressedTransferStats, setPressedTransferStats] = useState<UserTransfer | null>(null);

  const divRef = useRef<HTMLDivElement | null>(null);
  const [chartDimensions, setChartDimensions] = useState({
    width: divRef?.current?.offsetWidth,
    height: 380,
  });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [barWidth, setBarWidth] = useState<number | null>(null);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);
  const [isModalOpen, setModalOpen] = useState(false); // State for modal visibility

  const openModal = () => {
    setModalOpen(true);
    document.body.style.overflow = "hidden";
  }; // Function to open the modal

  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = "auto";
  }; // Function to close the modal

  const CustomLabel = (props: any) => {
    const { x, y, height, value, index } = props;
    const username = transfersData[index]?.user_full_name;
    const offsetX = x - 6;
    const offsetY = value >= 0 ? y + height - 5 : y + height + 5;
    const angleC = -90;

    return (
      <Text
        x={offsetX}
        y={offsetY}
        angle={angleC}
        textAnchor={value >= 0 ? "start" : "end"}
        fill="#606060"
        style={{ fontSize: "12px", fontWeight: "500" }}
        opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
      >
        {username.split(" ")[0]}
      </Text>
    );
  };

  const CustomTooltip = (props: any) => {
    const { payload, label, active } = props;
    if (active && payload && payload?.length) {
      return (
        <div className="bg-light-black text-off-white p-4 text-sm rounded-md">
          <p className="mb-1">{payload[0]?.payload?.user_full_name}</p>
          <p className="text-xs">
            No of transfer: <span>{payload[0]?.payload?.event_transfers}</span>
          </p>
          <p className="text-xs">
            Point Difference:{" "}
            <span>{payload[0]?.payload?.totalTransferResult}</span>
          </p>
          <p className="text-xs">
            Total Cost: <span>{payload[0]?.payload?.event_transfers_cost}</span>
          </p>
        </div>
      );
    }

    return null;
  };

  const handleBarClick = (entry: any) => {
    setPressedTransferStats(entry);
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
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth); // Check if we can scroll right
    }
  };

  useEffect(() => {


    if (leagueId) {
      fetchData(); // Fetch data only if leagueId exists
    }
  }, [leagueId]); // Ensure the effect triggers only when leagueId changes


  const fetchData = async () => {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const NEXT_API_BASE_URL = `${BASE_URL}/api/fetch`;


    setLoading(true); // Start loading state
    setIsError(false)
    try {
      const res = await fetch(`${NEXT_API_BASE_URL}/getTransferStats/${leagueId}`);
      if (!res.ok) {
        throw new Error(`Error fetching transfer stats: ${res.statusText}`);
      }
      const data: UserTransfers = await res.json();

      // Sort the data
      const sortedData = data.slice().sort((a, b) => b.totalTransferResult - a.totalTransferResult);
      setTransfersData(sortedData); // Update state with sorted data
    } catch (error) {
      console.error("Error fetching transfer data:", error);
      setIsError(true)

    } finally {
      setLoading(false); // End loading state
    }
  }


  useEffect(() => {
    const updateChartDimensions = () => {
      if (divRef.current) {
        let width;
        if (transfersData?.length > 7) {
          const count = transfersData?.length - 7;
          width = divRef.current.offsetWidth + 70 * count;
        } else {
          width = divRef.current.offsetWidth;
        }

        setChartDimensions({ ...chartDimensions, width });
        setBarWidth(width / transfersData.length);
      }
    };

    updateChartDimensions();

    window.addEventListener("resize", updateChartDimensions);
    divRef.current?.addEventListener("scroll", updateScrollButtons); // Listen for scroll events

    return () => {
      window.removeEventListener("resize", updateChartDimensions);
      divRef.current?.removeEventListener("scroll", updateScrollButtons); // Clean up event listener
    };
  }, [transfersData]);



  return (
    <div className="w-full">
      <MainCard error={isError} onRefresh={() => fetchData()} loader={loading} title={`Transfer Stats`}>
        <div className="flex-1 relative">
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
              data={transfersData}
              barSize={14}
              margin={{
                top: 30,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              {/* <YAxis hide={true} domain={[-16, 16]} /> */}
              <Tooltip cursor={false} content={<CustomTooltip />} />
              <Bar
                className="cursor-pointer"
                dataKey="totalTransferResult"
                radius={[10, 10, 0, 0]}
                isAnimationActive={true}
                animationDuration={500}
                onClick={handleBarClick}
                onMouseLeave={handleMouseOut}
              >
                {transfersData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.totalTransferResult >= 0 ? "#4CE133" : "#F47B50"
                    }
                    opacity={
                      activeIndex === null || activeIndex === index ? 1 : 0.3
                    }
                    onMouseOver={() => handleMouseOver(index)}
                  />
                ))}
                <LabelList dataKey="totalTransferResult" position="top" />
                <LabelList content={<CustomLabel />} />
              </Bar>
            </BarChart>
          </div>
          {canScrollRight && (
            <button
              onClick={handleNextClick}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-1 p-2 rounded-full shadow-primary"
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
          className={`w-[90%]  md:w-3/4 lg:w-2/5 fixed left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1010] bg-white shadow-lg rounded-lg overflow-hidden ${isModalOpen
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
            <h2>Transfer Status</h2>
            <MdClose className="text-xl cursor-pointer" onClick={closeModal} />
          </div>
          {/* Popup head */}

          {/* Popup content */}
          <div className="h-[80vh] overflow-auto">
            <div className="m-4 p-4 rounded-lg border border-[#f4f4f4] bg-white shadow-md">
              <h2 className="text-[#474747] font-bold">{pressedTransferStats?.user_full_name}</h2>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="flex flex-col md:flex-row items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-third-gradient flex justify-center items-center">
                    <TransferWithinAStationOutlinedIcon />
                  </div>
                  <p className="flex flex-col items-center md:items-start">
                    <span className="text-[#474747] font-medium">{pressedTransferStats?.event_transfers}</span>
                    <span className="text-[#7e7e7e] text-xs font-medium">
                      No of Transfer
                    </span>
                  </p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-third-gradient flex justify-center items-center">
                    <DifferenceOutlinedIcon />
                  </div>
                  <p className="flex flex-col items-center md:items-start">
                    <span className="text-[#474747] font-medium">{pressedTransferStats?.totalTransferResult}</span>
                    <span className="text-[#7e7e7e] text-xs font-medium">
                      Point Difference
                    </span>
                  </p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-third-gradient flex justify-center items-center">
                    <PriceChangeOutlinedIcon />
                  </div>
                  <p className="flex flex-col items-center md:items-start">
                    <span className="text-[#474747] font-medium">{pressedTransferStats?.event_transfers_cost}</span>
                    <span className="text-[#7e7e7e] text-xs font-medium">
                      Transfer Cost
                    </span>
                  </p>
                </div>
              </div>

            </div>

            <div className="p-4 flex flex-col gap-5">
              {pressedTransferStats?.transfers.map((transfer, index) => (
                <div className="flex justify-center gap-4 relative" key={index}>
                  <TransferCard transfer_photo={transfer.element_out_photo} transfer_point={transfer.element_out_point.toString()} transfer_first_name={transfer.elementOut.first_name} transfer_second_name={transfer.elementOut.second_name} team_code={transfer.elementOut.team_code} />
                  <TransferCard transfer_photo={transfer.element_in_photo} transfer_point={transfer.element_in_point.toString()} transfer_first_name={transfer.elementIn.first_name} transfer_second_name={transfer.elementIn.second_name} team_code={transfer.elementIn.team_code} />
                  <div className="w-8 h-8 rounded-full bg-primary-gradient text-[#474747] text-lg flex justify-center items-center absolute top-24 mt-2">
                    <p className="text-sm font-semibold">{transfer.element_in_point - transfer.element_out_point}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary-gradient text-[#474747] text-lg flex justify-center items-center absolute top-16">
                    <SwapHorizontalCircleOutlinedIcon />
                  </div>
                </div>
              ))}
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

export default TransferStats;
