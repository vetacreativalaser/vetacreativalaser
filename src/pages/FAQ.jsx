import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from '@/contexts/LanguageContext';

const faqData = [
  { question: 'faq.q1', answer: 'faq.a1' },
  { question: 'faq.q2', answer: 'faq.a2' },
  { question: 'faq.q3', answer: 'faq.a3' },
  { question: 'faq.q4', answer: 'faq.a4' },
  { question: 'faq.q5', answer: 'faq.a5' },
  { question: 'faq.q6', answer: 'faq.a6' },
];

const FAQ = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen py-12 bg-white text-black">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <HelpCircle className="h-12 w-12 text-black mx-auto mb-4" strokeWidth={1.5}/>
          <h1 className="text-4xl font-semibold text-black mb-3">
            {t('faq.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('faq.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqData.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index} className="border border-gray-200 bg-white transition-shadow hover:shadow-md">
                <AccordionTrigger className="px-6 py-4 text-left font-medium text-black hover:no-underline hover:bg-gray-50 text-md">
                  <span className="flex-1">{t(item.question)}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 text-gray-500" strokeWidth={1.5}/>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-0 text-gray-600 leading-relaxed text-sm">
                  {t(item.answer)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-2">{t('faq.noAnswer')}</p>
          <Link to="/contacto" className="font-medium text-black hover:underline">
            {t('faq.contact')}
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
