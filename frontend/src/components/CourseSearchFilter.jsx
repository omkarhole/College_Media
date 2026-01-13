import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

const CourseSearchFilter = ({
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Filter options based on "Level" or similar, since "Category" is handled by tabs
  const filterOptions = [
    { label: "All Levels", value: "all" },
    { label: "Beginner", value: "beginner" },
    { label: "Intermediate", value: "intermediate" },
    { label: "Advanced", value: "advanced" },
  ];

  const currentLabel =
    filterOptions.find((opt) => opt.value === filter)?.label || "Filter";

  return (
    <div className="w-full max-w-2xl mb-10 relative z-20">
      <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300 p-1.5 border border-slate-100 dark:border-slate-700">
        {/* Search Icon */}
        <div className="pl-4 text-slate-400">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for courses..."
          className="flex-1 w-full bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 placeholder-slate-400 px-4 py-2 outline-none"
        />

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 mx-2" />

        {/* Filter Dropdown Trigger */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 text-sm font-medium whitespace-nowrap"
          >
            <span>{currentLabel}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden py-1 z-50 origin-top-right"
              >
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilter(option.value);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full text-left px-4 py-2.5 text-sm transition-colors
                      ${
                        filter === option.value
                          ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Button (Visual) */}
        <button className="hidden sm:block bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-full transition-colors ml-1 shadow-md shadow-orange-200 dark:shadow-none">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CourseSearchFilter;
