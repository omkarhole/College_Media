import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on home and landing pages
  if (location.pathname === "/" || location.pathname === "/landing")
    return null;

  return (
    <button
      onClick={() => navigate(-1)}
      className="fixed top-24 left-6 z-40 p-3 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-slate-700 shadow-lg transition-all duration-300 group hover:scale-110"
      aria-label="Go Back"
    >
      <FaArrowLeft className="text-lg group-hover:-translate-x-1 transition-transform" />
    </button>
  );
};

export default BackButton;
