import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, FileText, Globe, ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function Landing() {
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const pages = [
    {
      title: t('pages.home.title'),
      subtitle: t('pages.home.subtitle'),
      content: null
    },
    {
      title: 'Core Features',
      subtitle: 'Everything you need in one place',
      features: [
        {
          icon: MessageSquare,
          title: t('pages.home.features.aiChat.title'),
          description: t('pages.home.features.aiChat.description'),
          color: 'text-blue-400'
        },
        {
          icon: FileText,
          title: t('pages.home.features.smartNotes.title'),
          description: t('pages.home.features.smartNotes.description'),
          color: 'text-purple-400'
        },
        {
          icon: Globe,
          title: t('pages.home.features.translation.title'),
          description: t('pages.home.features.translation.description'),
          color: 'text-pink-400'
        }
      ]
    },
    {
      title: 'Get Started',
      subtitle: 'Join thousands of users already using Nexa',
      content: null
    }
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"></div>
      
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {currentPage === 0 && (
            <motion.div
              key="page-0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="text-center space-y-6 sm:space-y-8"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold heading-gradient leading-tight py-2 mb-4 sm:mb-6 overflow-visible px-2"
              >
                {pages[0].title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-400 max-w-2xl mx-auto px-4"
              >
                {pages[0].subtitle}
              </motion.p>
            </motion.div>
          )}

          {currentPage === 1 && (
            <motion.div
              key="page-1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="text-center mb-8 sm:mb-12 px-2">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold heading-gradient leading-tight py-2 mb-3 sm:mb-4">
                  {pages[1].title}
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-400">{pages[1].subtitle}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 px-2">
                {pages[1].features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all"
                  >
                    <div className={`mb-3 sm:mb-4 p-2 sm:p-3 rounded-xl bg-white/5 w-fit ${feature.color}`}>
                      <feature.icon size={24} className="sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {currentPage === 2 && (
            <motion.div
              key="page-2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="text-center space-y-6 sm:space-y-8"
            >
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold heading-gradient leading-tight py-2 mb-3 sm:mb-4 px-2"
              >
                {pages[2].title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-base sm:text-lg md:text-xl text-gray-400 max-w-xl mx-auto mb-6 sm:mb-8 px-4"
              >
                {pages[2].subtitle}
              </motion.p>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={goToLogin}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-base sm:text-lg hover:from-blue-700 hover:to-purple-700 active:scale-95 transition-all flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl touch-manipulation min-h-[44px]"
              >
                Get Started <ArrowRight size={18} className="sm:w-5 sm:h-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 sm:mt-12 gap-2 sm:gap-4 px-2">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all touch-manipulation min-h-[44px] ${
              currentPage === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'bg-white/5 active:bg-white/10 border border-white/10 active:scale-95'
            }`}
          >
            <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden text-xs">Prev</span>
          </button>

          {/* Page indicators */}
          <div className="flex gap-2 flex-1 justify-center">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`h-2 rounded-full transition-all touch-manipulation ${
                  currentPage === index ? 'bg-white w-6 sm:w-8' : 'bg-white/30 w-2'
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all touch-manipulation min-h-[44px] ${
              currentPage === pages.length - 1
                ? 'opacity-50 cursor-not-allowed'
                : 'bg-white/5 active:bg-white/10 border border-white/10 active:scale-95'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sm:hidden text-xs">Next</span>
            <ChevronRight size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

