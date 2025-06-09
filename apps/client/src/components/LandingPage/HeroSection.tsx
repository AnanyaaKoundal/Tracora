'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { motion } from "framer-motion";

export default function HeroSection() {

  return (
    <>
        <section className="flex flex-col justify-center items-center text-center min-h-screen px-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-extrabold mb-6 text-primary"
        >
          Catch Every Bug.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-lg md:text-xl mb-8 max-w-2xl text-gray-700"
        >
          Track, squash, and resolve bugs with style. Make your development workflow fun and efficient.
        </motion.p>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Button size="lg" className="bg-primary text-white hover:bg-secondary text-lg px-8 py-4">
            Try Now
          </Button>
        </motion.div>
      </section>
    </>
  );
}
