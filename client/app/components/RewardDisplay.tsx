import { Trophy, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { IEmployeeRewardStats } from '~/interfaces/reward.interface';
import { ILoaderDataPromise } from '../interfaces/app.interface';
import { isResolveError } from '~/lib';

interface RewardDisplayProps {
  rewardPromise: ILoaderDataPromise<IEmployeeRewardStats>;
}

export default function RewardDisplay({ rewardPromise }: RewardDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [reward, setReward] = useState<
    IEmployeeRewardStats | { success: boolean; message: string }
  >({ success: false, message: 'Loading...' });
  const [hasRewards, setHasRewards] = useState(true);

  useEffect(() => {
    const loadReward = async () => {
      const reward = (await rewardPromise) as any;
      setReward(reward);
      // Check if there are any active rewards or total available amount
      if (reward.actives > 0 || reward.totalAvailableAmount > 0) {
        setHasRewards(true);
      } else {
        setHasRewards(false);
      }
    };

    loadReward();
  }, [rewardPromise]);

  if (isResolveError(reward)) {
    return (
      <div
        className={`fixed bottom-4 right-4 z-40 bg-gradient-to-br from-red-800 via-red-600 to-red-900 text-white rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-300/30 p-2`}
      >
        <div className='flex items-center space-x-1'>
          <XCircle className='text-red-100 text-lg' />
          <span className='font-bold text-sm'>{reward.message}</span>
        </div>
      </div>
    );
  } else if (!hasRewards) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 bg-gradient-to-br from-red-800 via-red-600 to-red-900 text-white rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 border border-red-300/30 ${isExpanded ? 'p-4 min-w-[220px]' : 'p-2'}`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        type='button'
        className='absolute -top-2 -left-2 bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-100 transition-colors duration-200 shadow-md border border-red-200'
      >
        {isExpanded ? '−' : '+'}
      </button>

      {isExpanded ? (
        <>
          <div className='flex items-center space-x-2 mb-3'>
            <Trophy className='text-red-100 animate-bounce' />
            <h3 className='font-bold text-sm'>🌟 Quỹ thưởng</h3>
          </div>

          <div className='space-y-2'>
            <div className='flex justify-between items-center bg-white/10 rounded-lg px-2 py-1'>
              <span className='text-xs font-medium'>
                Quỹ thưởng đang chờ bạn:
              </span>
              <span className='font-bold text-red-200 text-lg'>
                {reward.actives}
              </span>
            </div>

            <div className='flex justify-between items-center bg-white/10 rounded-lg px-2 py-1'>
              <span className='text-xs font-medium'>Tổng số tiền thưởng:</span>
              <span className='font-bold text-red-100 text-sm'>
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(reward.totalAvailableAmount)}
              </span>
            </div>
          </div>

          <div className='mt-3 pt-2 border-t border-red-300/30'>
            <p className='text-xs text-center font-medium text-red-100'>
              Kiên định dẫn lỗi vững bước trên hành trình pháp lý!
            </p>
          </div>
        </>
      ) : (
        <div className='flex items-center space-x-1'>
          <Trophy className='text-red-100 text-lg' />
          <span className='font-bold text-sm'>{reward.actives}</span>
        </div>
      )}

      {/* Sparkle effect */}
      <div className='absolute -top-[2px] -right-[2px] w-3 h-3 bg-red-300 rounded-full animate-ping'></div>
      <div className='absolute top-0 right-0 w-2 h-2 bg-red-200 rounded-full animate-pulse'></div>
    </div>
  );
}
