// "use client";
// import { useRef, useEffect, useState } from "react";

// export default function SpeakingAnimation({isPlaying ,isListening }) {
//   const waveRef = useRef(0);
//   const animationRef = useRef(null);
//   const containerRef = useRef(null);
//   const [scale, setScale] = useState(1); // smooth shrink/grow

//   useEffect(() => {
//     const animate = () => {
//       if (!isPlaying) return;

//       waveRef.current += 0.008;

//       const layers = containerRef.current.querySelectorAll(".siri-layer");
//       layers.forEach((layer, i) => {
//         const baseRadius = 40;
//         const pulse = Math.sin(waveRef.current * (1 + i * 0.15) + i * 0.5) * (6 + i * 2);
//         layer.style.width = `${(baseRadius + pulse) * 2}px`;
//         layer.style.height = `${(baseRadius + pulse) * 2}px`;
//         layer.style.top = `calc(50% - ${(baseRadius + pulse)}px)`;
//         layer.style.left = `calc(50% - ${(baseRadius + pulse)}px)`;
//       });

//       const core = containerRef.current.querySelector(".siri-core");
//       core.style.width = `${35 + Math.sin(waveRef.current * 2) * 5}px`;
//       core.style.height = `${35 + Math.sin(waveRef.current * 2) * 5}px`;
//       core.style.top = `calc(50% - ${35 / 2}px)`;
//       core.style.left = `calc(50% - ${35 / 2}px)`;

//       animationRef.current = requestAnimationFrame(animate);
//     };

//     animationRef.current = requestAnimationFrame(animate);
//     return () => cancelAnimationFrame(animationRef.current);
//   }, [isPlaying]);

//   // Smoothly interpolate scale
//   useEffect(() => {
//     const targetScale = isPlaying ? 1 : 0.1;
//     const interval = setInterval(() => {
//       setScale((prev) => {
//         const next = prev + (targetScale - prev) * 0.1;
//         if (Math.abs(next - targetScale) < 0.01) return targetScale;
//         return next;
//       });
//     }, 16);
//     return () => clearInterval(interval);
//   }, [isPlaying]);

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-black">
//       <div
//         ref={containerRef}
//         className="relative w-64 h-64"
//         style={{
//           transform: `scale(${scale})`,
//           transition: "transform 0.3s ease-in-out",
//         }}
//       >
//         {[0, 1, 2, 3, 4].map((i) => (
//           <div
//             key={i}
//             className="absolute rounded-full siri-layer"
//             style={{
//               width: "80px",
//               height: "80px",
//               top: "50%",
//               left: "50%",
//               background: isListening
//                 ? `radial-gradient(circle, rgba(255,50,200,${0.25 + i * 0.05}) 0%, rgba(50,0,150,0.05) 70%)`
//                 : `radial-gradient(circle, rgba(0,255,255,${0.25 + i * 0.05}) 0%, rgba(50,0,100,0.05) 70%)`,
//               boxShadow: isListening
//                 ? `0 0 ${20 + i * 10}px rgba(255,50,200,${0.3 + i * 0.05})`
//                 : `0 0 ${20 + i * 10}px rgba(0,255,255,${0.3 + i * 0.05})`,
//               transition: "background 0.5s, box-shadow 0.5s",
//             }}
//           />
//         ))}
//         <div
//           className="absolute rounded-full siri-core"
//           style={{
//             width: "40px",
//             height: "40px",
//             top: "50%",
//             left: "50%",
//             background: isListening
//               ? "radial-gradient(circle, rgba(255,50,200,0.9) 0%, rgba(50,0,150,0.2) 70%)"
//               : "radial-gradient(circle, rgba(0,255,255,0.9) 0%, rgba(50,0,100,0.2) 70%)",
//             boxShadow: isListening
//               ? "0 0 40px rgba(255,50,200,0.7), 0 0 80px rgba(100,0,200,0.3)"
//               : "0 0 40px rgba(0,255,255,0.7), 0 0 80px rgba(50,0,100,0.3)",
//             transition: "background 0.5s, box-shadow 0.5s",
//           }}
//         />
//       </div>

      
//     </div>
//   );
// }
"use client";
import { useRef, useEffect, useState } from "react";

export default function SpeakingAnimation({ isPlaying, isListening }) {
  const waveRef = useRef(0);
  const animationRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const animate = () => {
      if (!isPlaying) return;

      waveRef.current += 0.008;

      const layers = containerRef.current.querySelectorAll(".siri-layer");
      layers.forEach((layer, i) => {
        const baseRadius = 40;
        const pulse = Math.sin(waveRef.current * (1 + i * 0.15) + i * 0.5) * (6 + i * 2);
        layer.style.width = `${(baseRadius + pulse) * 2}px`;
        layer.style.height = `${(baseRadius + pulse) * 2}px`;
        layer.style.top = `calc(50% - ${(baseRadius + pulse)}px)`;
        layer.style.left = `calc(50% - ${(baseRadius + pulse)}px)`;
      });

      const core = containerRef.current.querySelector(".siri-core");
      core.style.width = `${35 + Math.sin(waveRef.current * 2) * 5}px`;
      core.style.height = `${35 + Math.sin(waveRef.current * 2) * 5}px`;
      core.style.top = `calc(50% - ${35 / 2}px)`;
      core.style.left = `calc(50% - ${35 / 2}px)`;

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying]);

  // Smooth shrink/grow
  useEffect(() => {
    const targetScale = isPlaying ? 1 : 0.1;
    const interval = setInterval(() => {
      setScale((prev) => {
        const next = prev + (targetScale - prev) * 0.1;
        if (Math.abs(next - targetScale) < 0.01) return targetScale;
        return next;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: "100%",
        height: "100%",
        background: "transparent", // transparent bg
      }}
    >
      <div
        ref={containerRef}
        className="relative"
        style={{
          width: "min(25vw, 180px)", // responsive size
          height: "min(25vw, 180px)",
          transform: `scale(${scale})`,
          transition: "transform 0.4s ease-in-out",
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute rounded-full siri-layer"
            style={{
              width: "80px",
              height: "80px",
              top: "50%",
              left: "50%",
              background: isListening
                ? `radial-gradient(circle, rgba(255,80,220,${0.3 + i * 0.05}) 0%, rgba(60,0,150,0.05) 70%)`
                : `radial-gradient(circle, rgba(0,255,255,${0.3 + i * 0.05}) 0%, rgba(50,0,120,0.05) 70%)`,
              boxShadow: isListening
                ? `0 0 ${20 + i * 10}px rgba(255,80,220,${0.3 + i * 0.05})`
                : `0 0 ${20 + i * 10}px rgba(0,255,255,${0.3 + i * 0.05})`,
              transition: "background 0.5s, box-shadow 0.5s",
            }}
          />
        ))}
        <div
          className="absolute rounded-full siri-core"
          style={{
            width: "40px",
            height: "40px",
            top: "50%",
            left: "50%",
            background: isListening
              ? "radial-gradient(circle, rgba(255,80,220,0.9) 0%, rgba(80,0,150,0.3) 70%)"
              : "radial-gradient(circle, rgba(0,255,255,0.9) 0%, rgba(50,0,120,0.3) 70%)",
            boxShadow: isListening
              ? "0 0 50px rgba(255,80,220,0.7), 0 0 100px rgba(100,0,200,0.3)"
              : "0 0 50px rgba(0,255,255,0.7), 0 0 100px rgba(50,0,120,0.3)",
            transition: "background 0.5s, box-shadow 0.5s",
          }}
        />
      </div>
    </div>
  );
}


