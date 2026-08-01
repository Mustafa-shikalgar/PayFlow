export const EmptyState = ({ title, description, icon, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
      {icon}
    </div>
    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);