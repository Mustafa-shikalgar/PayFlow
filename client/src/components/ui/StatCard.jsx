import { motion } from 'framer-motion';

export const StatCard = ({ title, value, icon, subtitle, color = 'primary', loading = false }) => {
  const colors = {
    primary: 'from-indigo-500 to-purple-600 shadow-indigo-500/30',
    green: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
    red: 'from-rose-500 to-pink-600 shadow-rose-500/30',
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/30',
    blue: 'from-blue-500 to-cyan-600 shadow-blue-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          {loading ? (
            <div className="skeleton mt-3 h-8 w-24" />
          ) : (
            <p className="mt-2 truncate text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          )}
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};