"use client";
import WhiteCard from "@/components/Card/WhiteCard";
import Header from "@/components/Header/Header";
import { getManager, getLeague, getBootstrapStatic } from "@/lib/utils/FPLFetch";
import CaptainsView from "@/components/Captain/CaptainsView";
import TransferInOut from "@/components/Transfer/TransferInOut";
import TransferStats from "@/components/Transfer/TransferStats";
import Advertise from "@/components/Advertise/Advertise";
import BenchAndAutoSub from "@/components/BenchAndAutoSub/BenchAndAutoSub";
import Chips from "@/components/Chips/Chips";
import MostOwnedPlayer from "@/components/MostOwnedPlayer/MostOwnedPlayer";
import TopDifferential from "@/components/TopDifferential/TopDifferential";
import LiveEvents from "@/components/LiveEvents/LiveEvents";
import TeamValue from "@/components/TeamValue/TeamValue";
import Image from "next/image";
import SquareAd from "@/components/Common/SquareAd";
import LeagueTable from "@/components/LeagueTable/LeagueTable";
import Footer from "@/components/Footer/Footer";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import Lottie from 'react-lottie';
import { footballPerson, footballPlayer } from "@/animations";



const Page = ({
  params,
}: {
  params: { managerId: string; leagueId: string };
}) => {
  const [managerData, setManagerData] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: footballPerson,

  }
  const fetchManager = async (managerId: string) => {
    const BASE_URL =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const NEXT_API_BASE_URL = `${BASE_URL}/api/fetch`;

    try {

      const res = await fetch(
        `${NEXT_API_BASE_URL}/getManager/${managerId}`
      );
      const data = await res.json();

      return data
    } catch (error) {
      console.error("Error fetching value:", error);
    }
  };

  const fetchData = async () => {
    try {
      window.scroll({
        top: 0,
        behavior: "smooth"
      })
      document.body.classList.add("hide-scrollbar");
      setTimeout(async () => {
        const data = await fetchManager(params.managerId);
        document.body.classList.remove("hide-scrollbar");
        setManagerData(data);
        setIsLoading(false); // Hide loader after 3 seconds
      }, 2000);
    } catch (error) {
      console.error(error, "error");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.managerId, params.leagueId]);


  return (
    <>
      {isLoading && <div className="absolute w-screen z-10 top-0 h-full bg-white flex justify-center items-center">
        <img src={footballPlayer.src} className="h-[400px] w-[400px]" alt="Loading..." />
      </div>
      }
      <div className="min-h-screen flex flex-col">

        <Header managerData={managerData} leagueId={params.leagueId} />
        <Head>
          <title>FPL League Insights</title>
          <meta name="description" content="Gain insights into your FPL league's dynamics" />
        </Head>

        <link rel="icon" href="/Tab-logo.svg" type="image/svg+xml" />
        <div className="flex-grow">
          <div className="flex gap-4 relative -top-[160px] left-0 w-full px-4 md:px-8 pb-8">
            <div className="w-full z-1 lg:w-[88%] flex flex-col gap-8">
              <CaptainsView leagueId={params.leagueId} />
              <LeagueTable leagueId={params.leagueId} />
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <TransferStats leagueId={params.leagueId} />
                <TransferInOut leagueId={params.leagueId} inOut={"In"} />
                <TransferInOut leagueId={params.leagueId} inOut={"Out"} />
              </div>
              <SquareAd imgUrl="/ad1.png" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <MostOwnedPlayer leagueId={params.leagueId} isDiff={false} />
                <MostOwnedPlayer leagueId={params.leagueId} isDiff={true} />
              </div>
              <SquareAd imgUrl="/ad2.png" />
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <LiveEvents leagueId={params.leagueId} />
                <TeamValue leagueId={params.leagueId} />
              </div>
              <SquareAd imgUrl="/ad3.png" />
              <div className="flex flex-col lg:flex-row gap-4">
                <BenchAndAutoSub leagueId={params.leagueId} />
                <Chips leagueId={params.leagueId} />
              </div>
            </div>
            <div className="w-full lg:w-[12%] flex-shrink-0 hidden lg:block">
              <Advertise />
            </div>
          </div>
        </div>

        <div className="top-[250px]">
          <Footer />
        </div>

      </div>
    </>

  );
};

export default Page;
