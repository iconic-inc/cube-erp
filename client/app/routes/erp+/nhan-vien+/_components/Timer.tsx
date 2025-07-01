import { useEffect, useState } from 'react';
import Hydrated from '~/components/Hydrated';

export default function Timer() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update Time
    setInterval(() => {
      setNow(new Date());
    }, 1000);
  }, []);

  return (
    <div>
      <Hydrated>
        {() => (
          <p className='text-2xl font-bold text-blue-500'>
            {now.toLocaleTimeString('us')}
          </p>
        )}
      </Hydrated>
    </div>
  );
}
