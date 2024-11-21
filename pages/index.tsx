import Head from "next/head";
import Image from "next/image";
import { useState, ChangeEvent, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { getManager } from "@/lib/utils/FPLFetch";
import Popup from "@/components/Modals/Popup";
import "@/app/globals.css";
import { Manager } from "@/lib/types/Manager";
import Welcome from "@/components/Welcome/Welcome"; // Ensure this is your new component

import { MdClose, MdKeyboardArrowUp, MdKeyboardArrowDown } from "react-icons/md";
import LandingStats from "@/components/Landing-Stats/LandingStats"; // Ensure this is your new component
import Footer from "@/components/Footer/Footer"; // Ensure this is your new component


export default function Home() {
  const [userID, setUserID] = useState<string>("");
  const [managerData, setManagerData] = useState<Manager | null>(null);
  const [isModalOpen, setModalOpen] = useState(false); // State for modal visibility
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const router = useRouter();

  const sections = ["#intro", "#welcome", "#landing-stats"];

  const introRef = useRef<HTMLDivElement>(null);
  const welcomeRef = useRef<HTMLDivElement>(null);
  const landingStatsRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUserID(e.target.value);
  };

  const handleGetStarted = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission behavior

    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const NEXT_API_BASE_URL = `${BASE_URL}/api/fetch`;

    try {
      const res = await fetch(`${NEXT_API_BASE_URL}/getManager/${userID}`);
      if (!res.ok) {
        throw new Error(`Error fetching transfer data: ${res.statusText}`);
      }
      const data: Manager = await res.json();
      setManagerData(data);
      openModal();
    } catch (error) {
      console.error("Error fetching transfer data:", error);
    }
  };

  const openModal = () => {
    setModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = "auto";
  };

  const handleSelectLeague = (userId: number | undefined, leagueId: number) => {
    router.push(`/${userId}/${leagueId}`);
    localStorage.setItem("managerData",JSON.stringify(managerData))
    localStorage.setItem("leagueId",leagueId.toString())
  };


  const scrollToSection = (direction: "up" | "down") => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;

    const introTop = introRef.current?.offsetTop || 0;
    const welcomeTop = welcomeRef.current?.offsetTop || 0;
    const landingStatsTop = landingStatsRef.current?.offsetTop || 0;
    const landingStatsHeight = landingStatsRef.current?.offsetHeight || 0;

    // Scroll down logic
    if (direction === "down") {
      if (scrollY < welcomeTop - windowHeight / 2) {
        // Scroll from intro to welcome
        welcomeRef.current?.scrollIntoView({ behavior: "smooth" });
      } else if (scrollY < landingStatsTop - windowHeight / 2) {
        // Scroll from welcome to landing stats
        landingStatsRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }

    // Scroll up logic
    if (direction === "up") {
      if (scrollY >= landingStatsTop - windowHeight / 2) {
        // Scroll from landing stats to welcome
        welcomeRef.current?.scrollIntoView({ behavior: "smooth" });
      } else if (scrollY >= welcomeTop - windowHeight / 2) {
        // Scroll from welcome to intro
        introRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      const landingStatsTop = landingStatsRef.current?.offsetTop || 0;
      const landingStatsHeight = landingStatsRef.current?.offsetHeight || 0;

      // Update if we are at the top or bottom
      setIsAtTop(scrollY === 0);

      // Disable down button if at the bottom of LandingStats
      const isAtLandingStatsBottom = scrollY + windowHeight >= landingStatsTop + landingStatsHeight;
      setIsAtBottom(isAtLandingStatsBottom);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sort leagues by number of players
  const sortedLeagues =
    managerData?.leagues?.classic
      .filter((league) => league.rank_count < 25)
      .sort((a, b) => b.rank_count - a.rank_count) || [];

  return (
    <div className={`relative`}>
      <Head>
        <title>FPL League Insights</title>
        <meta
          name="description"
          content="Gain insights into your FPL league's dynamics"
        />
        <link rel="icon" href="/Tab-logo.svg" type="image/svg+xml" />
      </Head>

      {/* Intro Section */}
      <div
        id="intro"
        ref={introRef}
        className="h-screen flex justify-center items-center"
        style={{
          background: "url(/welcome.png) no-repeat center center / cover",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 md:px-14 lg:px-0 flex flex-col items-center gap-28">
          <div className="max-w-lg flex flex-col gap-8">
            <Image
              src="/landing-logo.png"
              alt="FPL League Insights"
              width={800}
              height={800}
              style={{
                maxWidth: "100%",
                height: "auto",
              }}
            />
            <form
              className="w-full flex flex-col md:flex-row items-center gap-5"
              onSubmit={handleGetStarted}
            >
              <input
                type="text"
                placeholder="userID"
                className="flex-1 w-full md:w-auto py-2 px-4 rounded-lg border border-secondary-green bg-white text-primary-gray focus:outline focus:outline-1 focus:outline-primary-green"
                value={userID}
                onChange={handleInputChange}
              />
              <button
                type="submit"
                className="py-2 px-4 rounded-lg bg-primary-gradient text-primary-gray"
              >
                Get Started
              </button>
            </form>
          </div>
          <p className="text-white text-center">
            Enhancing rivalries, increase competition. Gain insights into your
            league dynamics, from top transfers to lucky stars and standout
            players in the league. Fuel the rivalry with FPL League Insights.
          </p>
        </div>
      </div>

      {/* Welcome Section */}
      <div id="welcome" ref={welcomeRef} >
        <Welcome />
      </div>

      {/* Landing Stats Section */}
      <div id="landing-stats" ref={landingStatsRef}>
        <LandingStats />
      </div>

      {/* Landing Stats */}
      <Footer />

      {/* Floating Scroll Button */}
      <div className="fixed bottom-5 left-5 z-50">
        <div
          className={`p-3 rounded-full bg-black bg-opacity-50 flex items-center justify-center mb-2 cursor-pointer ${isAtTop ? "opacity-30 cursor-not-allowed" : "hover:bg-opacity-70"}`}
          onClick={() => !isAtTop && scrollToSection("up")}
        >
          <MdKeyboardArrowUp size={24} className="text-white" />
        </div>
        <div
          className={`p-3 rounded-full bg-black bg-opacity-50 flex items-center justify-center cursor-pointer ${isAtBottom ? "opacity-30 cursor-not-allowed" : "hover:bg-opacity-70"}`}
          onClick={() => !isAtBottom && scrollToSection("down")}
        >
          <MdKeyboardArrowDown size={24} className="text-white" />
        </div>
      </div>

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
            <h2>Join The League</h2>
            <MdClose className="text-xl cursor-pointer" onClick={closeModal} />
          </div>

          {/* Popup content */}
          <div className="h-[85vh] overflow-auto">
            <h3 className="ml-2 mr-2 mb-5 mt-5">Note: The site currently only allows leagues with 20 users</h3>
            <table className="w-full">
              <thead className="text-sm text-primary-gray bg-white sticky top-[-2px] z-10">
                <tr className="shadow-primary">
                  <th>
                    <div className="px-3 py-1 border-r border-off-white text-left">
                      League Name
                    </div>
                  </th>
                  <th>
                    <div className="px-3 py-1 border-r border-off-white">
                      No of Player
                    </div>
                  </th>
                  <th className="px-3 py-1"></th>
                </tr>
              </thead>
              <tbody className="text-sm text-secondary-gray">
                {sortedLeagues.map((league) => (
                  <tr className="border-b border-off-white" key={league.id}>
                    <td className="px-3 py-1">{league.name}</td>
                    <td className="px-3 py-1 text-center">{league.rank_count}</td>
                    <td className="px-3 py-1 text-center">
                     
                      <button
                        className="px-2 py-1 rounded-md bg-primary-gradient"
                        onClick={() =>
                          handleSelectLeague(managerData?.id, league.id)
                        }
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Popup>
    </div>
  );
}
