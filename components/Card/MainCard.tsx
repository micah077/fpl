import { FC, ReactNode, useEffect } from "react";

// AOS animation
import AOS from "aos";
import "aos/dist/aos.css";
import { FiRefreshCw } from "react-icons/fi";
import Lottie from 'react-lottie';
import { football404, footballBounce } from "@/animations";
type PopupProps = {
  title: string;
  children: ReactNode;
  loader?: boolean;
  onRefresh?: () => void;
  error?: boolean
};

const MainCard: FC<PopupProps> = ({ title, children, loader, onRefresh, error }) => {
  useEffect(() => {
    AOS.init();
  }, []);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: footballBounce,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  const defaultErrorOptions = {
    loop: true,
    autoplay: true,
    animationData: football404,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  return (
    <div
      className="h-full bg-white rounded-lg shadow-lg overflow-hidden"
    // data-aos="fade-up"
    // data-aos-duration="2000"
    >
      {/* Card head */}
      <div className="flex items-center justify-between py-3 px-4 rounded-t-lg bg-third-gradient bg-no-repeat bg-right text-primary-gray font-bold"  >
        <h2>{title}</h2>
        <div onClick={onRefresh} className={`flex items-center gap-2 ${loader ? "cursor-default pointer-events-none" : "cursor-pointer"} ${error && "animate-pulse"}`}>
          <FiRefreshCw className={`${loader && "animate-spin"}`} />
          <p className="text-black font-bold" >Refresh</p>
        </div>
      </div>
      {/* Card head */}
      {loader ? <div className="flex items-center justify-center py-10">
        <Lottie options={defaultOptions}
          height={150}
          width={150}
        />
      </div> : error ?

        <div className="flex items-center justify-center py-10">
          <Lottie options={defaultErrorOptions}
            height={200}
            width={200}
          />
        </div>
        :
        children
      }
      {/* Card content */}
      {/* Card content */}
    </div>
  );
};

export default MainCard;
