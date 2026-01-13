import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { courses } from "../data/courses";
import CourseCard from "../components/CourseCard";
import CourseSearchFilter from "../components/CourseSearchFilter";
import CourseSkeleton from "../components/CourseSkeleton";
import { staggerContainer, fadeInUp } from "../utils/animations";

const CourseDiscovery = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [filteredCourses, setFilteredCourses] = useState([]);

  // States for new filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [levelFilter, setLevelFilter] = useState("all");

  const filterType = searchParams.get("type") || "all"; // 'free', 'paid', 'all'

  useEffect(() => {
    setIsLoading(true);
    // Simulate network delay for skeleton demo
    const timer = setTimeout(() => {
      let result = courses;

      // 1. Filter by Side Toggle (Free/Paid)
      if (filterType === "free") {
        result = result.filter((c) => c.price === 0);
      } else if (filterType === "paid") {
        result = result.filter((c) => c.price > 0);
      }

      // 2. Filter by Category
      if (activeCategory !== "All") {
        result = result.filter((c) => c.category === activeCategory);
      }

      // 3. Filter by Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(
          (c) =>
            c.title.toLowerCase().includes(query) ||
            c.instructor.toLowerCase().includes(query) ||
            c.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      // 4. Filter by Level
      if (levelFilter !== "all") {
        result = result.filter(
          (c) => c.difficulty.toLowerCase() === levelFilter
        );
      }

      setFilteredCourses(result);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [filterType, activeCategory, searchQuery, levelFilter]);

  const categories = [
    "All",
    "Development",
    "Design",
    "Data Science",
    "IT & Software",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Search Bar - Floating & Central */}
      <div className="flex justify-center mb-8">
        <CourseSearchFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filter={levelFilter}
          setFilter={setLevelFilter}
        />
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">😎</span>
            <span className="text-blue-500 font-semibold text-sm uppercase tracking-wider">
              #BeUnstoppable
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
            Unlock{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400">
              Courses
            </span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl text-lg">
            From tech to non-tech, discover courses to upskill and advance your
            career!
          </p>
        </div>

        {/* Illustration (Optional/Placeholder) */}
        <div className="hidden lg:block relative w-32 h-20">
          {/* Robot/Graphic placeholder */}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto pb-4 mb-8 gap-3 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              whitespace-nowrap px-6 py-3 rounded-2xl font-semibold transition-all duration-300
              ${
                activeCategory === cat
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200 dark:shadow-none scale-105"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white hover:shadow-md"
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-8 w-1 bg-blue-500 rounded-full"></div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          {activeCategory === "All" ? "Recommended for you" : activeCategory}
        </h2>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {isLoading
            ? [...Array(4)].map((_, index) => (
                <motion.div key={`skeleton-${index}`} variants={fadeInUp}>
                  <CourseSkeleton />
                </motion.div>
              ))
            : filteredCourses.map((course) => (
                <motion.div
                  key={course.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
        </AnimatePresence>
      </motion.div>

      {!isLoading && filteredCourses.length === 0 && (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            No results found
          </h3>
          <p className="text-slate-500">
            We couldn't find any courses matching your filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setLevelFilter("all");
              setActiveCategory("All");
            }}
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseDiscovery;
