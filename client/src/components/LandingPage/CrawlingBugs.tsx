'use client';

import { motion } from "framer-motion";

export default function CrawlingBugs() {

  return (
    <>
        {/* <motion.img
        src="/bug.svg"
        alt="Bug"
        className="absolute w-10 h-10 top-1/4 left-10"
        animate={{ x: [0, 300, 0], y: [0, 100, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      /> */}

      <motion.img
        src="/bug.svg"
        alt="Bug"
        className="absolute w-12 h-12 bottom-20 right-20"
        animate={{ x: [0, -200, 0], y: [0, -100, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}
