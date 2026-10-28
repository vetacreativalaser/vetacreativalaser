
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gift, Ruler, Palette, MessageSquare as MessageSquareIcon, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const BuyingGuides = () => {
  const { t } = useLanguage();

  const guides = [
    { icon: <Gift className="h-8 w-8 text-black mb-3" />, title: t('guide.1Title'), description: t('guide.1Desc') },
    { icon: <Ruler className="h-8 w-8 text-black mb-3" />, title: t('guide.2Title'), description: t('guide.2Desc') },
    { icon: <Palette className="h-8 w-8 text-black mb-3" />, title: t('guide.3Title'), description: t('guide.3Desc') },
    { icon: <MessageSquareIcon className="h-8 w-8 text-black mb-3" />, title: t('guide.4Title'), description: t('guide.4Desc') },
  ];

  return (
    <div className="min-h-screen py-12 bg-white text-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to="/" className="flex items-center text-gray-500 hover:text-black transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" strokeWidth={1.5}/>
            {t('legal.back')}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-semibold text-black mb-3">{t('guide.title')}</h1>
          <p className="text-lg text-gray-600">{t('guide.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {guides.map((guide, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white p-6 shadow border border-gray-200 flex flex-col items-center text-center"
            >
              {guide.icon}
              <h2 className="text-xl font-semibold text-black mb-2">{guide.title}</h2>
              <p className="text-gray-600 leading-relaxed text-sm">{guide.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + guides.length * 0.1 }}
            className="mt-12 text-center p-10 rounded-lg border-2 border-green-600 bg-green-50"
        >
            <Phone className="h-10 w-10 text-green-600 mx-auto mb-3" />
            <h2 className="text-2xl font-semibold mb-3 text-green-900">{t('guide.doubtTitle')}</h2>
            <p className="text-green-800 max-w-2xl mx-auto mb-4 leading-relaxed">
                {t('guide.doubt1')}
            </p>
            <p className="text-green-700 mb-6">
                {t('guide.doubt2')}
            </p>
            <Link to="/contacto">
                <Button className="bg-green-600 text-white hover:bg-green-700">
                    {t('guide.contactNow')}
                </Button>
            </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default BuyingGuides;
