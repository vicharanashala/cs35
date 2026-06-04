import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?._id],
    queryFn: () => notificationApi.list(user?._id, user?.role === 'admin'),
    enabled: !!user?._id,
  });

  const markReadMut = useMutation({
    mutationFn: (id) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?._id] }),
  });

  const handleMarkAllRead = () => {
    notifications.forEach(n => {
      if (!n.isRead) markReadMut.mutate(n._id);
    });
    toast.success('Marked all as read');
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'answers') return n.type === 'answer_added';
    if (filter === 'verifications') return n.type === 'answer_verified';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container-xl py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">
              You have {unreadCount} unread notification{unreadCount !== 1 && 's'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-secondary text-sm shrink-0"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'answers', label: 'Answers' },
              { id: 'verifications', label: 'Verifications' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === tab.id
                    ? 'text-brand-700 border-b-2 border-brand-500 bg-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="divide-y divide-gray-100">
            {filteredNotifs.length > 0 ? (
              filteredNotifs.map((n) => (
                <div
                  key={n._id}
                  onClick={() => {
                    if (!n.isRead) markReadMut.mutate(n._id);
                    navigate(n.link);
                  }}
                  className={`flex items-start gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !n.isRead ? 'bg-blue-50/20' : ''
                  }`}
                >
                  <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    !n.isRead ? 'bg-white shadow-sm border border-gray-100 text-brand-700 font-bold' : 'bg-gray-100 text-gray-600 font-bold'
                  }`}>
                    {n.senderName ? (
                      <span>{n.senderName.charAt(0).toUpperCase()}</span>
                    ) : (
                      <>
                        {n.type === 'new_question' && <span>❓</span>}
                        {n.type === 'answer_added' && <span>💬</span>}
                        {n.type === 'answer_verified' && <span>✅</span>}
                        {n.type === 'points_adjusted' && <span>💎</span>}
                        {!['new_question', 'answer_added', 'answer_verified', 'points_adjusted'].includes(n.type) && <span>🔔</span>}
                      </>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <p className={`text-sm ${!n.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {n.title}
                      </p>
                      <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${!n.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                      {n.message}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-500 shrink-0 self-center" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-16 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <span className="text-2xl opacity-50">📭</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">No notifications found</h3>
                <p className="text-sm text-gray-500">
                  {filter === 'all' 
                    ? "You're all caught up! When you receive notifications, they'll show up here."
                    : `You don't have any ${filter} notifications.`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
