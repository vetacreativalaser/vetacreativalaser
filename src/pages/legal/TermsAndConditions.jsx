
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const TermsAndConditions = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen py-12 bg-white text-black">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
          className="bg-white p-8 shadow border border-gray-200"
        >
          <h1 className="text-3xl font-semibold text-black mb-6">{t('terms.title')}</h1>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('terms.s1Title')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('terms.s1')}
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('terms.s2Title')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('terms.s2')}
            </p>
            <p className="text-gray-600 leading-relaxed mt-2">
              {t('terms.noDebes')}
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-1">
              <li>{t('terms.l1')}</li>
              <li>{t('terms.l2')}</li>
              <li>{t('terms.l3')}</li>
              <li>{t('terms.l4')}</li>
              <li>{t('terms.l5')}</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('terms.s3Title')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('terms.s3')}
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('terms.s4Title')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('terms.s4')}
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('terms.s5Title')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('terms.s5')}
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('terms.s6Title')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('terms.s6')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('terms.s7Title')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('terms.s7')}
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              {t('terms.lastUpdate')}
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
