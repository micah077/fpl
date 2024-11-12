import WhiteCard from "@/components/Card/WhiteCard";
import Header from "@/components/Header/Header";
import {
  getManager,
  getLeague,
  getBootstrapStatic,
} from "@/lib/utils/FPLFetch";
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

const Page = async ({
  params,
}: {
  params: { managerId: string; leagueId: string };
}) => {


  const managerData = await getManager(params.managerId);
 

    return (
      
      <div className="min-h-screen flex flex-col">
        <Header managerData={managerData} leagueId={params.leagueId} />
        <Head>
          <title>FPL League Insights</title>
          <meta
            name="description"
            content="Gain insights into your FPL league's dynamics"
          />
          
        </Head>
        {/* Main content area with flex-grow */}
        <link rel="icon" href="/Tab-logo.svg" type="image/svg+xml" />
        <div className="flex-grow">
          <div className="flex gap-4 relative -top-[160px] left-0 w-full px-4 md:px-8 pb-8">
            <div className="w-full lg:w-[88%] flex flex-col gap-8">
              {/* All your sections */}
              
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
                {/* <LiveEvents leagueId={params.leagueId} /> */}
                {/* <TeamValue leagueId={params.leagueId} /> */}
              </div>
              <SquareAd imgUrl="/ad3.png" />
              <div className="flex flex-col lg:flex-row gap-4">
                {/* <BenchAndAutoSub leagueId={params.leagueId} /> */}
                {/* <Chips leagueId={params.leagueId} /> */}
              </div>
            </div>
            <div className="w-full lg:w-[12%] flex-shrink-0 hidden lg:block">
              <Advertise />
            </div>
          </div>
        </div>
    
        {/* Footer */}
        <div className="-top-[250px]">
          <Footer />
        </div>
      </div>
    );
  };
    

  
  export default Page;
  