import { useEffect } from 'react';
import { useTimer } from './TimeContext';

const CountUpTimer = ({
  startSeconds = 0, // starting point if needed
  duration,
  handleEndTour,
}: {
  startSeconds?: number;
  duration: number;
  handleEndTour: () => void;
}) => {
  const { seconds } = useTimer();

  const timePassed = seconds !== null ? seconds - startSeconds : 0;

  useEffect(() => {
    if (duration > 0 && timePassed >= duration) {
      handleEndTour();
    }
  }, [timePassed, duration, handleEndTour]);

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    return `${hours < 10 ? '0' : ''}${hours}:${
      minutes < 10 ? '0' : ''
    }${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return formatTime(Math.max(0, timePassed));
};

export default CountUpTimer;
