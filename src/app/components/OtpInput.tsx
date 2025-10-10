"use client";
import { useEffect, useRef, useState } from "react";

interface OtpInputProps {
  length?: number;
  onOtpSubmit: (otp: string) => void;
}

export default function OtpInput({ length = 6, onOtpSubmit }: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle input change
  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Only allow numbers
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // If all inputs filled, call onOtpSubmit
    const fullOtp = newOtp.join("");
    if (fullOtp.length === length && !newOtp.includes("")) {
      onOtpSubmit(fullOtp);
    }

    // Move focus to next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        // Clear current box
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        // Move focus to previous box
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <div className=" ">
      {otp.map((value, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value}
          ref={(el: HTMLInputElement | null) => {
            inputRefs.current[index] = el;
          }}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-12 h-12 m-1 text-center border border-gray-400 rounded text-amber-50 text-lg font-medium bold mb-4"
        />
      ))}
    </div>
  );
}
