// pages/About.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Award, Users, Zap, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const About = () => {
  const { t } = useLanguage();

  const values = [
    { icon: <Award className="h-8 w-8 text-gray-800" />, title: t('about.value1Title'), description: t('about.value1Desc') },
    { icon: <Users className="h-8 w-8 text-gray-800" />, title: t('about.value2Title'), description: t('about.value2Desc') },
    { icon: <Zap className="h-8 w-8 text-gray-800" />, title: t('about.value3Title'), description: t('about.value3Desc') },
    { icon: <Heart className="h-8 w-8 text-gray-800" />, title: t('about.value4Title'), description: t('about.value4Desc') }
  ];

  return (
    <div className="min-h-screen py-12 bg-white text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-semibold mb-6">{t('about.title')}</h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            {t('about.subtitle')}
          </p>
        </motion.div>

        {/* Historia */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-3 space-y-6"
          >
            <h2 className="text-3xl font-semibold">{t('about.hobbyTitle')}</h2>
            <p className="text-gray-700 leading-relaxed text-justify">
              {t('about.hobby1')}
            </p>
            <p className="text-gray-700 leading-relaxed text-justify">
              {t('about.hobby2')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2 rounded-lg overflow-hidden border border-gray-200 shadow-md"
          >
            <img
              className="w-600 h-400 object-cover"
              alt="Taller de Veta Creativa Láser"
              src="https://dspsrnprvrpjrkicxiso.supabase.co/storage/v1/object/public/imgadmins//about-background.webp"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-24 bg-gray-100 rounded-xl p-10 text-center"
        >
          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-md mx-auto">
            <img
              src='https://dspsrnprvrpjrkicxiso.supabase.co/storage/v1/object/public/imgadmins/perfil.webp'
              alt="Isaac Delfa"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-3xl font-semibold mb-2 mt-6">Isaac Delfa Medina</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('about.isaacDesc')}
          </p>
        </motion.div>

        {/* Valores */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-semibold text-center mb-10">{t('about.valuesTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-6 rounded-lg bg-white border border-gray-200 hover:shadow-md"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Misión */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-24 bg-gray-200 rounded-xl p-10 text-center"
        >
          <h2 className="text-3xl font-semibold mb-6">{t('about.missionTitle')}</h2>
          <p className="text-gray-700 max-w-2xl mx-auto leading-relaxed">
            {t('about.mission')}
          </p>
        </motion.div>

      </div>
    </div>
  );
};

export default About;
