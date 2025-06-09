'use client';

import { motion } from 'framer-motion';

export default function Waves() {
  return (
    <div className="absolute top-0 left-0 w-full h-screen overflow-hidden z-0">
      <div className="relative w-[200%] h-[320px]">
        {/* First wave */}
        <motion.div
          className="absolute top-0 left-0 w-full"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <svg
            xmlns="/wave.svg"
            viewBox="0 0 1440 320"
            className="w-full h-full"
          >
            <path
              fill="#005b9c71"
              fillOpacity="0.3"
              d="M0,256L34.3,234.7C68.6,213,137,171,206,170.7C274.3,171,343,213,411,202.7C480,192,549,128,617,96C685.7,64,754,64,823,58.7C891.4,53,960,43,1029,58.7C1097.1,75,1166,117,1234,138.7C1302.9,160,1371,160,1406,160L1440,160L1440,0L1405.7,0C1371.4,0,1303,0,1234,0C1165.7,0,1097,0,1029,0C960,0,891,0,823,0C754.3,0,686,0,617,0C548.6,0,480,0,411,0C342.9,0,274,0,206,0C137.1,0,69,0,34,0L0,0Z"
            ></path>
          </svg>
        </motion.div>

        {/* Second wave (slower, creates depth) */}
        <motion.div
          className="absolute top-0 left-0 w-full opacity-50"
          animate={{ x: ['0%', '-25%'] }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <svg
            xmlns="/wave.svg"
            viewBox="0 0 1440 320"
            className="w-full h-full"
          >
            <path
              fill="#005b9c71"
              fillOpacity="0.3"
              d="M0,256L34.3,234.7C68.6,213,137,171,206,170.7C274.3,171,343,213,411,202.7C480,192,549,128,617,96C685.7,64,754,64,823,58.7C891.4,53,960,43,1029,58.7C1097.1,75,1166,117,1234,138.7C1302.9,160,1371,160,1406,160L1440,160L1440,0L1405.7,0C1371.4,0,1303,0,1234,0C1165.7,0,1097,0,1029,0C960,0,891,0,823,0C754.3,0,686,0,617,0C548.6,0,480,0,411,0C342.9,0,274,0,206,0C137.1,0,69,0,34,0L0,0Z"
            ></path>
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
