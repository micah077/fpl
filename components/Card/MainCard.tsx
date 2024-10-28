import { FC, ReactNode, useEffect } from "react";

// AOS animation
import AOS from "aos";
import "aos/dist/aos.css";

type PopupProps = {
  title: string;
  children: ReactNode;
};

const MainCard: FC<PopupProps> = ({ title, children }) => {
  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <div
      className="h-full bg-white rounded-lg shadow-lg overflow-hidden"
      // data-aos="fade-up"
      // data-aos-duration="2000"
    >
      {/* Card head */}
      <div className="py-3 px-4 rounded-t-lg bg-third-gradient bg-no-repeat bg-right text-primary-gray font-bold"  >
        <h2>{title}</h2>
      </div>
      {/* Card head */}

      {/* Card content */}
      {children}
      {/* Card content */}
    </div>
  );
};

export default MainCard;
