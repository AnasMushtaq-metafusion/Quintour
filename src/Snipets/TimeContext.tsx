import React, { createContext, useContext, useState, useRef } from 'react';

const TimerContext = createContext<any | null>(null);

export const TimerProvider = ({ children }: any) => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // useEffect(() => {
  //     const interval = setInterval(() => {
  //         setSeconds((prevSeconds) => prevSeconds + 1);
  //     }, 1000);

  //     return () => clearInterval(interval);
  // }, []);

  const statTimer = () => {
    // const interval = setInterval(() => {
    //     setSeconds((prevSeconds) => prevSeconds + 1);
    // }, 1000);

    // return () => clearInterval(interval);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setSeconds(prevSeconds => prevSeconds + 1);
    }, 1000);
  };

  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setSeconds(0);
  };

  return (
    <TimerContext.Provider value={{ seconds, resetTimer, statTimer }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);
