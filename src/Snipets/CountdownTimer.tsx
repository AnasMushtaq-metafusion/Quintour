import { useState, useEffect } from 'react';
import { useTimer } from './TimeContext';

const CountdownTimer = ({ initialTime, handleEndTour }: any) => {
  const { seconds } = useTimer();
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (seconds !== null) {
      const updatedTime = initialTime - seconds;
      setTimeLeft(updatedTime > 0 ? updatedTime : 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleEndTour();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    return `${hours < 10 ? '0' : ''}${hours}:${
      minutes < 10 ? '0' : ''
    }${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return formatTime(timeLeft);
};

export default CountdownTimer;
