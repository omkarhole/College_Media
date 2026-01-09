const CourseSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse">
      {/* Thumbnail Skeleton */}
      <div className="h-48 bg-slate-200 dark:bg-slate-700 w-full relative">
        <div className="absolute top-3 right-3 w-16 h-6 bg-slate-300 dark:bg-slate-600 rounded-full" />
        <div className="absolute top-3 left-3 w-20 h-6 bg-slate-300 dark:bg-slate-600 rounded-full" />
      </div>

      {/* Content Skeleton */}
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="w-24 h-5 bg-slate-200 dark:bg-slate-700 rounded-md" />
          <div className="w-16 h-5 bg-slate-200 dark:bg-slate-700 rounded-md" />
        </div>

        <div className="space-y-2">
          <div className="w-full h-6 bg-slate-200 dark:bg-slate-700 rounded-md" />
          <div className="w-3/4 h-6 bg-slate-200 dark:bg-slate-700 rounded-md" />
        </div>

        <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-700 rounded-md" />

        <div className="w-full h-10 bg-slate-200 dark:bg-slate-700 rounded-xl mt-4" />
      </div>
    </div>
  );
};

export default CourseSkeleton;
