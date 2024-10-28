import { FC, ReactNode } from "react";
import { MdClose } from "react-icons/md";

type PopupProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

const Popup: FC<PopupProps> = ({ isOpen, onClose, children }) => {
  // if (!isOpen) return null;

  return (
    <div
      className={`w-full h-screen fixed inset-0 z-[1000] bg-opacity-20 bg-[#282828] backdrop-blur ${
        isOpen ? "visible opacity-100" : "invisible opacity-0"
      } transition duration-500`}
      onClick={onClose}
    >
      {/* Popup */}
      {children}
      {/* Popup */}
    </div>
  );
};

export default Popup;
