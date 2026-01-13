import {
  FaStar,
  FaUser,
  FaClock,
  FaTag,
  FaArrowRight,
  FaBookOpen,
} from "react-icons/fa";

const CourseCard = ({ course }) => {
  const { title, instructor, rating, price, thumbnail, category, duration } =
    course;

  const isFree = price === 0;

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
      {/* Thumbnail Section - Reduced height */}
      <div className="relative h-36 overflow-hidden bg-gray-100 dark:bg-slate-700 shrink-0">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Floating Badges - Minimalist */}
        <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm">
          <span
            className={
              isFree ? "text-green-600" : "text-slate-900 dark:text-white"
            }
          >
            {isFree ? "Free" : `$${price}`}
          </span>
        </div>

        <div className="absolute bottom-2 left-2 flex gap-1">
          <div className="bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-medium text-white flex items-center gap-1">
            <FaBookOpen className="w-2.5 h-2.5" />
            <span>{course.modules || 8} Mods</span>
          </div>
        </div>
      </div>

      {/* Content Section - Compact */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2 text-[10px] text-slate-500 dark:text-slate-400">
          <span className="bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-medium">
            {category}
          </span>
          <div className="flex items-center gap-2">
            <span className="flex items-center">
              <FaClock className="mr-1 w-2.5 h-2.5" />
              {duration}
            </span>
            <span className="flex items-center text-yellow-500">
              <FaStar className="w-2.5 h-2.5 mr-0.5" />
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {rating}
              </span>
            </span>
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center">
          <span className="truncate">By {instructor}</span>
        </p>

        {/* Minimal Footer */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between group/footer">
          <span className="text-xs font-semibold text-slate-400 group-hover/footer:text-blue-600 transition-colors">
            View Details
          </span>
          <FaArrowRight className="w-3 h-3 text-slate-300 group-hover/footer:text-blue-600 transform -rotate-45 group-hover/footer:rotate-0 transition-all duration-300" />
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
