import { Card, CardContent, CardHeader } from './ui/card';

export default function StatCard({
  title,
  value,
  icon,
  description,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  icon: string;
  description?: string;
  color?: keyof typeof COLORS;
}) {
  return (
    <Card
      className={`border-0 border-l-4 ${COLORS[color].border} shadow hover:shadow-md transition duration-300 transform hover:-translate-y-1`}
    >
      <CardContent>
        <div className='h-full flex justify-between items-start pt-5'>
          <div>
            <p className='text-gray-500 text-sm mb-1'>{title}</p>
            <h3 className='text-2xl font-bold'>{value}</h3>

            {description && (
              <p className='text-xs text-green-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  arrow_upward
                </span>
                {description}
              </p>
            )}
          </div>

          <div
            className={`w-10 h-10 rounded-full ${COLORS[color].bg} flex items-center justify-center`}
          >
            <span
              className={`material-symbols-outlined ${COLORS[color].text} text-lg`}
            >
              {icon}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const COLORS = {
  blue: { border: 'border-blue-500', bg: 'bg-blue-100', text: 'text-blue-500' },
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-100',
    text: 'text-purple-500',
  },
  green: {
    border: 'border-green-500',
    bg: 'bg-green-100',
    text: 'text-green-500',
  },
  red: { border: 'border-red-500', bg: 'bg-red-100', text: 'text-red-500' },
  yellow: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-100',
    text: 'text-yellow-500',
  },
  orange: {
    border: 'border-orange-500',
    bg: 'bg-orange-100',
    text: 'text-orange-500',
  },
};
