import React from 'react';
import { Notification } from '../types';
import { ClockIcon, EnvelopeIcon } from './icons';

interface NotificationPanelProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onNotificationClick, onMarkAllAsRead, onClose }) => {
  return (
    <div className="absolute top-full right-0 mt-2 w-96 max-w-[95vw] bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 animate-fade-in-up">
      <div className="flex justify-between items-center p-3 border-b border-gray-700">
        <h3 className="font-semibold text-white">Thông báo</h3>
        <button 
          onClick={onMarkAllAsRead} 
          className="text-sm text-indigo-400 hover:text-indigo-300 transition"
        >
          Đánh dấu tất cả đã đọc
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(n => {
            const mailtoHref = n.action?.type === 'send_email'
              ? `mailto:${n.action.recipient}?${n.action.cc ? `cc=${n.action.cc}&` : ''}subject=${encodeURIComponent(n.action.subject)}&body=${encodeURIComponent(n.action.body)}`
              : '#';

            return (
              <div
                key={n.id}
                onClick={() => onNotificationClick(n)}
                className={`p-3 border-b border-gray-700/50 transition flex items-start gap-3 ${n.action ? '' : 'cursor-pointer'} ${n.isRead ? 'opacity-60 hover:opacity-100' : 'bg-indigo-900/20'} ${n.action ? '' : 'hover:bg-gray-700/50'}`}
              >
                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'overdue' ? 'bg-red-500' : 'bg-yellow-500'} ${!n.isRead ? 'animate-pulse' : ''}`}></div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate" title={n.message}>{n.message}</p>
                    {n.action?.type === 'send_email' && (
                        <a 
                            href={mailtoHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()} // Prevent parent onClick
                            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-md hover:bg-orange-500 transition text-xs font-bold"
                        >
                           <EnvelopeIcon className="w-4 h-4" />
                           Gửi Email Cảnh Báo
                        </a>
                    )}
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {new Date(n.timestamp).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-400 text-center p-6 text-sm italic">Bạn không có thông báo nào.</p>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
